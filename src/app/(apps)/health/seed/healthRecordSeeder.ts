import {doStandardPrisma} from '@cm/lib/server-actions/common-server-actions/doStandardPrisma/doStandardPrisma'
import {getMidnight} from '@cm/class/Days/date-utils/calculations'
import {isDev} from '@cm/lib/methods/common'

// 薬IDのマッピング（実際のDBから取得した値に調整してください）
const MEDICINE_IDS = {
  morning: 1, // 朝
  lunch: 2, // 昼
  evening: 3, // 晩
  novorapid: 4, // ノボラピッド
  emergency: 5, // 頓服薬
  kampoA: 6, // 漢方A
  kampoB: 7, // 漢方B
  fever: 8, // 解熱剤
}

// 時刻を生成するヘルパー関数
const randomTime = (startHour: number, endHour: number): string => {
  const hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour
  const minute = Math.floor(Math.random() * 12) * 5 // 5分刻み
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

// 血糖値を生成（正常範囲+バラつき）
const randomBloodSugar = (): number => {
  return Math.floor(Math.random() * 150) + 80 // 80-230 mg/dL
}

// 歩行ポイントを生成
const randomWalkingPoint = (): number => {
  return Math.floor(Math.random() * 10) + 1 // 1-10
}

// シードデータの型定義
interface HealthRecordSeed {
  userId: number
  category: string
  recordDate: Date
  recordTime: string
  bloodSugarValue?: number
  medicineId?: number
  medicineUnit?: number
  walkingShortDistance?: number
  walkingMediumDistance?: number
  walkingLongDistance?: number
  walkingExercise?: number
  memo?: string
}

// 2025年6月のシードデータ生成
export const generateHealthRecordSeeds = (userId: number) => {
  const seeds: HealthRecordSeed[] = []

  // 2025年6月1日から30日まで
  for (let day = 1; day <= 30; day++) {
    const dateStr = `2025-06-${day.toString().padStart(2, '0')}`
    const recordDate = getMidnight(new Date(dateStr))

    // 各日に複数の記録を追加

    // 1. 血糖値測定（15分間隔で6:00-翌6:00）
    // 6:00から翌日6:00まで24時間、15分間隔で96回のチャンス
    for (let hour = 6; hour < 30; hour++) {
      // 6:00から翌日6:00まで
      for (let minute = 0; minute < 60; minute += 15) {
        // 15分間隔
        if (Math.random() > 0.7) {
          // 30%の確率で記録（平均的に1日約29回の測定）
          const actualHour = hour >= 24 ? hour - 24 : hour
          const timeStr = `${actualHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

          seeds.push({
            userId,
            category: 'blood_sugar',
            recordDate,
            recordTime: timeStr,
            bloodSugarValue: randomBloodSugar(),
          })
        }
      }
    }

    // 2. 朝の薬（7:30-8:30）
    if (Math.random() > 0.2) {
      // 80%の確率で記録
      seeds.push({
        userId,
        category: 'medicine',
        recordDate,
        recordTime: randomTime(7, 8),
        medicineId: MEDICINE_IDS.morning,
        medicineUnit: 1,
      })
    }

    // 3. 朝の尿（6:30-8:00）
    if (Math.random() > 0.3) {
      // 70%の確率で記録
      seeds.push({
        userId,
        category: 'urine',
        recordDate,
        recordTime: randomTime(6, 7),
        memo: '起床時',
      })
    }

    // 4. 朝の便（7:00-9:00）
    if (Math.random() > 0.4) {
      // 60%の確率で記録
      seeds.push({
        userId,
        category: 'stool',
        recordDate,
        recordTime: randomTime(7, 8),
        memo: '朝食後',
      })
    }

    // 5. 朝食（8:00-9:00）
    if (Math.random() > 0.1) {
      // 90%の確率で記録
      seeds.push({
        userId,
        category: 'meal',
        recordDate,
        recordTime: randomTime(8, 8),
        memo: '朝食',
      })
    }

    // 6. 午前の間食（10:00-11:00）
    if (Math.random() > 0.6) {
      // 40%の確率で記録
      seeds.push({
        userId,
        category: 'snack',
        recordDate,
        recordTime: randomTime(10, 10),
        memo: 'おやつ',
      })
    }

    // 7. 昼食（12:30-13:30）
    if (Math.random() > 0.15) {
      // 85%の確率で記録
      seeds.push({
        userId,
        category: 'meal',
        recordDate,
        recordTime: randomTime(12, 13),
        memo: '昼食',
      })
    }

    // 8. 昼の薬（13:00-14:00）
    if (Math.random() > 0.3) {
      // 70%の確率で記録
      seeds.push({
        userId,
        category: 'medicine',
        recordDate,
        recordTime: randomTime(13, 13),
        medicineId: MEDICINE_IDS.lunch,
        medicineUnit: 1,
      })
    }

    // 9. 午後の尿（14:00-16:00）
    if (Math.random() > 0.4) {
      // 60%の確率で記録
      seeds.push({
        userId,
        category: 'urine',
        recordDate,
        recordTime: randomTime(14, 15),
        memo: '午後',
      })
    }

    // 10. 午後の間食（15:00-16:00）
    if (Math.random() > 0.7) {
      // 30%の確率で記録
      seeds.push({
        userId,
        category: 'snack',
        recordDate,
        recordTime: randomTime(15, 15),
        memo: 'おやつ',
      })
    }

    // 11. 夕食（19:00-20:00）
    if (Math.random() > 0.1) {
      // 90%の確率で記録
      seeds.push({
        userId,
        category: 'meal',
        recordDate,
        recordTime: randomTime(19, 19),
        memo: '夕食',
      })
    }

    // 12. 夕方の薬（19:30-20:30）
    if (Math.random() > 0.2) {
      // 80%の確率で記録
      seeds.push({
        userId,
        category: 'medicine',
        recordDate,
        recordTime: randomTime(19, 20),
        medicineId: MEDICINE_IDS.evening,
        medicineUnit: 1,
      })
    }

    // 13. 夜の間食（21:00-22:00）
    if (Math.random() > 0.8) {
      // 20%の確率で記録
      seeds.push({
        userId,
        category: 'snack',
        recordDate,
        recordTime: randomTime(21, 21),
        memo: '夜食',
      })
    }

    // 14. 夜の尿（22:00-23:00）
    if (Math.random() > 0.3) {
      // 70%の確率で記録
      seeds.push({
        userId,
        category: 'urine',
        recordDate,
        recordTime: randomTime(22, 22),
        memo: '就寝前',
      })
    }

    // 15. 歩行記録（1日5-8回）
    const walkingCount = Math.floor(Math.random() * 4) + 5 // 5-8回に変更
    for (let i = 0; i < walkingCount; i++) {
      if (Math.random() > 0.05) {
        // 95%の確率に変更
        const walkingType = Math.floor(Math.random() * 4)
        const walkingData: HealthRecordSeed = {
          userId,
          category: 'walking',
          recordDate,
          recordTime: randomTime(6, 21), // 時間帯を6:00-21:00に拡大
          memo: '散歩',
        }

        // 歩行タイプをランダムに設定
        switch (walkingType) {
          case 0:
            walkingData.walkingShortDistance = randomWalkingPoint()
            break
          case 1:
            walkingData.walkingMediumDistance = randomWalkingPoint()
            break
          case 2:
            walkingData.walkingLongDistance = randomWalkingPoint()
            break
          case 3:
            walkingData.walkingExercise = randomWalkingPoint()
            break
        }

        seeds.push(walkingData)
      }
    }

    // 16. 時々追加の便（不定期）
    if (Math.random() > 0.7) {
      // 30%の確率で追加
      seeds.push({
        userId,
        category: 'stool',
        recordDate,
        recordTime: randomTime(15, 17),
        memo: '午後',
      })
    }

    // 17. 時々ノボラピッド（食前）
    if (Math.random() > 0.6) {
      // 40%の確率で記録
      seeds.push({
        userId,
        category: 'medicine',
        recordDate,
        recordTime: randomTime(11, 12),
        medicineId: MEDICINE_IDS.novorapid,
        medicineUnit: Math.floor(Math.random() * 5) + 3, // 3-7単位
      })
    }
  }

  return seeds
}

// シーディング実行関数
export const seedHealthRecords = async (userId: number) => {
  const seeds = generateHealthRecordSeeds(userId)

  try {
    // 既存の2025年6月のデータを削除
    const startDate = getMidnight(new Date('2025-06-01'))
    const endDate = getMidnight(new Date('2025-07-01'))

    if (isDev) {
      await doStandardPrisma('healthRecord', 'deleteMany', {
        where: {
          userId,
          recordDate: {gte: startDate, lt: endDate},
        },
      })
    }

    // 新しいデータを一括作成
    const result = await doStandardPrisma('healthRecord', 'createMany', {
      data: seeds,
    })

    if (result.success) {
      console.log(`${result.result.count}件の健康記録を作成しました`)
      return {success: true, count: result.result.count}
    } else {
      console.error('シーディングに失敗しました:', result.error)
      return {success: false, error: result.error}
    }
  } catch (error) {
    console.error('シーディング実行エラー:', error)
    return {success: false, error}
  }
}
