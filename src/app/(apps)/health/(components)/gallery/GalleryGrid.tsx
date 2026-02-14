'use client'

import Image from 'next/image'

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

interface GalleryGridProps {
  dateImages: DateImageData[]
  onDateClick: (date: string) => void
  year: number
  month: number
}

export default function GalleryGrid({dateImages, onDateClick, year, month}: GalleryGridProps) {
  // 月の日数を取得
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

  // 日付マップを作成
  const dateMap = new Map<string, DateImageData>()
  dateImages.forEach(item => {
    dateMap.set(item.date, item)
  })

  // カレンダーグリッド用の日付配列を作成
  const calendarDays: Array<{date: string; data: DateImageData | null}> = []

  // 月初めの空白セル
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({date: '', data: null})
  }

  // 日付セル
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(month).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const date = `${year}-${monthStr}-${dayStr}`
    const data = dateMap.get(date) || null
    calendarDays.push({date, data})
  }

  return (
    <div className="w-full">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((item, index) => {
          if (!item.date) {
            return <div key={`empty-${index}`} className="aspect-square"></div>
          }

          const dateObj = new Date(item.date + 'T00:00:00+09:00')
          const day = dateObj.getDate()

          return (
            <div
              key={item.date}
              onClick={() => item.data && onDateClick(item.date)}
              className={`aspect-square relative bg-gray-100 border border-gray-100  overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
                item.data ? 'hover:ring-2 hover:ring-blue-500' : ''
              }`}
            >
              {item.data?.firstImage ? (
                <>
                  <div className={`w-full h-full bg-white `}>
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 overflow-hidden relative">
                      <Image
                        src={item.data.firstImage.filePath}
                        width={100}
                        height={100}
                        alt={item.data.firstImage.fileName}
                        className={`w-full h-full object-cover `}
                      />
                      {/* イチオシ未設定のバッジ */}
                      {!item.data.firstImage.isFeatured && (
                        <div className="hidden sm:flex absolute top-1 left-1 bg-gray-500/80 text-white text-[10px] px-1 py-0.5 rounded  items-center gap-0.5">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>未設定</span>
                        </div>
                      )}
                      {/* イチオシ設定済みのバッジ */}
                      {item.data.firstImage.isFeatured && (
                        <div className="hidden sm:flex absolute top-1 left-1 bg-yellow-400/90 text-yellow-900 text-[10px] px-1 py-0.5 rounded flex items-center gap-0.5 font-medium">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>イチオシ</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* {item.data.imageCount > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {item.data.imageCount}
                    </div>
                  )} */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                    <div className="text-white text-xs font-medium">{day}</div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">{day}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
