'use client'

import {HospitalWithRelations} from '../../(lib)/hospital-actions'

type Props = {
  hospital: HospitalWithRelations
  onEdit: (hospital: HospitalWithRelations) => void
  onDelete: (hospital: HospitalWithRelations) => void
}

export default function HospitalCard({hospital, onEdit, onDelete}: Props) {
  const visitCount = hospital._count?.MedicalVisit ?? 0
  const taskCount = hospital._count?.HospitalTask ?? 0

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${
        hospital.active ? 'border-blue-500' : 'border-gray-300 opacity-60'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{hospital.name}</h3>
          {!hospital.active && <span className="inline-block px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">無効</span>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(hospital)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(hospital)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <span className="inline-block w-16 text-gray-500">診療科:</span>
          <span className="font-medium">{hospital.department}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="inline-block w-16 text-gray-500">担当医:</span>
          <span className="font-medium">{hospital.doctorName}</span>
        </div>
      </div>

      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span>通院履歴: {visitCount}件</span>
        <span>タスク: {taskCount}件</span>
      </div>
    </div>
  )
}

