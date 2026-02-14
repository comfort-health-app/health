import {HEALTH_CATEGORY_COLORS} from '@app/(apps)/health/(constants)/types'

// カスタムラベルコンポーネント
export const CustomLabel = (props: any) => {
  const {x, y, payload, dataKey} = props
  if (!payload || payload.value === null || payload.value === undefined) return null

  let displayText = ''
  let color = '#000'

  // データキーに基づいて表示内容を決定
  switch (dataKey) {
    case 'bloodSugar': {
      displayText = `${payload.value}`
      color = HEALTH_CATEGORY_COLORS.blood_sugar
      break
    }
    case 'medicine': {
      const record = payload.medicineRecord
      if (!record) return null
      const medicineName = record.Medicine?.name || '薬'
      const unit = record.medicineUnit ? ` (${record.medicineUnit}単位)` : ''
      displayText = `${medicineName}${unit}`
      color = HEALTH_CATEGORY_COLORS.medicine
      break
    }
    case 'urine': {
      const record = payload.urineRecord
      if (!record) return null
      displayText = record.recordTime
      color = HEALTH_CATEGORY_COLORS.urine
      break
    }
    case 'stool': {
      const record = payload.stoolRecord
      if (!record) return null
      displayText = record.recordTime
      color = HEALTH_CATEGORY_COLORS.stool
      break
    }
    case 'meal': {
      const record = payload.mealRecord
      if (!record) return null
      displayText = record.recordTime
      color = HEALTH_CATEGORY_COLORS.meal
      break
    }
    case 'snack': {
      const record = payload.snackRecord
      if (!record) return null
      displayText = record.recordTime
      color = HEALTH_CATEGORY_COLORS.snack
      break
    }
    case 'walking': {
      const record = payload.walkingRecord
      if (!record) return null
      displayText = record.recordTime
      color = HEALTH_CATEGORY_COLORS.walking
      break
    }
    default:
      return null
  }

  const textWidth = displayText.length * 6

  return (
    <g>
      <rect
        x={x - textWidth / 2 - 3}
        y={y - 10}
        width={textWidth + 6}
        height={16}
        fill="rgba(255, 255, 255, 0.95)"
        stroke={color}
        strokeWidth={1}
        rx={2}
      />
      <text x={x} y={y} textAnchor="middle" fontSize="11" fill={color} fontWeight="bold" dominantBaseline="middle">
        {displayText}
      </text>
    </g>
  )
}
