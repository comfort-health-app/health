'use client'

import {DailySummary, HEALTH_CATEGORY_COLORS} from '../(constants)/types'

import Link from 'next/link'

const getDayOfWeek = (dateStr: string) => {
  const date = new Date(dateStr)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[date.getDay()]
}

const getDay = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.getDate()
}

const formatValue = (value: number | null) => {
  return value !== null && value !== undefined ? value.toString() : ''
}

const formatDecimal = (value: number) => {
  if (value === null || value === undefined || value === 0) return ''
  return value.toFixed(1)
}

export default function MonthlySummaryTable({
  year,
  month,
  loading,
  summaryData,
}: {
  year: number
  month: number
  loading: boolean
  summaryData: DailySummary[]
}) {
  return (
    <div>
      {/* 月別サマリーテーブル */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {year}年{month}月
        </h2>

        {loading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm ">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2" colSpan={3} rowSpan={1}>
                    日付
                  </th>
                  <th
                    className="border border-gray-300 px-2 py-2"
                    colSpan={3}
                    style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}
                  >
                    血糖値
                  </th>
                  <th className="border border-gray-300 px-2 py-2" colSpan={5} style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    歩行
                  </th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-1 text-xs">月：</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">
                    {year}年{month}月
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">リンク</th>
                  <th className="border border-gray-300 px-2 py-2" style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}>
                    最高
                  </th>
                  <th className="border border-gray-300 px-2 py-2" style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}>
                    平均
                  </th>
                  <th className="border border-gray-300 px-2 py-2" style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}>
                    最低
                  </th>
                  <th className="border border-gray-300 px-2 py-2" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    短距離P
                  </th>
                  <th className="border border-gray-300 px-2 py-2" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    中距離P
                  </th>
                  <th className="border border-gray-300 px-2 py-2" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    長距離P
                  </th>
                  <th className="border border-gray-300 px-2 py-2" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    運動P
                  </th>
                  <th className="border border-gray-300 px-2 py-2" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    P合計
                  </th>
                </tr>
                <tr>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map(day => {
                  return (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-2 text-center">{getDay(day.date)}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center">{getDayOfWeek(day.date)}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <Link href={`/health/daily?date=${day.date}`} className="text-blue-600 hover:text-blue-800 underline">
                          リンク
                        </Link>
                      </td>
                      <td
                        className="border border-gray-300 px-2 py-2 text-center"
                        style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}
                      >
                        {formatValue(day.bloodSugar.max)}
                      </td>
                      <td
                        className="border border-gray-300 px-2 py-2 text-center"
                        style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}
                      >
                        {formatValue(day.bloodSugar.avg)}
                      </td>
                      <td
                        className="border border-gray-300 px-2 py-2 text-center"
                        style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}
                      >
                        {formatValue(day.bloodSugar.min)}
                      </td>
                      <td
                        className="border border-gray-300 px-2 py-2 text-center"
                        style={{color: HEALTH_CATEGORY_COLORS.walking}}
                      >
                        {formatDecimal(day.walkingPoints.shortDistance)}
                      </td>
                      <td
                        className="border border-gray-300 px-2 py-2 text-center"
                        style={{color: HEALTH_CATEGORY_COLORS.walking}}
                      >
                        {formatDecimal(day.walkingPoints.mediumDistance)}
                      </td>
                      <td
                        className="border border-gray-300 px-2 py-2 text-center"
                        style={{color: HEALTH_CATEGORY_COLORS.walking}}
                      >
                        {formatDecimal(day.walkingPoints.longDistance)}
                      </td>
                      <td
                        className="border border-gray-300 px-2 py-2 text-center"
                        style={{color: HEALTH_CATEGORY_COLORS.walking}}
                      >
                        {formatDecimal(day.walkingPoints.exercise)}
                      </td>
                      <td
                        className="border border-gray-300 px-2 py-2 text-center"
                        style={{color: HEALTH_CATEGORY_COLORS.walking, fontWeight: 'bold'}}
                      >
                        {formatDecimal(day.walkingPoints.total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-2 py-2 text-center" colSpan={3}>
                    月計
                  </td>
                  <td
                    className="border border-gray-300 px-2 py-2 text-center"
                    style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}
                  >
                    {summaryData.length > 0
                      ? Math.max(...summaryData.map(d => d.bloodSugar.max).filter(v => v !== null)) || ''
                      : ''}
                  </td>
                  <td
                    className="border border-gray-300 px-2 py-2 text-center"
                    style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}
                  >
                    {(() => {
                      const validAvgs = summaryData.filter(d => d.bloodSugar.avg !== null)
                      if (validAvgs.length === 0) return ''
                      return Math.round(validAvgs.reduce((sum, d) => sum + (d.bloodSugar.avg || 0), 0) / validAvgs.length)
                    })()}
                  </td>
                  <td
                    className="border border-gray-300 px-2 py-2 text-center"
                    style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}
                  >
                    {summaryData.length > 0
                      ? Math.min(...summaryData.map(d => d.bloodSugar.min).filter(v => v !== null)) || ''
                      : ''}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    {formatDecimal(summaryData.reduce((sum, d) => sum + d.walkingPoints.shortDistance, 0))}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    {formatDecimal(summaryData.reduce((sum, d) => sum + d.walkingPoints.mediumDistance, 0))}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    {formatDecimal(summaryData.reduce((sum, d) => sum + d.walkingPoints.longDistance, 0))}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center" style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                    {formatDecimal(summaryData.reduce((sum, d) => sum + d.walkingPoints.exercise, 0))}
                  </td>
                  <td
                    className="border border-gray-300 px-2 py-2 text-center"
                    style={{color: HEALTH_CATEGORY_COLORS.walking, fontWeight: 'bold'}}
                  >
                    {formatDecimal(summaryData.reduce((sum, d) => sum + d.walkingPoints.total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
