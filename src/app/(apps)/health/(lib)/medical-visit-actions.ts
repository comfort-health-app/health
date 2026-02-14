'use server'

import prisma from 'src/lib/prisma'
import {MedicalVisit, MedicalVisitImage, Hospital, Symptom, MedicalVisitSymptom, MedicalVisitImageType} from '@prisma/client'

// 日本時間の日付文字列をUTC時刻（0時）に変換
function convertJSTDateToUTC(dateString: string): Date {
  const jstDate = new Date(dateString + 'T00:00:00')
  const utcDate = new Date(jstDate.getTime() - 9 * 60 * 60 * 1000)
  return utcDate
}

// 型定義
export type MedicalVisitImageWithType = MedicalVisitImage & {
  imageType: MedicalVisitImageType
}

export type MedicalVisitSymptomWithSymptom = MedicalVisitSymptom & {
  Symptom: Symptom
}

export type MedicalVisitWithRelations = MedicalVisit & {
  Hospital: Hospital
  MedicalVisitImage: MedicalVisitImageWithType[]
  MedicalVisitSymptom?: MedicalVisitSymptomWithSymptom[]
}

export type MedicalVisitFormData = {
  hospitalId: number
  visitDate: string // YYYY-MM-DD形式
  visitTime?: string // HH:mm形式
  departmentAtVisit?: string
  doctorNameAtVisit?: string
  treatment?: string
  doctorComment?: string
  memo?: string
  symptomIds?: number[] // 紐付ける症状ID（複数可能）
}

// 通院履歴一覧取得
export async function getMedicalVisits(params: {
  userId: number
  hospitalId?: number
  symptomId?: number // 症状フィルタ追加
  limit?: number
  offset?: number
}) {
  try {
    const {userId, hospitalId, symptomId, limit = 50, offset = 0} = params

    const where: any = {userId}
    if (hospitalId) {
      where.hospitalId = hospitalId
    }
    // 症状でフィルタ
    if (symptomId) {
      where.MedicalVisitSymptom = {
        some: {
          symptomId: symptomId,
        },
      }
    }

    const [visits, total] = await Promise.all([
      prisma.medicalVisit.findMany({
        where,
        include: {
          Hospital: true,
          MedicalVisitImage: {
            orderBy: {sortOrder: 'asc'},
          },
          MedicalVisitSymptom: {
            include: {
              Symptom: true,
            },
          },
        },
        orderBy: {visitDate: 'desc'},
        take: limit,
        skip: offset,
      }),
      prisma.medicalVisit.count({where}),
    ])

    return {success: true, data: visits, total}
  } catch (error) {
    console.error('通院履歴一覧取得エラー:', error)
    return {success: false, error: '通院履歴の取得に失敗しました'}
  }
}

// 通院履歴詳細取得
export async function getMedicalVisit(id: number) {
  try {
    const visit = await prisma.medicalVisit.findUnique({
      where: {id},
      include: {
        Hospital: true,
        MedicalVisitImage: {
          orderBy: {sortOrder: 'asc'},
        },
        MedicalVisitSymptom: {
          include: {
            Symptom: true,
          },
        },
      },
    })

    if (!visit) {
      return {success: false, error: '通院履歴が見つかりません'}
    }

    return {success: true, data: visit}
  } catch (error) {
    console.error('通院履歴詳細取得エラー:', error)
    return {success: false, error: '通院履歴の取得に失敗しました'}
  }
}

// 通院履歴作成
export async function createMedicalVisit(data: MedicalVisitFormData & {userId: number}) {
  try {
    // 病院情報を取得してスナップショットを保存
    const hospital = await prisma.hospital.findUnique({
      where: {id: data.hospitalId},
    })

    if (!hospital) {
      return {success: false, error: '病院が見つかりません'}
    }

    const visit = await prisma.medicalVisit.create({
      data: {
        userId: data.userId,
        hospitalId: data.hospitalId,
        visitDate: convertJSTDateToUTC(data.visitDate),
        visitTime: data.visitTime,
        departmentAtVisit: data.departmentAtVisit || hospital.department,
        doctorNameAtVisit: data.doctorNameAtVisit || hospital.doctorName,
        treatment: data.treatment,
        doctorComment: data.doctorComment,
        memo: data.memo,
        // 症状の紐付け
        MedicalVisitSymptom: data.symptomIds?.length
          ? {
              create: data.symptomIds.map(symptomId => ({symptomId})),
            }
          : undefined,
      },
      include: {
        Hospital: true,
        MedicalVisitImage: true,
        MedicalVisitSymptom: {
          include: {
            Symptom: true,
          },
        },
      },
    })

    return {success: true, data: visit}
  } catch (error) {
    console.error('通院履歴作成エラー:', error)
    return {success: false, error: '通院履歴の作成に失敗しました'}
  }
}

