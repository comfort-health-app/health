import {NextRequest, NextResponse} from 'next/server'
import prisma from 'src/lib/prisma'
import {FileHandler} from '@cm/class/FileHandler'

// DELETE: 画像削除
export async function DELETE(request: NextRequest, {params}: {params: {id: string}}) {
  try {
    const imageId = Number(params.id)

    if (isNaN(imageId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効な画像IDです',
        },
        {status: 400}
      )
    }

    // 画像の存在確認
    const image = await prisma.medicalVisitImage.findUnique({
      where: {id: imageId},
    })

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: '画像が見つかりません',
        },
        {status: 404}
      )
    }

    // S3から画像を削除
    try {
      await FileHandler.deleteFileFromS3(image.filename)
    } catch (error) {
      console.error(`S3画像削除エラー (${image.filename}):`, error)
      // S3削除エラーがあってもDB削除は続行
    }

    // データベースから削除
    await prisma.medicalVisitImage.delete({
      where: {id: imageId},
    })

    return NextResponse.json({
      success: true,
      message: '画像が正常に削除されました',
    })
  } catch (error) {
    console.error('画像削除エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: '画像の削除に失敗しました',
      },
      {status: 500}
    )
  }
}

