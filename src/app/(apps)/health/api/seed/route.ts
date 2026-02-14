import {NextRequest, NextResponse} from 'next/server'
import {seedHealthRecords} from '../../seed/healthRecordSeeder'
import {doStandardPrisma} from '@cm/lib/server-actions/common-server-actions/doStandardPrisma/doStandardPrisma'

export async function POST(request: NextRequest) {
  try {
    // リクエストボディからユーザーIDを取得
    const body = await request.json()
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({success: false, error: 'ユーザーIDが必要です'}, {status: 400})
    }

    // シーディング実行
    await doStandardPrisma(`healthRecord`, `deleteMany`, {where: {id: {gte: 0}}})
    // return

    const result = await seedHealthRecords(userId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${result.count}件の健康記録を作成しました`,
        count: result.count,
      })
    } else {
      return NextResponse.json({success: false, error: result.error}, {status: 500})
    }
  } catch (error) {
    console.error('シーディングAPIエラー:', error)
    return NextResponse.json({success: false, error: 'シーディングに失敗しました'}, {status: 500})
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Health Record Seeder API',
    usage: 'POST /health/api/seed?userId=<optional_user_id>',
    description: '2025年6月の健康記録データをシーディングします',
  })
}
