'use client'

import {useState} from 'react'
import {Hospital} from '@prisma/client'
import {HospitalTaskFormData, HospitalTaskWithRelations} from '../../(lib)/hospital-task-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  task?: HospitalTaskWithRelations | null
  hospitals: Hospital[]
  onSubmit: (data: HospitalTaskFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function HospitalTaskForm({task, hospitals, onSubmit, onCancel, isSubmitting = false}: Props) {
  const [formData, setFormData] = useState<HospitalTaskFormData>({
    hospitalId: task?.hospitalId || (hospitals[0]?.id ?? 0),
    dueDate: task?.dueDate ? formatDate(new Date(task.dueDate), 'YYYY-MM-DD') : '',
    content: task?.content || '',
    memo: task?.memo || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          病院 <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.hospitalId}
          onChange={e => setFormData({...formData, hospitalId: Number(e.target.value)})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">選択してください</option>
          {hospitals.map(hospital => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name} - {hospital.department}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">期限（次の診療日など）</label>
        <input
          type="date"
          value={formData.dueDate || ''}
          onChange={e => setFormData({...formData, dueDate: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.content}
          onChange={e => setFormData({...formData, content: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="例：検尿セット持参"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
        <textarea
          value={formData.memo || ''}
          onChange={e => setFormData({...formData, memo: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="備考を入力"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.hospitalId || !formData.content}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : task ? '更新' : '登録'}
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

