'use client'

import {doStandardPrisma} from '@cm/lib/server-actions/common-server-actions/doStandardPrisma/doStandardPrisma'
import {medicineSeeds} from '../seed/medicine'
import React, {useState} from 'react'
import {T_LINK} from '@cm/components/styles/common-components/links'
import ShadPopover from '@cm/shadcn/components/ShadPopover'
import {HREF} from '@cm/lib/methods/urls'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'

export default function Template({children}) {
  const [hospitalMenuOpen, setHospitalMenuOpen] = useState(false)
  const [recordMenuOpen, setRecordMenuOpen] = useState(false)
  const [purchaseMenuOpen, setPurchaseMenuOpen] = useState(false)
  const {query} = useGlobal()

  return (
    <div>
      {/* <Button onClick={seedMedicines}>SEED</Button> */}
      <div className={`pb-32 min-h-screen`}>{children}</div>
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-100 backdrop-blur-sm border-t border-gray-200 shadow-lg p-3 sm:p-4"
        style={{paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'}}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3  justify-center gap-2 sm:gap-3">
            <T_LINK
              simple
              href={HREF('/health/dashboard', {}, query)}
              className="flex-1 w-full h-full sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm sm:text-base font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg text-center"
            >
              トップ
            </T_LINK>
            <ShadPopover
              mode="click"
              open={recordMenuOpen}
              setopen={setRecordMenuOpen}
              PopoverTrigger={
                <button className="flex-1 w-full h-full sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg text-center">
                  記録
                </button>
              }
            >
              <div className="flex flex-col gap-4 min-w-[160px] py-20">
                <T_LINK
                  simple
                  href={HREF('/health/daily', {}, query)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setRecordMenuOpen(false)}
                >
                  日別
                </T_LINK>
                <T_LINK
                  simple
                  href={HREF('/health/monthly', {}, query)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setRecordMenuOpen(false)}
                >
                  月別
                </T_LINK>
                <T_LINK
                  simple
                  href={HREF('/health/journal', {}, query)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setRecordMenuOpen(false)}
                >
                  日誌
                </T_LINK>
                <T_LINK
                  simple
                  href={HREF('/health/gallery', {}, query)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setRecordMenuOpen(false)}
                >
                  ギャラリー
                </T_LINK>
              </div>
            </ShadPopover>
            <T_LINK
              simple
              href={HREF('/health/task', {}, query)}
              className="flex-1 w-full h-full sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-sm sm:text-base font-medium rounded-lg hover:from-rose-700 hover:to-rose-800 transition-all duration-200 shadow-md hover:shadow-lg text-center"
            >
              タスク
            </T_LINK>

            <ShadPopover
              mode="click"
              open={purchaseMenuOpen}
              setopen={setPurchaseMenuOpen}
              PopoverTrigger={
                <button className="flex-1 w-full h-full sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm sm:text-base font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg text-center">
                  購入品
                </button>
              }
            >
              <div className="flex flex-col gap-4 min-w-[160px] py-20">
                <T_LINK
                  simple
                  href={HREF('/health/purchase', {}, query)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setPurchaseMenuOpen(false)}
                >
                  購入品リスト
                </T_LINK>
                <T_LINK
                  simple
                  href={HREF('/health/person', {}, query)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setPurchaseMenuOpen(false)}
                >
                  担当者マスタ
                </T_LINK>
                <T_LINK
                  simple
                  href={HREF('/health/purchase-location', {}, query)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setPurchaseMenuOpen(false)}
                >
                  購入場所マスタ
                </T_LINK>
              </div>
            </ShadPopover>
            <ShadPopover
              mode="click"
              open={hospitalMenuOpen}
              setopen={setHospitalMenuOpen}
              PopoverTrigger={
                <button className="flex-1 w-full h-full sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm sm:text-base font-medium rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg text-center">
                  病院
                </button>
              }
            >
              <div className="flex flex-col gap-4 min-w-[160px] py-20">
                <T_LINK
                  simple
                  href={HREF('/health/symptom', {}, query)}
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setHospitalMenuOpen(false)}
                >
                  症状
                </T_LINK>
                <T_LINK
                  simple
                  href={HREF('/health/hospital-task', {}, query)}
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setHospitalMenuOpen(false)}
                >
                  病院タスク
                </T_LINK>
                <T_LINK
                  simple
                  href={HREF('/health/medical-visit', {}, query)}
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-medium rounded-lg transition-colors text-center"
                  onClick={() => setHospitalMenuOpen(false)}
                >
                  履歴
                </T_LINK>
              </div>
            </ShadPopover>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function seedMedicines() {
  try {
    // 新しいデータを挿入
    for (const medicine of medicineSeeds) {
      await doStandardPrisma('medicine', 'upsert', {
        where: {
          name: medicine?.name ?? '',
        },
        create: medicine,
        update: medicine,
      })
    }

    console.log('薬マスタのシードが完了しました')
  } catch (error) {
    console.error('薬マスタのシード中にエラーが発生しました:', error)
    throw error
  }
}
