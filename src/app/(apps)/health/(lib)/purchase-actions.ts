'use server'

import prisma from 'src/lib/prisma'
import {Purchase, PurchaseImage, PurchaseCategory} from '@prisma/client'

// 日本時間の日付文字列をUTC時刻（0時）に変換
function convertJSTDateToUTC(dateString: string): Date {
  const jstDate = new Date(dateString + 'T00:00:00')
  const utcDate = new Date(jstDate.getTime() - 9 * 60 * 60 * 1000)
  return utcDate
}

// 型定義
export type PurchaseWithRelations = Purchase & {
  PurchaseImage: PurchaseImage[]
  PersonRequester?: {id: number; name: string} | null
  PersonOrderer?: {id: number; name: string} | null
  PersonReceiver?: {id: number; name: string} | null
  PurchaseLocationMaster?: {id: number; name: string} | null
}

// フェーズ1: 買いたい時のデータ
export type PurchasePhase1Data = {
  itemName: string
  requester: string // 後方互換性のため残す
  requesterId?: number // 担当者ID
  category: PurchaseCategory
  deadline?: string // YYYY-MM-DD形式
  purchaseLocation?: string // 購入場所（直接購入用）

  purchaseLocationId?: number // 購入場所マスタID
}

// フェーズ2: 買った時のデータ
export type PurchasePhase2Data = {
  orderer?: string // 後方互換性のため残す
  ordererId?: number // 担当者ID
  paymentMethod?: string
  paymentDate?: string // YYYY-MM-DD形式
  expectedArrival?: string // YYYY-MM-DD形式
  expectedArrivalUndefined?: boolean // 到着予定日が未定かどうか
  purchaseLocationId?: number // 購入場所マスタID
  purchaseLocation?: string // 購入場所（フリーテキスト用）
  receiptDate?: string // YYYY-MM-DD形式
}

// フェーズ3A: 受取確認時のデータ
export type PurchasePhase3AData = {
  receiver?: string // 後方互換性のため残す
  receiverId?: number // 担当者ID
  receivedDate?: string // YYYY-MM-DD形式
}

// フェーズ3B: 領収書出力時のデータ
export type PurchasePhase3BData = {
  receiptDate?: string // YYYY-MM-DD形式
}

// フェーズ3: 受け取った時のデータ（後方互換性のため残す）
export type PurchasePhase3Data = PurchasePhase3AData & PurchasePhase3BData

export type PurchaseFormData = PurchasePhase1Data &
  PurchasePhase2Data &
  PurchasePhase3Data & {
    memo?: string
  }

// フィルタータイプ
export type PurchaseFilter = {
  category?: PurchaseCategory
  isPurchased?: boolean // 購入済み/未購入
  hasIssues?: boolean // 未到着または未領収書（ネット限定）
  showCompleted?: boolean // 完了したアイテムを表示するか（デフォルト: false）
}

