'use client'

import {useState, useEffect, useCallback, Fragment} from 'react'
import {HOUR_SLOTS, HealthJournal} from '../../(constants)/types'
import JournalTimelineEntry from '../../(pages)/journal/JournalTimelineEntry'
import {getOrCreateJournal, getAllHealthRecordsForDate, updateJournalEntry} from '../../(lib)/journalActions'
import {getMidnight} from '@cm/class/Days/date-utils/calculations'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import {Days} from '@cm/class/Days/Days'
import {HealthJournalEntry} from '@prisma/client'

interface JournalContentModalProps {
  isOpen: boolean
  date: string
  userId: number
  onClose: () => void
  onFeaturedUpdated?: () => void
}

export default function JournalContentModal({isOpen, date, userId, onClose, onFeaturedUpdated}: JournalContentModalProps) {
  const [journal, setJournal] = useState<(HealthJournal & {HealthJournalEntry: HealthJournalEntry[]}) | null>(null)
  const [healthRecordsByHour, setHealthRecordsByHour] = useState<Map<number, any[]>>(new Map())
  const [loading, setLoading] = useState(true)

  const dateObj = new Date(date + 'T00:00:00+09:00')
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`

  // 健康記録を時間帯別にプリプロセッシング
  const preprocessHealthRecords = useCallback((records: any[]) => {
    const recordsByHour = new Map<number, any[]>()

    for (let hour = 0; hour < 24; hour++) {
      recordsByHour.set(hour, [])
    }

    records.forEach(record => {
      const datetime = new Date(`${formatDate(record.recordDate)} ${record.recordTime}`)
      const recordHour = datetime.getHours()

      try {
        if (recordHour >= 0 && recordHour < 24) {
          const hourRecords = recordsByHour.get(recordHour) || []
          hourRecords.push(record)
          recordsByHour.set(recordHour, hourRecords)
        }
      } catch (error) {
        console.warn('記録時刻の解析に失敗:', record.recordTime, error)
      }
    })

    return recordsByHour
  }, [])

  // 指定時間帯の健康記録を取得
  const getHealthRecordsForHourSlot = useCallback(
    (hourSlot: number) => {
      return healthRecordsByHour.get(hourSlot) || []
    },
    [healthRecordsByHour]
  )

  // 日誌データを取得
  const fetchJournal = async () => {
    setLoading(true)
    try {
      const journalResult = await getOrCreateJournal(userId, date)
      let {data: healthRecordsResult} = await getAllHealthRecordsForDate(userId, date)

      healthRecordsResult.sort((a, b) => {
        const datetimeA = new Date(`${formatDate(a.recordDate)} ${a.recordTime}`)
        const datetimeB = new Date(`${formatDate(b.recordDate)} ${b.recordTime}`)
        return datetimeA.getTime() - datetimeB.getTime()
      })

      healthRecordsResult = healthRecordsResult.filter(record => {
        const datetime = new Date(`${formatDate(record.recordDate)} ${record.recordTime}`)
        const today7 = getMidnight(new Date(date))
        today7.setHours(7, 0, 0, 0)
        const tomorrow7 = Days.day.add(getMidnight(new Date(date)), 1)
        tomorrow7.setHours(7, 0, 0, 0)
        const after7Today = datetime.getTime() >= today7.getTime()
        const before7Tomorrow = datetime.getTime() < tomorrow7.getTime()
        return after7Today && before7Tomorrow
      })

      if (journalResult.success && journalResult.data) {
        setJournal(journalResult.data as any)
      }

      const processedRecords = preprocessHealthRecords(healthRecordsResult)
      setHealthRecordsByHour(processedRecords)
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  // エントリを更新
  const updateEntry = useCallback(
    async (entryId: number, comment: string) => {
      if (!journal) return

      try {
        const result = await updateJournalEntry(entryId, comment)

        if (result.success && result.data) {
          const updatedEntries = journal.HealthJournalEntry.map(entry => (entry.id === entryId ? result.data : entry))

          setJournal({
            ...journal,
            HealthJournalEntry: updatedEntries as any,
          })
        }
      } catch (error) {
        console.error('エントリの更新に失敗しました:', error)
      }
    },
    [journal]
  )

  // イチオシ画像を更新（ステートのみ更新、再取得なし）
  const updateFeaturedImage = useCallback(
    (imageId: number | null) => {
      if (!journal) return

      // 全てのエントリの画像のisFeaturedを更新
      const updatedEntries = journal.HealthJournalEntry.map(entry => ({
        ...entry,
        images: entry.images?.map(img => ({
          ...img,
          isFeatured: imageId ? img.id === imageId : false,
        })),
      }))

      setJournal({
        ...journal,
        HealthJournalEntry: updatedEntries as any,
      })

      // ギャラリーグリッドの更新を通知
      onFeaturedUpdated?.()
    },
    [journal, onFeaturedUpdated]
  )

  useEffect(() => {
    if (isOpen && date) {
      fetchJournal()
    }
  }, [isOpen, date, userId])

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // スクロールを無効化
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">{formattedDate}の日誌</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="閉じる (ESC)">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
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
          ) : journal?.templateApplied ? (
            <div className="space-y-4">
              {/* 目標と振り返り */}
              {journal.goalAndReflection && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">目標と振り返り</h3>
                  <div className="p-3 bg-white rounded-md whitespace-pre-wrap text-gray-700">{journal.goalAndReflection}</div>
                </div>
              )}

              {/* タイムライン */}
              {HOUR_SLOTS.map(hourSlot => {
                const entry = journal.HealthJournalEntry.find(e => e.hourSlot === hourSlot)
                const hourHealthRecords = getHealthRecordsForHourSlot(hourSlot)

                return (
                  <Fragment key={hourSlot}>
                    <JournalTimelineEntry
                      hourSlot={hourSlot}
                      entry={entry}
                      journalDate={date}
                      userId={userId}
                      healthRecords={hourHealthRecords}
                      onUpdateEntry={updateEntry}
                      journalId={journal.id}
                      onFeaturedUpdated={updateFeaturedImage}
                      readOnly={true}
                    />
                  </Fragment>
                )
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">この日の日誌はまだ作成されていません。</p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
