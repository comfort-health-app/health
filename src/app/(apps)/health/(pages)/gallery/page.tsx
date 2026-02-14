'use client'

import {useState, useEffect, useCallback} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {getJournalImagesByDateRange} from '../../(lib)/journalActions'
import GalleryGrid from '../../(components)/gallery/GalleryGrid'
import JournalContentModal from '../../(components)/gallery/JournalContentModal'

type DateImageData = {
  date: string
  firstImage: {
    id: number
    filePath: string
    fileName: string
    description?: string
    isFeatured?: boolean
  } | null
  imageCount: number
}

export default function GalleryPage() {
  const {session} = useGlobal()
  const [dateImages, setDateImages] = useState<DateImageData[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  // 月の画像データを取得
  const fetchMonthImages = useCallback(async () => {
    if (!session?.id) return

    setIsLoading(true)
    try {
      const startDate = new Date(year, month - 1, 1)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(year, month, 0)
      endDate.setHours(23, 59, 59, 999)

      const result = await getJournalImagesByDateRange(session.id, startDate, endDate)
      if (result.success && result.data) {
        setDateImages(result.data)
      } else {
        console.error('画像取得エラー:', result.error)
        setDateImages([])
      }
    } catch (error) {
      console.error('画像取得エラー:', error)
      setDateImages([])
    } finally {
      setIsLoading(false)
    }
  }, [session?.id, year, month])

  useEffect(() => {
    fetchMonthImages()
  }, [fetchMonthImages])

  // 日付グリッドをクリック
  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setIsModalOpen(true)
  }

  // モーダルを閉じる
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // イチオシ更新時
  const handleFeaturedUpdated = () => {
    fetchMonthImages()
  }

  // 前の月へ
  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  // 次の月へ
  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>ログインが必要です</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* ヘッダー */}
      <div className="flex justify-center items-center">
        <div className="flex items-center gap-4">
          <button onClick={handlePrevMonth} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">
            ←
          </button>
          <span className="text-lg font-medium min-w-[120px] text-center">
            {year}年{month}月
          </span>
          <button onClick={handleNextMonth} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">
            →
          </button>
        </div>
      </div>

      {/* グリッド表示 */}
      {isLoading ? (
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
      ) : (
        <GalleryGrid dateImages={dateImages} onDateClick={handleDateClick} year={year} month={month} />
      )}

      {/* 日誌モーダル */}
      {selectedDate && (
        <JournalContentModal
          isOpen={isModalOpen}
          date={selectedDate}
          userId={session.id}
          onClose={handleCloseModal}
          onFeaturedUpdated={handleFeaturedUpdated}
        />
      )}
    </div>
  )
}