// 購入品一覧取得
export async function getPurchases(params: {userId: number; filter?: PurchaseFilter; limit?: number; offset?: number}) {
  try {
    const {userId, filter, limit = 50, offset = 0} = params

    const where: any = {userId}

    if (filter) {
      // 区分フィルター
      if (filter.category) {
        where.category = filter.category
      }

      // 購入済み/未購入フィルター
      if (filter.isPurchased !== undefined) {
        if (filter.isPurchased) {
          where.paymentDate = {not: null}
        } else {
          where.paymentDate = null
        }
      }

      // 未到着/未領収書フィルター（ネット限定）
      if (filter.hasIssues) {
        where.category = 'ONLINE'
        where.paymentDate = {not: null} // 購入済みのみ
        where.OR = [
          {receivedDate: null}, // 未到着
          {receiptDate: null}, // 未領収書
        ]
      }

      // 完了したアイテムの表示制御
      // 完了の定義：
      // - 直接購入：paymentDateが設定されている（購入済み=完了）
      // - ネット購入：paymentDate、receivedDate、receiptDateがすべて設定されている
      if (filter.showCompleted === true) {
        // 完了したアイテムのみ表示
        const completedConditions: any[] = [
          // 直接購入で完了
          {category: 'DIRECT', paymentDate: {not: null}},
          // ネット購入で完了（全ての日付が設定済み）
          {
            category: 'ONLINE',
            paymentDate: {not: null},
            receivedDate: {not: null},
            receiptDate: {not: null},
          },
        ]

        // 既存のwhere条件とANDで結合
        if (where.AND) {
          where.AND.push({OR: completedConditions})
        } else {
          where.AND = [{OR: completedConditions}]
        }
      } else if (filter.showCompleted === false || filter.showCompleted === undefined) {
        // 完了していないアイテムのみ表示
        const incompleteConditions: any[] = [
          // 未購入
          {paymentDate: null},
          // ネット購入で未完了（受取未または領収書未）
          {
            category: 'ONLINE',
            paymentDate: {not: null},
            OR: [
              {receivedDate: null}, // 未受取
              {receiptDate: null}, // 未領収書
            ],
          },
        ]

        // 既存のwhere条件とANDで結合
        if (where.AND) {
          where.AND.push({OR: incompleteConditions})
        } else {
          where.AND = [{OR: incompleteConditions}]
        }
      }
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          PurchaseImage: {
            orderBy: {sortOrder: 'asc'},
          },
          PersonRequester: {
            select: {id: true, name: true},
          },
          PersonOrderer: {
            select: {id: true, name: true},
          },
          PersonReceiver: {
            select: {id: true, name: true},
          },
          PurchaseLocationMaster: {
            select: {id: true, name: true},
          },
        },
        orderBy: [{deadline: 'asc'}, {createdAt: 'desc'}],
        take: limit,
        skip: offset,
      }),
      prisma.purchase.count({where}),
    ])

    return {success: true, data: purchases, total}
  } catch (error) {
    console.error('購入品一覧取得エラー:', error)
    return {success: false, error: '購入品の取得に失敗しました'}
  }
}

// 今日が期限の購入品取得（ダッシュボード用）
export async function getTodayPurchases(userId: number) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const purchases = await prisma.purchase.findMany({
      where: {
        userId,
        paymentDate: null, // 未購入のみ
        deadline: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        PurchaseImage: true,
        PersonRequester: {
          select: {id: true, name: true},
        },
        PersonOrderer: {
          select: {id: true, name: true},
        },
        PersonReceiver: {
          select: {id: true, name: true},
        },
      },
      orderBy: {createdAt: 'desc'},
    })

    return {success: true, data: purchases}
  } catch (error) {
    console.error('今日の購入品取得エラー:', error)
    return {success: false, error: '今日の購入品の取得に失敗しました'}
  }
}

// 購入品詳細取得
export async function getPurchase(id: number) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {id},
      include: {
        PurchaseImage: {
          orderBy: {sortOrder: 'asc'},
        },
        PersonRequester: {
          select: {id: true, name: true},
        },
        PersonOrderer: {
          select: {id: true, name: true},
        },
        PersonReceiver: {
          select: {id: true, name: true},
        },
        PurchaseLocationMaster: {
          select: {id: true, name: true},
        },
      },
    })

    if (!purchase) {
      return {success: false, error: '購入品が見つかりません'}
    }

    return {success: true, data: purchase}
  } catch (error) {
    console.error('購入品詳細取得エラー:', error)
    return {success: false, error: '購入品の取得に失敗しました'}
  }
}

