'use server'

import {doStandardPrisma} from '@cm/lib/server-actions/common-server-actions/doStandardPrisma/doStandardPrisma'
import {HOUR_SLOTS} from '../(constants)/types'
import {HealthService} from '@app/(apps)/health/(lib)/healthService'
import {journalDefaultValue} from '@app/(apps)/health/(lib)/journalService'
import {HealthJournal, HealthJournalEntry, HealthJournalImage} from '@prisma/client'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

// 日誌を取得または作成
export async function getOrCreateJournal(userId: number, date: string) {
  try {
    // 日本時刻の00:00として設定（UTC-9時間）
    const journalDate = new Date(date + 'T00:00:00+09:00')

    // 既存の日誌を検索
    const findResult = await doStandardPrisma('healthJournal', 'findUnique', {
      where: {
        userId_journalDate: {userId, journalDate},
      },
      include: {
        HealthJournalEntry: {
          include: {HealthJournalImage: true},
          orderBy: [{hourSlot: 'asc'}, {createdAt: 'asc'}],
        },
      },
    })

    if (findResult.success && findResult.result) {
      return {
        success: true,
        data: formatJournalData(findResult.result),
      }
    }

    // 新規作成
    const createResult = await doStandardPrisma('healthJournal', 'create', {
      data: {userId, journalDate, templateApplied: false, goalAndReflection: journalDefaultValue},
      include: {
        HealthJournalEntry: {
          include: {HealthJournalImage: true},
          orderBy: {
            hourSlot: 'asc',
          },
        },
      },
    })

    if (!createResult.success) {
      return {
        success: false,
        error: '日誌の作成に失敗しました',
      }
    }

    return {
      success: true,
      data: formatJournalData(createResult.result),
    }
  } catch (error) {
    console.error('日誌取得エラー:', error)
    return {
      success: false,
      error: '日誌の取得に失敗しました',
    }
  }
}

// テンプレートを適用
export async function applyJournalTemplate(journalId: number) {
  try {
    const HealthJournalEntry = HOUR_SLOTS.map(hourSlot => ({
      healthJournalId: journalId,
      hourSlot,
    }))

    const createResult = await doStandardPrisma('healthJournalEntry', 'createMany', {
      data: HealthJournalEntry,
      skipDuplicates: true,
    })

    if (!createResult.success) {
      return {
        success: false,
        error: 'エントリの作成に失敗しました',
      }
    }

    const updateResult = await doStandardPrisma('healthJournal', 'update', {
      where: {id: journalId},
      data: {templateApplied: true},
    })

    if (!updateResult.success) {
      return {
        success: false,
        error: 'テンプレート適用フラグの更新に失敗しました',
      }
    }

    return {success: true}
  } catch (error) {
    console.error('テンプレート適用エラー:', error)
    return {
      success: false,
      error: 'テンプレートの適用に失敗しました',
    }
  }
}

// 日誌を更新
export async function updateJournal(journalId: number, goalAndReflection: string) {
  try {
    const result = await doStandardPrisma('healthJournal', 'update', {
      where: {id: journalId},
      data: {goalAndReflection},
      include: {
        HealthJournalEntry: {
          include: {
            HealthJournalImage: true,
          },
          orderBy: {
            hourSlot: 'asc',
          },
        },
      },
    })

    if (!result.success) {
      return {
        success: false,
        error: '日誌の更新に失敗しました',
      }
    }

    return {
      success: true,
      data: formatJournalData(result.result),
    }
  } catch (error) {
    console.error('日誌更新エラー:', error)
    return {
      success: false,
      error: '日誌の更新に失敗しました',
    }
  }
}

// エントリを更新
export async function updateJournalEntry(healthJournalEntryId: number, comment: string) {
  try {
    const result = await doStandardPrisma('healthJournalEntry', 'update', {
      where: {id: healthJournalEntryId},
      data: {comment},
      include: {
        HealthJournalImage: true,
      },
    })

    if (!result.success) {
      return {
        success: false,
        error: 'エントリの更新に失敗しました',
      }
    }

    return {
      success: true,
      data: formatEntryData(result.result),
    }
  } catch (error) {
    console.error('エントリ更新エラー:', error)
    return {
      success: false,
      error: 'エントリの更新に失敗しました',
    }
  }
}

// 指定日の全健康記録を取得
export async function getAllHealthRecordsForDate(userId: number, journalDate: string) {
  try {
    const {startDate, endDate} = await HealthService.getRecordDateWhere(journalDate)

    const result = await doStandardPrisma('healthRecord', 'findMany', {
      where: {
        userId,
        recordDate: {
          gte: startDate,
          lte: endDate,
        },
      },

      include: {Medicine: true},
      orderBy: {recordTime: 'asc'},
    })

    return {
      success: true,
      data: result.success ? result.result : [],
    }
  } catch (error) {
    console.error('健康記録取得エラー:', error)
    return {
      success: false,
      error: '健康記録の取得に失敗しました',
      data: [],
    }
  }
}

