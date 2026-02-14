'use client'

import {useState, useEffect} from 'react'
import {PurchaseWithRelations, PurchasePhase3Data} from '../../(lib)/purchase-actions'
import {getPersons, PersonWithRelations} from '../../(lib)/person-actions'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  purchase: PurchaseWithRelations
  onSubmit: (data: PurchasePhase3Data) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function PurchasePhase3Form({purchase, onSubmit, onCancel, isSubmitting = false}: Props) {
  const {session} = useGlobal()
  const [persons, setPersons] = useState<PersonWithRelations[]>([])
  const [formData, setFormData] = useState<PurchasePhase3Data>({
    receiver: '',
    receiverId: undefined,
    receivedDate: formatDate(purchase?.receivedDate ? new Date(purchase.receivedDate) : '', 'YYYY-MM-DD'),
    receiptDate: formatDate(purchase?.receiptDate ? new Date(purchase.receiptDate) : '', 'YYYY-MM-DD'),
  })

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
        {purchase.expectedArrival && (
          <div className="text-xs text-gray-500 mt-1">
            到着予定日: {formatDate(new Date(purchase.expectedArrival), 'YYYY/MM/DD')}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          受取者 <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.receiverId || ''}
          onChange={e => {
            const personId = e.target.value ? parseInt(e.target.value) : undefined
            const person = persons.find(p => p.id === personId)
            setFormData({
              ...formData,
              receiverId: personId,
              receiver: person?.name || '',
            })
          }}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          受取確認日 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.receivedDate || ''}
          onChange={e => setFormData({...formData, receivedDate: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
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
          disabled={isSubmitting || !formData.receiverId || !formData.receivedDate}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : '受取を記録'}
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
