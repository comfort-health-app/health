'use server'

import prisma from 'src/lib/prisma'
import {Prisma, RecurringPattern} from '@prisma/client'
import {getMidnight, addDays} from '@cm/class/Days/date-utils/calculations'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

// 型定義
export type Task = {
  id: number
  createdAt: Date
  updatedAt: Date
  title: string
  description?: string | null
  dueDate?: Date | null
  completed: boolean
  completedAt?: Date | null
  isRecurring: boolean
  RecurringPattern?: RecurringPattern | null
  recurringEndDate?: Date | null
  recurringWeekdays: number[]
  recurringDayOfMonth?: number | null
  recurringMonths: number[]
  userId?: number | null
  TaskAttachment?: TaskAttachment[]
  RecurringTask?: RecurringTask | null
  recurringTaskId?: number | null
}

export type TaskAttachment = {
  id: number
  createdAt: Date
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  taskId: number
}

export type RecurringTask = {
  id: number
  createdAt: Date
  updatedAt: Date
  title: string
  description?: string | null
  pattern: RecurringPattern
  startDate: Date
  endDate: Date | null // nullも許可（Prismaから取得する際はnullの可能性）
  weekdays: number[]
  dayOfMonth?: number | null
  months: number[]
  interval: number
  nextGenerationDate?: Date | null
  isActive: boolean
  userId?: number | null
}

// タスクフィルタータイプ
export type TaskFilter = 'all' | 'individual' | 'recurring' | 'completed' | 'pending'

// ページネーション結果の型
export type PaginatedTasksResult = {
  tasks: Task[]
  totalCount: number
  individualCount: number
  recurringCount: number
  page: number
  pageSize: number
  totalPages: number
}

// タスク件数取得（タブ用）
export async function getTaskCounts(params: {userId: number; completionStatus?: 'all' | 'completed' | 'pending'}) {
  try {
    const {userId, completionStatus = 'all'} = params

    const baseWhere: any = {userId}

    // 完了状態フィルタ
    if (completionStatus === 'completed') {
      baseWhere.completed = true
    } else if (completionStatus === 'pending') {
      baseWhere.completed = false
    }

    // 並列で件数を取得
    const [individualCount, recurringCount] = await Promise.all([
      prisma.task.count({
        where: {...baseWhere, recurringTaskId: null},
      }),
      prisma.task.count({
        where: {...baseWhere, recurringTaskId: {not: null}},
      }),
    ])

    return {
      success: true,
      data: {
        individualCount,
        recurringCount,
        totalCount: individualCount + recurringCount,
      },
    }
  } catch (error) {
    console.error('タスク件数取得エラー:', error)
    return {success: false, error: 'タスク件数の取得に失敗しました'}
  }
}

