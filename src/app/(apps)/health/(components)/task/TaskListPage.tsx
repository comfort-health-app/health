'use client'

import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react'
import {getTasks, getTaskCounts, toggleTaskComplete, deleteTask, deleteTaskAttachment} from '../../(lib)/task-actions'
import {Task} from '../../(lib)/task-actions'
import TaskModal from './TaskModal'
import RecurringTaskModal from './RecurringTaskModal'
import RecurringTaskList from './RecurringTaskList'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import {getMidnight} from '@cm/class/Days/date-utils/calculations'

// デバウンス用カスタムフック
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function TaskListPage() {
  const {session} = useGlobal()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [taskType, setTaskType] = useState<'all' | 'individual' | 'recurring'>('all')
  const [completionStatus, setCompletionStatus] = useState<'all' | 'completed' | 'pending'>('pending')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [isRecurringListOpen, setIsRecurringListOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null)

  // ページネーション状態
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 50

  // タスクタイプ別件数
  const [taskCounts, setTaskCounts] = useState({
    individualCount: 0,
    recurringCount: 0,
    totalCount: 0,
  })

  // 操作中フラグ（部分更新用）
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<number>>(new Set())

  // 検索デバウンス（300ms）
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // 件数を取得
  const loadTaskCounts = async () => {
    if (!session?.id) return

    const result = await getTaskCounts({
      userId: session.id,
      completionStatus,
    })

    if (result.success && result.data) {
      setTaskCounts(result.data)
    }
  }

  // タスク一覧を取得
  const loadTasks = useCallback(
    async (page = 1) => {
      if (!session?.id) return

      setLoading(true)
      // フィルターによってソート順を変更
      // 完了タスク：完了日の降順（新しい順）
      // すべて・未完了：期限日の昇順（古い順）
      const sortBy = completionStatus === 'completed' ? 'completedAt' : 'dueDate'
      const sortOrder = completionStatus === 'completed' ? 'desc' : 'asc'

      const result = await getTasks({
        where: {
          userId: session.id,
        },
        taskType,
        completionStatus,
        sortBy,
        sortOrder,
        page,
        pageSize,
        includeAttachments: true,
        includeRecurringTask: true,
      })

      if (result.success && result.data) {
        setTasks(result.data)
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalCount(result.pagination.totalCount)
          setCurrentPage(result.pagination.page)
        }
      }
      setLoading(false)
    },
    [session?.id, taskType, completionStatus]
  )

  // フィルタ変更時にタスクと件数を再読み込み
  useEffect(() => {
    setCurrentPage(1)
    loadTasks(1)
    loadTaskCounts()
  }, [taskType, completionStatus, session?.id])

  // 検索フィルタリング（デバウンス適用済み）
  const filteredTasks = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return tasks

    const query = debouncedSearchQuery.toLowerCase()
    return tasks.filter(
      task => task.title.toLowerCase().includes(query) || (task.description && task.description.toLowerCase().includes(query))
    )
  }, [tasks, debouncedSearchQuery])

  // 完了切替（部分更新）
  const handleToggleComplete = async (taskId: number) => {
    // 操作中フラグを設定
    setUpdatingTaskIds(prev => new Set(prev).add(taskId))

    const result = await toggleTaskComplete(taskId)
    if (result.success && result.data) {
      // 部分更新：該当タスクのみ更新
      setTasks(prevTasks => prevTasks.map(task => (task.id === taskId ? result.data : task)))

      // 件数を更新（非同期で実行）
      loadTaskCounts()

      // 完了状態が変わった場合、フィルタに合わなくなる可能性があるのでリストから除外
      if (completionStatus === 'pending' && result.data.completed) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
        setTotalCount(prev => prev - 1)
      } else if (completionStatus === 'completed' && !result.data.completed) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
        setTotalCount(prev => prev - 1)
      }
    }

    // 操作中フラグを解除
    setUpdatingTaskIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  // タスク削除（部分更新）
  const handleDeleteTask = async (taskId: number) => {
    if (confirm('このタスクを削除しますか？')) {
      setUpdatingTaskIds(prev => new Set(prev).add(taskId))

      const result = await deleteTask(taskId)
      if (result.success) {
        // 部分更新：該当タスクをリストから除外
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
        setTotalCount(prev => prev - 1)

        // 件数を更新
        loadTaskCounts()
      }

      setUpdatingTaskIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  // 添付ファイル削除
  const handleDeleteAttachment = async (attachmentId: number) => {
    if (confirm('この画像を削除しますか？\n削除した画像は復元できません。')) {
      setDeletingAttachmentId(attachmentId)
      try {
        const result = await deleteTaskAttachment(attachmentId)
        if (result.success) {
          // 部分更新：該当タスクの添付ファイルのみ更新
          setTasks(prevTasks =>
            prevTasks.map(task => ({
              ...task,
              TaskAttachment: task.TaskAttachment?.filter(att => att.id !== attachmentId),
            }))
          )
        } else {
          alert(`画像の削除に失敗しました: ${result.error}`)
        }
      } catch (error) {
        console.error('画像削除エラー:', error)
        alert('画像の削除に失敗しました')
      } finally {
        setDeletingAttachmentId(null)
      }
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const handleTaskModalClose = (needsRefresh = true) => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
    // 変更があった場合のみ再読み込み
    if (needsRefresh) {
      loadTasks(currentPage)
      loadTaskCounts()
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      loadTasks(newPage)
      // ページトップにスクロール
      window.scrollTo({top: 0, behavior: 'smooth'})
    }
  }

  const isOverdue = (dueDate: Date | null, completed: boolean) => {
    if (!dueDate || completed) return false
    return getMidnight(new Date(dueDate)) < getMidnight(new Date())
  }

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return '期限なし'
    return formatDate(date, 'YYYY年M月D日') ?? '期限なし'
  }

  // 定期タスクのパターン名を取得
  const getRecurringPatternLabel = (task: Task) => {
    if (!task.RecurringTask) return null
    const pattern = task.RecurringTask.pattern
    const patternLabels: Record<string, string> = {
      DAILY: '毎日',
      WEEKDAYS: '平日',
      WEEKENDS: '週末',
      WEEKLY: '毎週',
      MONTHLY: '毎月',
      YEARLY: '毎年',
      CUSTOM: 'カスタム',
    }
    return patternLabels[pattern] || pattern
  }

  if (loading && tasks.length === 0) {
    return <div className="p-4">読み込み中...</div>
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">タスク管理</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base"
          >
            新しいタスク
          </button>
          <button
            onClick={() => setIsRecurringModalOpen(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm sm:text-base"
          >
            定期タスク作成
          </button>
          <button
            onClick={() => setIsRecurringListOpen(!isRecurringListOpen)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm sm:text-base"
          >
            {isRecurringListOpen ? '定期タスクを非表示' : '定期タスク一覧'}
          </button>
        </div>
      </div>

      {/* 定期タスク一覧 */}
      {isRecurringListOpen && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <RecurringTaskList />
        </div>
      )}

      {/* タスクタイプタブ（件数バッジ付き） */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex -mb-px space-x-4 sm:space-x-8">
          <button
            onClick={() => setTaskType('all')}
            className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              taskType === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            すべて
            <span
              className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
                taskType === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {taskCounts.totalCount}
            </span>
          </button>
          <button
            onClick={() => setTaskType('individual')}
            className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              taskType === 'individual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="inline-flex items-center gap-1">📝 通常タスク</span>
            <span
              className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
                taskType === 'individual' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {taskCounts.individualCount}
            </span>
          </button>
          <button
            onClick={() => setTaskType('recurring')}
            className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              taskType === 'recurring'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="inline-flex items-center gap-1">🔄 定期タスク</span>
            <span
              className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
                taskType === 'recurring' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {taskCounts.recurringCount}
            </span>
          </button>
        </nav>
      </div>

      {/* 検索・フィルタ */}
      <div className="flex flex-col gap-4 mb-6">
        {/* 検索バー */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="タスクを検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && searchQuery !== debouncedSearchQuery && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">検索中...</span>
            )}
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
              クリア
            </button>
          )}
        </div>

        {/* 完了状態フィルタ */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs sm:text-sm text-gray-600 font-medium self-center">完了状態:</span>
          <button
            onClick={() => setCompletionStatus('all')}
            className={`px-3 py-1 rounded text-sm ${completionStatus === 'all' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            すべて
          </button>
          <button
            onClick={() => setCompletionStatus('pending')}
            className={`px-3 py-1 rounded text-sm ${completionStatus === 'pending' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            未完了
          </button>
          <button
            onClick={() => setCompletionStatus('completed')}
            className={`px-3 py-1 rounded text-sm ${completionStatus === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            完了
          </button>
        </div>
      </div>

      {/* 検索結果と件数表示 */}
      <div className="mb-4 flex flex-wrap gap-2 items-center text-sm text-gray-600">
        {debouncedSearchQuery ? (
          <span>
            検索結果: {filteredTasks.length}件 / 全{totalCount}件
          </span>
        ) : (
          <span>
            {totalCount}件のタスク（{currentPage}/{totalPages}ページ）
          </span>
        )}
        {loading && <span className="text-blue-500">更新中...</span>}
      </div>

      {/* タスク一覧 */}
      <div className="space-y-2">
        {filteredTasks.map(task => {
          const isUpdating = updatingTaskIds.has(task.id)
          const patternLabel = getRecurringPatternLabel(task)

          return (
            <div
              key={task.id}
              className={`p-3 sm:p-4 border rounded-lg transition-opacity ${isUpdating ? 'opacity-50' : ''} ${
                task.completed
                  ? 'bg-green-50 border-green-200'
                  : isOverdue(task.dueDate || null, task.completed)
                    ? 'bg-red-50 border-red-200'
                    : task.recurringTaskId
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task.id)}
                    disabled={isUpdating}
                    className="w-4 h-4 mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`font-medium text-sm sm:text-base ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                      >
                        {task.title}
                      </h3>
                      {/* 定期タスクインジケーター */}
                      {task.recurringTaskId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          定期
                        </span>
                      )}
                    </div>
                    {task.description && <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{task.description}</p>}
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      <div>期限: {formatDateDisplay(task.dueDate || null)}</div>
                      {task.completed && task.completedAt && (
                        <div className="text-green-600">完了日: {formatDateDisplay(task.completedAt)}</div>
                      )}
                    </div>
                    {/* 添付画像の表示 */}
                    {task.TaskAttachment && task.TaskAttachment.length > 0 && (
                      <div className="mt-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {task.TaskAttachment.map(attachment => (
                            <div key={attachment.id} className="relative group">
                              <img
                                src={attachment.url}
                                alt={attachment.originalName}
                                className="w-full h-16 sm:h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(attachment.url, '_blank')}
                              />
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                📎
                              </div>
                              {/* 削除ボタン */}
                              <button
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                disabled={deletingAttachmentId === attachment.id}
                                className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                {deletingAttachmentId === attachment.id ? '...' : '×'}
                              </button>
                              {/* ファイル名のツールチップ */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                {attachment.originalName}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditTask(task)}
                    disabled={isUpdating}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={isUpdating}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
            {debouncedSearchQuery ? '検索条件に一致するタスクがありません' : 'タスクがありません'}
          </div>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && !debouncedSearchQuery && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            最初
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            前へ
          </button>

          {/* ページ番号ボタン */}
          <div className="flex gap-1">
            {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === pageNum ? 'bg-blue-500 text-white' : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            次へ
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            最後
          </button>
        </div>
      )}

      {/* モーダル */}
      {isTaskModalOpen && <TaskModal task={editingTask} onClose={handleTaskModalClose} />}
      {isRecurringModalOpen && (
        <RecurringTaskModal
          onClose={() => {
            setIsRecurringModalOpen(false)
            loadTasks(currentPage)
            loadTaskCounts()
          }}
        />
      )}
    </div>
  )
}
