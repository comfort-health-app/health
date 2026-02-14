'use server'

import prisma from 'src/lib/prisma'
import {Hospital} from '@prisma/client'

// 型定義
export type HospitalWithRelations = Hospital & {
  _count?: {
    MedicalVisit: number
    HospitalTask: number
  }
}

export type HospitalFormData = {
  name: string
  department: string
  doctorName: string
  active?: boolean
}

// 病院一覧取得
export async function getHospitals(params: {userId: number; includeInactive?: boolean}) {
  try {
    const {userId, includeInactive = false} = params

    const where: any = {userId}
    if (!includeInactive) {
      where.active = true
    }

    const hospitals = await prisma.hospital.findMany({
      where,
      include: {
        _count: {
          select: {
            MedicalVisit: true,
            HospitalTask: true,
          },
        },
      },
      orderBy: {createdAt: 'asc'},
    })

    return {success: true, data: hospitals}
  } catch (error) {
    console.error('病院一覧取得エラー:', error)
    return {success: false, error: '病院一覧の取得に失敗しました'}
  }
}

// 病院詳細取得
export async function getHospital(id: number) {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: {id},
      include: {
        _count: {
          select: {
            MedicalVisit: true,
            HospitalTask: true,
          },
        },
      },
    })

    if (!hospital) {
      return {success: false, error: '病院が見つかりません'}
    }

    return {success: true, data: hospital}
  } catch (error) {
    console.error('病院詳細取得エラー:', error)
    return {success: false, error: '病院の取得に失敗しました'}
  }
}

// 病院作成
export async function createHospital(data: HospitalFormData & {userId: number}) {
  try {
    // 同じユーザーの最大sortOrderを取得
    const maxSortOrder = await prisma.hospital.aggregate({
      where: {userId: data.userId},
      _max: {sortOrder: true},
    })

    const hospital = await prisma.hospital.create({
      data: {
        userId: data.userId,
        name: data.name,
        department: data.department,
        doctorName: data.doctorName,
        active: data.active ?? true,
        sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
      },
      include: {
        _count: {
          select: {
            MedicalVisit: true,
            HospitalTask: true,
          },
        },
      },
    })

    return {success: true, data: hospital}
  } catch (error) {
    console.error('病院作成エラー:', error)
    return {success: false, error: '病院の作成に失敗しました'}
  }
}

// 病院更新
export async function updateHospital(id: number, data: Partial<HospitalFormData>) {
  try {
    const hospital = await prisma.hospital.update({
      where: {id},
      data: {
        name: data.name,
        department: data.department,
        doctorName: data.doctorName,
        active: data.active,
      },
      include: {
        _count: {
          select: {
            MedicalVisit: true,
            HospitalTask: true,
          },
        },
      },
    })

    return {success: true, data: hospital}
  } catch (error) {
    console.error('病院更新エラー:', error)
    return {success: false, error: '病院の更新に失敗しました'}
  }
}

// 病院削除（論理削除 = active: false）
export async function deactivateHospital(id: number) {
  try {
    const hospital = await prisma.hospital.update({
      where: {id},
      data: {active: false},
    })

    return {success: true, data: hospital}
  } catch (error) {
    console.error('病院無効化エラー:', error)
    return {success: false, error: '病院の無効化に失敗しました'}
  }
}

// 病院物理削除（通院履歴やタスクがある場合は削除不可）
export async function deleteHospital(id: number) {
  try {
    // 関連データの確認
    const hospital = await prisma.hospital.findUnique({
      where: {id},
      include: {
        _count: {
          select: {
            MedicalVisit: true,
            HospitalTask: true,
          },
        },
      },
    })

    if (!hospital) {
      return {success: false, error: '病院が見つかりません'}
    }

    if (hospital._count.MedicalVisit > 0 || hospital._count.HospitalTask > 0) {
      return {
        success: false,
        error: '通院履歴またはタスクが存在するため削除できません。無効化をお試しください。',
      }
    }

    await prisma.hospital.delete({
      where: {id},
    })

    return {success: true}
  } catch (error) {
    console.error('病院削除エラー:', error)
    return {success: false, error: '病院の削除に失敗しました'}
  }
}

// 並び順更新
export async function updateHospitalSortOrder(updates: {id: number; sortOrder: number}[]) {
  try {
    await prisma.$transaction(
      updates.map(({id, sortOrder}) =>
        prisma.hospital.update({
          where: {id},
          data: {sortOrder},
        })
      )
    )

    return {success: true}
  } catch (error) {
    console.error('並び順更新エラー:', error)
    return {success: false, error: '並び順の更新に失敗しました'}
  }
}

