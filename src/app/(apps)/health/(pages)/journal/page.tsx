'use client'

const today = getMidnight()

import {useState, useEffect, useRef, Fragment, useCallback} from 'react'
import {useReactToPrint} from 'react-to-print'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {HOUR_SLOTS, HealthJournal} from '../../(constants)/types'
import JournalTimelineEntry from './JournalTimelineEntry'
import {
  getOrCreateJournal,
  applyJournalTemplate,
  updateJournal,
  updateJournalEntry,
  getAllHealthRecordsForDate,
} from '../../(lib)/journalActions'
import PlaceHolder from '@cm/components/utils/loader/PlaceHolder'
import {C_Stack, R_Stack} from '@cm/components/styles/common-components/common-components'

import {getMidnight} from '@cm/class/Days/date-utils/calculations'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import {BreakBefore} from '@cm/components/styles/common-components/print-components'
import {HealthJournalEntry} from '@prisma/client'
import {Days} from '@cm/class/Days/Days'

export default function JournalPage() {
  const global = useGlobal()
  const {toggleLoad, session, query, addQuery} = global

  const selectedDate = query.date ? query.date : formatDate(getMidnight())
  const setSelectedDate = value => addQuery({date: value})

  const [journal, setJournal] = useState<(HealthJournal & {HealthJournalEntry: HealthJournalEntry[]}) | null>(null)
  const [loading, setLoading] = useState(false)
  const [goalAndReflection, setGoalAndReflection] = useState('')
  const [originalGoalAndReflection, setOriginalGoalAndReflection] = useState('')

  const [goalHasChanges, setGoalHasChanges] = useState(false)
  // const [healthRecords, setHealthRecords] = useState<any[]>([])

  // 健康記録の時間帯別キャッシュ
  const [healthRecordsByHour, setHealthRecordsByHour] = useState<Map<number, any[]>>(new Map())

  // Timeline表示制御
  const [showAllEntries, setShowAllEntries] = useState(false)

  // 印刷用のref
  const printRef = useRef<HTMLDivElement>(null)

  // debounce用のtimer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 印刷処理
  const reactToPrintFn = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @media print {
        @page {
          size: A4;
          margin: 15mm;
        }

        body {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-target {
          font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
        }

        .print-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 20px !important;
          padding-bottom: 10px !important;
          border-bottom: 2px solid #333 !important;
        }

        .print-title {
          font-size: 18px !important;
          font-weight: bold !important;
          margin: 0 !important;
        }

        .print-date {
          font-size: 14px !important;
          color: #666 !important;
        }

        .break-before-all {
           page-break-before:always !important;
           margin: 20px !important;
        }


        .print-section-title {
          font-size: 14px !important;
          font-weight: bold !important;
          margin-bottom: 10px !important;
          color: #333 !important;
        }

        .print-goal-box {
          border: 1px solid #ddd !important;
          padding: 15px !important;
          border-radius: 4px !important;
          background-color: #f9f9f9 !important;
          min-height: 60px !important;
          white-space: pre-wrap !important;
        }

        .print-timeline-entry {
          margin-bottom: 15px !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          border: 1px solid #e0e0e0 !important;
          border-radius: 4px !important;
          padding: 10px !important;
          min-height: 45vh !important;
        }

        .print-timeline-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 8px !important;
          padding-bottom: 5px !important;
          border-bottom: 1px solid #eee !important;
        }

        .print-time-label {
          font-weight: bold !important;
          font-size: 13px !important;
          color: #333 !important;
        }

        .print-health-records {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 4px !important;
        }

        .print-health-badge {
          display: inline-block !important;
          padding: 2px 6px !important;
          border-radius: 3px !important;
          font-size: 10px !important;
          font-weight: 500 !important;
          color: white !important;
        }

        .print-comment-box {
          border: 1px solid #ddd !important;
          padding: 8px !important;
          border-radius: 3px !important;
          background-color: #fafafa !important;
          min-height: 30px !important;
          margin-top: 8px !important;
          white-space: pre-wrap !important;
          font-size: 11px !important;
          line-height: 1.4 !important;
        }

        .print-comment-box textarea,
        .print-textarea {
          height: auto !important;
          min-height: 30px !important;
          max-height: none !important;
          overflow: visible !important;
          resize: none !important;
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          font-size: 11px !important;
          line-height: 1.4 !important;
          color: #333 !important;
          outline: none !important;
          box-shadow: none !important;
          word-wrap: break-word !important;
          white-space: pre-wrap !important;
        }

        /* 印刷時にtextareaの代わりに表示する内容 */
        .print-comment-content {
          display: none;
        }

        .print-comment-box textarea {
          display: block !important;
        }

        /* 印刷時に非表示にする要素 */
        .no-print {
          display: none !important;
        }

        /* 印刷時の画像表示 */
        .print-images {
          margin-top: 10px !important;
          display: block !important;
        }

        .print-image-container {
          display: inline-block !important;
          margin: 5px !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
          overflow: hidden !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          vertical-align: top !important;
          max-width: 160px !important;
        }

        .print-image {
          max-width: 150px !important;
          max-height: 120px !important;
          width: auto !important;
          height: auto !important;
          display: block !important;
          object-fit: contain !important;
        }

        .print-image-caption {
          padding: 4px !important;
          font-size: 10px !important;
          color: #666 !important;
          background-color: #f9f9f9 !important;
          text-align: center !important;
          border-top: 1px solid #eee !important;
          word-wrap: break-word !important;
          max-width: 150px !important;
          line-height: 1.2 !important;
        }

        /* ページ区切りの制御 */
        .page-break-before {
          page-break-before: always !important;
        }

        .page-break-after {
          page-break-after: always !important;
        }

        .avoid-break {
          page-break-inside: avoid !important;
        }
      }
    `,
  })

  // 印刷実行関数
  const handlePrint = () => {
    // 印刷時は全エントリを表示
    const wasShowingAll = showAllEntries
    if (!showAllEntries) {
      setShowAllEntries(true)
      // 全エントリ表示後に少し待ってから印刷処理を開始
      setTimeout(() => {
        executePrint(wasShowingAll)
      }, 100)
      return
    }

    executePrint(wasShowingAll)
  }

  const executePrint = (wasShowingAll: boolean) => {
    // 印刷前に全てのtextareaの高さを自動調整
    const adjustTextareaHeights = () => {
      const textareas = printRef.current?.querySelectorAll('textarea')
      textareas?.forEach(textarea => {
        if (textarea instanceof HTMLTextAreaElement && textarea.value.trim()) {
          // 現在の高さをリセット
          textarea.style.height = 'auto'
          textarea.style.minHeight = 'auto'

          // コンテンツに応じた高さを計算
          const scrollHeight = textarea.scrollHeight
          const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 14
          const padding = 6 // 上下のpadding
          const requiredHeight = Math.max(scrollHeight + padding, lineHeight + padding)

          // 高さを設定
          textarea.style.height = requiredHeight + 'px'
          textarea.style.minHeight = requiredHeight + 'px'

          // 印刷用の追加スタイルを適用
          textarea.style.overflow = 'visible'
          textarea.style.resize = 'none'
          textarea.style.border = 'none'
          textarea.style.background = 'transparent'
        }
      })
    }

    // 画像の読み込み完了を待つ
    const waitForImages = () => {
      return new Promise<void>(resolve => {
        const images = printRef.current?.querySelectorAll('.print-image') as NodeListOf<HTMLImageElement>
        if (!images || images.length === 0) {
          resolve()
          return
        }

        let loadedCount = 0
        const totalImages = images.length

        const checkComplete = () => {
          loadedCount++
          if (loadedCount >= totalImages) {
            resolve()
          }
        }

        images.forEach(img => {
          if (img.complete) {
            checkComplete()
          } else {
            img.onload = checkComplete
            img.onerror = checkComplete
          }
        })

        // タイムアウト（最大3秒待機）
        setTimeout(() => {
          resolve()
        }, 3000)
      })
    }

    // 高さ調整を実行
    adjustTextareaHeights()

    // 画像読み込み完了を待ってから印刷実行
    setTimeout(async () => {
      adjustTextareaHeights()
      await waitForImages()
      // さらに遅延してから印刷実行
      setTimeout(() => {
        reactToPrintFn()
        // 印刷後、必要に応じて表示状態を元に戻す
        if (!wasShowingAll) {
          setTimeout(() => setShowAllEntries(false), 1000)
        }
      }, 100)
    }, 100)
  }

  // 健康記録を時間帯別にプリプロセッシング
  const preprocessHealthRecords = useCallback((records: any[]) => {
    const recordsByHour = new Map<number, any[]>()

    // 全ての時間帯を初期化
    for (let hour = 0; hour < 24; hour++) {
      recordsByHour.set(hour, [])
    }

    // 記録を時間帯別に分類
    records.forEach((record, i) => {
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

  // 指定時間帯の健康記録を取得（キャッシュ使用）
  const getHealthRecordsForHourSlot = useCallback(
    (hourSlot: number) => {
      const result = healthRecordsByHour.get(hourSlot) || []

      return result
    },
    [healthRecordsByHour]
  )

  // 日誌データを取得
  const fetchJournal = async () => {
    if (!session?.id) return

    setLoading(true)
    try {
      // 日誌データと健康記録を並行取得

      const journalResult = await getOrCreateJournal(session.id, selectedDate)

      let {data: healthRecordsResult} = await getAllHealthRecordsForDate(session.id, selectedDate)

      healthRecordsResult.sort((a, b) => {
        const datetimeA = new Date(`${formatDate(a.recordDate)} ${a.recordTime}`)
        const datetimeB = new Date(`${formatDate(b.recordDate)} ${b.recordTime}`)

        return datetimeA.getTime() - datetimeB.getTime()
      })

      healthRecordsResult = healthRecordsResult.filter(record => {
        const datetime = new Date(`${formatDate(record.recordDate)} ${record.recordTime}`)

        const today7 = getMidnight(selectedDate)
        today7.setHours(7, 0, 0, 0)

        const tomorrow7 = Days.day.add(getMidnight(selectedDate), 1)
        tomorrow7.setHours(7, 0, 0, 0)

        const after7Today = datetime.getTime() >= today7.getTime()
        const before7Tomorrow = datetime.getTime() < tomorrow7.getTime()

        return after7Today && before7Tomorrow
      })

      if (journalResult.success && journalResult.data) {
        setJournal(journalResult.data as any)
        const goalText = journalResult.data.goalAndReflection || ''
        setGoalAndReflection(goalText)
        setOriginalGoalAndReflection(goalText)
        setGoalHasChanges(false)
      } else {
        console.error('日誌の取得に失敗しました:', journalResult.error)
      }

      // setHealthRecords(healthRecordsResult.data)
      // 健康記録をプリプロセッシングしてキャッシュ
      const processedRecords = preprocessHealthRecords(healthRecordsResult)

      setHealthRecordsByHour(processedRecords)
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  // テンプレートを適用
  const applyTemplate = async () => {
    if (!journal) return

    setLoading(true)
    try {
      const result = await applyJournalTemplate(journal.id)

      if (result.success) {
        // 日誌データを再取得してエントリを反映
        await fetchJournal()
      } else {
        console.error('テンプレートの適用に失敗しました:', result.error)
      }
    } catch (error) {
      console.error('テンプレートの適用に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  // 目標と振り返りの変更を検知（debounce処理付き）
  const handleGoalAndReflectionChange = useCallback(
    (value: string) => {
      // 即座にUIを更新（レスポンシブ性を保つ）
      setGoalAndReflection(value)

      // debounceで変更検知処理を遅延実行
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        setGoalHasChanges(value !== originalGoalAndReflection)
      }, 500) // 500ms後に変更を検知（重いデータセット対応）
    },
    [originalGoalAndReflection]
  )

  // 目標と振り返りを保存
  const saveGoalAndReflection = async () => {
    if (!journal || !goalHasChanges) return

    try {
      const result = await updateJournal(journal.id, goalAndReflection)

      if (result.success && result.data) {
        setJournal(result.data as any)
        setOriginalGoalAndReflection(goalAndReflection)
        setGoalHasChanges(false)
      } else {
        console.error('目標と振り返りの保存に失敗しました:', result.error)
      }
    } catch (error) {
      console.error('目標と振り返りの保存に失敗しました:', error)
    }
  }

  // エントリを更新（メモ化）
  const updateEntry = useCallback(
    async (entryId: number, comment: string) => {
      if (!journal) return

      try {
        const result = await updateJournalEntry(entryId, comment)

        if (result.success && result.data) {
          // ローカル状態を更新
          const updatedEntries = journal.HealthJournalEntry.map(entry => (entry.id === entryId ? result.data : entry))

          setJournal({
            ...journal,
            HealthJournalEntry: updatedEntries as any,
          })
        } else {
          console.error('エントリの更新に失敗しました:', result.error)
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
    },
    [journal]
  )

  useEffect(() => {
    fetchJournal()
  }, [selectedDate, session?.id])

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  if (!session?.id) {
    return <div className="p-4">ログインが必要です</div>
  }

  if (loading) {
    return (
      <div className="p-4">
        <PlaceHolder />
      </div>
    )
  }

  return (
    <div className="max-w-[850px] mx-auto p-4 space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6 no-print">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">健康日誌</h1>
        <R_Stack className={` justify-between`}>
          {/* 日付選択 */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ボタン群 */}
          <div className="flex gap-2">
            {journal && !journal.templateApplied && (
              <button
                onClick={applyTemplate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '適用中...' : 'テンプレート反映'}
              </button>
            )}
            {journal && journal.templateApplied && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                PDF出力
              </button>
            )}
          </div>
        </R_Stack>
      </div>

      {/* 印刷用コンテンツ */}
      <div ref={printRef} className="print-target p-4">
        {/* 印刷用ヘッダー */}
        <div className="print-header">
          <h1 className="print-title">健康日誌</h1>
          <div className="print-date">{selectedDate}</div>
        </div>

        {/* データがない場合 */}
        {journal && !journal.templateApplied ? (
          <>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">この日の日誌はまだ作成されていません。</p>
              <p className="text-sm text-gray-500">「テンプレート反映」ボタンを押して、24時間分の入力枠を作成してください。</p>
            </div>
          </>
        ) : (
          <C_Stack>
            {/* 目標と振り返り */}

            <div className="bg-white rounded-lg shadow p-6 ">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 print-section-title">目標と振り返り</h2>
              <div className="print-goal-box">
                <textarea
                  value={goalAndReflection}
                  onChange={e => handleGoalAndReflectionChange(e.target.value)}
                  placeholder="今日の目標や振り返りを記入してください..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {goalHasChanges && (
                <div className="flex justify-end mt-3 no-print">
                  <button
                    onClick={saveGoalAndReflection}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    確定
                  </button>
                </div>
              )}
            </div>
            <BreakBefore />

            {/* タイムライン */}
            {journal?.templateApplied && (
              <div className="space-y-4 ">
                {HOUR_SLOTS.map((hourSlot, i) => {
                  const entry = journal.HealthJournalEntry.find(e => e.hourSlot === hourSlot)
                  const hourHealthRecords = getHealthRecordsForHourSlot(hourSlot)

                  const even = i % 2 === 1

                  return (
                    <Fragment key={hourSlot}>
                      <JournalTimelineEntry
                        hourSlot={hourSlot}
                        entry={entry}
                        journalDate={selectedDate}
                        userId={session.id}
                        healthRecords={hourHealthRecords}
                        onUpdateEntry={updateEntry}
                        journalId={journal.id}
                        onFeaturedUpdated={updateFeaturedImage}
                      />
                      {even && <BreakBefore />}
                    </Fragment>
                  )
                })}
              </div>
            )}

            {/* データがない場合 */}
            {journal && !journal.templateApplied && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">この日の日誌はまだ作成されていません。</p>
                <p className="text-sm text-gray-500">「テンプレート反映」ボタンを押して、24時間分の入力枠を作成してください。</p>
              </div>
            )}
          </C_Stack>
        )}
      </div>
    </div>
  )
}
