'use client'

import {useState, useEffect, useCallback} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {PurchaseCategory} from '@prisma/client'
import {
  getPurchases,
  createPurchase,
  updatePurchase,
  updatePurchasePhase2,
  deletePurchase,
  PurchaseWithRelations,
  PurchaseFormData,
  PurchasePhase2Data,
  PurchaseFilter,
} from '../../(lib)/purchase-actions'
import PurchaseForm from './PurchaseForm'
import PurchasePhase2Form from './PurchasePhase2Form'
import PurchasePhase3AForm from './PurchasePhase3AForm'
import PurchasePhase3BForm from './PurchasePhase3BForm'
import BulkPurchaseForm from './BulkPurchaseForm'
import PurchaseCard from './PurchaseCard'
import PurchaseTable from './PurchaseTable'
import {Tabs, TabsContent} from '@cm/shadcn/components/ui/tabs'
import {
  bulkUpdatePurchasePhase2,
  updatePurchasePhase3A,
  updatePurchasePhase3B,
  PurchasePhase3AData,
  PurchasePhase3BData,
} from '../../(lib)/purchase-actions'

type ModalType = 'create' | 'edit' | 'phase2' | 'phase3a' | 'phase3b' | 'bulk' | null

export default function PurchaseList() {
  const {session} = useGlobal()
  const [purchases, setPurchases] = useState<PurchaseWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<PurchaseFilter>({showCompleted: false})
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  const fetchPurchases = useCallback(async () => {
    if (!session?.id) return

    setIsLoading(true)
    try {
      const result = await getPurchases({userId: session.id, filter})
      if (result.success && result.data) {
        setPurchases(result.data)
      }
    } catch (error) {
      console.error('購入品取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.id, filter])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  const handleCreate = async (data: PurchaseFormData) => {
    if (!session?.id) return

    setIsSubmitting(true)
    try {
      const result = await createPurchase({
        userId: session.id,
        itemName: data.itemName,
        requester: data.requester,
        requesterId: data.requesterId,
        category: data.category,
        deadline: data.deadline,
        memo: data.memo,
        purchaseLocation: data.purchaseLocation,
        purchaseLocationId: data.purchaseLocationId,
      })
      if (result.success) {
        await fetchPurchases()
        setModalType(null)
      } else {
        alert(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (data: PurchaseFormData) => {
    if (!selectedPurchase) return

    setIsSubmitting(true)
    try {
      const result = await updatePurchase(selectedPurchase.id, data)
      if (result.success) {
        await fetchPurchases()
        setModalType(null)
        setSelectedPurchase(null)
      } else {
        alert(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhase2 = async (data: PurchasePhase2Data) => {
    if (!selectedPurchase) return

    setIsSubmitting(true)
    try {
      const result = await updatePurchasePhase2(selectedPurchase.id, data)
      if (result.success) {
        await fetchPurchases()
        setModalType(null)
        setSelectedPurchase(null)
      } else {
        alert(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhase3A = async (data: PurchasePhase3AData) => {
    if (!selectedPurchase) return

    setIsSubmitting(true)
    try {
      const result = await updatePurchasePhase3A(selectedPurchase.id, data)
      if (result.success) {
        await fetchPurchases()
        setModalType(null)
        setSelectedPurchase(null)
      } else {
        alert(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhase3B = async (data: PurchasePhase3BData) => {
    if (!selectedPurchase) return

    setIsSubmitting(true)
    try {
      const result = await updatePurchasePhase3B(selectedPurchase.id, data)
      if (result.success) {
        await fetchPurchases()
        setModalType(null)
        setSelectedPurchase(null)
      } else {
        alert(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (purchase: PurchaseWithRelations) => {
    if (!confirm('この購入品を削除しますか？')) return

    const result = await deletePurchase(purchase.id)
    if (result.success) {
      await fetchPurchases()
    } else {
      alert(result.error)
    }
  }

  const openEdit = (purchase: PurchaseWithRelations) => {
    setSelectedPurchase(purchase)
    setModalType('edit')
  }

  const openPhase2 = (purchase: PurchaseWithRelations) => {
    setSelectedPurchase(purchase)
    setModalType('phase2')
  }

  const openPhase3A = (purchase: PurchaseWithRelations) => {
    setSelectedPurchase(purchase)
    setModalType('phase3a')
  }

  const openPhase3B = (purchase: PurchaseWithRelations) => {
    setSelectedPurchase(purchase)
    setModalType('phase3b')
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedPurchase(null)
  }

  const handleBulkPurchase = async (ordererId: number, purchaseIds: number[]) => {
    setIsSubmitting(true)
    try {
      const result = await bulkUpdatePurchasePhase2(purchaseIds, ordererId)
      if (result.success) {
        await fetchPurchases()
        setModalType(null)
        alert(`${result.data?.count || purchaseIds.length}件の購入品を一括で記録しました`)
      } else {
        alert(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const openBulkPurchase = () => {
    setModalType('bulk')
  }

  // 未購入の直接購入品を取得
  const getUnpurchasedDirectPurchases = () => {
    return purchases.filter(p => p.category === 'DIRECT' && !p.paymentDate)
  }

  // 購入品をカテゴリと購入場所でグループ化
  const groupPurchasesByCategoryAndLocation = () => {
    const groups: {key: string; label: string; purchases: PurchaseWithRelations[]}[] = []

    // ネット購入
    const onlinePurchases = purchases.filter(p => p.category === 'ONLINE')
    if (onlinePurchases.length > 0) {
      groups.push({
        key: 'ONLINE',
        label: 'ネット',
        purchases: onlinePurchases,
      })
    }

    // 直接購入を購入場所ごとにグループ化
    const directPurchases = purchases.filter(p => p.category === 'DIRECT')
    const locationGroups: {[key: string]: PurchaseWithRelations[]} = {}

    directPurchases.forEach(purchase => {
      // マスタがあればマスタ名、なければフリーテキスト、どちらもなければnull
      const location = purchase.PurchaseLocationMaster?.name || (purchase as any).purchaseLocation || null
      const locationKey = location || '__NO_LOCATION__'
      if (!locationGroups[locationKey]) {
        locationGroups[locationKey] = []
      }
      locationGroups[locationKey].push(purchase)
    })

    // 購入場所でソート（「購入場所なし」は最後に）
    const locationKeys = Object.keys(locationGroups).sort((a, b) => {
      if (a === '__NO_LOCATION__') return 1
      if (b === '__NO_LOCATION__') return -1
      return a.localeCompare(b, 'ja')
    })

    locationKeys.forEach(locationKey => {
      const label = locationKey === '__NO_LOCATION__' ? '直接（購入場所なし）' : `直接（${locationKey}）`
      groups.push({
        key: `DIRECT_${locationKey}`,
        label,
        purchases: locationGroups[locationKey],
      })
    })

    return groups
  }

  // グループ化されたデータを取得
  const purchaseGroups = groupPurchasesByCategoryAndLocation()

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>ログインが必要です</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">購入品リスト</h1>
        <div className="flex gap-2">
          {getUnpurchasedDirectPurchases().length > 0 && (
            <button onClick={openBulkPurchase} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              一括購入
            </button>
          )}
          <button
            onClick={() => setModalType('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + 新規登録
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">区分:</span>
            <select
              value={filter.category || ''}
              onChange={e => setFilter({...filter, category: e.target.value ? (e.target.value as PurchaseCategory) : undefined})}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm"
            >
              <option value="">すべて</option>
              <option value="ONLINE">ネット</option>
              <option value="DIRECT">直接</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">ステータス:</span>
            <select
              value={filter.isPurchased === undefined ? '' : filter.isPurchased ? 'purchased' : 'not_purchased'}
              onChange={e => {
                const val = e.target.value
                setFilter({
                  ...filter,
                  isPurchased: val === '' ? undefined : val === 'purchased',
                  hasIssues: false,
                })
              }}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm"
            >
              <option value="">すべて</option>
              <option value="not_purchased">未購入</option>
              <option value="purchased">購入済</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filter.hasIssues || false}
              onChange={e => setFilter({...filter, hasIssues: e.target.checked, isPurchased: undefined, category: undefined})}
              className="w-4 h-4 text-orange-600 rounded"
            />
            <span className="text-orange-600">未到着/未領収書（ネット）</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filter.showCompleted || false}
              onChange={e => setFilter({...filter, showCompleted: e.target.checked})}
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-green-600">完了したアイテムを表示</span>
          </label>
        </div>
      </div>

      {/* モーダル */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {modalType === 'create' && (
              <>
                <h2 className="text-xl font-bold mb-4">購入品を登録</h2>
                <PurchaseForm onSubmit={handleCreate} onCancel={closeModal} isSubmitting={isSubmitting} />
              </>
            )}
            {modalType === 'edit' && selectedPurchase && (
              <>
                <h2 className="text-xl font-bold mb-4">購入品を編集</h2>
                <PurchaseForm
                  purchase={selectedPurchase}
                  onSubmit={handleUpdate}
                  onCancel={closeModal}
                  isSubmitting={isSubmitting}
                />
              </>
            )}
            {modalType === 'phase2' && selectedPurchase && (
              <>
                <h2 className="text-xl font-bold mb-4">購入を記録</h2>
                <PurchasePhase2Form
                  purchase={selectedPurchase}
                  onSubmit={handlePhase2}
                  onCancel={closeModal}
                  isSubmitting={isSubmitting}
                />
              </>
            )}
            {modalType === 'phase3a' && selectedPurchase && (
              <>
                <h2 className="text-xl font-bold mb-4">受取を記録</h2>
                <PurchasePhase3AForm
                  purchase={selectedPurchase}
                  onSubmit={handlePhase3A}
                  onCancel={closeModal}
                  isSubmitting={isSubmitting}
                />
              </>
            )}
            {modalType === 'phase3b' && selectedPurchase && (
              <>
                <h2 className="text-xl font-bold mb-4">領収書を記録</h2>
                <PurchasePhase3BForm
                  purchase={selectedPurchase}
                  onSubmit={handlePhase3B}
                  onCancel={closeModal}
                  isSubmitting={isSubmitting}
                />
              </>
            )}
            {modalType === 'bulk' && (
              <>
                <h2 className="text-xl font-bold mb-4">一括購入</h2>
                <BulkPurchaseForm
                  purchases={getUnpurchasedDirectPurchases()}
                  onSubmit={handleBulkPurchase}
                  onCancel={closeModal}
                  isSubmitting={isSubmitting}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* 表示切り替えタブ */}
      <Tabs value={viewMode} onValueChange={value => setViewMode(value as 'card' | 'table')} className="w-full">
        {/* <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-200">
          <TabsTrigger
            value="card"
            className="font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
          >
            カード表示
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
          >
            テーブル表示
          </TabsTrigger>
        </TabsList> */}
        {/* カード表示 */}
        <TabsContent value="card" className="mt-4 focus-visible:outline-none">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>購入品がありません</p>
              <button onClick={() => setModalType('create')} className="mt-4 text-blue-600 hover:underline">
                最初の購入品を登録する
              </button>
            </div>
          ) : (
            // カテゴリと購入場所でグループ化して表示
            <div className="space-y-8">
              {purchaseGroups.map(group => (
                <div key={group.key}>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-300 flex items-center gap-2">
                    {group.key === 'ONLINE' ? (
                      <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                    ) : (
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                    )}
                    {group.label}
                    <span className="text-sm font-normal text-gray-500">({group.purchases.length}件)</span>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {group.purchases.map(purchase => (
                      <PurchaseCard
                        key={purchase.id}
                        purchase={purchase}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onPhase2={openPhase2}
                        onPhase3A={openPhase3A}
                        onPhase3B={openPhase3B}
                        onUpdated={fetchPurchases}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        {/* テーブル表示 */}
        <TabsContent value="table" className="mt-4 focus-visible:outline-none">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>購入品がありません</p>
              <button onClick={() => setModalType('create')} className="mt-4 text-blue-600 hover:underline">
                最初の購入品を登録する
              </button>
            </div>
          ) : (
            <PurchaseTable
              purchases={purchases}
              onEdit={openEdit}
              onDelete={handleDelete}
              onPhase2={openPhase2}
              onPhase3A={openPhase3A}
              onPhase3B={openPhase3B}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
