import {NextRequest, NextResponse} from 'next/server'
import {HealthService} from '../../(lib)/healthService'

// 薬マスタの取得
export async function GET(request: NextRequest) {
  try {
    const medicines = await HealthService.getMedicines()
    return NextResponse.json(medicines)
  } catch (error) {
    console.error('薬マスタ取得エラー:', error)
    return NextResponse.json({error: 'データの取得に失敗しました'}, {status: 500})
  }
}