// タスク取得（ページネーション対応）
export const getTasks = async (params: {
  filter?: TaskFilter
  taskType?: 'all' | 'individual' | 'recurring'
  completionStatus?: 'all' | 'completed' | 'pending'
  sortBy?: 'dueDate' | 'createdAt' | 'title' | 'completedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  includeAttachments?: boolean
  includeRecurringTask?: boolean
  where?: Prisma.TaskWhereInput
}) => {
  try {
    const {
      filter,
      taskType = 'all',
      completionStatus = 'all',
      sortBy = 'dueDate',
      sortOrder = 'asc',
      page = 1,
      pageSize = 50,
      includeAttachments = false,
      includeRecurringTask = false,
      where = {},
    } = params

    // const where: any = {userId}

    // 後方互換性のため、filterパラメータが指定されている場合はそれを使用
    if (filter) {
      switch (filter) {
        case 'individual': {
          where.recurringTaskId = null
          break
        }
        case 'recurring': {
          where.recurringTaskId = {not: null}
          break
        }
        case 'completed': {
          where.completed = true
          break
        }
        case 'pending': {
          where.completed = false
          break
        }
        case 'all':
        default:
          // フィルターなし
          break
      }
    } else {
      // 新しいパラメータを使用
      // タスクタイプフィルタ
      if (taskType === 'individual') {
        where.recurringTaskId = null
      } else if (taskType === 'recurring') {
        where.recurringTaskId = {not: null}
      }

      // 完了状態フィルタ
      if (completionStatus === 'completed') {
        where.completed = true
      } else if (completionStatus === 'pending') {
        where.completed = false
      }
    }

    // 総件数を取得（ページネーション情報用）
    const totalCount = await prisma.task.count({where})
    const totalPages = Math.ceil(totalCount / pageSize)

    // タスクを取得（ページネーション適用）
    const tasks = await prisma.task.findMany({
      where,
      include: {
        TaskAttachment: includeAttachments,
        RecurringTask: includeRecurringTask,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      success: true,
      data: tasks,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    }
  } catch (error) {
    console.error('タスク取得エラー:', error)
    return {success: false, error: 'タスクの取得に失敗しました'}
  }
}

// 個別タスク作成
export async function createTask(data: {title: string; description?: string; dueDate?: Date; userId: number}) {
  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        userId: data.userId,
        isRecurring: false,
        recurringWeekdays: [],
        recurringMonths: [],
      },
      include: {
        TaskAttachment: true,
        RecurringTask: true,
      },
    })

    return {success: true, data: task}
  } catch (error) {
    console.error('タスク作成エラー:', error)
    return {success: false, error: 'タスクの作成に失敗しました'}
  }
}

// 定期タスク作成（一括生成付き）
export async function createRecurringTask(data: {
  title: string
  description?: string
  pattern: RecurringPattern
  startDate: Date | string
  endDate: Date | string
  weekdays?: number[]
  dayOfMonth?: number
  months?: number[]
  interval?: number
  userId: number
}) {
  try {
    // 日付を適切に変換（getMidnightでJST午前0時のUTC表現に統一）
    const startDateJST = typeof data.startDate === 'string' ? getMidnight(new Date(data.startDate)) : data.startDate
    const endDateJST = typeof data.endDate === 'string' ? getMidnight(new Date(data.endDate)) : data.endDate

    // トランザクション内で定期タスクとTaskを一括作成
    const result = await prisma.$transaction(async tx => {
      // 定期タスクを作成
      const recurringTask = await tx.recurringTask.create({
        data: {
          title: data.title,
          description: data.description,
          pattern: data.pattern,
          startDate: startDateJST,
          endDate: endDateJST,
          weekdays: data.weekdays || [],
          dayOfMonth: data.dayOfMonth,
          months: data.months || [],
          interval: data.interval || 1,
          userId: data.userId,
          isActive: true,
        },
      })

      // 開始日から終了日までの期間でタスクを一括生成
      const tasks = generateTaskInstances({
        recurringTask,
        startDate: startDateJST,
        endDate: endDateJST,
      })

      // 生成したタスクをデータベースに一括保存
      const createdTasks = await Promise.all(
        tasks.map(taskData =>
          tx.task.create({
            data: {
              ...taskData,
              recurringTaskId: recurringTask.id,
              userId: data.userId,
              isRecurring: true,
              recurringWeekdays: data.weekdays || [],
              recurringMonths: data.months || [],
            },
          })
        )
      )

      return {recurringTask, tasks: createdTasks}
    })

    return {success: true, data: result}
  } catch (error) {
    console.error('定期タスク作成エラー:', error)
    return {success: false, error: '定期タスクの作成に失敗しました'}
  }
}

// タスクインスタンス生成ロジック
function generateTaskInstances(params: {recurringTask: any; startDate: Date; endDate: Date}): Array<{
  title: string
  description?: string | null
  dueDate: Date
}> {
  const {recurringTask, startDate, endDate} = params
  const tasks: Array<{title: string; description?: string | null; dueDate: Date}> = []

  // 開始日から終了日まで1日ずつチェック
  const end = new Date(endDate)
  let currentDate = new Date(startDate)

  while (currentDate <= end) {
    if (shouldGenerateTaskForDate(currentDate, recurringTask)) {
      tasks.push({
        title: recurringTask.title,
        description: recurringTask.description,
        dueDate: new Date(currentDate),
      })
    }

    // 翌日へ進む
    currentDate = addDays(currentDate, 1)
  }

  return tasks
}

