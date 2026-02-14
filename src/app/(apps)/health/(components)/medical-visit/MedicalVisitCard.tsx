'use client'

import {useState} from 'react'
import {MedicalVisitWithRelations, deleteMedicalVisitImage} from '../../(lib)/medical-visit-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import ImageUploader from './ImageUploader'

type Props = {
  visit: MedicalVisitWithRelations
  onEdit: (visit: MedicalVisitWithRelations) => void
  onDelete: (visit: MedicalVisitWithRelations) => void
  onImageUploaded: () => void
}

export default function MedicalVisitCard({visit, onEdit, onDelete, onImageUploaded}: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showUploader, setShowUploader] = useState<'BEFORE' | 'AFTER' | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('この画像を削除しますか？')) return

    setDeletingImageId(imageId)
    try {
      const result = await deleteMedicalVisitImage(imageId)
      if (result.success) {
        onImageUploaded()
      } else {
        alert(result.error)
      }
    } finally {
      setDeletingImageId(null)
    }
  }

  // 画像を種類別に分類
  const beforeImages = visit.MedicalVisitImage.filter(img => img.imageType === 'BEFORE')
  const afterImages = visit.MedicalVisitImage.filter(img => img.imageType === 'AFTER')

  // 紐付いた症状
  const symptoms = visit.MedicalVisitSymptom || []

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">{formatDate(new Date(visit.visitDate), 'YYYY/MM/DD')}</span>
            {visit.visitTime && <span className="text-sm text-gray-500">{visit.visitTime}</span>}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-medium">{visit.Hospital.name}</span>
            <span className="mx-2">-</span>
            <span>{visit.departmentAtVisit || visit.Hospital.department}</span>
          </div>
          <div className="text-sm text-gray-500">担当: {visit.doctorNameAtVisit || visit.Hospital.doctorName}</div>

          {/* 関連症状 */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {symptoms.map(({Symptom}) => (
                <span
                  key={Symptom.id}
                  className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full"
                >
                  {Symptom.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(visit)}
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
            onClick={() => onDelete(visit)}
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

      {/* 処置内容・コメント */}
      {(visit.treatment || visit.doctorComment || visit.memo) && (
        <div className="space-y-2 text-sm">
          {visit.treatment && (
            <div>
              <span className="text-gray-500">処置: </span>
              <span className="text-gray-700">{visit.treatment}</span>
            </div>
          )}
          {visit.doctorComment && (
            <div>
              <span className="text-gray-500">先生コメント: </span>
              <span className="text-gray-700">{visit.doctorComment}</span>
            </div>
          )}
          {visit.memo && (
            <div>
              <span className="text-gray-500">備考: </span>
              <span className="text-gray-700">{visit.memo}</span>
            </div>
          )}
        </div>
      )}

      {/* 画像セクション */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            画像 ({visit.MedicalVisitImage.length}件)
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploader(showUploader === 'BEFORE' ? null : 'BEFORE')}
              className={`text-xs px-2 py-1 rounded ${
                showUploader === 'BEFORE' ? 'bg-purple-500 text-white' : 'text-purple-600 hover:bg-purple-50'
              }`}
            >
              + 通院前
            </button>
            <button
              onClick={() => setShowUploader(showUploader === 'AFTER' ? null : 'AFTER')}
              className={`text-xs px-2 py-1 rounded ${
                showUploader === 'AFTER' ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-green-50'
              }`}
            >
              + 処置後
            </button>
          </div>
        </div>

        {/* アップローダー */}
        {showUploader && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">
              {showUploader === 'BEFORE' ? '通院前の画像をアップロード' : '処置後の画像をアップロード'}
            </div>
            <ImageUploader
              medicalVisitId={visit.id}
              imageType={showUploader}
              onUploaded={() => {
                onImageUploaded()
                setShowUploader(null)
              }}
            />
          </div>
        )}

        {/* 通院前画像 */}
        {beforeImages.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-purple-600 mb-1">通院前 ({beforeImages.length}件)</div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {beforeImages.map(image => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt={image.originalName}
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-90 transition-opacity border-2 border-purple-200"
                    onClick={() => window.open(image.url, '_blank')}
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteImage(image.id)
                    }}
                    disabled={deletingImageId === image.id}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title="画像を削除"
                  >
                    {deletingImageId === image.id ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 処置後画像 */}
        {afterImages.length > 0 && (
          <div>
            <div className="text-xs font-medium text-green-600 mb-1">処置後 ({afterImages.length}件)</div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {afterImages.map(image => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt={image.originalName}
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-90 transition-opacity border-2 border-green-200"
                    onClick={() => window.open(image.url, '_blank')}
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteImage(image.id)
                    }}
                    disabled={deletingImageId === image.id}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title="画像を削除"
                  >
                    {deletingImageId === image.id ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
