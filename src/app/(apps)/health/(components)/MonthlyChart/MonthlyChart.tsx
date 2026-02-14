'use client'

import React from 'react'
import {
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_CHART_HEIGHT_VALUE,
  HEALTH_CATEGORY_COLORS,
  HealthCategory,
  DailySummary,
} from '../../(constants)/types'
import MonthlyWalkingChart from '@app/(apps)/health/(components)/MonthlyChart/MonthlyWalkingChart'
import MonthlyBloodSugarChart from '@app/(apps)/health/(components)/MonthlyChart/MonthlyBloodSugarChart'

// 血糖値帯域定義（DailyChartと同じ）
const BLOOD_SUGAR_ZONES = [
  {min: 0, max: 70, label: '危険', color: 'rgba(239, 68, 68, 0.4)'}, // 赤系
  {min: 70, max: 100, label: '要注意', color: 'rgba(251, 146, 60, 0.4)'}, // 橙系
  {min: 100, max: 150, label: '安定', color: 'rgba(34, 197, 94, 0.4)'}, // 緑系
  {min: 150, max: 250, label: '要観察', color: 'rgba(250, 204, 21, 0.4)'}, // 黄系
  {min: 250, max: 400, label: '要注意', color: 'rgba(251, 146, 60, 0.4)'}, // 橙系
  {min: 400, max: 500, label: '危険', color: 'rgba(239, 68, 68, 0.4)'}, // 赤系
]

interface MonthlyChartProps {
  summaryData: DailySummary[]
  year: number
  month: number
}

export default function MonthlyChart({summaryData, year, month}: MonthlyChartProps) {
  // 日付ラベル（1日〜月末）
  const dayLabels = summaryData.map(day => new Date(day.date).getDate())

  // recharts用データ整形
  const chartData = summaryData.map((day, idx) => ({
    day: dayLabels[idx],
    bloodSugarMax: day.bloodSugar.max,
    bloodSugarAvg: day.bloodSugar.avg,
    bloodSugarMin: day.bloodSugar.min,
    urine: day.bloodSugar.max !== null ? HEALTH_CATEGORY_CHART_HEIGHT_VALUE[HEALTH_CATEGORIES.URINE] : null, // 仮:記録有無
    stool: day.bloodSugar.max !== null ? HEALTH_CATEGORY_CHART_HEIGHT_VALUE[HEALTH_CATEGORIES.STOOL] : null,
    meal: day.bloodSugar.max !== null ? HEALTH_CATEGORY_CHART_HEIGHT_VALUE[HEALTH_CATEGORIES.MEAL] : null,
    snack: day.bloodSugar.max !== null ? HEALTH_CATEGORY_CHART_HEIGHT_VALUE[HEALTH_CATEGORIES.SNACK] : null,
    medicine: day.bloodSugar.max !== null ? HEALTH_CATEGORY_CHART_HEIGHT_VALUE[HEALTH_CATEGORIES.MEDICINE] : null,
    walking: day.walkingPoints.total > 0 ? HEALTH_CATEGORY_CHART_HEIGHT_VALUE[HEALTH_CATEGORIES.WALKING] : null,
    walkingPoints: day.walkingPoints,
  }))

  // カスタムツールチップ
  const CustomTooltip = ({active, payload, label}: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <div className="font-bold mb-1">
            {month}月{label}日
          </div>
          {payload.map((entry: any, idx: number) => {
            if (entry.dataKey === 'bloodSugarMax') {
              return (
                <div key={idx} style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}>
                  最高: {entry.value ?? '-'} mg/dL
                </div>
              )
            }
            if (entry.dataKey === 'bloodSugarAvg') {
              return (
                <div key={idx} style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}>
                  平均: {entry.value ?? '-'} mg/dL
                </div>
              )
            }
            if (entry.dataKey === 'bloodSugarMin') {
              return (
                <div key={idx} style={{color: HEALTH_CATEGORY_COLORS.blood_sugar}}>
                  最低: {entry.value ?? '-'} mg/dL
                </div>
              )
            }
            if (entry.dataKey === 'walking' && entry.payload.walkingPoints.total > 0) {
              const wp = entry.payload.walkingPoints
              return (
                <div key={idx} style={{color: HEALTH_CATEGORY_COLORS.walking}}>
                  歩行: {wp.total.toFixed(1)}P (短:{wp.shortDistance.toFixed(1)} 中:{wp.mediumDistance.toFixed(1)} 長:
                  {wp.longDistance.toFixed(1)} 運:{wp.exercise.toFixed(1)})
                </div>
              )
            }
            if (['urine', 'stool', 'meal', 'medicine'].includes(entry.dataKey)) {
              return (
                <div key={idx} style={{color: HEALTH_CATEGORY_COLORS[entry.dataKey as HealthCategory]}}>
                  記録あり
                </div>
              )
            }
            return null
          })}
        </div>
      )
    }
    return null
  }

  {
    /* 月間統計サマリー */
  }
  return (
    <div className={` flex flex-col items-start gap-2  mt-2`}>
      <section className={` w-full`}>
        <MonthlyBloodSugarChart
          summaryData={summaryData}
          chartData={chartData}
          BLOOD_SUGAR_ZONES={BLOOD_SUGAR_ZONES}
          CustomTooltip={CustomTooltip}
        />
      </section>
      <section className={` w-full`}>
        <MonthlyWalkingChart year={year} month={month} summaryData={summaryData} />
      </section>
    </div>
  )
}