// 購入品作成（フェーズ1）
export async function createPurchase(data: PurchasePhase1Data & {userId: number; memo?: string}) {
  try {
    const createData: any = {
      userId: data.userId,
      itemName: data.itemName,
      requester: data.requester || '', // 後方互換性のため
      category: data.category,
      deadline: data.deadline ? convertJSTDateToUTC(data.deadline) : null,
      memo: data.memo,
    }

    // 担当者IDが指定されている場合は設定
    if (data.requesterId) {
      createData.requesterId = data.requesterId
      // 担当者名も取得して設定（後方互換性のため）
      const person = await prisma.person.findUnique({where: {id: data.requesterId}})
      if (person) {
        createData.requester = person.name
      }
    }

    // 購入場所（直接購入用）
    // マスタIDが指定されている場合
    if (data.purchaseLocationId !== undefined && data.purchaseLocationId !== null) {
      createData.purchaseLocationId = data.purchaseLocationId
      createData.purchaseLocation = null // マスタ使用時はフリーテキストをクリア
    } else if (data.purchaseLocation !== undefined) {
      // フリーテキストが指定されている場合
      createData.purchaseLocation = data.purchaseLocation || null
      createData.purchaseLocationId = null // フリーテキスト使用時はマスタIDをクリア
    }

    const purchase = await prisma.purchase.create({
      data: createData,
      include: {
        PurchaseImage: true,
        PersonRequester: {
          select: {id: true, name: true},
        },
        PersonOrderer: {
          select: {id: true, name: true},
        },
        PersonReceiver: {
          select: {id: true, name: true},
        },
        PurchaseLocationMaster: {
          select: {id: true, name: true},
        },
      },
    })

    return {success: true, data: purchase}
  } catch (error) {
    console.error('購入品作成エラー:', error)
    return {success: false, error: '購入品の作成に失敗しました'}
  }
}

// 購入品更新（フェーズ2: 買った時）
export async function updatePurchasePhase2(id: number, data: PurchasePhase2Data) {
  try {
    // 購入品を取得して区分を確認
    const existing = await prisma.purchase.findUnique({where: {id}})
    if (!existing) {
      return {success: false, error: '購入品が見つかりません'}
    }

    const now = new Date()
    const updateData: any = {}

    // 担当者IDが指定されている場合は設定
    if (data.ordererId !== undefined) {
      updateData.ordererId = data.ordererId || null
      if (data.ordererId) {
        const person = await prisma.person.findUnique({where: {id: data.ordererId}})
        if (person) {
          updateData.orderer = person.name // 後方互換性のため
        }
      } else {
        updateData.orderer = data.orderer || null
      }
    } else if (data.orderer !== undefined) {
      updateData.orderer = data.orderer
    }

    // 「直接」の場合の自動入力
    if (existing.category === 'DIRECT') {
      updateData.paymentMethod = '現金'
      updateData.paymentDate = now
      updateData.expectedArrival = now
      updateData.receiptDate = now
      updateData.receivedDate = now // 直接購入は即時受取
      // 購入場所を設定（マスタIDまたはフリーテキスト）
      // マスタIDが指定されている場合（nullも含む - マスタからフリーテキストへの変更を示す）
      if (data.purchaseLocationId !== undefined) {
        if (data.purchaseLocationId !== null && data.purchaseLocationId !== undefined) {
          // マスタIDが設定されている場合
          updateData.purchaseLocationId = data.purchaseLocationId
          updateData.purchaseLocation = null // マスタ使用時はフリーテキストをクリア
        } else {
          // purchaseLocationIdがnullの場合、フリーテキストに変更
          updateData.purchaseLocationId = null
          // purchaseLocationが指定されている場合は設定
          if (data.purchaseLocation !== undefined) {
            updateData.purchaseLocation = data.purchaseLocation || null
          }
        }
      } else if (data.purchaseLocation !== undefined) {
        // purchaseLocationIdが指定されていないが、purchaseLocationが指定されている場合
        // フリーテキストとして設定
        updateData.purchaseLocation = data.purchaseLocation || null
        updateData.purchaseLocationId = null // フリーテキスト使用時はマスタIDをクリア
      }
      // 注文者が受取者
      if (data.ordererId) {
        updateData.receiverId = data.ordererId
        const person = await prisma.person.findUnique({where: {id: data.ordererId}})
        if (person) {
          updateData.receiver = person.name
        }
      } else {
        updateData.receiver = data.orderer || ''
      }
    } else {
      // ネットの場合は手動入力
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod
      if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate ? convertJSTDateToUTC(data.paymentDate) : null
      if (data.expectedArrivalUndefined !== undefined) {
        updateData.expectedArrivalUndefined = data.expectedArrivalUndefined
        if (data.expectedArrivalUndefined) {
          // 未定の場合はexpectedArrivalをnullに
          updateData.expectedArrival = null
        } else if (data.expectedArrival !== undefined) {
          // 日付指定の場合は日付を設定
          updateData.expectedArrival = data.expectedArrival ? convertJSTDateToUTC(data.expectedArrival) : null
        }
      } else if (data.expectedArrival !== undefined) {
        // expectedArrivalUndefinedが未指定の場合は従来通り
        updateData.expectedArrival = data.expectedArrival ? convertJSTDateToUTC(data.expectedArrival) : null
      }
      if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate ? convertJSTDateToUTC(data.receiptDate) : null
    }

    const purchase = await prisma.purchase.update({
      where: {id},
      data: updateData,
      include: {
        PurchaseImage: {
          orderBy: {sortOrder: 'asc'},
        },
        PersonRequester: {
          select: {id: true, name: true},
        },
        PersonOrderer: {
          select: {id: true, name: true},
        },
        PersonReceiver: {
          select: {id: true, name: true},
        },
      },
    })

    return {success: true, data: purchase}
  } catch (error) {
    console.error('購入品更新エラー:', error)
    return {success: false, error: '購入品の更新に失敗しました'}
  }
}

