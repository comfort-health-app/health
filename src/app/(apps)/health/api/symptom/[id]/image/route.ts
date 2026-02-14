import {NextRequest, NextResponse} from 'next/server'
import prisma from 'src/lib/prisma'
import {FileHandler} from '@cm/class/FileHandler'

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const symptomId = Number(formData.get('symptomId'))

  try {
    if (isNaN(symptomId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効な症状IDです',
        },
        {status: 400}
      )
    }

    // 症状の存在確認
    const symptom = await prisma.symptom.findUnique({
      where: {id: symptomId},
    })

    if (!symptom) {
      return NextResponse.json(
        {
          success: false,
          error: '症状が見つかりません',
        },
        {status: 404}
      )
    }

    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'ファイルが選択されていません',
        },
        {status: 400}
      )
    }

    // ファイル検証
    const validation = FileHandler.validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `ファイル検証エラー: ${validation.errors.join(', ')}`,
        },
        {status: 400}
      )
    }

    // S3にアップロード
    const s3Result = await FileHandler.sendFileToS3({
      file,
      formDataObj: {
        bucketKey: `health/symptom/${symptomId}`,
        optimize: true,
      },
      validateFile: true,
    })

    if (!s3Result.success) {
      return NextResponse.json(
        {
          success: false,
          error: `ファイルアップロードに失敗しました: ${s3Result.error}`,
        },
        {status: 500}
      )
    }

    // 最大sortOrderを取得
    const maxSortOrder = await prisma.symptomImage.aggregate({
      where: {symptomId},
      _max: {sortOrder: true},
    })

    // DBにレコード追加
    const image = await prisma.symptomImage.create({
      data: {
        filename: s3Result.result?.key || file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: s3Result.result?.url || '',
        symptomId,
        sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
      },
    })

    return NextResponse.json({
      success: true,
      data: image,
    })
  } catch (error) {
    console.error('ファイルアップロードエラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'ファイルのアップロードに失敗しました',
      },
      {status: 500}
    )
  }
}