// 指定時間帯の健康記録を取得（廃止予定 - 互換性のため残す）
export async function getHealthRecordsForTimeSlot(userId: number, journalDate: string, hourSlot: number) {
  try {
    // 日本時刻の00:00として設定（UTC-9時間）
    const startDate = new Date(journalDate + 'T00:00:00+09:00')
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)

    // 時間帯の開始・終了時刻を計算
    const startHour = hourSlot
    const endHour = hourSlot === 6 ? 7 : (hourSlot + 1) % 24

    const startTime = `${startHour.toString().padStart(2, '0')}:00`
    const endTime = `${endHour.toString().padStart(2, '0')}:00`

    const result = await doStandardPrisma('healthRecord', 'findMany', {
      where: {
        userId,
        recordDate: {
          gte: startDate,
          lt: endDate,
        },
        recordTime: {
          gte: startTime,
          lt: endTime,
        },
      },
      include: {
        Medicine: true,
      },
      orderBy: {
        recordTime: 'asc',
      },
    })

    return {
      success: true,
      data: result.success ? result.result : [],
    }
  } catch (error) {
    console.error('健康記録取得エラー:', error)
    return {
      success: false,
      error: '健康記録の取得に失敗しました',
      data: [],
    }
  }
}

// 画像を追加
export async function addJournalImage(
  healthJournalEntryId: number,
  imageData: {
    fileName: string
    filePath: string
    fileSize?: number
    mimeType?: string
    description?: string
  }
) {
  try {
    const result = await doStandardPrisma('healthJournalImage', 'create', {
      data: {
        healthJournalEntryId,
        ...imageData,
      },
    })

    return {
      success: result.success,
      data: result.success ? result.result : null,
      error: result.success ? null : '画像の追加に失敗しました',
    }
  } catch (error) {
    console.error('画像追加エラー:', error)
    return {
      success: false,
      error: '画像の追加に失敗しました',
    }
  }
}

// 画像を削除
export async function deleteJournalImage(imageId: number) {
  try {
    const result = await doStandardPrisma('healthJournalImage', 'delete', {
      where: {id: imageId},
    })

    return {
      success: result.success,
      error: result.success ? null : '画像の削除に失敗しました',
    }
  } catch (error) {
    console.error('画像削除エラー:', error)
    return {
      success: false,
      error: '画像の削除に失敗しました',
    }
  }
}

// イチオシ画像を設定
export async function setFeaturedImage(journalId: number, imageId: number | null) {
  try {
    // まず同じ日誌の全画像のisFeaturedをfalseに
    const journal = await doStandardPrisma('healthJournal', 'findUnique', {
      where: {id: journalId},
      include: {
        HealthJournalEntry: {include: {HealthJournalImage: true}},
      },
    })

    if (!journal.success || !journal.result) {
      return {success: false, error: '日誌が見つかりません'}
    }

    // 全画像IDを取得
    const allImageIds: number[] = []
    journal.result.HealthJournalEntry.forEach((entry: any) => {
      entry.HealthJournalImage.forEach((img: any) => {
        allImageIds.push(img.id)
      })
    })

    await Promise.all(
      allImageIds.map(id =>
        doStandardPrisma('healthJournalImage', 'update', {
          where: {id},
          data: {isFeatured: false},
        })
      )
    )

    // 指定画像をイチオシに設定
    if (imageId) {
      await doStandardPrisma('healthJournalImage', 'update', {
        where: {id: imageId},
        data: {isFeatured: true},
      })
    }

    return {success: true}
  } catch (error) {
    console.error('イチオシ設定エラー:', error)
    return {success: false, error: 'イチオシの設定に失敗しました'}
  }
}

