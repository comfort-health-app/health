export const journalDefaultValue = `≪目標≫

早番：

遅番：

深夜：



≪振り返り≫

早番：

遅番：

深夜：`

// 日誌機能のデータアクセスサービス

export class JournalService {
  // // 7:00起点の日付を取得（前日7:00から当日7:00まで）
  // static getJournalDate(date: Date): Date {
  //   const journalDate = new Date(date)
  //   if (journalDate.getHours() < 7) {
  //     // 7:00より前なら前日の日誌
  //     journalDate.setDate(journalDate.getDate() - 1)
  //   }
  //   journalDate.setHours(7, 0, 0, 0)
  //   return journalDate
  // }
  // // 日誌を取得（存在しない場合は作成）
  // static async getOrCreateJournal(userId: number, date: string): Promise<HealthJournal | null> {
  //   const journalDate = new Date(date + 'T07:00:00.000Z')
  //   // 既存の日誌を検索
  //   const findResult = await doStandardPrisma('healthJournal', 'findUnique', {
  //     where: {
  //       userId_journalDate: {
  //         userId,
  //         journalDate,
  //       },
  //     },
  //     include: {
  //       entries: {
  //         include: {
  //           images: true,
  //         },
  //         orderBy: {
  //           hourSlot: 'asc',
  //         },
  //       },
  //     },
  //   })
  //   let journal
  //   if (findResult.success && findResult.result) {
  //     journal = findResult.result
  //   } else {
  //     // 新規作成
  //     const createResult = await doStandardPrisma('healthJournal', 'create', {
  //       data: {
  //         goalAndReflection: journalDefaultValue,
  //         userId,
  //         journalDate,
  //         templateApplied: false,
  //       },
  //       include: {
  //         HealthJournalEntry: {
  //           include: {
  //             HealthJournalImage: true,
  //           },
  //           orderBy: {
  //             hourSlot: 'asc',
  //           },
  //         },
  //       },
  //     })
  //     if (!createResult.success) {
  //       return null
  //     }
  //     journal = createResult.result
  //   }
  //   return {
  //     id: journal.id,
  //     userId: journal.userId,
  //     journalDate: journal.journalDate.toISOString().split('T')[0],
  //     goalAndReflection: journal.goalAndReflection || undefined,
  //     templateApplied: journal.templateApplied,
  //     entries: journal.entries.map((entry: any) => ({
  //       id: entry.id,
  //       journalId: entry.journalId,
  //       hourSlot: entry.hourSlot,
  //       comment: entry.comment || undefined,
  //       images: entry.images.map((image: any) => ({
  //         id: image.id,
  //         entryId: image.entryId,
  //         fileName: image.fileName,
  //         filePath: image.filePath,
  //         fileSize: image.fileSize || undefined,
  //         mimeType: image.mimeType || undefined,
  //         description: image.description || undefined,
  //         createdAt: image.createdAt.toISOString(),
  //         updatedAt: image.updatedAt?.toISOString(),
  //       })),
  //       createdAt: entry.createdAt.toISOString(),
  //       updatedAt: entry.updatedAt?.toISOString(),
  //     })),
  //     createdAt: journal.createdAt.toISOString(),
  //     updatedAt: journal.updatedAt?.toISOString(),
  //   }
  // }
  // // テンプレートを適用（24時間分のエントリを作成）
  // static async applyTemplate(journalId: number): Promise<boolean> {
  //   const entries = HOUR_SLOTS.map(hourSlot => ({
  //     journalId,
  //     hourSlot,
  //   }))
  //   const createResult = await doStandardPrisma('healthJournalEntry', 'createMany', {
  //     data: entries,
  //     skipDuplicates: true,
  //   })
  //   if (!createResult.success) {
  //     return false
  //   }
  //   const updateResult = await doStandardPrisma('healthJournal', 'update', {
  //     where: {id: journalId},
  //     data: {templateApplied: true},
  //   })
  //   return updateResult.success
  // }
  // // 日誌を更新
  // static async updateJournal(journalId: number, data: {goalAndReflection?: string}): Promise<HealthJournal | null> {
  //   const result = await doStandardPrisma('healthJournal', 'update', {
  //     where: {id: journalId},
  //     data,
  //     include: {
  //       entries: {
  //         include: {
  //           images: true,
  //         },
  //         orderBy: {
  //           hourSlot: 'asc',
  //         },
  //       },
  //     },
  //   })
  //   if (!result.success) {
  //     return null
  //   }
  //   const journal = result.result
  //   return {
  //     id: journal.id,
  //     userId: journal.userId,
  //     journalDate: journal.journalDate.toISOString().split('T')[0],
  //     goalAndReflection: journal.goalAndReflection || undefined,
  //     templateApplied: journal.templateApplied,
  //     entries: journal.entries.map((entry: any) => ({
  //       id: entry.id,
  //       journalId: entry.journalId,
  //       hourSlot: entry.hourSlot,
  //       comment: entry.comment || undefined,
  //       images: entry.images.map((image: any) => ({
  //         id: image.id,
  //         entryId: image.entryId,
  //         fileName: image.fileName,
  //         filePath: image.filePath,
  //         fileSize: image.fileSize || undefined,
  //         mimeType: image.mimeType || undefined,
  //         description: image.description || undefined,
  //         createdAt: image.createdAt.toISOString(),
  //         updatedAt: image.updatedAt?.toISOString(),
  //       })),
  //       createdAt: entry.createdAt.toISOString(),
  //       updatedAt: entry.updatedAt?.toISOString(),
  //     })),
  //     createdAt: journal.createdAt.toISOString(),
  //     updatedAt: journal.updatedAt?.toISOString(),
  //   }
  // }
  // // エントリを更新
  // static async updateEntry(entryId: number, data: {comment?: string}): Promise<HealthJournalEntry | null> {
  //   const result = await doStandardPrisma('healthJournalEntry', 'update', {
  //     where: {id: entryId},
  //     data,
  //     include: {
  //       images: true,
  //     },
  //   })
  //   if (!result.success) {
  //     return null
  //   }
  //   const entry = result.result
  //   return {
  //     id: entry.id,
  //     journalId: entry.journalId,
  //     hourSlot: entry.hourSlot,
  //     comment: entry.comment || undefined,
  //     images: entry.images.map((image: any) => ({
  //       id: image.id,
  //       entryId: image.entryId,
  //       fileName: image.fileName,
  //       filePath: image.filePath,
  //       fileSize: image.fileSize || undefined,
  //       mimeType: image.mimeType || undefined,
  //       description: image.description || undefined,
  //       createdAt: image.createdAt.toISOString(),
  //       updatedAt: image.updatedAt?.toISOString(),
  //     })),
  //     createdAt: entry.createdAt.toISOString(),
  //     updatedAt: entry.updatedAt?.toISOString(),
  //   }
  // }
  // // 画像を追加
  // static async addImage(
  //   entryId: number,
  //   imageData: {
  //     fileName: string
  //     filePath: string
  //     fileSize?: number
  //     mimeType?: string
  //     description?: string
  //   }
  // ) {
  //   return await doStandardPrisma('healthJournalImage', 'create', {
  //     data: {
  //       entryId,
  //       ...imageData,
  //     },
  //   })
  // }
  // // 画像を削除
  // static async deleteImage(imageId: number) {
  //   return await doStandardPrisma('healthJournalImage', 'delete', {
  //     where: {id: imageId},
  //   })
  // }
  // // 指定時間帯の健康記録を取得
  // static async getHealthRecordsForTimeSlot(userId: number, journalDate: string, hourSlot: number) {
  //   const startDate = new Date(journalDate + 'T07:00:00.000Z')
  //   const endDate = new Date(startDate)
  //   endDate.setDate(endDate.getDate() + 1)
  //   // 時間帯の開始・終了時刻を計算
  //   const startHour = hourSlot
  //   const endHour = hourSlot === 6 ? 7 : (hourSlot + 1) % 24
  //   const startTime = `${startHour.toString().padStart(2, '0')}:00`
  //   const endTime = `${endHour.toString().padStart(2, '0')}:00`
  //   const result = await doStandardPrisma('healthRecord', 'findMany', {
  //     where: {
  //       userId,
  //       recordDate: {
  //         gte: startDate,
  //         lt: endDate,
  //       },
  //       recordTime: {
  //         gte: startTime,
  //         lt: endTime,
  //       },
  //     },
  //     include: {
  //       Medicine: true,
  //     },
  //     orderBy: {
  //       recordTime: 'asc',
  //     },
  //   })
  //   return result.success ? result.result : []
  // }
}
