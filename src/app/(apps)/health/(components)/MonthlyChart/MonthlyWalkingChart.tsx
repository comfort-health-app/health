import React, {useState, useMemo, useEffect} from 'react'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList} from 'recharts'
import {DailySummary} from '../../(constants)/types'
import {getMonthlyGoal, upsertMonthlyGoal} from '@app/(apps)/health/api/monthly-setting'
import {R_Stack} from '@cm/components/styles/common-components/common-components'

const WALKING_COLORS = {
  shortDistance: '#3b82f6', // 青
  mediumDistance: '#f59e0b', // オレンジ
  longDistance: '#6b7280', // グレー
  exercise: '#facc15', // 黄
}

interface MonthlyWalkingChartProps {
  summaryData: DailySummary[]
  year: number
  month: number
}

export default function MonthlyWalkingChart({year, month, summaryData}: MonthlyWalkingChartProps) {
  // 目標値（初期値は650）
  const [goal, setGoal] = useState<number>(650)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchGoal = async () => {
      const goal = await getMonthlyGoal({year, month, key: 'walking_goal'})

      setGoal(Number(goal) ?? 650)
    }
    fetchGoal()
  }, [year, month])

  const handleGoalChange = async (newGoal: number) => {
    setGoal(newGoal)
    setSaving(true)
    await upsertMonthlyGoal({year, month, key: 'walking_goal', value: String(newGoal)})
    setSaving(false)
  }

  // recharts用データ整形
  const chartData = useMemo(
    () =>
      summaryData.map((day, idx) => ({
        day: new Date(day.date).getDate(),
        shortDistance: day.walkingPoints.shortDistance,
        mediumDistance: day.walkingPoints.mediumDistance,
        longDistance: day.walkingPoints.longDistance,
        exercise: day.walkingPoints.exercise,
        total: day.walkingPoints.total,
      })),
    [summaryData]
  )

  // サマリー計算
  const sumRange = (start: number, end: number) => chartData.slice(start, end).reduce((sum, d) => sum + d.total, 0)
  const sum10 = sumRange(0, 10)
  const sum20 = sumRange(0, 20)
  const sumAll = sumRange(0, chartData.length)
  const sumLast = sumRange(chartData.length - 10, chartData.length)
  const achievement = goal > 0 ? Math.round((sumAll / goal) * 100) : 0

  // カスタムツールチップ
  const CustomTooltip = ({active, payload, label}: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-white p-2 border rounded shadow text-xs">
          <div className="font-bold mb-1">{label}日</div>
          <div>短距離: {d.shortDistance}</div>
          <div>中距離: {d.mediumDistance}</div>
          <div>長距離: {d.longDistance}</div>
          <div>運動: {d.exercise}</div>
          <div className="font-bold mt-1">合計: {d.total}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* サマリー */}

      {/* グラフ */}
      <div className="bg-white rounded-lg shadow p-2">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{top: 30, right: 30, left: 0, bottom: 0}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{fontSize: 12}} />
            <YAxis domain={[0, 'dataMax + 10']} tick={{fontSize: 12}} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              isAnimationActive={false}
              dataKey="shortDistance"
              stackId="a"
              fill={WALKING_COLORS.shortDistance}
              name="短距離"
            />
            <Bar
              isAnimationActive={false}
              dataKey="mediumDistance"
              stackId="a"
              fill={WALKING_COLORS.mediumDistance}
              name="中距離"
            />
            <Bar isAnimationActive={false} dataKey="longDistance" stackId="a" fill={WALKING_COLORS.longDistance} name="長距離" />
            <Bar isAnimationActive={false} dataKey="exercise" stackId="a" fill={WALKING_COLORS.exercise} name="運動">
              <LabelList dataKey="total" position="top" formatter={v => (v > 0 ? v : '')} fontSize={12} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* 凡例 */}
        <div className="flex gap-4 mt-2 text-xs">
          <div className="flex items-center">
            <span className="inline-block w-4 h-3 mr-1" style={{background: WALKING_COLORS.shortDistance}} />
            短距離
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-3 mr-1" style={{background: WALKING_COLORS.mediumDistance}} />
            中距離
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-3 mr-1" style={{background: WALKING_COLORS.longDistance}} />
            長距離
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-3 mr-1" style={{background: WALKING_COLORS.exercise}} />
            運動
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-2 flex flex-wrap items-center gap-2 text-sm">
        <div className="font-bold">歩行ポイント（月次集計）</div>
        <div className="flex items-center border rounded overflow-hidden ml-2">
          <span className="bg-gray-100 px-2 py-1">目標</span>
          <input
            type="number"
            className="w-20 px-2 py-1 text-center outline-none"
            style={{background: '#fff', border: 'none'}}
            value={goal}
            min={0}
            onChange={e => setGoal(Number(e.target.value))}
            onBlur={e => handleGoalChange(Number(e.target.value))}
          />
        </div>
        {saving && <span>保存中...</span>}

        <R_Stack>
          <div className="ml-2">
            ～10日 <span className="font-bold">{sum10.toFixed(1)}</span>
          </div>
          <div className="ml-2">
            ～20日 <span className="font-bold">{sum20.toFixed(1)}</span>
          </div>
          <div className="ml-2">
            ～最終 <span className="font-bold">{sumAll.toFixed(1)}</span>
          </div>
          <div className="ml-2">
            達成率 <span className="font-bold">{achievement}%</span>
          </div>
        </R_Stack>
      </div>
    </div>
  )
}
