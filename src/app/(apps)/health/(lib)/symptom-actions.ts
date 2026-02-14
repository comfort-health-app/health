'use server'

import prisma from 'src/lib/prisma'
import {Symptom, SymptomImage} from '@prisma/client'

// 日本時間の日付文字列をUTC時刻（0時）に変換
function convertJSTDateToUTC(dateString: string): Date {
  const jstDate = new Date(dateString + 'T00:00:00')
  const utcDate = new Date(jstDate.getTime() - 9 * 60 * 60 * 1000)
  return utcDate
}

// 型定義
export type SymptomWithRelations = Symptom & {
  _count?: {
    MedicalVisitSymptom: number
  }
  SymptomImage?: SymptomImage[]
}

export type SymptomFormData = {
  name: string
  description?: string
  startDate: string // YYYY-MM-DD形式
  endDate?: string // YYYY-MM-DD形式
}

// 症状一覧取得
export async function getSymptoms(params: {
  userId: number
  includeEnded?: boolean // 終了済みも含める
  activeOnly?: boolean // 進行中のみ
  limit?: number
  offset?: number
}) {
  try {
    const {userId, includeEnded = true, activeOnly = false, limit = 100, offset = 0} = params

    const where: any = {userId}

    // 進行中のみの場合
    if (activeOnly) {
      const now = new Date()
      where.OR = [{endDate: null}, {endDate: {gt: now}}]
    }

    // 終了済みを除外する場合
    if (!includeEnded) {
      const now = new Date()
      where.OR = [{endDate: null}, {endDate: {gt: now}}]
    }

    const [symptoms, total] = await Promise.all([
      prisma.symptom.findMany({
        where,
        include: {
          _count: {
            select: {MedicalVisitSymptom: true},
          },
          SymptomImage: {
            orderBy: {sortOrder: 'asc'},
          },
        },
        orderBy: [{endDate: {sort: 'asc', nulls: 'first'}}, {startDate: 'desc'}],
        take: limit,
        skip: offset,
      }),
      prisma.symptom.count({where}),
    ])

    return {success: true, data: symptoms, total}
  } catch (error) {
    console.error('症状一覧取得エラー:', error)
    return {success: false, error: '症状の取得に失敗しました'}
  }
}

// 進行中の症状のみ取得（ダッシュボード用）
export async function getActiveSymptoms(userId: number) {
  try {
    const now = new Date()

    const symptoms = await prisma.symptom.findMany({
      where: {
        userId,
        OR: [{endDate: null}, {endDate: {gt: now}}],
      },
      include: {
        _count: {
          select: {MedicalVisitSymptom: true},
        },
        SymptomImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
      orderBy: {startDate: 'desc'},
    })

    return {success: true, data: symptoms}
  } catch (error) {
    console.error('進行中症状取得エラー:', error)
    return {success: false, error: '進行中症状の取得に失敗しました'}
  }
}

// 症状詳細取得
export async function getSymptom(id: number) {
  try {
    const symptom = await prisma.symptom.findUnique({
      where: {id},
      include: {
        _count: {
          select: {MedicalVisitSymptom: true},
        },
        SymptomImage: {
          orderBy: {sortOrder: 'asc'},
        },
        MedicalVisitSymptom: {
          include: {
            MedicalVisit: {
              include: {
                Hospital: true,
              },
            },
          },
          orderBy: {
            MedicalVisit: {
              visitDate: 'desc',
            },
          },
        },
      },
    })

    if (!symptom) {
      return {success: false, error: '症状が見つかりません'}
    }

    return {success: true, data: symptom}
  } catch (error) {
    console.error('症状詳細取得エラー:', error)
    return {success: false, error: '症状の取得に失敗しました'}
  }
}

// 症状作成
export async function createSymptom(data: SymptomFormData & {userId: number}) {
  try {
    const symptom = await prisma.symptom.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
        startDate: convertJSTDateToUTC(data.startDate),
        endDate: data.endDate ? convertJSTDateToUTC(data.endDate) : null,
      },
      include: {
        _count: {
          select: {MedicalVisitSymptom: true},
        },
        SymptomImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
    })

    return {success: true, data: symptom}
  } catch (error) {
    console.error('症状作成エラー:', error)
    return {success: false, error: '症状の作成に失敗しました'}
  }
}

// 症状更新
export async function updateSymptom(id: number, data: Partial<SymptomFormData>) {
  try {
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.startDate !== undefined) updateData.startDate = convertJSTDateToUTC(data.startDate)
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? convertJSTDateToUTC(data.endDate) : null
    }

    const symptom = await prisma.symptom.update({
      where: {id},
      data: updateData,
      include: {
        _count: {
          select: {MedicalVisitSymptom: true},
        },
        SymptomImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
    })

    return {success: true, data: symptom}
  } catch (error) {
    console.error('症状更新エラー:', error)
    return {success: false, error: '症状の更新に失敗しました'}
  }
}

// 症状削除
export async function deleteSymptom(id: number) {
  try {
    // 紐付いている通院履歴の数を確認
    const symptom = await prisma.symptom.findUnique({
      where: {id},
      include: {
        _count: {
          select: {MedicalVisitSymptom: true},
        },
      },
    })

    if (!symptom) {
      return {success: false, error: '症状が見つかりません'}
    }

    // 削除（CASCADE設定により中間テーブルも自動削除）
    await prisma.symptom.delete({
      where: {id},
    })

    return {success: true}
  } catch (error) {
    console.error('症状削除エラー:', error)
    return {success: false, error: '症状の削除に失敗しました'}
  }
}

// 症状の終了日を設定（症状を終了させる）
export async function endSymptom(id: number, endDate: string) {
  try {
    const symptom = await prisma.symptom.update({
      where: {id},
      data: {
        endDate: convertJSTDateToUTC(endDate),
      },
      include: {
        _count: {
          select: {MedicalVisitSymptom: true},
        },
        SymptomImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
    })

    return {success: true, data: symptom}
  } catch (error) {
    console.error('症状終了エラー:', error)
    return {success: false, error: '症状の終了に失敗しました'}
  }
}

// 症状の終了を解除（再発）
export async function reopenSymptom(id: number) {
  try {
    const symptom = await prisma.symptom.update({
      where: {id},
      data: {
        endDate: null,
      },
      include: {
        _count: {
          select: {MedicalVisitSymptom: true},
        },
        SymptomImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
    })

    return {success: true, data: symptom}
  } catch (error) {
    console.error('症状再開エラー:', error)
    return {success: false, error: '症状の再開に失敗しました'}
  }
}

