import {NextRequest, NextResponse} from 'next/server'
import prisma from 'src/lib/prisma'
import {FileHandler} from '@cm/class/FileHandler'
import {MedicalVisitImageType} from '@prisma/client'

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const medicalVisitId = Number(formData.get('medicalVisitId'))
  const imageType = (formData.get('imageType') as MedicalVisitImageType) || 'AFTER'

  try {
    if (isNaN(medicalVisitId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効な通院履歴IDです',
        },
        {status: 400}
      )
    }

    // imageType の検証
    if (imageType !== 'BEFORE' && imageType !== 'AFTER') {
      return NextResponse.json(
        {
          success: false,
          error: '無効な画像種別です',
        },
        {status: 400}
      )
    }

    // 通院履歴の存在確認
    const visit = await prisma.medicalVisit.findUnique({
      where: {id: medicalVisitId},
    })

    if (!visit) {
      return NextResponse.json(
        {
          success: false,
          error: '通院履歴が見つかりません',
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
        bucketKey: `health/medical-visit/${medicalVisitId}`,
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
    const maxSortOrder = await prisma.medicalVisitImage.aggregate({
      where: {medicalVisitId},
      _max: {sortOrder: true},
    })

    // DBにレコード追加
    const image = await prisma.medicalVisitImage.create({
      data: {
        filename: s3Result.result?.key || file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: s3Result.result?.url || '',
        medicalVisitId,
        imageType,
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
