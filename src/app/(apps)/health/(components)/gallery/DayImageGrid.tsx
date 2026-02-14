'use client'

import ContentPlayer from '@cm/components/utils/ContentPlayer'

type ImageData = {
  id: number
  filePath: string
  fileName: string
  description?: string
}

interface DayImageGridProps {
  date: string
  images: ImageData[]
  onImageClick: (image: ImageData) => void
  onClose: () => void
  isLoading: boolean
}

export default function DayImageGrid({date, images, onImageClick, onClose, isLoading}: DayImageGridProps) {
  const dateObj = new Date(date + 'T00:00:00+09:00')
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">{formattedDate}</h2>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            閉じる
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>読み込み中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">{formattedDate}</h2>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            閉じる
          </button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <p>この日の画像はありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">{formattedDate}</h2>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
          閉じる
        </button>
      </div>

      {/* 画像グリッド */}
      <div className="grid grid-cols-3 gap-3">
        {images.map(image => (
          <div
            key={image.id}
            onClick={() => onImageClick(image)}
            className="aspect-square relative bg-white border-2 border-gray-200 shadow-sm p-2 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-full h-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-sm overflow-hidden relative">
              <ContentPlayer
                src={image.filePath}
                styles={{
                  thumbnail: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  },
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
