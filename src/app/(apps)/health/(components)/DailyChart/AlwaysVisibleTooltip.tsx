import {DAILY_CHART_HEIGHT, DAILY_CHART_MARGIN} from '@app/(apps)/health/(components)/DailyChart/constants'
import {
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_CHART_HEIGHT_VALUE,
  HEALTH_CATEGORY_COLORS,
  HealthCategory,
} from '@app/(apps)/health/(constants)/types'

export const AlwaysVisibleTooltip = ({chartData, timeLabels}: {chartData: any[]; timeLabels: string[]}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {chartData
        .map((dataPoint, timeIndex) => {
          const categories = ['urine', 'stool', 'meal', 'medicine', 'walking']

          return categories.map((category, categoryIndex) => {
            const value = dataPoint[category]
            const record = dataPoint[`${category}Record`]

            if (!value || !record) return null

            const getYPosition = (category: HealthCategory) => {
              const chartWrapperHeight = DAILY_CHART_HEIGHT + DAILY_CHART_MARGIN.top + DAILY_CHART_MARGIN.bottom

              const categoryHeight = HEALTH_CATEGORY_CHART_HEIGHT_VALUE[category]
              const data = categoryHeight - DAILY_CHART_MARGIN.top - DAILY_CHART_MARGIN.bottom

              return data
            }

            const getXPosition = () => {
              const xTickCount = timeLabels.length
              const tickRatio = timeIndex / (xTickCount - 1)
              const result = (timeIndex / xTickCount) * 100

              return result
            }

            // 時間軸上の位置を計算（概算）
            const xPercent = getXPosition()
            const yPositions = {
              urine: getYPosition(HEALTH_CATEGORIES.URINE),
              stool: getYPosition(HEALTH_CATEGORIES.STOOL),
              meal: getYPosition(HEALTH_CATEGORIES.MEAL),
              snack: getYPosition(HEALTH_CATEGORIES.SNACK),
              medicine: getYPosition(HEALTH_CATEGORIES.MEDICINE),
              walking: getYPosition(HEALTH_CATEGORIES.WALKING),
            }

            let displayText = ''
            let color = '#000'

            switch (category) {
              case 'medicine': {
                const medicineName = record.Medicine?.name || '薬'
                const unit = record.medicineUnit ? ` (${record.medicineUnit}単位)` : ''
                displayText = `${medicineName}${unit}`
                color = HEALTH_CATEGORY_COLORS.medicine
                break
              }
              case 'urine': {
                displayText = record.recordTime
                color = HEALTH_CATEGORY_COLORS.urine
                break
              }
              case 'stool': {
                displayText = record.recordTime
                color = HEALTH_CATEGORY_COLORS.stool
                break
              }
              case 'meal': {
                displayText = record.recordTime
                color = HEALTH_CATEGORY_COLORS.meal
                break
              }
              case 'snack': {
                displayText = record.recordTime
                color = HEALTH_CATEGORY_COLORS.snack
                break
              }
              case 'walking': {
                displayText = record.recordTime
                color = HEALTH_CATEGORY_COLORS.walking
                break
              }
            }

            return (
              <div
                key={`${timeIndex}-${category}`}
                className="absolute text-xs font-bold"
                style={{
                  left: `${xPercent}%`,
                  bottom: yPositions[category as keyof typeof yPositions],
                  transform: 'translateY(-100%)',
                  color: color,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: `1px solid ${color}`,
                  borderRadius: '4px',
                  padding: '2px 4px',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}
              >
                {displayText}
              </div>
            )
          })
        })
        .flat()}
    </div>
  )
}