// 指定日にタスクを生成すべきかチェック（formatDateでJST日付部品を取得）
function shouldGenerateTaskForDate(date: Date, recurringTask: any): boolean {
  const {pattern, weekdays, dayOfMonth, months, interval = 1, startDate} = recurringTask

  // JST基準で日付部品を取得
  const jstDay = Number(formatDate(date, 'd')) // 曜日番号 0-6（dayjs 'd'）
  const jstDate = Number(formatDate(date, 'DD')) // 日
  const jstMonth = Number(formatDate(date, 'MM')) // 月
  const jstYear = Number(formatDate(date, 'YYYY')) // 年

  const startDateObj = new Date(startDate)
  const startJstMonth = Number(formatDate(startDateObj, 'MM'))
  const startJstYear = Number(formatDate(startDateObj, 'YYYY'))

  switch (pattern) {
    case 'DAILY': {
      // interval日ごと
      const dayDiff = Math.round((date.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000))
      return dayDiff >= 0 && dayDiff % interval === 0
    }

    case 'WEEKDAYS': {
      return jstDay >= 1 && jstDay <= 5 // 月曜〜金曜
    }

    case 'WEEKENDS': {
      return jstDay === 0 || jstDay === 6 // 日曜、土曜
    }

    case 'WEEKLY': {
      // interval週ごと
      const dayDiff = Math.round((date.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000))
      const weekDiff = Math.floor(dayDiff / 7)
      return dayDiff >= 0 && weekDiff % interval === 0 && weekdays.includes(jstDay)
    }

    case 'MONTHLY': {
      // intervalヶ月ごと
      const monthDiff = (jstYear - startJstYear) * 12 + (jstMonth - startJstMonth)
      return monthDiff >= 0 && monthDiff % interval === 0 && jstDate === dayOfMonth
    }

    case 'YEARLY': {
      // interval年ごと
      const yearDiff = jstYear - startJstYear
      return yearDiff >= 0 && yearDiff % interval === 0 && jstMonth === months[0] && jstDate === dayOfMonth
    }

    case 'CUSTOM': {
      // interval日ごと
      const dayDiff = Math.round((date.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000))
      return dayDiff >= 0 && dayDiff % interval === 0
    }

    default:
      return false
  }
}