// 指定期間の日誌画像を日付ごとに取得（イチオシ画像を優先）
export async function getJournalImagesByDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<{success: boolean; data?: Array<{date: string; firstImage: any; imageCount: number}>; error?: string}> {
  try {
    const result = await doStandardPrisma('healthJournal', 'findMany', {
      where: {
        userId,
        journalDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        HealthJournalEntry: {
          include: {
            HealthJournalImage: {
              orderBy: [{isFeatured: 'desc'}, {sortOrder: 'asc'}],
            },
          },
          orderBy: {hourSlot: 'asc'},
        },
      },
      orderBy: {journalDate: 'desc'},
    })

    if (!result.success) {
      return {
        success: false,
        error: '日誌の取得に失敗しました',
      }
    }

    // 日付ごとにイチオシ画像（なければ最初の画像）を取得
    const dateImageMap = new Map<string, {firstImage: any; imageCount: number}>()

    result.result.forEach(journal => {
      const date = formatDate(journal.journalDate)
      let featuredImage: any = null
      let firstImage: any = null
      let imageCount = 0

      // 時間帯順に並んでいるエントリからイチオシ画像または最初の画像を取得
      for (const entry of journal.HealthJournalEntry) {
        if (entry.HealthJournalImage && entry.HealthJournalImage.length > 0) {
          for (const img of entry.HealthJournalImage) {
            if (img.isFeatured) {
              featuredImage = img
            }
            if (!firstImage) {
              firstImage = img
            }
            imageCount++
          }
        }
      }

      const displayImage = featuredImage || firstImage

      if (displayImage || imageCount > 0) {
        dateImageMap.set(date, {firstImage: displayImage, imageCount})
      }
    })

    const data = Array.from(dateImageMap.entries()).map(([date, {firstImage, imageCount}]) => ({
      date,
      firstImage: firstImage
        ? {
            id: firstImage.id,
            healthJournalEntryId: firstImage.healthJournalEntryId,
            fileName: firstImage.fileName,
            filePath: firstImage.filePath,
            fileSize: firstImage.fileSize,
            mimeType: firstImage.mimeType,
            description: firstImage.description,
            isFeatured: firstImage.isFeatured || false,
            createdAt: firstImage.createdAt.toISOString(),
            updatedAt: firstImage.updatedAt?.toISOString(),
          }
        : null,
      imageCount,
    }))

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('日誌画像取得エラー:', error)
    return {
      success: false,
      error: '日誌画像の取得に失敗しました',
    }
  }
}

// 指定日の全画像を取得
export async function getJournalImagesByDate(
  userId: number,
  date: string
): Promise<{success: boolean; data?: any[]; error?: string}> {
  try {
    const journalDate = new Date(date + 'T00:00:00+09:00')

    const result = await doStandardPrisma('healthJournal', 'findUnique', {
      where: {
        userId_journalDate: {userId, journalDate},
      },
      include: {
        HealthJournalEntry: {
          include: {
            HealthJournalImage: {
              orderBy: {sortOrder: 'asc'},
            },
          },
          orderBy: {hourSlot: 'asc'},
        },
      },
    })

    if (!result.success || !result.result) {
      return {
        success: true,
        data: [],
      }
    }

    // 全画像をフラット化
    const images: any[] = []
    result.result.HealthJournalEntry.forEach(entry => {
      entry.HealthJournalImage.forEach(image => {
        images.push({
          id: image.id,
          healthJournalEntryId: image.healthJournalEntryId,
          fileName: image.fileName,
          filePath: image.filePath,
          fileSize: image.fileSize,
          mimeType: image.mimeType,
          description: image.description,
          createdAt: image.createdAt.toISOString(),
          updatedAt: image.updatedAt?.toISOString(),
        })
      })
    })

    return {
      success: true,
      data: images,
    }
  } catch (error) {
    console.error('日誌画像取得エラー:', error)
    return {
      success: false,
      error: '日誌画像の取得に失敗しました',
    }
  }
}

// データフォーマット関数
function formatJournalData(HealthJournal: HealthJournal & {HealthJournalEntry: HealthJournalEntry[]}) {
  const data = {
    id: HealthJournal.id,
    userId: HealthJournal.userId,
    journalDate: HealthJournal.journalDate.toISOString().split('T')[0],
    goalAndReflection: HealthJournal.goalAndReflection || '',
    templateApplied: HealthJournal.templateApplied,
    HealthJournalEntry: HealthJournal.HealthJournalEntry.map(formatEntryData),
    createdAt: HealthJournal.createdAt.toISOString(),
    updatedAt: HealthJournal.updatedAt?.toISOString(),
  }

  return data
}

function formatEntryData(HealthJournalEntry: HealthJournalEntry & {HealthJournalImage: HealthJournalImage[]}) {
  return {
    id: HealthJournalEntry.id,
    healthJournalId: HealthJournalEntry.healthJournalId,
    hourSlot: HealthJournalEntry.hourSlot,
    comment: HealthJournalEntry.comment || '',
    images:
      HealthJournalEntry.HealthJournalImage?.map((image: any) => ({
        id: image.id,
        healthJournalEntryId: image.healthJournalEntryId,
        fileName: image.fileName,
        filePath: image.filePath,
        fileSize: image.fileSize,
        mimeType: image.mimeType,
        description: image.description,
        isFeatured: image.isFeatured || false,
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt?.toISOString(),
      })) || [],
    createdAt: HealthJournalEntry.createdAt.toISOString(),
    updatedAt: HealthJournalEntry.updatedAt?.toISOString(),
  }
}
