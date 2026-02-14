'use client'

import {useMemo} from 'react'
import useWindowSize from '@cm/hooks/useWindowSize'
import {CalendarEvent} from '../../(lib)/calendar-actions'
import {HospitalTaskWithRelations} from '../../(lib)/hospital-task-actions'
import {PurchaseWithRelations} from '../../(lib)/purchase-actions'
import {Task} from '../../(lib)/task-actions'

type DayData = {
  events: CalendarEvent[]
  hospitalEvents: CalendarEvent[]
  otherEvents: CalendarEvent[]
  hospitalTasks: HospitalTaskWithRelations[]
  purchases: PurchaseWithRelations[]
  tasks: Task[]
}

type Props = {
  year: number
  month: number
  selectedDate: Date
  onDateSelect: (date: Date, dayData: DayData) => void
  onMonthChange: (year: number, month: number) => void
  calendarEvents: CalendarEvent[]
  hospitalTasks: HospitalTaskWithRelations[]
  purchases: PurchaseWithRelations[]
  tasks: Task[]
}

export default function MonthCalendar({
  year,
  month,
  selectedDate,
  onDateSelect,
  onMonthChange,
  calendarEvents,
  hospitalTasks,
  purchases,
  tasks,
}: Props) {
  const {SP} = useWindowSize()

  // 日付のキーを生成
  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 月のカレンダーデータを生成（カレンダー形式用）
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: {date: Date; isCurrentMonth: boolean}[] = []

    // 前月の日付を追加
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, -i)
      days.push({date, isCurrentMonth: false})
    }

    // 当月の日付を追加
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({date: new Date(year, month - 1, i), isCurrentMonth: true})
    }

    // 次月の日付を追加（6週間分になるまで）
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({date: new Date(year, month, i), isCurrentMonth: false})
    }

    return days
  }, [year, month])

  // 月の日付リストを生成（モバイル用）
  const monthDays = useMemo(() => {
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const days: Date[] = []

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month - 1, i))
    }

    return days
  }, [year, month])

  // イベントの色を取得する関数
  const getEventColor = (event: CalendarEvent) => {
    // 病院関連は常に水色
    if (event.isHospitalRelated) {
      return {bg: 'bg-cyan-100', text: 'text-cyan-700'}
    }
    // アカウントに応じた色分け
    if (event.calendarId === 'sinsyaoku@gmail.com') {
      return {bg: 'bg-pink-100', text: 'text-pink-700'}
    } else if (event.calendarId === 'sinsyaoku0501@gmail.com') {
      return {bg: 'bg-orange-100', text: 'text-orange-700'}
    }
    // デフォルトは青色
    return {bg: 'bg-blue-100', text: 'text-blue-700'}
  }

  // 日付ごとのデータを取得
  const getDayData = (date: Date): DayData => {
    const dateKey = getDateKey(date)

    // カレンダーイベント（時系列でソート）
    const events = calendarEvents
      .filter(event => {
        const eventDateKey = getDateKey(new Date(event.start))
        return eventDateKey === dateKey
      })
      .sort((a, b) => {
        // 開始時刻でソート（時系列順）
        return new Date(a.start).getTime() - new Date(b.start).getTime()
      })

    const hospitalEvents = events.filter(e => e.isHospitalRelated)
    const otherEvents = events.filter(e => !e.isHospitalRelated)

    // 病院タスク（すべて表示）
    const hospitalTaskItems = hospitalTasks.filter(task => {
      if (!task.dueDate) return false
      const taskDateKey = getDateKey(new Date(task.dueDate))
      return taskDateKey === dateKey
    })

    // 購入品（すべて表示）
    const purchaseItems = purchases.filter(purchase => {
      if (!purchase.deadline) return false
      const purchaseDateKey = getDateKey(new Date(purchase.deadline))
      return purchaseDateKey === dateKey
    })

    // タスク（すべて表示）
    const taskItems = tasks.filter(task => {
      if (!task.dueDate) return false

      const taskDateKey = getDateKey(new Date(task.dueDate))
      if (task.title.includes('【定期掃除】深夜28日')) {
        console.log({taskDateKey, dateKey}) //logs
      }
      return taskDateKey === dateKey
    })

    // デバッグログ（今日の日付の場合のみ）
    const today = new Date()

    return {
      events,
      hospitalEvents,
      otherEvents,
      hospitalTasks: hospitalTaskItems,
      purchases: purchaseItems,
      tasks: taskItems,
    }
  }

  // 今日かどうか
  const isToday = (date: Date) => {
    const today = new Date()
    return getDateKey(date) === getDateKey(today)
  }

  // 選択された日かどうか
  const isSelected = (date: Date) => {
    return getDateKey(date) === getDateKey(selectedDate)
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12)
    } else {
      onMonthChange(year, month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1)
    } else {
      onMonthChange(year, month + 1)
    }
  }

  // 項目をレンダリングする共通関数
  const renderItem = (item: {type: 'event' | 'task' | 'hospitalTask' | 'purchase'; data: any}) => {
    if (item.type === 'event') {
      const event = item.data
      const colors = getEventColor(event)
      const timeStr = new Date(event.start).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return (
        <div
          key={`event-${event.id}`}
          className={`text-[10px] leading-tight px-1 py-0.5 ${colors.bg} ${colors.text} rounded truncate`}
          title={`${timeStr} ${event.summary}`}
        >
          {event.isHospitalRelated && '🏥 '}
          <span className="text-[9px] opacity-70">{timeStr}</span> {event.summary}
        </div>
      )
    } else if (item.type === 'task') {
      const task = item.data
      return (
        <div
          key={`task-${task.id}`}
          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
            task.completed ? 'bg-gray-100 text-gray-400 line-through' : 'bg-blue-100 text-blue-700'
          }`}
          title={task.title}
        >
          📋 {task.title}
        </div>
      )
    } else if (item.type === 'hospitalTask') {
      const task = item.data
      return (
        <div
          key={`hospital-${task.id}`}
          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
            task.completed ? 'bg-gray-100 text-gray-400 line-through' : 'bg-green-100 text-green-700'
          }`}
          title={task.content}
        >
          ✅ {task.content}
        </div>
      )
    } else if (item.type === 'purchase') {
      const purchase = item.data
      return (
        <div
          key={`purchase-${purchase.id}`}
          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
            purchase.receivedDate ? 'bg-gray-100 text-gray-400 line-through' : 'bg-purple-100 text-purple-700'
          }`}
          title={purchase.itemName}
        >
          🛒 {purchase.itemName}
        </div>
      )
    }
    return null
  }

  // 日付の全項目を取得してソート
  const getAllItemsForDate = (date: Date) => {
    const dayData = getDayData(date)
    const allItems: Array<{
      type: 'event' | 'task' | 'hospitalTask' | 'purchase'
      data: any
      sortTime: number
    }> = []

    dayData.events.forEach(event => {
      allItems.push({
        type: 'event',
        data: event,
        sortTime: new Date(event.start).getTime(),
      })
    })

    dayData.tasks.forEach(task => {
      allItems.push({
        type: 'task',
        data: task,
        sortTime: task.dueDate ? new Date(task.dueDate).getTime() : 0,
      })
    })

    dayData.hospitalTasks.forEach(task => {
      allItems.push({
        type: 'hospitalTask',
        data: task,
        sortTime: task.dueDate ? new Date(task.dueDate).getTime() : 0,
      })
    })

    dayData.purchases.forEach(purchase => {
      allItems.push({
        type: 'purchase',
        data: purchase,
        sortTime: purchase.deadline ? new Date(purchase.deadline).getTime() : 0,
      })
    })

    allItems.sort((a, b) => a.sortTime - b.sortTime)
    return allItems
  }

  return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-800">
          {year}年 {month}月
        </h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* モバイル: リスト形式 */}
      {SP && (
        <div className="space-y-3">
          {monthDays.map(date => {
            const dayData = getDayData(date)
            const allItems = getAllItemsForDate(date)
            const dayOfWeek = date.getDay()
            const weekDayStr = weekDays[dayOfWeek]

            return (
              <button
                key={getDateKey(date)}
                onClick={() => onDateSelect(date, dayData)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isToday(date) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                } ${isSelected(date) ? 'ring-2 ring-blue-500' : ''} hover:bg-gray-50`}
              >
                {/* 日付ヘッダー */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-base font-bold ${
                        dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-800'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    <span className="text-xs text-gray-500">({weekDayStr})</span>
                  </div>
                  {allItems.length > 0 && <span className="text-xs text-gray-400">{allItems.length}件</span>}
                </div>

                {/* 項目一覧 */}
                {allItems.length > 0 ? (
                  <div className="space-y-1">
                    {allItems.slice(0, 5).map(item => renderItem(item))}
                    {allItems.length > 5 && (
                      <div className="text-xs text-blue-600 font-medium pt-1">+{allItems.length - 5}件続く</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">予定なし</div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* デスクトップ: カレンダー形式 */}
      {!SP && (
        <>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1 ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダー日付 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({date, isCurrentMonth}, index) => {
              const dayData = getDayData(date)
              const dayOfWeek = date.getDay()
              const allItems = getAllItemsForDate(date)
              const displayItems = allItems.slice(0, 3)
              const remainingCount = allItems.length - displayItems.length
              const hasMore = remainingCount > 0

              return (
                <button
                  key={index}
                  onClick={() => onDateSelect(date, dayData)}
                  className={`
                    relative p-1 min-h-[80px] sm:min-h-[120px] max-h-[80px] sm:max-h-[120px] rounded-lg text-sm transition-colors border overflow-hidden flex flex-col
                    ${isCurrentMonth ? 'text-gray-800 border-gray-200' : 'text-gray-300 border-gray-100'}
                    ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''}
                    ${isSelected(date) ? 'ring-2 ring-blue-500' : ''}
                    ${dayOfWeek === 0 && isCurrentMonth ? 'bg-red-50/50' : ''}
                    ${dayOfWeek === 6 && isCurrentMonth ? 'bg-blue-50/50' : ''}
                    hover:bg-gray-50
                  `}
                >
                  {/* 日付 */}
                  <div
                    className={`text-center font-medium mb-1 flex-shrink-0 ${
                      dayOfWeek === 0 && isCurrentMonth
                        ? 'text-red-500'
                        : dayOfWeek === 6 && isCurrentMonth
                          ? 'text-blue-500'
                          : ''
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  {/* 予定・タスク一覧 */}
                  {allItems.length > 0 && isCurrentMonth && (
                    <div className="space-y-0.5 text-left flex-1 overflow-hidden flex flex-col">
                      <div className="flex-1 min-h-0">{displayItems.map(item => renderItem(item))}</div>
                      {hasMore && (
                        <div className="text-[9px] text-blue-600 font-medium px-1 py-0.5 mt-0.5 flex-shrink-0">
                          +{remainingCount}件続く
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-cyan-500 rounded-full" />
          病院予定
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-pink-500 rounded-full" />
          sinsyaoku@gmail.com
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-orange-500 rounded-full" />
          sinsyaoku0501@gmail.com
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          タスク
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          病院タスク
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-purple-500 rounded-full" />
          購入品
        </span>
      </div>
    </div>
  )
}

export type {DayData}
