'use client'

import {useState, useEffect, useRef} from 'react'
import {DailySummary} from '../../(constants)/types'
import {HEALTH_CATEGORY_COLORS} from '../../(constants)/types'
import MonthlyChart from '../../(components)/MonthlyChart/MonthlyChart'
import {doStandardPrisma} from '@cm/lib/server-actions/common-server-actions/doStandardPrisma/doStandardPrisma'
import {getMidnight} from '@cm/class/Days/date-utils/calculations'
import {Days} from '@cm/class/Days/Days'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import MonthlySummaryTable from '@app/(apps)/health/(components)/MonthlySummaryTable'
import {C_Stack, R_Stack} from '@cm/components/styles/common-components/common-components'
import useWindowSize from '@cm/hooks/useWindowSize'
import {useReactToPrint} from 'react-to-print'
import {Button} from '@cm/components/styles/common-components/Button'

// useGlobalの型定義（実際の実装に合わせて調整してください）
interface User {
  id: number
  name: string
}

export default function MonthlyPage() {
  const {session, query, addQuery} = useGlobal()
  const {PC} = useWindowSize()

  const year = query.year ? parseInt(query.year) : new Date().getFullYear()
  const month = query.month ? parseInt(query.month) : new Date().getMonth() + 1

  // const [year, setYear] = useState(new Date().getFullYear())
  // const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [summaryData, setSummaryData] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSummary = async () => {
    if (!session) return

    try {
      setLoading(true)

      // 指定月の開始日と終了日を計算
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0) // 次の月の0日 = 当月の最終日

      // 健康記録を取得
      const result = await doStandardPrisma('healthRecord', 'findMany', {
        where: {
          userId: session.id,
          recordDate: {
            gte: getMidnight(startDate),
            lt: getMidnight(Days.day.add(endDate, 1)), // 翌日の開始時刻まで
          },
        },
        include: {
          Medicine: true,
        },
        orderBy: {
          recordDate: 'asc',
        },
      })

      if (result.success) {
        // 日別サマリーを生成
        const summary = generateMonthlySummary(result.result, startDate, endDate)

        setSummaryData(summary)
      } else {
        console.error('記録取得エラー:', result.error)
      }
    } catch (error) {
      console.error('サマリー取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 月別サマリー生成ロジック（6:00〜翌6:00基準）
  const generateMonthlySummary = (records: any[], startDate: Date, endDate: Date): DailySummary[] => {
    const summary: DailySummary[] = []

    // 月内の全ての日を生成（日別判定は6:00〜翌6:00）
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate, 'YYYY-MM-DD')

      // その日の6:00から翌日6:00までのレコードを抽出
      const dayStart = new Date(dateStr + ' 07:00:00')
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayRecords = records.filter(record => {
        const recordDateTime = new Date(`${formatDate(record.recordDate, 'YYYY-MM-DD')} ${record.recordTime}`)
        return recordDateTime >= dayStart && recordDateTime < dayEnd
        // const recordDate = new Date(record.recordDate)
        // return recordDate >= dayStart && recordDate < dayEnd
      })

      // 血糖値の統計計算
      const bloodSugarRecords = dayRecords.filter(
        record =>
          record.category === 'blood_sugar' &&
          record.bloodSugarValue !== null &&
          record.bloodSugarValue !== undefined &&
          !isNaN(record.bloodSugarValue)
      )

      const bloodSugarValues = bloodSugarRecords.map(record => Number(record.bloodSugarValue))

      const bloodSugar = {
        max: bloodSugarValues.length > 0 ? Math.max(...bloodSugarValues) : null,
        min: bloodSugarValues.length > 0 ? Math.min(...bloodSugarValues) : null,
        avg:
          bloodSugarValues.length > 0 ? Math.round(bloodSugarValues.reduce((a, b) => a + b, 0) / bloodSugarValues.length) : null,
      }

      // 歩行ポイントの計算（歩行カテゴリのレコードを対象）
      const walkingRecords = dayRecords.filter(record => record.category === 'walking')

      // 各歩行タイプの合計値を計算
      const shortDistanceTotal = walkingRecords.reduce((sum, record) => sum + (Number(record.walkingShortDistance) || 0), 0)
      const mediumDistanceTotal = walkingRecords.reduce((sum, record) => sum + (Number(record.walkingMediumDistance) || 0), 0)
      const longDistanceTotal = walkingRecords.reduce((sum, record) => sum + (Number(record.walkingLongDistance) || 0), 0)
      const exerciseTotal = walkingRecords.reduce((sum, record) => sum + (Number(record.walkingExercise) || 0), 0)

      // ポイント計算（係数を掛ける）
      const walkingPoints = {
        shortDistance: shortDistanceTotal * 0.5,
        mediumDistance: mediumDistanceTotal * 1.0,
        longDistance: longDistanceTotal * 1.5,
        exercise: exerciseTotal * 0.5,
        total: 0,
      }

      // 総ポイント計算
      walkingPoints.total =
        walkingPoints.shortDistance + walkingPoints.mediumDistance + walkingPoints.longDistance + walkingPoints.exercise

      summary.push({
        date: dateStr,
        bloodSugar,
        walkingPoints,
      })

      // 次の日に進む
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return summary
  }

  // 月間統計データ
  const validBloodSugarDays = summaryData.filter(day => day.bloodSugar.avg !== null)
  const monthlyStats = {
    bloodSugar: {
      max: validBloodSugarDays.length > 0 ? Math.max(...validBloodSugarDays.map(d => d.bloodSugar.max!)) : 0,
      min: validBloodSugarDays.length > 0 ? Math.min(...validBloodSugarDays.map(d => d.bloodSugar.min!)) : 0,
      avg:
        validBloodSugarDays.length > 0
          ? Math.round(validBloodSugarDays.reduce((sum, d) => sum + d.bloodSugar.avg!, 0) / validBloodSugarDays.length)
          : 0,
      days: validBloodSugarDays.length,
    },
    walking: {
      totalPoints: summaryData.reduce((sum, d) => sum + d.walkingPoints.total, 0),
      avgDaily: summaryData.length > 0 ? summaryData.reduce((sum, d) => sum + d.walkingPoints.total, 0) / summaryData.length : 0,
      activeDays: summaryData.filter(d => d.walkingPoints.total > 0).length,
    },
  }

  const printRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @media print {
        @page {
          size: A4 landscape;
          margin: 5mm;
        }
        body {
          margin: 0;
        }

      }
    `,
  })
  useEffect(() => {
    fetchSummary()
  }, [session, year, month])

  if (!session) {
    return <div className="p-2 text-center">ログインが必要です</div>
  }

  if (!PC) {
    return <div className="p-4 text-center">PCでご覧ください</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-[1500px] mx-auto space-y-6">
        <Button onClick={reactToPrintFn}>印刷</Button>
        {/* ヘッダー */}
        <section className={`print-target`} ref={printRef}>
          <div className="bg-white rounded-lg shadow p-2">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">月別サマリー</h1>
            </div>

            <R_Stack className="gap-4 ">
              {/* 年月選択 */}
              <C_Stack className={`gap-2 items-center`}>
                <select
                  value={year}
                  onChange={e => addQuery({year: e.target.value})}
                  className="w-[100px] p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={e => addQuery({month: e.target.value})}
                  className="w-[100px] p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
              </C_Stack>

              <R_Stack className="gap-2 ">
                <div className="bg-red-50 p-2 rounded-lg text-center">
                  <div className="text-xs text-gray-600 ">血糖値最高</div>
                  <div className="text-xl font-bold" style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}>
                    {monthlyStats.bloodSugar.max || '-'}
                  </div>
                  <div className="text-xs text-gray-500">mg/dL</div>
                </div>
                <div className="bg-red-50 p-2 rounded-lg text-center">
                  <div className="text-xs text-gray-600 ">血糖値平均</div>
                  <div className="text-xl font-bold" style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}>
                    {monthlyStats.bloodSugar.avg || '-'}
                  </div>
                  <div className="text-xs text-gray-500">mg/dL</div>
                </div>

                <div className="bg-orange-50 p-2 rounded-lg text-center">
                  <div className="text-xs text-gray-600 ">月間歩行P</div>
                  <div className="text-xl font-bold" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    {monthlyStats.walking.totalPoints.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">ポイント</div>
                </div>
              </R_Stack>
            </R_Stack>
          </div>

          <MonthlyChart summaryData={summaryData} year={year} month={month} />
        </section>

        {/* 月別サマリーテーブル */}
        <MonthlySummaryTable year={year} month={month} loading={loading} summaryData={summaryData} />
      </div>
    </div>
  )
}
