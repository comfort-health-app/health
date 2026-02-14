// 健康管理アプリの型定義

export const HEALTH_CATEGORIES = {
  BLOOD_SUGAR: 'blood_sugar',
  URINE: 'urine',
  STOOL: 'stool',
  MEAL: 'meal',
  SNACK: 'snack',
  MEDICINE: 'medicine',
  WALKING: 'walking',
} as const

export type HealthCategory = (typeof HEALTH_CATEGORIES)[keyof typeof HEALTH_CATEGORIES]

export const HEALTH_CATEGORY_LABELS: Record<HealthCategory, string> = {
  [HEALTH_CATEGORIES.BLOOD_SUGAR]: '血糖値',
  [HEALTH_CATEGORIES.URINE]: '尿',
  [HEALTH_CATEGORIES.STOOL]: '便',
  [HEALTH_CATEGORIES.MEAL]: '食事',
  [HEALTH_CATEGORIES.SNACK]: '間食',
  [HEALTH_CATEGORIES.MEDICINE]: '薬',
  [HEALTH_CATEGORIES.WALKING]: '歩行',
}

export const HEALTH_CATEGORY_CHART_HEIGHT_VALUE: Record<HealthCategory, number> = {
  [HEALTH_CATEGORIES.BLOOD_SUGAR]: 0,
  [HEALTH_CATEGORIES.URINE]: 450,
  [HEALTH_CATEGORIES.STOOL]: 400,
  [HEALTH_CATEGORIES.MEAL]: 350,
  [HEALTH_CATEGORIES.SNACK]: 300,
  [HEALTH_CATEGORIES.MEDICINE]: 250,
  [HEALTH_CATEGORIES.WALKING]: 200,
}

// カテゴリの色定義
export const HEALTH_CATEGORY_COLORS: Record<HealthCategory, string> = {
  [HEALTH_CATEGORIES.BLOOD_SUGAR]: '#ef4444', // 赤
  [HEALTH_CATEGORIES.URINE]: '#f59e0b', // オレンジ
  [HEALTH_CATEGORIES.STOOL]: '#8b5cf6', // 紫
  [HEALTH_CATEGORIES.MEAL]: '#10b981', // 緑
  [HEALTH_CATEGORIES.SNACK]: '#06b6d4', // シアン
  [HEALTH_CATEGORIES.MEDICINE]: '#3b82f6', // 青
  [HEALTH_CATEGORIES.WALKING]: '#464646', // オレンジ
}

// カテゴリの背景色（薄い色）
export const HEALTH_CATEGORY_BG_COLORS: Record<HealthCategory, string> = {
  [HEALTH_CATEGORIES.BLOOD_SUGAR]: '#fef2f2', // 薄い赤
  [HEALTH_CATEGORIES.URINE]: '#fef3c7', // 薄いオレンジ
  [HEALTH_CATEGORIES.STOOL]: '#f3e8ff', // 薄い紫
  [HEALTH_CATEGORIES.MEAL]: '#d1fae5', // 薄い緑
  [HEALTH_CATEGORIES.SNACK]: '#cffafe', // 薄いシアン
  [HEALTH_CATEGORIES.MEDICINE]: '#dbeafe', // 薄い青
  [HEALTH_CATEGORIES.WALKING]: '#fed7aa', // 薄いオレンジ
}

export const WALKING_TYPES = {
  SHORT_DISTANCE: 'short_distance',
  MEDIUM_DISTANCE: 'medium_distance',
  LONG_DISTANCE: 'long_distance',
  EXERCISE: 'exercise',
} as const

export type WalkingType = (typeof WALKING_TYPES)[keyof typeof WALKING_TYPES]

export const WALKING_TYPE_LABELS: Record<WalkingType, string> = {
  [WALKING_TYPES.SHORT_DISTANCE]: '短距離',
  [WALKING_TYPES.MEDIUM_DISTANCE]: '中距離',
  [WALKING_TYPES.LONG_DISTANCE]: '長距離',
  [WALKING_TYPES.EXERCISE]: '運動',
}

