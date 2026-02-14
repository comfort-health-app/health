'use server'

import prisma from 'src/lib/prisma'

// 月間目標値の保存（upsert）
export async function upsertMonthlyGoal({year, month, key, value}: {year: number; month: number; key: string; value: string}) {
  return await prisma.monthlySetting.upsert({
    where: {year_month_key: {year, month, key}},
    update: {value},
    create: {year, month, key, value},
  })
}

// 月間目標値の取得
export async function getMonthlyGoal({year, month, key}: {year: number; month: number; key: string}) {
  const setting = await prisma.monthlySetting.findUnique({
    where: {
      year_month_key: {year, month, key},
    },
  })
  return setting?.value ?? null
}
