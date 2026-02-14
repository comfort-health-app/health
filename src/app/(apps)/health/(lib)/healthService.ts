import {HealthRecordFormData, DailySummary, WALKING_MULTIPLIERS} from '../(constants)/types'
import {Days} from '@cm/class/Days/Days'
import {toUtc} from '@cm/class/Days/date-utils/calculations'
import prisma from 'src/lib/prisma'

export class HealthService {
  static async getRecordDateWhere(selectedDate: string) {
    // 指定日の範囲を計算（前日7:00〜当日7:00）
    const selectedDateObj = new Date(selectedDate)

    // 前日の7:00（UTC）
    const startDate = Days.hour.add(toUtc(selectedDateObj), 0)

    // 当日の7:00（UTC）
    const endDate = Days.hour.add(startDate, 24)

    return {
      startDate,
      endDate,
    }
  }

  // 健康記録を作成
  static async createHealthRecord(userId: number, data: HealthRecordFormData) {
    return await prisma.healthRecord.create({
      data: {
        userId,
        category: data.category,
        recordDate: new Date(data.recordDate),
        recordTime: data.recordTime,
        bloodSugarValue: data.bloodSugarValue,
        medicineId: data.medicineId,
        medicineUnit: data.medicineUnit,
        walkingShortDistance: data.walkingShortDistance || 0,
        walkingMediumDistance: data.walkingMediumDistance || 0,
        walkingLongDistance: data.walkingLongDistance || 0,
        walkingExercise: data.walkingExercise || 0,
        memo: data.memo,
      },
      include: {
        Medicine: true,
      },
    })
  }

  // 健康記録を更新
  static async updateHealthRecord(id: number, data: Partial<HealthRecordFormData>) {
    return await prisma.healthRecord.update({
      where: {id},
      data: {
        category: data.category,
        recordDate: data.recordDate ? new Date(data.recordDate) : undefined,
        recordTime: data.recordTime,
        bloodSugarValue: data.bloodSugarValue,
        medicineId: data.medicineId,
        medicineUnit: data.medicineUnit,
        walkingShortDistance: data.walkingShortDistance,
        walkingMediumDistance: data.walkingMediumDistance,
        walkingLongDistance: data.walkingLongDistance,
        walkingExercise: data.walkingExercise,
        memo: data.memo,
      },
      include: {
        Medicine: true,
      },
    })
  }

  // 健康記録を削除
  static async deleteHealthRecord(id: number) {
    return await prisma.healthRecord.delete({
      where: {id},
    })
  }

  // 指定日の健康記録を取得
  static async getHealthRecordsByDate(userId: number, date: string) {
    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    return await prisma.healthRecord.findMany({
      where: {
        userId,
        recordDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        Medicine: true,
      },
      orderBy: [{recordTime: 'asc'}, {createdAt: 'asc'}],
    })
  }

  // 指定月の健康記録を取得
  static async getHealthRecordsByMonth(userId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    return await prisma.healthRecord.findMany({
      where: {
        userId,
        recordDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        Medicine: true,
      },
      orderBy: [{recordDate: 'asc'}, {recordTime: 'asc'}],
    })
  }

  // 月別サマリーデータを生成
  static async getMonthlySummary(userId: number, year: number, month: number): Promise<DailySummary[]> {
    const records = await this.getHealthRecordsByMonth(userId, year, month)
    const daysInMonth = new Date(year, month, 0).getDate()
    const summary: DailySummary[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayRecords = records.filter(record => record.recordDate.toISOString().split('T')[0] === date)

      // 血糖値データ
      const bloodSugarRecords = dayRecords.filter(r => r.category === 'blood_sugar' && r.bloodSugarValue)
      const bloodSugarValues = bloodSugarRecords.map(r => r.bloodSugarValue!)

      // 歩行データ
      const walkingRecords = dayRecords.filter(r => r.category === 'walking')
      const walkingPoints = {
        shortDistance: 0,
        mediumDistance: 0,
        longDistance: 0,
        exercise: 0,
        total: 0,
      }

      walkingRecords.forEach(record => {
        walkingPoints.shortDistance += (record.walkingShortDistance || 0) * WALKING_MULTIPLIERS.short_distance
        walkingPoints.mediumDistance += (record.walkingMediumDistance || 0) * WALKING_MULTIPLIERS.medium_distance
        walkingPoints.longDistance += (record.walkingLongDistance || 0) * WALKING_MULTIPLIERS.long_distance
        walkingPoints.exercise += (record.walkingExercise || 0) * WALKING_MULTIPLIERS.exercise
      })

      walkingPoints.total =
        walkingPoints.shortDistance + walkingPoints.mediumDistance + walkingPoints.longDistance + walkingPoints.exercise

      summary.push({
        date,
        bloodSugar: {
          max: bloodSugarValues.length > 0 ? Math.max(...bloodSugarValues) : null,
          min: bloodSugarValues.length > 0 ? Math.min(...bloodSugarValues) : null,
          avg:
            bloodSugarValues.length > 0
              ? Math.round(bloodSugarValues.reduce((a, b) => a + b, 0) / bloodSugarValues.length)
              : null,
        },
        walkingPoints,
      })
    }

    return summary
  }

  // 薬マスタを取得
  static async getMedicines() {
    return await prisma.medicine.findMany({
      where: {active: true},
      orderBy: {createdAt: 'asc'},
    })
  }

  // 特定の健康記録を取得
  static async getHealthRecord(id: number) {
    return await prisma.healthRecord.findUnique({
      where: {id},
      include: {
        Medicine: true,
      },
    })
  }
}
