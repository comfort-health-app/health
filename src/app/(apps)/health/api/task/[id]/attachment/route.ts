import {NextRequest, NextResponse} from 'next/server'
import prisma from 'src/lib/prisma'
import {FileHandler} from '@cm/class/FileHandler'

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const taskId = Number(formData.get('taskId'))

  try {
    if (isNaN(taskId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効なタスクIDです',
        },
        {status: 400}
      )
    }

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: {id: taskId},
    })

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'タスクが見つかりません',
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

    // ファイル検証（新しいFileHandler使用）
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
        bucketKey: `health/task/${taskId}`,
        optimize: true, // 画像最適化を有効にする
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

    // DBにレコード追加
    const attachment = await prisma.taskAttachment.create({
      data: {
        filename: s3Result.result?.key || file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: s3Result.result?.url || '',
        taskId,
      },
    })

    return NextResponse.json({
      success: true,
      data: attachment,
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
