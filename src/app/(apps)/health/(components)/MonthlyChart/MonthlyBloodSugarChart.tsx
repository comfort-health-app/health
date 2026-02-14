'use client'

import React from 'react'
import {ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea} from 'recharts'
import {
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_CHART_HEIGHT_VALUE,
  HEALTH_CATEGORY_COLORS,
  HealthCategory,
  DailySummary,
} from '../../(constants)/types'

export default function MonthlyBloodSugarChart({
  summaryData,
  chartData,
  BLOOD_SUGAR_ZONES,
  CustomTooltip,
}: {
  summaryData: DailySummary[]
  chartData: any[]
  BLOOD_SUGAR_ZONES: any[]
  CustomTooltip: any
}) {
  return (
    <div>
      {/* 統合グラフ */}
      {summaryData.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-2">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* グラフエリア */}
            <div className="flex-1 relative" style={{height: 400}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{top: 30, right: 30, left: 0, bottom: 0}}>
                  {/* 背景帯域 */}
                  {BLOOD_SUGAR_ZONES.map((zone, idx) => (
                    <ReferenceArea key={idx} y1={zone.min} y2={zone.max} fill={zone.color} fillOpacity={0.6} />
                  ))}
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{fontSize: 12}} interval={0} />
                  <YAxis
                    domain={[0, 500]}
                    tick={{fontSize: 12}}
                    tickFormatter={value => {
                      const getValue = (category: HealthCategory) => HEALTH_CATEGORY_CHART_HEIGHT_VALUE[category]
                      if (value === getValue(HEALTH_CATEGORIES.URINE)) return '尿'
                      if (value === getValue(HEALTH_CATEGORIES.STOOL)) return '便'
                      if (value === getValue(HEALTH_CATEGORIES.MEAL)) return '食事'
                      if (value === getValue(HEALTH_CATEGORIES.SNACK)) return '間食'
                      if (value === getValue(HEALTH_CATEGORIES.MEDICINE)) return '薬'
                      if (value === getValue(HEALTH_CATEGORIES.WALKING)) return '歩行'
                      if (value % 50 === 0) return `${value} mg/dL`
                      return ''
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value, entry) => {
                      const color = HEALTH_CATEGORY_COLORS[entry.dataKey as HealthCategory] || '#000'
                      return <span style={{color}}>{value}</span>
                    }}
                  />
                  {/* 血糖値グラフ */}
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="bloodSugarMax"
                    stroke={HEALTH_CATEGORY_COLORS.blood_sugar}
                    strokeWidth={2}
                    connectNulls
                    name="血糖値最高"
                    dot={({cx, cy, value, index}) =>
                      value != null ? (
                        <g key={index}>
                          <circle cx={cx} cy={cy} r={3} fill={HEALTH_CATEGORY_COLORS.blood_sugar} />
                          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fill={HEALTH_CATEGORY_COLORS.blood_sugar}>
                            {value}
                          </text>
                        </g>
                      ) : (
                        <g key={index} />
                      )
                    }
                  />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="bloodSugarAvg"
                    stroke={HEALTH_CATEGORY_COLORS.blood_sugar + 'AA'}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    connectNulls
                    name="血糖値平均"
                    dot={({cx, cy, value, index}) =>
                      value != null ? (
                        <g key={index}>
                          <circle cx={cx} cy={cy} r={2} fill={HEALTH_CATEGORY_COLORS.blood_sugar + 'AA'} />
                          <text
                            x={cx}
                            y={cy - 10}
                            textAnchor="middle"
                            fontSize={10}
                            fill={HEALTH_CATEGORY_COLORS.blood_sugar + 'AA'}
                          >
                            {value}
                          </text>
                        </g>
                      ) : (
                        <g key={index} />
                      )
                    }
                  />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="bloodSugarMin"
                    stroke={HEALTH_CATEGORY_COLORS.blood_sugar + '77'}
                    strokeDasharray="2 2"
                    strokeWidth={2}
                    connectNulls
                    name="血糖値最低"
                    dot={({cx, cy, value, index}) =>
                      value != null ? (
                        <g key={index}>
                          <circle cx={cx} cy={cy} r={2} fill={HEALTH_CATEGORY_COLORS.blood_sugar + '77'} />
                          <text
                            x={cx}
                            y={cy - 10}
                            textAnchor="middle"
                            fontSize={10}
                            fill={HEALTH_CATEGORY_COLORS.blood_sugar + '77'}
                          >
                            {value}
                          </text>
                        </g>
                      ) : (
                        <g key={index} />
                      )
                    }
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 血糖値帯域凡例 */}
            <div className="lg:w-32 bg-gray-50 p-3 rounded-lg print:hidden">
              <h4 className="text-sm font-bold text-gray-800 mb-2">血糖値帯域</h4>
              <div className="flex lg:flex-col lg:space-y-1 space-x-2 lg:space-x-0 overflow-x-auto lg:overflow-x-visible">
                {BLOOD_SUGAR_ZONES.map((zone, idx) => (
                  <div key={idx} className="flex items-center text-xs flex-shrink-0">
                    <div className="w-3 h-3 rounded mr-2" style={{backgroundColor: zone.color.replace('0.25', '0.8')}} />
                    <div className="whitespace-nowrap">
                      <div className="font-medium">{zone.label}</div>
                      <div className="text-gray-600">
                        {zone.min}-{zone.max}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">健康記録推移グラフ</h3>
          <div className="text-center py-8 text-gray-500">この月の記録がありません</div>
        </div>
      )}
    </div>
  )
}
