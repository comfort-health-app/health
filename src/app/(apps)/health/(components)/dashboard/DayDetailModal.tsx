'use client'

import {useState} from 'react'
import {CalendarEvent} from '../../(lib)/calendar-actions'
import {
  HospitalTaskWithRelations,
  toggleHospitalTaskComplete,
  updateHospitalTask,
  HospitalTaskFormData,
} from '../../(lib)/hospital-task-actions'
import {PurchaseWithRelations, updatePurchasePhase2, PurchasePhase2Data} from '../../(lib)/purchase-actions'
import {Task, toggleTaskComplete} from '../../(lib)/task-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import {DayData} from './MonthCalendar'
import Link from 'next/link'

type Props = {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  dayData: DayData
  onDataUpdated: () => void
}

export default function DayDetailModal({isOpen, onClose, selectedDate, dayData, onDataUpdated}: Props) {
  const [editingHospitalTaskId, setEditingHospitalTaskId] = useState<number | null>(null)
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isOpen) return null

  const hasAny =
    dayData.events.length > 0 || dayData.hospitalTasks.length > 0 || dayData.purchases.length > 0 || dayData.tasks.length > 0

  // タスク完了切り替え（一般タスク）
  const handleToggleGeneralTask = async (taskId: number) => {
    setIsUpdating(true)
    try {
      const result = await toggleTaskComplete(taskId)
      if (result.success) {
        onDataUpdated()
      } else {
        alert(result.error)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // 病院タスク完了切り替え
  const handleToggleHospitalTask = async (taskId: number) => {
    setIsUpdating(true)
    try {
      const result = await toggleHospitalTaskComplete(taskId)
      if (result.success) {
        onDataUpdated()
      } else {
        alert(result.error)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // タスク更新
  const handleUpdateTask = async (taskId: number, data: Partial<HospitalTaskFormData>) => {
    setIsUpdating(true)
    try {
      const result = await updateHospitalTask(taskId, data)
      if (result.success) {
        onDataUpdated()
        setEditingHospitalTaskId(null)
      } else {
        alert(result.error)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // 購入記録
  const handlePurchase = async (purchaseId: number, data: PurchasePhase2Data) => {
    setIsUpdating(true)
    try {
      const result = await updatePurchasePhase2(purchaseId, data)
      if (result.success) {
        onDataUpdated()
        setEditingPurchaseId(null)
      } else {
        alert(result.error)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{formatDate(selectedDate, 'YYYY年MM月DD日')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hasAny ? (
            <div className="text-center py-8 text-gray-500">この日の予定はありません</div>
          ) : (
            <div className="space-y-6">
              {/* カレンダーイベント（時系列順に混合表示） */}
              {dayData.events.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">📅 予定</h3>
                  <div className="space-y-2">
                    {dayData.events.map(event => (
                      <EventCard key={event.id} event={event} isHospital={event.isHospitalRelated} />
                    ))}
                  </div>
                </div>
              )}

              {/* タスク */}
              {dayData.tasks.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2">📋 タスク</h3>
                    <Link href="/health/task" className="text-xs text-blue-600 hover:underline">
                      一覧へ
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {dayData.tasks.map(task => (
                      <GeneralTaskCard
                        key={task.id}
                        task={task}
                        isUpdating={isUpdating}
                        onToggle={() => handleToggleGeneralTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 病院タスク */}
              {dayData.hospitalTasks.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-green-600 flex items-center gap-2">✅ 病院タスク</h3>
                    <Link href="/health/hospital-task" className="text-xs text-blue-600 hover:underline">
                      一覧へ
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {dayData.hospitalTasks.map(task => (
                      <HospitalTaskCard
                        key={task.id}
                        task={task}
                        isEditing={editingHospitalTaskId === task.id}
                        isUpdating={isUpdating}
                        onToggle={() => handleToggleHospitalTask(task.id)}
                        onEdit={() => setEditingHospitalTaskId(task.id)}
                        onCancelEdit={() => setEditingHospitalTaskId(null)}
                        onSave={data => handleUpdateTask(task.id, data)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 購入品 */}
              {dayData.purchases.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-purple-600 flex items-center gap-2">🛒 購入品</h3>
                    <Link href="/health/purchase" className="text-xs text-blue-600 hover:underline">
                      一覧へ
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {dayData.purchases.map(purchase => (
                      <PurchaseCard
                        key={purchase.id}
                        purchase={purchase}
                        isEditing={editingPurchaseId === purchase.id}
                        isUpdating={isUpdating}
                        onPurchase={() => setEditingPurchaseId(purchase.id)}
                        onCancelEdit={() => setEditingPurchaseId(null)}
                        onSave={data => handlePurchase(purchase.id, data)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

// イベントカード
function EventCard({event, isHospital = false}: {event: CalendarEvent; isHospital?: boolean}) {
  // イベントの色を取得する関数
  const getEventColor = () => {
    // 病院関連は常に水色
    if (event.isHospitalRelated || isHospital) {
      return {bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700'}
    }
    // アカウントに応じた色分け
    if (event.calendarId === 'sinsyaoku@gmail.com') {
      return {bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700'}
    } else if (event.calendarId === 'sinsyaoku0501@gmail.com') {
      return {bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700'}
    }
    // デフォルトは青色
    return {bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700'}
  }

  const colors = getEventColor()

  return (
    <div className={`p-3 rounded-lg border-l-4 ${colors.bg} ${colors.border}`}>
      <div className={`font-medium ${colors.text}`}>{event.summary}</div>
      {event.description && <div className="text-sm text-gray-600 mt-1">{event.description}</div>}
      <div className="text-xs text-gray-500 mt-1">
        {formatDate(new Date(event.start), 'HH:mm')} - {formatDate(new Date(event.end), 'HH:mm')}
      </div>
      {/* {event.htmlLink && (
        <a
          href={event.htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
        >
          Googleカレンダーで開く →
        </a>
      )} */}
    </div>
  )
}

// 一般タスクカード
function GeneralTaskCard({task, isUpdating, onToggle}: {task: Task; isUpdating: boolean; onToggle: () => void}) {
  return (
    <div className={`p-3 rounded-lg border-l-4 ${task.completed ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-500'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          disabled={isUpdating}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center disabled:opacity-50 ${
            task.completed ? 'border-gray-400 bg-gray-400 text-white' : 'border-blue-500 hover:bg-blue-100'
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-blue-700'}`}>{task.title}</div>
          {task.description && (
            <div className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>{task.description}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// 病院タスクカード
function HospitalTaskCard({
  task,
  isEditing,
  isUpdating,
  onToggle,
  onEdit,
  onCancelEdit,
  onSave,
}: {
  task: HospitalTaskWithRelations
  isEditing: boolean
  isUpdating: boolean
  onToggle: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (data: Partial<HospitalTaskFormData>) => void
}) {
  const [editContent, setEditContent] = useState(task.content)
  const [editMemo, setEditMemo] = useState(task.memo || '')

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">内容</label>
            <input
              type="text"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">備考</label>
            <textarea
              value={editMemo}
              onChange={e => setEditMemo(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSave({content: editContent, memo: editMemo})}
              disabled={isUpdating}
              className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              保存
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isUpdating}
              className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`p-3 rounded-lg border-l-4 ${task.completed ? 'bg-gray-50 border-gray-300' : 'bg-green-50 border-green-500'}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          disabled={isUpdating}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center disabled:opacity-50 ${
            task.completed ? 'border-gray-400 bg-gray-400 text-white' : 'border-green-500 hover:bg-green-100'
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-green-700'}`}>{task.content}</div>
          <div className={`text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.Hospital.name} - {task.Hospital.department}
          </div>
          {task.memo && <div className={`text-xs mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>{task.memo}</div>}
        </div>
        {!task.completed && (
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-green-600" title="編集">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// 購入品カード
function PurchaseCard({
  purchase,
  isEditing,
  isUpdating,
  onPurchase,
  onCancelEdit,
  onSave,
}: {
  purchase: PurchaseWithRelations
  isEditing: boolean
  isUpdating: boolean
  onPurchase: () => void
  onCancelEdit: () => void
  onSave: (data: PurchasePhase2Data) => void
}) {
  const [orderer, setOrderer] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(purchase.category === 'DIRECT' ? '現金' : '')

  const isDirect = purchase.category === 'DIRECT'
  const isCompleted = !!purchase.receivedDate

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
        <div className="text-sm font-medium text-purple-700 mb-2">{purchase.itemName}を購入記録</div>
        {isDirect && (
          <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded mb-2">
            直接購入のため、決済日・到着予定日・領収書出力日は自動設定されます
          </div>
        )}
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">注文者 *</label>
            <input
              type="text"
              value={orderer}
              onChange={e => setOrderer(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="例：田中"
            />
          </div>
          {!isDirect && (
            <div>
              <label className="text-xs text-gray-500">支払方法</label>
              <input
                type="text"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="例：クレジットカード"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onSave({orderer, paymentMethod})}
              disabled={isUpdating || !orderer}
              className="flex-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              購入記録
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isUpdating}
              className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-3 rounded-lg border-l-4 ${isCompleted ? 'bg-gray-50 border-gray-300' : 'bg-purple-50 border-purple-500'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
              isCompleted ? 'border-gray-400 bg-gray-400 text-white' : 'border-purple-500'
            }`}
          >
            {isCompleted && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div>
            <div className={`font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-purple-700'}`}>
              {purchase.itemName}
            </div>
            <div className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
              依頼者: {purchase.requester}
              <span
                className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                  isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-purple-200 text-purple-700'
                }`}
              >
                {isDirect ? '直接' : 'ネット'}
              </span>
            </div>
            {purchase.memo && (
              <div className={`text-xs mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>{purchase.memo}</div>
            )}
          </div>
        </div>
        {!isCompleted && !purchase.paymentDate && (
          <button onClick={onPurchase} className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700">
            購入記録
          </button>
        )}
        {purchase.paymentDate && !isCompleted && (
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">購入済み（到着待ち）</span>
        )}
      </div>
    </div>
  )
}
