'use client'

import {useState, useEffect, useCallback} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import MonthCalendar, {DayData} from './MonthCalendar'
import DayDetailModal from './DayDetailModal'
import {getMonthCalendarEventsFromMultipleAccounts, CalendarEvent} from '../../(lib)/calendar-actions'
import {getHospitalTasks, HospitalTaskWithRelations} from '../../(lib)/hospital-task-actions'
import {getPurchases, PurchaseWithRelations} from '../../(lib)/purchase-actions'
import {getTasks, Task} from '../../(lib)/task-actions'
import {getActiveSymptoms, SymptomWithRelations} from '../../(lib)/symptom-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import Link from 'next/link'
import {HREF} from '@cm/lib/methods/urls'
import {Days} from '@cm/class/Days/Days'
import {addDays, toUtc} from '@cm/class/Days/date-utils/calculations'

export default function HealthDashboard() {
  const {session, query} = useGlobal()
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [hospitalTasks, setHospitalTasks] = useState<HospitalTaskWithRelations[]>([])
  const [purchases, setPurchases] = useState<PurchaseWithRelations[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const [activeSymptoms, setActiveSymptoms] = useState<SymptomWithRelations[]>([])

  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true)
  const [isLoadingGeneralTasks, setIsLoadingGeneralTasks] = useState(true)
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [calendarError, setCalendarError] = useState<string | null>(null)

  // カレンダーイベント取得（2つのアカウントから）
  const fetchCalendarEvents = useCallback(async () => {
    setIsLoadingCalendar(true)
    setCalendarError(null)
    try {
      const result = await getMonthCalendarEventsFromMultipleAccounts({year, month})
      if (result.success && result.data) {
        setCalendarEvents(result.data)
        // エラーがある場合は警告として表示
        if (result.errors && result.errors.length > 0) {
          setCalendarError(result.errors.join(' / '))
        }
      } else {
        setCalendarError(result.errors?.join(' / ') || 'カレンダーの取得に失敗しました')
        setCalendarEvents([])
      }
    } catch (error) {
      console.error('カレンダー取得エラー:', error)
      setCalendarError('カレンダーの取得に失敗しました')
      setCalendarEvents([])
    } finally {
      setIsLoadingCalendar(false)
    }
  }, [year, month])

  // 病院タスク取得（達成状況に関わらずすべて取得）
  const fetchHospitalTasks = useCallback(async () => {
    if (!session?.id) return

    setIsLoadingTasks(true)
    try {
      const result = await getHospitalTasks({userId: session.id, includeCompleted: true})
      if (result.success && result.data) {
        setHospitalTasks(result.data)
      }
    } catch (error) {
      console.error('病院タスク取得エラー:', error)
    } finally {
      setIsLoadingTasks(false)
    }
  }, [session?.id])

  // 購入品取得（達成状況に関わらずすべて取得）
  const fetchPurchases = useCallback(async () => {
    if (!session?.id) return

    setIsLoadingPurchases(true)
    try {
      const result = await getPurchases({userId: session.id})
      if (result.success && result.data) {
        setPurchases(result.data)
      }
    } catch (error) {
      console.error('購入品取得エラー:', error)
    } finally {
      setIsLoadingPurchases(false)
    }
  }, [session?.id])

  // タスク取得（達成状況に関わらずすべて取得）
  const fetchTasks = useCallback(async () => {
    if (!session?.id) return

    setIsLoadingGeneralTasks(true)
    try {
      const {firstDayOfMonth, lastDayOfMonth} = Days.month.getMonthDatum(toUtc(new Date(year, month - 1, 1)))

      const result = await getTasks({
        where: {
          userId: session.id,
          dueDate: {gte: addDays(firstDayOfMonth, -1), lte: addDays(lastDayOfMonth, 1)},
        },
        filter: 'all',
        pageSize: 99999,
      })

      if (result.success && result.data) {
        setTasks(result.data)
      }
    } catch (error) {
      console.error('タスク取得エラー:', error)
    } finally {
      setIsLoadingGeneralTasks(false)
    }
  }, [session?.id, year, month])

  // 進行中の症状を取得
  const fetchActiveSymptoms = useCallback(async () => {
    if (!session?.id) return

    setIsLoadingSymptoms(true)
    try {
      const result = await getActiveSymptoms(session.id)
      if (result.success && result.data) {
        setActiveSymptoms(result.data)
      }
    } catch (error) {
      console.error('進行中症状取得エラー:', error)
    } finally {
      setIsLoadingSymptoms(false)
    }
  }, [session?.id])

  // 初期読み込み
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCalendarEvents(), fetchHospitalTasks(), fetchPurchases(), fetchTasks(), fetchActiveSymptoms()])
      setIsInitialLoad(false)
    }
    loadData()
  }, [fetchCalendarEvents, fetchHospitalTasks, fetchPurchases, fetchTasks, fetchActiveSymptoms])

  // 月変更時
  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear)
    setMonth(newMonth)
  }

  // 日付選択時（モーダルを開く）
  const handleDateSelect = (date: Date, dayData: DayData) => {
    setSelectedDate(date)
    setSelectedDayData(dayData)
    setIsModalOpen(true)
  }

  // モーダルを閉じる
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // データ更新時（モーダル内でのアクション後）
  const handleDataUpdated = async () => {
    await Promise.all([fetchHospitalTasks(), fetchPurchases(), fetchTasks()])
    // モーダルを閉じる（データが変更されたため）
    setIsModalOpen(false)
  }

  // 手動更新
  const handleRefresh = async () => {
    await Promise.all([fetchCalendarEvents(), fetchHospitalTasks(), fetchPurchases(), fetchTasks(), fetchActiveSymptoms()])
  }

  const isLoading = isLoadingCalendar || isLoadingTasks || isLoadingPurchases || isLoadingGeneralTasks || isLoadingSymptoms

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>ログインが必要です</p>
      </div>
    )
  }

  // 初期読み込み時のローディングUI
  if (isInitialLoad) {
    return (
      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <div className="px-4 py-2 bg-gray-200 rounded-md animate-pulse w-24 h-10"></div>
        </div>

        {/* 進行中症状のスケルトン */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 animate-pulse">
          <div className="h-5 bg-orange-200 rounded w-32 mb-3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-orange-200 rounded-full w-20"></div>
            <div className="h-8 bg-orange-200 rounded-full w-24"></div>
          </div>
        </div>

        {/* クイックリンクのスケルトン */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-3 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          ))}
        </div>

        {/* カレンダーのスケルトン */}
        <div className="bg-white rounded-lg shadow p-2 sm:p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium py-1 text-gray-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length: 42}).map((_, i) => (
              <div
                key={i}
                className="p-1 min-h-[80px] sm:min-h-[120px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-6 mx-auto mb-1"></div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ローディングメッセージ */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>データを読み込み中...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⟳</span>
              更新中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              更新
            </>
          )}
        </button>
      </div>

      {/* 進行中の症状セクション */}
      {activeSymptoms.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="font-bold text-orange-800">進行中の症状</h2>
              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{activeSymptoms.length}</span>
            </div>
            <Link
              href={HREF('/health/symptom', {}, query)}
              className="text-sm text-orange-600 hover:text-orange-800 hover:underline"
            >
              症状管理へ →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSymptoms.map(symptom => {
              const daysSinceStart = Math.floor(
                (new Date().getTime() - new Date(symptom.startDate).getTime()) / (1000 * 60 * 60 * 24)
              )
              return (
                <Link
                  key={symptom.id}
                  href={HREF('/health/medical-visit', {symptomId: symptom.id}, query)}
                  className="group flex items-center gap-2 px-3 py-2 bg-white border border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="font-medium text-gray-800 group-hover:text-orange-600">{symptom.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(new Date(symptom.startDate), 'MM/DD')}〜（{daysSinceStart}日目）
                    </div>
                  </div>
                  {(symptom._count?.MedicalVisitSymptom || 0) > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                      通院{symptom._count?.MedicalVisitSymptom}件
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* カレンダーエラー表示 */}
      {calendarError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          <span className="font-medium">⚠️ カレンダー連携:</span> {calendarError}
          <div className="text-xs mt-1">Google カレンダーの設定を確認してください。</div>
        </div>
      )}

      {/* カレンダー */}
      <div className="relative">
        {isLoadingCalendar && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-sm">カレンダーを読み込み中...</span>
            </div>
          </div>
        )}
        <MonthCalendar
          year={year}
          month={month}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          calendarEvents={calendarEvents}
          hospitalTasks={hospitalTasks}
          purchases={purchases}
          tasks={tasks}
        />
      </div>

      {/* 日付詳細モーダル */}
      {selectedDayData && (
        <DayDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedDate={selectedDate}
          dayData={selectedDayData}
          onDataUpdated={handleDataUpdated}
        />
      )}
    </div>
  )
}