// 歩行ポイント計算の係数
export const WALKING_MULTIPLIERS: Record<WalkingType, number> = {
  [WALKING_TYPES.SHORT_DISTANCE]: 0.5,
  [WALKING_TYPES.MEDIUM_DISTANCE]: 1.0,
  [WALKING_TYPES.LONG_DISTANCE]: 1.5,
  [WALKING_TYPES.EXERCISE]: 0.5,
}

// 血糖値の帯域設定
export const BLOOD_SUGAR_RANGES = {
  DANGER_LOW: {min: 0, max: 70, color: 'red', label: '危険域'},
  CAUTION_LOW: {min: 71, max: 100, color: 'pink', label: '要注意域'},
  STABLE: {min: 101, max: 150, color: 'lightblue', label: '安定域'},
  OBSERVATION: {min: 151, max: 250, color: 'yellow', label: '要観察域'},
  CAUTION_HIGH: {min: 251, max: 400, color: 'pink', label: '要注意域'},
  DANGER_HIGH: {min: 401, max: 500, color: 'red', label: '危険域'},
} as const

// 健康記録の入力フォームデータ型
export interface HealthRecordFormData {
  category: HealthCategory
  recordDate: string // YYYY-MM-DD形式
  recordTime: string // HH:mm形式
  bloodSugarValue?: number
  medicineId?: number
  medicineUnit?: number
  walkingShortDistance?: number
  walkingMediumDistance?: number
  walkingLongDistance?: number
  walkingExercise?: number
  memo?: string
}

// 月別サマリー用の型
export interface DailySummary {
  date: string // YYYY-MM-DD形式
  bloodSugar: {
    max: number | null
    min: number | null
    avg: number | null
  }
  walkingPoints: {
    shortDistance: number
    mediumDistance: number
    longDistance: number
    exercise: number
    total: number
  }
}

// 日誌機能の型定義
export interface HealthJournal {
  id: number
  userId: number
  journalDate: string // YYYY-MM-DD形式
  goalAndReflection?: string
  templateApplied: boolean
  createdAt: string
  updatedAt?: string
  HealthJournalEntry: HealthJournalEntry[]
}

export interface HealthJournalEntry {
  id: number
  healthJournalId: number
  hourSlot: number // 7, 8, 9, ..., 6
  comment?: string
  images: HealthJournalImage[]
  createdAt: string
  updatedAt?: string
}

export interface HealthJournalImage {
  id: number
  healthJournalEntryId: number
  fileName: string
  filePath: string
  fileSize?: number
  mimeType?: string
  description?: string
  isFeatured?: boolean
  createdAt: string
  updatedAt?: string
}

// 日誌フォームデータ型
export interface JournalFormData {
  goalAndReflection?: string
  HealthJournalEntry: {
    hourSlot: number
    comment?: string
    images?: File[]
  }[]
}

// 時間帯ラベル
export const HOUR_SLOT_LABELS: Record<number, string> = {
  7: '7:00-8:00',
  8: '8:00-9:00',
  9: '9:00-10:00',
  10: '10:00-11:00',
  11: '11:00-12:00',
  12: '12:00-13:00',
  13: '13:00-14:00',
  14: '14:00-15:00',
  15: '15:00-16:00',
  16: '16:00-17:00',
  17: '17:00-18:00',
  18: '18:00-19:00',
  19: '19:00-20:00',
  20: '20:00-21:00',
  21: '21:00-22:00',
  22: '22:00-23:00',
  23: '23:00-0:00',
  0: '0:00-1:00',
  1: '1:00-2:00',
  2: '2:00-3:00',
  3: '3:00-4:00',
  4: '4:00-5:00',
  5: '5:00-6:00',
  6: '6:00-7:00',
}

// 時間帯の順序（7:00起点）
export const HOUR_SLOTS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6]
