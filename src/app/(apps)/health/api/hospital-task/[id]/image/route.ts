import {NextRequest, NextResponse} from 'next/server'
import prisma from 'src/lib/prisma'
import {FileHandler} from '@cm/class/FileHandler'

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const hospitalTaskId = Number(formData.get('hospitalTaskId'))

  try {
    if (isNaN(hospitalTaskId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効な病院タスクIDです',
        },
        {status: 400}
      )
    }

    // 病院タスクの存在確認
    const task = await prisma.hospitalTask.findUnique({
      where: {id: hospitalTaskId},
    })

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: '病院タスクが見つかりません',
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
        bucketKey: `health/hospital-task/${hospitalTaskId}`,
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
    const maxSortOrder = await prisma.hospitalTaskImage.aggregate({
      where: {hospitalTaskId},
      _max: {sortOrder: true},
    })

    // DBにレコード追加
    const image = await prisma.hospitalTaskImage.create({
      data: {
        filename: s3Result.result?.key || file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: s3Result.result?.url || '',
        hospitalTaskId,
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