// 通院履歴更新
export async function updateMedicalVisit(id: number, data: Partial<MedicalVisitFormData>) {
  try {
    const updateData: any = {}

    if (data.hospitalId !== undefined) updateData.hospitalId = data.hospitalId
    if (data.visitDate !== undefined) updateData.visitDate = convertJSTDateToUTC(data.visitDate)
    if (data.visitTime !== undefined) updateData.visitTime = data.visitTime
    if (data.departmentAtVisit !== undefined) updateData.departmentAtVisit = data.departmentAtVisit
    if (data.doctorNameAtVisit !== undefined) updateData.doctorNameAtVisit = data.doctorNameAtVisit
    if (data.treatment !== undefined) updateData.treatment = data.treatment
    if (data.doctorComment !== undefined) updateData.doctorComment = data.doctorComment
    if (data.memo !== undefined) updateData.memo = data.memo

    // 症状の紐付けを更新
    if (data.symptomIds !== undefined) {
      // 既存の紐付けを削除して再作成
      await prisma.medicalVisitSymptom.deleteMany({
        where: {medicalVisitId: id},
      })

      if (data.symptomIds.length > 0) {
        await prisma.medicalVisitSymptom.createMany({
          data: data.symptomIds.map(symptomId => ({
            medicalVisitId: id,
            symptomId,
          })),
        })
      }
    }

    const visit = await prisma.medicalVisit.update({
      where: {id},
      data: updateData,
      include: {
        Hospital: true,
        MedicalVisitImage: {
          orderBy: {sortOrder: 'asc'},
        },
        MedicalVisitSymptom: {
          include: {
            Symptom: true,
          },
        },
      },
    })

    return {success: true, data: visit}
  } catch (error) {
    console.error('通院履歴更新エラー:', error)
    return {success: false, error: '通院履歴の更新に失敗しました'}
  }
}

// 通院履歴削除
export async function deleteMedicalVisit(id: number) {
  try {
    // 関連画像のS3削除
    const visit = await prisma.medicalVisit.findUnique({
      where: {id},
      include: {MedicalVisitImage: true},
    })

    if (!visit) {
      return {success: false, error: '通院履歴が見つかりません'}
    }

    // S3から画像を削除
    const {FileHandler} = await import('@cm/class/FileHandler')
    for (const image of visit.MedicalVisitImage) {
      try {
        await FileHandler.deleteFileFromS3(image.filename)
      } catch (error) {
        console.error(`S3画像削除エラー (${image.filename}):`, error)
      }
    }

    // データベースから削除（CASCADE設定により画像も自動削除）
    await prisma.medicalVisit.delete({
      where: {id},
    })

    return {success: true}
  } catch (error) {
    console.error('通院履歴削除エラー:', error)
    return {success: false, error: '通院履歴の削除に失敗しました'}
  }
}

// 画像追加（imageType対応）
export async function addMedicalVisitImage(
  medicalVisitId: number,
  imageData: {
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    imageType?: MedicalVisitImageType
  }
) {
  try {
    // 最大sortOrderを取得
    const maxSortOrder = await prisma.medicalVisitImage.aggregate({
      where: {medicalVisitId},
      _max: {sortOrder: true},
    })

    const image = await prisma.medicalVisitImage.create({
      data: {
        medicalVisitId,
        filename: imageData.filename,
        originalName: imageData.originalName,
        mimeType: imageData.mimeType,
        size: imageData.size,
        url: imageData.url,
        imageType: imageData.imageType || 'AFTER',
        sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
      },
    })

    return {success: true, data: image}
  } catch (error) {
    console.error('画像追加エラー:', error)
    return {success: false, error: '画像の追加に失敗しました'}
  }
}

// 画像削除
export async function deleteMedicalVisitImage(imageId: number) {
  try {
    const image = await prisma.medicalVisitImage.findUnique({
      where: {id: imageId},
    })

    if (!image) {
      return {success: false, error: '画像が見つかりません'}
    }

    // S3から画像を削除
    const {FileHandler} = await import('@cm/class/FileHandler')
    try {
      await FileHandler.deleteFileFromS3(image.filename)
    } catch (error) {
      console.error(`S3画像削除エラー (${image.filename}):`, error)
    }

    // データベースから削除
    await prisma.medicalVisitImage.delete({
      where: {id: imageId},
    })

    return {success: true}
  } catch (error) {
    console.error('画像削除エラー:', error)
    return {success: false, error: '画像の削除に失敗しました'}
  }
}
