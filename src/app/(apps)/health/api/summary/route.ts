import {NextRequest, NextResponse} from 'next/server'
import {HealthService} from '../../(lib)/healthService'

// 月別サマリーの取得
export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url)
    const userId = parseInt(searchParams.get('userId') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    const month = parseInt(searchParams.get('month') || '0')

    if (!userId || !year || !month) {
      return NextResponse.json({error: 'ユーザーID、年、月の指定が必要です'}, {status: 400})
    }

    const summary = await HealthService.getMonthlySummary(userId, year, month)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('月別サマリー取得エラー:', error)
    return NextResponse.json({error: 'データの取得に失敗しました'}, {status: 500})
  }
}
