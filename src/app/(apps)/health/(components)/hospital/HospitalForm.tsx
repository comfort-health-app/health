'use client'

import {useState} from 'react'
import {Hospital} from '@prisma/client'
import {HospitalFormData} from '../../(lib)/hospital-actions'

type Props = {
  hospital?: Hospital | null
  onSubmit: (data: HospitalFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function HospitalForm({hospital, onSubmit, onCancel, isSubmitting = false}: Props) {
  const [formData, setFormData] = useState<HospitalFormData>({
    name: hospital?.name || '',
    department: hospital?.department || '',
    doctorName: hospital?.doctorName || '',
    active: hospital?.active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          病院名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例：東京病院"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          診療科 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.department}
          onChange={e => setFormData({...formData, department: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例：皮膚科"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          担当医 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.doctorName}
          onChange={e => setFormData({...formData, doctorName: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例：田中先生"
          required
        />
      </div>

      {hospital && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={e => setFormData({...formData, active: e.target.checked})}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="active" className="text-sm text-gray-700">
            有効
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : hospital ? '更新' : '登録'}
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