// 購入品更新（フェーズ3A: 受取確認時）
export async function updatePurchasePhase3A(id: number, data: PurchasePhase3AData) {
  try {
    const updateData: any = {}

    // 担当者IDが指定されている場合は設定
    if (data.receiverId !== undefined) {
      updateData.receiverId = data.receiverId || null
      if (data.receiverId) {
        const person = await prisma.person.findUnique({where: {id: data.receiverId}})
        if (person) {
          updateData.receiver = person.name // 後方互換性のため
        }
      } else {
        updateData.receiver = data.receiver || null
      }
    } else if (data.receiver !== undefined) {
      updateData.receiver = data.receiver
    }
    if (data.receivedDate !== undefined)
      updateData.receivedDate = data.receivedDate ? convertJSTDateToUTC(data.receivedDate) : null

    const purchase = await prisma.purchase.update({
      where: {id},
      data: updateData,
      include: {
        PurchaseImage: {
          orderBy: {sortOrder: 'asc'},
        },
        PersonRequester: {
          select: {id: true, name: true},
        },
        PersonOrderer: {
          select: {id: true, name: true},
        },
        PersonReceiver: {
          select: {id: true, name: true},
        },
      },
    })

    return {success: true, data: purchase}
  } catch (error) {
    console.error('購入品更新エラー:', error)
    return {success: false, error: '購入品の更新に失敗しました'}
  }
}

// 購入品更新（フェーズ3B: 領収書出力時）
export async function updatePurchasePhase3B(id: number, data: PurchasePhase3BData) {
  try {
    const updateData: any = {}

    if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate ? convertJSTDateToUTC(data.receiptDate) : null

    const purchase = await prisma.purchase.update({
      where: {id},
      data: updateData,
      include: {
        PurchaseImage: {
          orderBy: {sortOrder: 'asc'},
        },
        PersonRequester: {
          select: {id: true, name: true},
        },
        PersonOrderer: {
          select: {id: true, name: true},
        },
        PersonReceiver: {
          select: {id: true, name: true},
        },
      },
    })

    return {success: true, data: purchase}
  } catch (error) {
    console.error('購入品更新エラー:', error)
    return {success: false, error: '購入品の更新に失敗しました'}
  }
}

// 購入品更新（フェーズ3: 受け取った時）（後方互換性のため残す）
export async function updatePurchasePhase3(id: number, data: PurchasePhase3Data) {
  try {
    const updateData: any = {}

    // 担当者IDが指定されている場合は設定
    if (data.receiverId !== undefined) {
      updateData.receiverId = data.receiverId || null
      if (data.receiverId) {
        const person = await prisma.person.findUnique({where: {id: data.receiverId}})
        if (person) {
          updateData.receiver = person.name // 後方互換性のため
        }
      } else {
        updateData.receiver = data.receiver || null
      }
    } else if (data.receiver !== undefined) {
      updateData.receiver = data.receiver
    }
    if (data.receivedDate !== undefined)
      updateData.receivedDate = data.receivedDate ? convertJSTDateToUTC(data.receivedDate) : null
    if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate ? convertJSTDateToUTC(data.receiptDate) : null

    const purchase = await prisma.purchase.update({
      where: {id},
      data: updateData,
      include: {
        PurchaseImage: {
          orderBy: {sortOrder: 'asc'},
        },
        PersonRequester: {
          select: {id: true, name: true},
        },
        PersonOrderer: {
          select: {id: true, name: true},
        },
        PersonReceiver: {
          select: {id: true, name: true},
        },
      },
    })

    return {success: true, data: purchase}
  } catch (error) {
    console.error('購入品更新エラー:', error)
    return {success: false, error: '購入品の更新に失敗しました'}
  }
}

