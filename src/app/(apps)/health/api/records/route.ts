import {NextRequest, NextResponse} from 'next/server'
import {HealthService} from '../../(lib)/healthService'
import {HealthRecordFormData} from '../../(constants)/types'

// 健康記録の取得
export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url)
    const userId = parseInt(searchParams.get('userId') || '0')
    const date = searchParams.get('date')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (!userId) {
      return NextResponse.json({error: 'ユーザーIDが必要です'}, {status: 400})
    }

    if (date) {
      // 日別データ取得
      const records = await HealthService.getHealthRecordsByDate(userId, date)
      return NextResponse.json(records)
    } else if (year && month) {
      // 月別データ取得
      const records = await HealthService.getHealthRecordsByMonth(userId, parseInt(year), parseInt(month))
      return NextResponse.json(records)
    } else {
      return NextResponse.json({error: '日付または年月の指定が必要です'}, {status: 400})
    }
  } catch (error) {
    console.error('健康記録取得エラー:', error)
    return NextResponse.json({error: 'データの取得に失敗しました'}, {status: 500})
  }
}

// 健康記録の作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {userId, ...data}: {userId: number} & HealthRecordFormData = body

    if (!userId) {
      return NextResponse.json({error: 'ユーザーIDが必要です'}, {status: 400})
    }

    const record = await HealthService.createHealthRecord(userId, data)
    return NextResponse.json(record, {status: 201})
  } catch (error) {
    console.error('健康記録作成エラー:', error)
    return NextResponse.json({error: 'データの作成に失敗しました'}, {status: 500})
  }
}

// 健康記録の更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {id, ...data}: {id: number} & Partial<HealthRecordFormData> = body

    if (!id) {
      return NextResponse.json({error: '記録IDが必要です'}, {status: 400})
    }

    const record = await HealthService.updateHealthRecord(id, data)
    return NextResponse.json(record)
  } catch (error) {
    console.error('健康記録更新エラー:', error)
    return NextResponse.json({error: 'データの更新に失敗しました'}, {status: 500})
  }
}

// 健康記録の削除
export async function DELETE(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json({error: '記録IDが必要です'}, {status: 400})
    }

    await HealthService.deleteHealthRecord(id)
    return NextResponse.json({message: '記録を削除しました'})
  } catch (error) {
    console.error('健康記録削除エラー:', error)
    return NextResponse.json({error: 'データの削除に失敗しました'}, {status: 500})
  }
}
