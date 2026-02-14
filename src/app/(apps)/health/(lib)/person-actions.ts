'use server'

import prisma from 'src/lib/prisma'
import {Person} from '@prisma/client'

// 型定義
export type PersonWithRelations = Person

// 担当者一覧取得
export async function getPersons(userId: number) {
  try {
    const persons = await prisma.person.findMany({
      where: {userId},
      orderBy: {id: 'asc'},
    })

    return {success: true, data: persons}
  } catch (error) {
    console.error('担当者一覧取得エラー:', error)
    return {success: false, error: '担当者の取得に失敗しました'}
  }
}

// 担当者詳細取得
export async function getPerson(id: number) {
  try {
    const person = await prisma.person.findUnique({
      where: {id},
    })

    if (!person) {
      return {success: false, error: '担当者が見つかりません'}
    }

    return {success: true, data: person}
  } catch (error) {
    console.error('担当者詳細取得エラー:', error)
    return {success: false, error: '担当者の取得に失敗しました'}
  }
}

// 担当者作成
export async function createPerson(data: {userId: number; name: string; active?: boolean}) {
  try {
    const person = await prisma.person.create({
      data: {
        userId: data.userId,
        name: data.name.trim(),
        active: data.active !== undefined ? data.active : true,
      },
    })

    return {success: true, data: person}
  } catch (error) {
    console.error('担当者作成エラー:', error)
    return {success: false, error: '担当者の作成に失敗しました'}
  }
}

// 担当者更新
export async function updatePerson(id: number, data: {name?: string; active?: boolean}) {
  try {
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.active !== undefined) updateData.active = data.active

    const person = await prisma.person.update({
      where: {id},
      data: updateData,
    })

    return {success: true, data: person}
  } catch (error) {
    console.error('担当者更新エラー:', error)
    return {success: false, error: '担当者の更新に失敗しました'}
  }
}

// 担当者削除
export async function deletePerson(id: number) {
  try {
    // 使用されているかチェック
    const [requesterCount, ordererCount, receiverCount] = await Promise.all([
      prisma.purchase.count({where: {requesterId: id}}),
      prisma.purchase.count({where: {ordererId: id}}),
      prisma.purchase.count({where: {receiverId: id}}),
    ])

    if (requesterCount > 0 || ordererCount > 0 || receiverCount > 0) {
      return {success: false, error: 'この担当者は購入品で使用されているため削除できません'}
    }

    await prisma.person.delete({
      where: {id},
    })

    return {success: true}
  } catch (error) {
    console.error('担当者削除エラー:', error)
    return {success: false, error: '担当者の削除に失敗しました'}
  }
}






