'use client'

import {useState} from 'react'
import {SymptomWithRelations} from '../../(lib)/symptom-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import {basePath} from '@cm/lib/methods/common'
import SymptomImageUploader from './SymptomImageUploader'

type Props = {
  symptom: SymptomWithRelations
  onEdit: (symptom: SymptomWithRelations) => void
  onDelete: (symptom: SymptomWithRelations) => void
  onEnd?: (symptom: SymptomWithRelations) => void
  onReopen?: (symptom: SymptomWithRelations) => void
  onUpdated?: () => void
}

export default function SymptomCard({symptom, onEdit, onDelete, onEnd, onReopen, onUpdated}: Props) {
  const [showUploader, setShowUploader] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  const isActive = !symptom.endDate || new Date(symptom.endDate) > new Date()
  const visitCount = symptom._count?.MedicalVisitSymptom || 0
  const images = symptom.SymptomImage || []

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('この画像を削除しますか？')) return

    setDeletingImageId(imageId)
    try {
      const response = await fetch(`${basePath}/health/api/symptom/image/${imageId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        onUpdated?.()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('画像削除エラー:', error)
      alert('画像の削除に失敗しました')
    } finally {
      setDeletingImageId(null)
    }
  }

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${isActive ? 'border-orange-500' : 'border-gray-300'}`}
    >
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-800">{symptom.name}</span>
            {isActive ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">進行中</span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">終了</span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {formatDate(new Date(symptom.startDate), 'YYYY/MM/DD')} 〜{' '}
            {symptom.endDate ? formatDate(new Date(symptom.endDate), 'YYYY/MM/DD') : ''}
          </div>
          {visitCount > 0 && <div className="text-sm text-blue-600 mt-1">通院 {visitCount} 件</div>}
        </div>
        <div className="flex gap-1">
          {isActive && onEnd && (
            <button
              onClick={() => onEnd(symptom)}
              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded"
              title="終了する"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {!isActive && onReopen && (
            <button
              onClick={() => onReopen(symptom)}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
              title="再開する"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(symptom)}
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
            onClick={() => onDelete(symptom)}
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

      {/* 詳細 */}
      {symptom.description && (
        <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{symptom.description}</div>
      )}

      {/* 画像セクション */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">画像 ({images.length})</span>
          <button onClick={() => setShowUploader(!showUploader)} className="text-xs text-blue-600 hover:text-blue-800">
            + 追加
          </button>
        </div>

        {showUploader && (
          <div className="mt-2">
            <SymptomImageUploader
              symptomId={symptom.id}
              onUploaded={() => {
                onUpdated?.()
                setShowUploader(false)
              }}
            />
          </div>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {images.map(image => (
              <div key={image.id} className="relative group aspect-square">
                <img
                  src={image.url}
                  alt={image.originalName}
                  className="w-full h-full object-cover rounded cursor-pointer"
                  onClick={() => window.open(image.url, '_blank')}
                />
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleDeleteImage(image.id)
                  }}
                  disabled={deletingImageId === image.id}
                  className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="画像を削除"
                >
                  {deletingImageId === image.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
