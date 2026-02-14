'use client'

import {useState} from 'react'
import {SymptomFormData, SymptomWithRelations} from '../../(lib)/symptom-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  symptom?: SymptomWithRelations | null
  onSubmit: (data: SymptomFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function SymptomForm({symptom, onSubmit, onCancel, isSubmitting = false}: Props) {
  const [formData, setFormData] = useState<SymptomFormData>({
    name: symptom?.name || '',
    description: symptom?.description || '',
    startDate: symptom ? formatDate(new Date(symptom.startDate), 'YYYY-MM-DD') : formatDate(new Date(), 'YYYY-MM-DD'),
    endDate: symptom?.endDate ? formatDate(new Date(symptom.endDate), 'YYYY-MM-DD') : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          症状名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例：腰痛、花粉症、湿疹"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">詳細</label>
        <textarea
          value={formData.description || ''}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="症状の詳細を入力"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            開始日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={e => setFormData({...formData, startDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            終了日 <span className="text-xs text-gray-500">（空欄＝進行中）</span>
          </label>
          <input
            type="date"
            value={formData.endDate || ''}
            onChange={e => setFormData({...formData, endDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.startDate}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : symptom ? '更新' : '登録'}
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

