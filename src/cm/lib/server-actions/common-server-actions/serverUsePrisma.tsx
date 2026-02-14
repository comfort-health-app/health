'use server'

import {revalidatePath} from 'next/cache'

import * as fs from 'fs'

export const fs_write_text = async ({title, content}) => {
  const write = await fs.writeFileSync(title, content, 'utf8')
}

export const revalidateAllPath = async ({pathname = '/'}) => {
  await revalidatePath(pathname, 'layout')
}
