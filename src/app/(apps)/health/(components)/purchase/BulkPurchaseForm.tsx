'use client'

import {useState, useEffect} from 'react'
import {PurchaseWithRelations} from '../../(lib)/purchase-actions'
import {getPersons, PersonWithRelations} from '../../(lib)/person-actions'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  purchases: PurchaseWithRelations[]
  onSubmit: (ordererId: number, purchaseIds: number[]) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function BulkPurchaseForm({purchases, onSubmit, onCancel, isSubmitting = false}: Props) {
  const {session} = useGlobal()
  const [persons, setPersons] = useState<PersonWithRelations[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [ordererId, setOrdererId] = useState<number | ''>('')

  useEffect(() => {
    const fetchPersons = async () => {
      if (session?.id) {
        const result = await getPersons(session.id)
        if (result.success && result.data) {
          setPersons(result.data.filter(p => p.active))
        }
      }
    }
    fetchPersons()
  }, [session?.id])

  const handleToggle = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === purchases.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(purchases.map(p => p.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.size === 0) {
      alert('購入品を選択してください')
      return
    }
    if (!ordererId) {
      alert('購入者を選択してください')
      return
    }
    await onSubmit(ordererId as number, Array.from(selectedIds))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 mb-4">
        直接購入の場合、決済日・到着予定日・領収書出力日・受取日は自動的に現在時刻が設定されます。
      </div>

      {/* 購入者選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          購入者 <span className="text-red-500">*</span>
        </label>
        <select
          value={ordererId}
          onChange={e => setOrdererId(e.target.value ? parseInt(e.target.value) : '')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">選択してください</option>
          {persons.map(person => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>

      {/* 購入品リスト */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">未購入の直接購入品 ({purchases.length}件)</span>
          <button type="button" onClick={handleSelectAll} className="text-sm text-blue-600 hover:text-blue-700">
            {selectedIds.size === purchases.length ? 'すべて解除' : 'すべて選択'}
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {purchases.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">未購入の直接購入品がありません</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {purchases.map(purchase => (
                <label key={purchase.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(purchase.id)}
                    onChange={() => handleToggle(purchase.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{purchase.itemName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span>依頼者: {purchase.requester}</span>
                      {purchase.deadline && (
                        <span className="ml-3">期限: {formatDate(new Date(purchase.deadline), 'YYYY/MM/DD')}</span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 選択状況 */}
      {selectedIds.size > 0 && <div className="text-sm text-gray-600">{selectedIds.size}件を選択中</div>}

      {/* ボタン */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || selectedIds.size === 0 || !ordererId}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : '確定'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}





