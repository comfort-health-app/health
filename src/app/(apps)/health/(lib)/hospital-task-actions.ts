'use server'

import prisma from 'src/lib/prisma'
import {HospitalTask, HospitalTaskImage, Hospital} from '@prisma/client'

// 日本時間の日付文字列をUTC時刻（0時）に変換
function convertJSTDateToUTC(dateString: string): Date {
  const jstDate = new Date(dateString + 'T00:00:00')
  const utcDate = new Date(jstDate.getTime() - 9 * 60 * 60 * 1000)
  return utcDate
}

// 型定義
export type HospitalTaskWithRelations = HospitalTask & {
  Hospital: Hospital
  HospitalTaskImage: HospitalTaskImage[]
}

export type HospitalTaskFormData = {
  hospitalId: number
  dueDate?: string // YYYY-MM-DD形式
  content: string
  memo?: string
}

// 病院タスク一覧取得（病院ごとにグループ化）
export async function getHospitalTasks(params: {userId: number; includeCompleted?: boolean}) {
  try {
    const {userId, includeCompleted = false} = params

    const where: any = {userId}
    if (!includeCompleted) {
      where.completed = false
    }

    const tasks = await prisma.hospitalTask.findMany({
      where,
      include: {
        Hospital: true,
        HospitalTaskImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
      orderBy: [{Hospital: {sortOrder: 'asc'}}, {dueDate: 'asc'}, {createdAt: 'desc'}],
    })

    return {success: true, data: tasks}
  } catch (error) {
    console.error('病院タスク一覧取得エラー:', error)
    return {success: false, error: '病院タスクの取得に失敗しました'}
  }
}

// 今日が期限のタスク取得（ダッシュボード用）
export async function getTodayHospitalTasks(userId: number) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tasks = await prisma.hospitalTask.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        Hospital: true,
        HospitalTaskImage: true,
      },
      orderBy: {createdAt: 'desc'},
    })

    return {success: true, data: tasks}
  } catch (error) {
    console.error('今日の病院タスク取得エラー:', error)
    return {success: false, error: '今日の病院タスクの取得に失敗しました'}
  }
}

// 病院タスク詳細取得
export async function getHospitalTask(id: number) {
  try {
    const task = await prisma.hospitalTask.findUnique({
      where: {id},
      include: {
        Hospital: true,
        HospitalTaskImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
    })

    if (!task) {
      return {success: false, error: '病院タスクが見つかりません'}
    }

    return {success: true, data: task}
  } catch (error) {
    console.error('病院タスク詳細取得エラー:', error)
    return {success: false, error: '病院タスクの取得に失敗しました'}
  }
}

// 病院タスク作成
export async function createHospitalTask(data: HospitalTaskFormData & {userId: number}) {
  try {
    const task = await prisma.hospitalTask.create({
      data: {
        userId: data.userId,
        hospitalId: data.hospitalId,
        dueDate: data.dueDate ? convertJSTDateToUTC(data.dueDate) : null,
        content: data.content,
        memo: data.memo,
        completed: false,
      },
      include: {
        Hospital: true,
        HospitalTaskImage: true,
      },
    })

    return {success: true, data: task}
  } catch (error) {
    console.error('病院タスク作成エラー:', error)
    return {success: false, error: '病院タスクの作成に失敗しました'}
  }
}

// 病院タスク更新
export async function updateHospitalTask(id: number, data: Partial<HospitalTaskFormData>) {
  try {
    const updateData: any = {}

    if (data.hospitalId !== undefined) updateData.hospitalId = data.hospitalId
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? convertJSTDateToUTC(data.dueDate) : null
    if (data.content !== undefined) updateData.content = data.content
    if (data.memo !== undefined) updateData.memo = data.memo

    const task = await prisma.hospitalTask.update({
      where: {id},
      data: updateData,
      include: {
        Hospital: true,
        HospitalTaskImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
    })

    return {success: true, data: task}
  } catch (error) {
    console.error('病院タスク更新エラー:', error)
    return {success: false, error: '病院タスクの更新に失敗しました'}
  }
}

// 病院タスク完了切り替え
export async function toggleHospitalTaskComplete(id: number) {
  try {
    const task = await prisma.hospitalTask.findUnique({
      where: {id},
    })

    if (!task) {
      return {success: false, error: '病院タスクが見つかりません'}
    }

    const updatedTask = await prisma.hospitalTask.update({
      where: {id},
      data: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      },
      include: {
        Hospital: true,
        HospitalTaskImage: {
          orderBy: {sortOrder: 'asc'},
        },
      },
    })

    return {success: true, data: updatedTask}
  } catch (error) {
    console.error('病院タスク完了切り替えエラー:', error)
    return {success: false, error: '病院タスクの更新に失敗しました'}
  }
}

// 病院タスク削除
export async function deleteHospitalTask(id: number) {
  try {
    const task = await prisma.hospitalTask.findUnique({
      where: {id},
      include: {HospitalTaskImage: true},
    })

    if (!task) {
      return {success: false, error: '病院タスクが見つかりません'}
    }

    // S3から画像を削除
    const {FileHandler} = await import('@cm/class/FileHandler')
    for (const image of task.HospitalTaskImage) {
      try {
        await FileHandler.deleteFileFromS3(image.filename)
      } catch (error) {
        console.error(`S3画像削除エラー (${image.filename}):`, error)
      }
    }

    // データベースから削除
    await prisma.hospitalTask.delete({
      where: {id},
    })

    return {success: true}
  } catch (error) {
    console.error('病院タスク削除エラー:', error)
    return {success: false, error: '病院タスクの削除に失敗しました'}
  }
}

// 画像追加
export async function addHospitalTaskImage(
  hospitalTaskId: number,
  imageData: {filename: string; originalName: string; mimeType: string; size: number; url: string}
) {
  try {
    const maxSortOrder = await prisma.hospitalTaskImage.aggregate({
      where: {hospitalTaskId},
      _max: {sortOrder: true},
    })

    const image = await prisma.hospitalTaskImage.create({
      data: {
        hospitalTaskId,
        ...imageData,
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
export async function deleteHospitalTaskImage(imageId: number) {
  try {
    const image = await prisma.hospitalTaskImage.findUnique({
      where: {id: imageId},
    })

    if (!image) {
      return {success: false, error: '画像が見つかりません'}
    }

    const {FileHandler} = await import('@cm/class/FileHandler')
    try {
      await FileHandler.deleteFileFromS3(image.filename)
    } catch (error) {
      console.error(`S3画像削除エラー (${image.filename}):`, error)
    }

    await prisma.hospitalTaskImage.delete({
      where: {id: imageId},
    })

    return {success: true}
  } catch (error) {
    console.error('画像削除エラー:', error)
    return {success: false, error: '画像の削除に失敗しました'}
  }
}