// 購入品更新（全般）
export async function updatePurchase(id: number, data: Partial<PurchaseFormData>) {
  try {
    const updateData: any = {}

    if (data.itemName !== undefined) updateData.itemName = data.itemName
    if (data.requester !== undefined) updateData.requester = data.requester
    if (data.requesterId !== undefined) {
      updateData.requesterId = data.requesterId || null
      if (data.requesterId) {
        const person = await prisma.person.findUnique({where: {id: data.requesterId}})
        if (person) {
          updateData.requester = person.name
        }
      }
    }
    if (data.category !== undefined) updateData.category = data.category
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? convertJSTDateToUTC(data.deadline) : null
    if (data.orderer !== undefined) updateData.orderer = data.orderer
    if (data.ordererId !== undefined) {
      updateData.ordererId = data.ordererId || null
      if (data.ordererId) {
        const person = await prisma.person.findUnique({where: {id: data.ordererId}})
        if (person) {
          updateData.orderer = person.name
        }
      }
    }
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod
    if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate ? convertJSTDateToUTC(data.paymentDate) : null
    if (data.expectedArrivalUndefined !== undefined) {
      updateData.expectedArrivalUndefined = data.expectedArrivalUndefined
      if (data.expectedArrivalUndefined) {
        // 未定の場合はexpectedArrivalをnullに
        updateData.expectedArrival = null
      } else if (data.expectedArrival !== undefined) {
        // 日付指定の場合は日付を設定
        updateData.expectedArrival = data.expectedArrival ? convertJSTDateToUTC(data.expectedArrival) : null
      }
    } else if (data.expectedArrival !== undefined) {
      // expectedArrivalUndefinedが未指定の場合は従来通り
      updateData.expectedArrival = data.expectedArrival ? convertJSTDateToUTC(data.expectedArrival) : null
    }
    if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate ? convertJSTDateToUTC(data.receiptDate) : null
    // 購入場所（マスタIDまたはフリーテキスト）
    // マスタIDが指定されている場合（nullも含む - マスタからフリーテキストへの変更を示す）
    if (data.purchaseLocationId !== undefined) {
      if (data.purchaseLocationId !== null && data.purchaseLocationId !== undefined) {
        // マスタIDが設定されている場合
        updateData.purchaseLocationId = data.purchaseLocationId
        updateData.purchaseLocation = null // マスタ使用時はフリーテキストをクリア
      } else {
        // purchaseLocationIdがnullまたはundefinedの場合、フリーテキストに変更
        updateData.purchaseLocationId = null
        // purchaseLocationが指定されている場合は設定
        if (data.purchaseLocation !== undefined) {
          updateData.purchaseLocation = data.purchaseLocation || null
        }
      }
    } else if (data.purchaseLocation !== undefined) {
      // purchaseLocationIdが指定されていないが、purchaseLocationが指定されている場合
      // フリーテキストとして設定
      updateData.purchaseLocation = data.purchaseLocation || null
      updateData.purchaseLocationId = null // フリーテキスト使用時はマスタIDをクリア
    }
    if (data.receiver !== undefined) updateData.receiver = data.receiver
    if (data.receiverId !== undefined) {
      updateData.receiverId = data.receiverId || null
      if (data.receiverId) {
        const person = await prisma.person.findUnique({where: {id: data.receiverId}})
        if (person) {
          updateData.receiver = person.name
        }
      }
    }
    if (data.receivedDate !== undefined)
      updateData.receivedDate = data.receivedDate ? convertJSTDateToUTC(data.receivedDate) : null
    if (data.memo !== undefined) updateData.memo = data.memo

    const purchase = await prisma.purchase.update({
      where: {id},
      data: updateData,
      include: {
        PurchaseImage: {
          orderBy: {sortOrder: 'asc'},
        },
        PersonRequester: {
          select: {id: true, name: true},
        },
        PersonOrderer: {
          select: {id: true, name: true},
        },
        PersonReceiver: {
          select: {id: true, name: true},
        },
        PurchaseLocationMaster: {
          select: {id: true, name: true},
        },
      },
    })

    return {success: true, data: purchase}
  } catch (error) {
    console.error('購入品更新エラー:', error)
    return {success: false, error: '購入品の更新に失敗しました'}
  }
}

