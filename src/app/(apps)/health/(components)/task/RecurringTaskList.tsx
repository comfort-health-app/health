'use client'

import React, {useState, useEffect} from 'react'
import {getRecurringTasks, deleteRecurringTask} from '../../(lib)/task-actions'
import {RecurringPattern} from '@prisma/client'
import RecurringTaskModal from './RecurringTaskModal'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
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
  Task: Array<{id: number; completed: boolean}>
}

export default function RecurringTaskList() {
  const {session} = useGlobal()
  const [recurringTasks, setRecurringTasks] = useState<RecurringTaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<RecurringTaskData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadRecurringTasks = async () => {
    if (!session?.id) return

    setLoading(true)
    const result = await getRecurringTasks(session.id)
    if (result.success && result.data) {
      setRecurringTasks(result.data as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRecurringTasks()
  }, [session?.id])

  const handleEdit = (task: RecurringTaskData) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number, title: string) => {
    if (
      confirm(
        `定期タスク「${title}」を削除しますか？\n関連するすべてのタスク（完了済みも含む）が削除されます。この操作は取り消せません。`
      )
    ) {
      const result = await deleteRecurringTask(id)
      if (result.success) {
        await loadRecurringTasks()
      } else {
        alert(`削除に失敗しました: ${result.error}`)
      }
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingTask(null)
    loadRecurringTasks()
  }

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return '-'
    return formatDate(date, 'YYYY年M月D日') ?? '-'
  }

  const getPatternLabel = (pattern: RecurringPattern) => {
    const labels: Record<RecurringPattern, string> = {
      DAILY: '毎日',
      WEEKDAYS: '平日',
      WEEKENDS: '週末',
      WEEKLY: '毎週',
      BIWEEKLY: '隔週',
      MONTHLY: '毎月',
      CUSTOM: 'カスタム',
      QUARTERLY: '四半期',
      SEMIANNUAL: '半年ごと',
      YEARLY: '毎年',
    }
    // QUARTERLYとSEMIANNUALは非推奨（既存データの互換性のためラベルは残す）
    return labels[pattern] || pattern
  }

  if (loading) {
    return <div className="p-4">読み込み中...</div>
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">定期タスク一覧</h2>

      {recurringTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">定期タスクがありません</div>
      ) : (
        <div className="space-y-2">
          {recurringTasks.map(task => {
            const totalTasks = task.Task.length
            const completedTasks = task.Task.filter(t => t.completed).length

            return (
              <div key={task.id} className="p-3 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">{getPatternLabel(task.pattern)}</span>
                      <span>
                        期間: {formatDateDisplay(task.startDate)} 〜 {formatDateDisplay(task.endDate)}
                      </span>
                      <span>
                        進捗: {completedTasks}/{totalTasks}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(task)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(task.id, task.title)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 編集モーダル */}
      {isModalOpen && <RecurringTaskModal existingTask={editingTask || undefined} onClose={handleModalClose} />}
    </div>
  )
}