// 定期タスク一覧取得
export async function getRecurringTasks(userId: number) {
  try {
    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        Task: {
          select: {
            id: true,
            completed: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {success: true, data: recurringTasks}
  } catch (error) {
    console.error('定期タスク取得エラー:', error)
    return {success: false, error: '定期タスクの取得に失敗しました'}
  }
}

// 定期タスク更新（関連タスクも更新・削除・作成）
export const updateRecurringTask = async (
  id: number,
  data: {
    title?: string
    description?: string
    pattern?: RecurringPattern
    startDate?: Date | string
    endDate?: Date | string
    weekdays?: number[]
    dayOfMonth?: number
    months?: number[]
    interval?: number
  }
) => {
  try {
    // トランザクション内で実行
    const result = await prisma.$transaction(async tx => {
      // 既存の定期タスクを取得
      const existingRecurringTask = await tx.recurringTask.findUnique({
        where: {id},
        include: {
          Task: true,
        },
      })

      if (!existingRecurringTask) {
        throw new Error('定期タスクが見つかりません')
      }

      // 更新データをマージ
      const updateData: any = {...data}



      if (data.startDate) {
        updateData.startDate = typeof data.startDate === 'string' ? getMidnight(new Date(data.startDate)) : data.startDate
      }
      if (data.endDate) {
        updateData.endDate = typeof data.endDate === 'string' ? getMidnight(new Date(data.endDate)) : data.endDate
      }



      // 新しい設定をマージ（未指定のフィールドは既存の値を使用）
      const newRecurringTask = {
        title: updateData.title ?? existingRecurringTask.title,
        description: updateData.description ?? existingRecurringTask.description,
        pattern: updateData.pattern ?? existingRecurringTask.pattern,
        startDate: updateData.startDate ?? existingRecurringTask.startDate,
        endDate: updateData.endDate ?? existingRecurringTask.endDate,
        weekdays: updateData.weekdays ?? existingRecurringTask.weekdays,
        dayOfMonth: updateData.dayOfMonth ?? existingRecurringTask.dayOfMonth,
        months: updateData.months ?? existingRecurringTask.months,
        interval: updateData.interval ?? existingRecurringTask.interval,
      }

      // 定期タスクを更新
      const updatedRecurringTask = await tx.recurringTask.update({
        where: {id},
        data: {
          title: newRecurringTask.title,
          description: newRecurringTask.description,
          pattern: newRecurringTask.pattern,
          startDate: newRecurringTask.startDate,
          endDate: newRecurringTask.endDate,
          weekdays: newRecurringTask.weekdays,
          dayOfMonth: newRecurringTask.dayOfMonth,
          months: newRecurringTask.months,
          interval: newRecurringTask.interval,
        },
      })

      // 新しい設定に基づいてタスクリストを生成
      const newTasks = generateTaskInstances({
        recurringTask: newRecurringTask,
        startDate: newRecurringTask.startDate,
        endDate: newRecurringTask.endDate,
      })

      // 既存のタスクを日付でマップ（時刻部分を無視）
      const existingTasksByDate = new Map<string, (typeof existingRecurringTask.Task)[0]>()
      existingRecurringTask.Task.forEach(task => {
        if (task.dueDate) {
          const dateKey = formatDate(task.dueDate)
          existingTasksByDate.set(dateKey, task)
        }
      })

      // 新しいタスクを日付でマップ
      const newTasksByDate = new Map<string, {title: string; description?: string | null; dueDate: Date}>()
      newTasks.forEach(task => {
        const dateKey = formatDate(task.dueDate)
        newTasksByDate.set(dateKey, task)
      })

      // 削除対象：既存タスクのうち、新しい設定範囲外のもの
      const tasksToDelete: number[] = []
      existingRecurringTask.Task.forEach(task => {
        if (task.dueDate) {
          const dateKey = formatDate(task.dueDate)
          if (!newTasksByDate.has(dateKey)) {
            tasksToDelete.push(task.id)
          }
        }
      })

      // 更新対象：既存タスクのうち、新しい設定範囲内のもの（title, description を更新）
      const tasksToUpdate: Array<{id: number; title: string; description?: string | null}> = []
      existingRecurringTask.Task.forEach(task => {
        if (task.dueDate) {
          const dateKey = formatDate(task.dueDate)
          const newTask = newTasksByDate.get(dateKey)
          if (newTask) {
            tasksToUpdate.push({
              id: task.id,
              title: newTask.title,
              description: newTask.description,
            })
          }
        }
      })

      // 作成対象：新しい設定で追加されるべきタスク
      const tasksToCreate: Array<{title: string; description?: string | null; dueDate: Date}> = []
      newTasks.forEach(task => {
        const dateKey = formatDate(task.dueDate)
        if (!existingTasksByDate.has(dateKey)) {
          tasksToCreate.push(task)
        }
      })

      // 削除を実行
      if (tasksToDelete.length > 0) {
        await tx.task.deleteMany({
          where: {
            id: {in: tasksToDelete},
          },
        })
      }

      // 更新を実行
      await Promise.all(
        tasksToUpdate.map(task =>
          tx.task.update({
            where: {id: task.id},
            data: {
              title: task.title,
              description: task.description,
            },
          })
        )
      )

      // 作成を実行
      if (tasksToCreate.length > 0) {
        await Promise.all(
          tasksToCreate.map(taskData =>
            tx.task.create({
              data: {
                ...taskData,
                recurringTaskId: id,
                userId: existingRecurringTask.userId,
                isRecurring: true,
                recurringWeekdays: newRecurringTask.weekdays,
                recurringMonths: newRecurringTask.months,
              },
            })
          )
        )
      }

      return {recurringTask: updatedRecurringTask}
    })

    return {success: true, data: result}
  } catch (error) {
    console.error('定期タスク更新エラー:', error)
    return {success: false, error: '定期タスクの更新に失敗しました'}
  }
}

// 定期タスク削除（関連するタスクも削除）
export async function deleteRecurringTask(id: number) {
  try {
    // トランザクション内で関連タスクと定期タスクを削除
    await prisma.$transaction(async tx => {
      // 関連するタスクを削除
      await tx.task.deleteMany({
        where: {
          recurringTaskId: id,
        },
      })

      // 定期タスクを削除
      await tx.recurringTask.delete({
        where: {id},
      })
    })

    return {success: true}
  } catch (error) {
    console.error('定期タスク削除エラー:', error)
    return {success: false, error: '定期タスクの削除に失敗しました'}
  }
}

// タスク更新
export async function updateTask(id: number, data: {title?: string; description?: string; dueDate?: Date}) {
  try {
    const task = await prisma.task.update({
      where: {id},
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
      },
      include: {
        TaskAttachment: true,
        RecurringTask: true,
      },
    })

    return {success: true, data: task}
  } catch (error) {
    console.error('タスク更新エラー:', error)
    return {success: false, error: 'タスクの更新に失敗しました'}
  }
}

// タスク削除
export async function deleteTask(id: number) {
  try {
    // 削除前にタスクの添付ファイル情報を取得
    const task = await prisma.task.findUnique({
      where: {id},
      include: {
        TaskAttachment: true,
      },
    })

    if (!task) {
      return {success: false, error: 'タスクが見つかりません'}
    }

    // S3から画像を削除（FileHandlerを使用）
    const {FileHandler} = await import('@cm/class/FileHandler')

    for (const attachment of task.TaskAttachment) {
      try {
        // fileNameからS3のkeyを推測（filename フィールドを使用）
        const s3Key = attachment.filename
        await FileHandler.deleteFileFromS3(s3Key)
      } catch (error) {
        console.error(`S3画像削除エラー (${attachment.filename}):`, error)
        // S3削除エラーがあってもタスク削除は続行
      }
    }

    // データベースからタスクを削除（CASCADE設定により添付ファイルも自動削除）
    await prisma.task.delete({
      where: {id},
    })

    return {success: true}
  } catch (error) {
    console.error('タスク削除エラー:', error)
    return {success: false, error: 'タスクの削除に失敗しました'}
  }
}

// タスク添付画像削除
export async function deleteTaskAttachment(attachmentId: number) {
  try {
    // 削除前に添付ファイル情報を取得
    const attachment = await prisma.taskAttachment.findUnique({
      where: {id: attachmentId},
    })

    if (!attachment) {
      return {success: false, error: '添付ファイルが見つかりません'}
    }

    // S3から画像を削除
    const {FileHandler} = await import('@cm/class/FileHandler')

    try {
      await FileHandler.deleteFileFromS3(attachment.filename)
    } catch (error) {
      console.error(`S3画像削除エラー (${attachment.filename}):`, error)
      // S3削除エラーがあってもDB削除は続行
    }

    // データベースから添付ファイルを削除
    await prisma.taskAttachment.delete({
      where: {id: attachmentId},
    })

    return {success: true}
  } catch (error) {
    console.error('添付ファイル削除エラー:', error)
    return {success: false, error: '添付ファイルの削除に失敗しました'}
  }
}

// タスク完了状態切り替え
export async function toggleTaskComplete(id: number) {
  try {
    const task = await prisma.task.findUnique({
      where: {id},
    })

    if (!task) {
      return {success: false, error: 'タスクが見つかりません'}
    }

    const updatedTask = await prisma.task.update({
      where: {id},
      data: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      },
      include: {
        TaskAttachment: true,
        RecurringTask: true,
      },
    })

    return {success: true, data: updatedTask}
  } catch (error) {
    console.error('タスク完了状態切り替えエラー:', error)
    return {success: false, error: 'タスクの更新に失敗しました'}
  }
}
