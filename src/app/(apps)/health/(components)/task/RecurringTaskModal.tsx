'use client'

import React, {useState, useEffect, useRef} from 'react'
import {createRecurringTask, getRecurringTasks, getTasks, updateRecurringTask} from '../../(lib)/task-actions'
import {RecurringPattern} from '@prisma/client'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {useRouter} from 'next/navigation'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type RecurringTaskData = {
  id: number
  title: string
  description?: string | null
  pattern: RecurringPattern
  startDate: Date
  endDate: Date | null
  weekdays: number[]
  dayOfMonth?: number | null
  months: number[]
  interval: number
}

type Props = {
  existingTask?: RecurringTaskData
  onClose: () => void
}

export default function RecurringTaskModal({existingTask, onClose}: Props) {
  const {session} = useGlobal()
  const isEdit = !!existingTask
  const router = useRouter()
  // 既存タスクがある場合はその値で初期化
  const [title, setTitle] = useState(existingTask?.title || '')
  const [description, setDescription] = useState(existingTask?.description || '')
  const [pattern, setPattern] = useState<RecurringPattern>(existingTask?.pattern || 'WEEKLY')
  const [interval, setInterval] = useState(existingTask?.interval || 1)
  const [dayOfWeek, setDayOfWeek] = useState(existingTask?.weekdays?.[0] ?? 1) // 月曜日
  const [dayOfMonth, setDayOfMonth] = useState(existingTask?.dayOfMonth || 1)
  const [month, setMonth] = useState(existingTask?.months?.[0] ?? 1)
  const [startDate, setStartDate] = useState(
    existingTask?.startDate
      ? formatDate(existingTask.startDate, 'YYYY-MM-DD') ?? ''
      : formatDate(new Date(), 'YYYY-MM-DD') ?? ''
  )
  const [endDate, setEndDate] = useState(existingTask?.endDate ? formatDate(existingTask.endDate, 'YYYY-MM-DD') ?? '' : '')
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // モーダル外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!session?.id && !isEdit) {
        alert('ログインが必要です')
        return
      }

      const recurringData = {
        title,
        description: description || undefined,
        pattern,
        startDate: startDate, // 日付文字列として渡す
        endDate: endDate, // 日付文字列として渡す

        weekdays: pattern === 'WEEKLY' ? [dayOfWeek] : [],
        dayOfMonth: pattern === 'MONTHLY' || pattern === 'YEARLY' ? dayOfMonth : undefined,
        months: pattern === 'YEARLY' ? [month] : [],
        interval,
      }

      let result
      if (isEdit && existingTask) {
        // 更新
        result = await updateRecurringTask(existingTask.id, recurringData)
      } else {
        // 新規作成
        result = await createRecurringTask({
          ...recurringData,
          userId: session!.id,
        })
      }

      if (result.success) {
        router.refresh()
        onClose()
      } else {
        alert(`定期タスクの${isEdit ? '更新' : '作成'}に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} recurring task:`, error)
      alert(`定期タスクの${isEdit ? '更新' : '作成'}に失敗しました`)
    } finally {
      setLoading(false)
    }
  }

  const weekdays = [
    {value: 0, label: '日曜日'},
    {value: 1, label: '月曜日'},
    {value: 2, label: '火曜日'},
    {value: 3, label: '水曜日'},
    {value: 4, label: '木曜日'},
    {value: 5, label: '金曜日'},
    {value: 6, label: '土曜日'},
  ]

  const months = [
    {value: 1, label: '1月'},
    {value: 2, label: '2月'},
    {value: 3, label: '3月'},
    {value: 4, label: '4月'},
    {value: 5, label: '5月'},
    {value: 6, label: '6月'},
    {value: 7, label: '7月'},
    {value: 8, label: '8月'},
    {value: 9, label: '9月'},
    {value: 10, label: '10月'},
    {value: 11, label: '11月'},
    {value: 12, label: '12月'},
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg sm:text-xl font-bold mb-4">{isEdit ? '定期タスク編集' : '定期タスク作成'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              タスク名 *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="pattern" className="block text-sm font-medium text-gray-700">
              繰り返しパターン
            </label>
            <select
              id="pattern"
              value={pattern}
              onChange={e => setPattern(e.target.value as RecurringPattern)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DAILY">毎日</option>
              <option value="WEEKDAYS">平日</option>
              <option value="WEEKENDS">週末</option>
              <option value="WEEKLY">毎週</option>
              <option value="MONTHLY">毎月</option>
              <option value="YEARLY">毎年</option>
              <option value="CUSTOM">カスタム</option>
            </select>
          </div>

          {(pattern === 'DAILY' || pattern === 'CUSTOM') && (
            <div>
              <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                間隔（日）
              </label>
              <input
                type="number"
                id="interval"
                value={interval ?? ''}
                onChange={e => setInterval(parseInt(e.target.value))}
                min="1"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {pattern === 'WEEKLY' && (
            <>
              <div>
                <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                  曜日
                </label>
                <select
                  id="dayOfWeek"
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(parseInt(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {weekdays.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                  間隔（週）
                </label>
                <input
                  type="number"
                  id="interval"
                  value={interval ?? ''}
                  onChange={e => setInterval(parseInt(e.target.value))}
                  min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {(pattern === 'MONTHLY' || pattern === 'YEARLY') && (
            <div>
              <label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-700">
                日
              </label>
              <input
                type="number"
                id="dayOfMonth"
                value={dayOfMonth}
                onChange={e => setDayOfMonth(parseInt(e.target.value))}
                min="1"
                max="31"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {pattern === 'MONTHLY' && (
            <div>
              <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                間隔（月）
              </label>
              <input
                type="number"
                id="interval"
                value={interval ?? ''}
                onChange={e => setInterval(parseInt(e.target.value))}
                min="1"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {pattern === 'YEARLY' && (
            <>
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                  月
                </label>
                <select
                  id="month"
                  value={month}
                  onChange={e => setMonth(parseInt(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                  間隔（年）
                </label>
                <input
                  type="number"
                  id="interval"
                  value={interval ?? ''}
                  onChange={e => setInterval(parseInt(e.target.value))}
                  min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}


          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              開始日 *
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              終了日 *
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm sm:text-base"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? (isEdit ? '更新中...' : '作成中...') : isEdit ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
