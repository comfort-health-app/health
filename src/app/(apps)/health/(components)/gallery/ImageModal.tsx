'use client'

import {useEffect, useState} from 'react'
import ContentPlayer from '@cm/components/utils/ContentPlayer'

type ImageData = {
  id: number
  filePath: string
  fileName: string
  description?: string
}

interface ImageModalProps {
  image: ImageData
  images: ImageData[]
  onClose: () => void
}

export default function ImageModal({image, images, onClose}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // 現在の画像のインデックスを設定
  useEffect(() => {
    const index = images.findIndex(img => img.id === image.id)
    if (index !== -1) {
      setCurrentIndex(index)
    }
  }, [image, images])

  // 前の画像へ
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // 次の画像へ
  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, images.length, onClose])

  const currentImage = images[currentIndex]

  if (!currentImage) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      {/* 閉じるボタン */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 前へボタン */}
      {currentIndex > 0 && (
        <button
          onClick={e => {
            e.stopPropagation()
            handlePrev()
          }}
          className="absolute left-4 text-white hover:text-gray-300 z-10"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 画像 */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div className="w-full h-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-lg overflow-hidden flex items-center justify-center">
          <ContentPlayer
            src={currentImage.filePath}
            styles={{
              main: {
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              },
            }}
            options={{download: true}}
          />
        </div>
      </div>

      {/* 次へボタン */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={e => {
            e.stopPropagation()
            handleNext()
          }}
          className="absolute right-4 text-white hover:text-gray-300 z-10"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 画像情報 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
