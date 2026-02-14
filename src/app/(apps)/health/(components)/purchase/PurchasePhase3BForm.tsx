'use client'

import {useState} from 'react'
import {PurchaseWithRelations, PurchasePhase3BData} from '../../(lib)/purchase-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  purchase: PurchaseWithRelations
  onSubmit: (data: PurchasePhase3BData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function PurchasePhase3BForm({purchase, onSubmit, onCancel, isSubmitting = false}: Props) {
  const [formData, setFormData] = useState<PurchasePhase3BData>({
    receiptDate: purchase?.receiptDate
      ? formatDate(new Date(purchase.receiptDate), 'YYYY-MM-DD')
      : formatDate(new Date(), 'YYYY-MM-DD'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{purchase.itemName}</span>
        </div>
        {purchase.receivedDate && (
          <div className="text-xs text-gray-500 mt-1">
            受取確認日: {formatDate(new Date(purchase.receivedDate), 'YYYY/MM/DD')}
            {purchase.receiver && ` (${purchase.receiver})`}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          領収書出力日 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.receiptDate || ''}
          onChange={e => setFormData({...formData, receiptDate: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.receiptDate}
          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : '領収書を記録'}
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





