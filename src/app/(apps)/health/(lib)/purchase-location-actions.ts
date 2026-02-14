'use server'

import prisma from 'src/lib/prisma'
import {PurchaseLocation} from '@prisma/client'

// 型定義
export type PurchaseLocationWithRelations = PurchaseLocation

// 購入場所一覧取得
export async function getPurchaseLocations(userId: number) {
  try {
    const locations = await prisma.purchaseLocation.findMany({
      where: {userId},
      orderBy: {id: 'asc'},
    })

    return {success: true, data: locations}
  } catch (error) {
    console.error('購入場所一覧取得エラー:', error)
    return {success: false, error: '購入場所の取得に失敗しました'}
  }
}

// 購入場所詳細取得
export async function getPurchaseLocation(id: number) {
  try {
    const location = await prisma.purchaseLocation.findUnique({
      where: {id},
    })

    if (!location) {
      return {success: false, error: '購入場所が見つかりません'}
    }

    return {success: true, data: location}
  } catch (error) {
    console.error('購入場所詳細取得エラー:', error)
    return {success: false, error: '購入場所の取得に失敗しました'}
  }
}

// 購入場所作成
export async function createPurchaseLocation(data: {userId: number; name: string; active?: boolean}) {
  try {
    const location = await prisma.purchaseLocation.create({
      data: {
        userId: data.userId,
        name: data.name.trim(),
        active: data.active !== undefined ? data.active : true,
      },
    })

    return {success: true, data: location}
  } catch (error) {
    console.error('購入場所作成エラー:', error)
    return {success: false, error: '購入場所の作成に失敗しました'}
  }
}

// 購入場所更新
export async function updatePurchaseLocation(id: number, data: {name?: string; active?: boolean}) {
  try {
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.active !== undefined) updateData.active = data.active

    const location = await prisma.purchaseLocation.update({
      where: {id},
      data: updateData,
    })

    return {success: true, data: location}
  } catch (error) {
    console.error('購入場所更新エラー:', error)
    return {success: false, error: '購入場所の更新に失敗しました'}
  }
}

// 購入場所削除
export async function deletePurchaseLocation(id: number) {
  try {
    // 使用されているかチェック
    const purchaseCount = await prisma.purchase.count({where: {purchaseLocationId: id}})

    if (purchaseCount > 0) {
      return {success: false, error: 'この購入場所は購入品で使用されているため削除できません'}
    }

    await prisma.purchaseLocation.delete({
      where: {id},
    })

    return {success: true}
  } catch (error) {
    console.error('購入場所削除エラー:', error)
    return {success: false, error: '購入場所の削除に失敗しました'}
  }
}