// 購入品削除
export async function deletePurchase(id: number) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {id},
      include: {PurchaseImage: true},
    })

    if (!purchase) {
      return {success: false, error: '購入品が見つかりません'}
    }

    // S3から画像を削除
    const {FileHandler} = await import('@cm/class/FileHandler')
    for (const image of purchase.PurchaseImage) {
      try {
        await FileHandler.deleteFileFromS3(image.filename)
      } catch (error) {
        console.error(`S3画像削除エラー (${image.filename}):`, error)
      }
    }

    await prisma.purchase.delete({
      where: {id},
    })

    return {success: true}
  } catch (error) {
    console.error('購入品削除エラー:', error)
    return {success: false, error: '購入品の削除に失敗しました'}
  }
}

// 画像追加
export async function addPurchaseImage(
  purchaseId: number,
  imageData: {filename: string; originalName: string; mimeType: string; size: number; url: string}
) {
  try {
    const maxSortOrder = await prisma.purchaseImage.aggregate({
      where: {purchaseId},
      _max: {sortOrder: true},
    })

    const image = await prisma.purchaseImage.create({
      data: {
        purchaseId,
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
export async function deletePurchaseImage(imageId: number) {
  try {
    const image = await prisma.purchaseImage.findUnique({
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

    await prisma.purchaseImage.delete({
      where: {id: imageId},
    })

    return {success: true}
  } catch (error) {
    console.error('画像削除エラー:', error)
    return {success: false, error: '画像の削除に失敗しました'}
  }
}

// 一括購入（直接購入のみ）
export async function bulkUpdatePurchasePhase2(purchaseIds: number[], ordererId: number) {
  try {
    if (!purchaseIds || purchaseIds.length === 0) {
      return {success: false, error: '購入品が選択されていません'}
    }

    if (!ordererId) {
      return {success: false, error: '購入者を選択してください'}
    }

    const now = new Date()

    // 担当者を取得
    const person = await prisma.person.findUnique({where: {id: ordererId}})
    if (!person) {
      return {success: false, error: '担当者が見つかりません'}
    }

    // 選択された購入品を取得して、すべて「直接」であることを確認
    const purchases = await prisma.purchase.findMany({
      where: {
        id: {in: purchaseIds},
        paymentDate: null, // 未購入のみ
      },
    })

    if (purchases.length === 0) {
      return {success: false, error: '選択された購入品が見つかりません'}
    }

    // すべて「直接」であることを確認
    const nonDirectPurchases = purchases.filter(p => p.category !== 'DIRECT')
    if (nonDirectPurchases.length > 0) {
      return {success: false, error: '「直接」購入のみ一括購入できます'}
    }

    // 一括更新
    const result = await prisma.purchase.updateMany({
      where: {
        id: {in: purchaseIds},
        category: 'DIRECT',
        paymentDate: null, // 未購入のみ
      },
      data: {
        ordererId: ordererId,
        orderer: person.name, // 後方互換性のため
        paymentMethod: '現金',
        paymentDate: now,
        expectedArrival: now,
        receiptDate: now,
        receivedDate: now, // 直接購入は即時受取
        receiverId: ordererId, // 注文者が受取者
        receiver: person.name, // 後方互換性のため
      },
    })

    return {success: true, data: {count: result.count}}
  } catch (error) {
    console.error('一括購入エラー:', error)
    return {success: false, error: '一括購入の処理に失敗しました'}
  }
}
