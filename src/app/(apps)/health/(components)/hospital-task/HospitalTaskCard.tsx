'use client'

import {useState} from 'react'
import {HospitalTaskWithRelations, deleteHospitalTaskImage, toggleHospitalTaskComplete} from '../../(lib)/hospital-task-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import HospitalTaskImageUploader from './HospitalTaskImageUploader'

type Props = {
  task: HospitalTaskWithRelations
  onEdit: (task: HospitalTaskWithRelations) => void
  onDelete: (task: HospitalTaskWithRelations) => void
  onUpdated: () => void
}

export default function HospitalTaskCard({task, onEdit, onDelete, onUpdated}: Props) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
  const isToday = task.dueDate && formatDate(new Date(task.dueDate), 'YYYY-MM-DD') === formatDate(new Date(), 'YYYY-MM-DD')

  const handleToggleComplete = async () => {
    setIsToggling(true)
    try {
      const result = await toggleHospitalTaskComplete(task.id)
      if (result.success) {
        onUpdated()
      } else {
        alert(result.error)
      }
    } finally {
      setIsToggling(false)
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('この画像を削除しますか？')) return

    setDeletingImageId(imageId)
    try {
      const result = await deleteHospitalTaskImage(imageId)
      if (result.success) {
        onUpdated()
      } else {
        alert(result.error)
      }
    } finally {
      setDeletingImageId(null)
    }
  }

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${
        task.completed
          ? 'border-gray-300 opacity-60'
          : isOverdue
            ? 'border-red-500'
            : isToday
              ? 'border-yellow-500'
              : 'border-green-500'
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleComplete}
          disabled={isToggling}
          className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 ${
            task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500'
          } ${isToggling ? 'opacity-50' : ''}`}
        >
          {task.completed && (
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>{task.content}</div>

          {task.dueDate && (
            <div
              className={`text-xs mt-1 ${
                task.completed ? 'text-gray-400' : isOverdue ? 'text-red-600' : isToday ? 'text-yellow-600' : 'text-gray-500'
              }`}
            >
              期限: {formatDate(new Date(task.dueDate), 'MM/DD')}
              {isOverdue && !task.completed && ' (期限切れ)'}
              {isToday && !task.completed && ' (今日)'}
            </div>
          )}

          {task.memo && <div className="text-xs text-gray-500 mt-1">{task.memo}</div>}
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
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
            onClick={() => onDelete(task)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
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

      {/* 画像セクション */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {/* <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg> */}
            画像 ({task.HospitalTaskImage.length})
          </button>
          <button onClick={() => setShowUploader(!showUploader)} className="text-xs text-blue-600 hover:text-blue-800">
            + 追加
          </button>
        </div>

        {showUploader && (
          <div className="mt-2">
            <HospitalTaskImageUploader
              hospitalTaskId={task.id}
              onUploaded={() => {
                onUpdated()
                setShowUploader(false)
              }}
            />
          </div>
        )}

        {task.HospitalTaskImage.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-1 mt-2">
            {task.HospitalTaskImage.map(image => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.originalName}
                  className="w-full  object-cover rounded cursor-pointer"
                  onClick={() => window.open(image.url, '_blank')}
                />
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  disabled={deletingImageId === image.id}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
