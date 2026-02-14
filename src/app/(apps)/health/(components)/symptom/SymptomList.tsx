'use client'

import {useState, useEffect, useCallback} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {
  getSymptoms,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  endSymptom,
  reopenSymptom,
  SymptomWithRelations,
  SymptomFormData,
} from '../../(lib)/symptom-actions'
import SymptomForm from './SymptomForm'
import SymptomCard from './SymptomCard'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

export default function SymptomList() {
  const {session} = useGlobal()
  const [symptoms, setSymptoms] = useState<SymptomWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSymptom, setEditingSymptom] = useState<SymptomWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [endingSymptom, setEndingSymptom] = useState<SymptomWithRelations | null>(null)

  const fetchSymptoms = useCallback(async () => {
    if (!session?.id) return

    setIsLoading(true)
    try {
      const result = await getSymptoms({
        userId: session.id,
        includeEnded: true,
      })
      if (result.success && result.data) {
        setSymptoms(result.data)
      }
    } catch (error) {
      console.error('症状取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    fetchSymptoms()
  }, [fetchSymptoms])

  const handleSubmit = async (data: SymptomFormData) => {
    if (!session?.id) return

    setIsSubmitting(true)
    try {
      if (editingSymptom) {
        const result = await updateSymptom(editingSymptom.id, data)
        if (result.success) {
          await fetchSymptoms()
          setEditingSymptom(null)
          setIsFormOpen(false)
        } else {
          alert(result.error)
        }
      } else {
        const result = await createSymptom({...data, userId: session.id})
        if (result.success) {
          await fetchSymptoms()
          setIsFormOpen(false)
        } else {
          alert(result.error)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (symptom: SymptomWithRelations) => {
    setEditingSymptom(symptom)
    setIsFormOpen(true)
  }

  const handleDelete = async (symptom: SymptomWithRelations) => {
    const visitCount = symptom._count?.MedicalVisitSymptom || 0
    const message =
      visitCount > 0
        ? `この症状を削除しますか？\n${visitCount}件の通院履歴との紐付けも解除されます。`
        : 'この症状を削除しますか？'

    if (!confirm(message)) return

    const result = await deleteSymptom(symptom.id)
    if (result.success) {
      await fetchSymptoms()
    } else {
      alert(result.error)
    }
  }

  const handleEnd = (symptom: SymptomWithRelations) => {
    setEndingSymptom(symptom)
  }

  const handleEndConfirm = async (endDate: string) => {
    if (!endingSymptom) return

    const result = await endSymptom(endingSymptom.id, endDate)
    if (result.success) {
      await fetchSymptoms()
      setEndingSymptom(null)
    } else {
      alert(result.error)
    }
  }

  const handleReopen = async (symptom: SymptomWithRelations) => {
    if (!confirm('この症状を再開しますか？終了日がクリアされます。')) return

    const result = await reopenSymptom(symptom.id)
    if (result.success) {
      await fetchSymptoms()
    } else {
      alert(result.error)
    }
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingSymptom(null)
  }

  // フィルタリング
  const filteredSymptoms = symptoms.filter(symptom => {
    const isActive = !symptom.endDate || new Date(symptom.endDate) > new Date()
    if (filter === 'active') return isActive
    if (filter === 'ended') return !isActive
    return true
  })

  // 統計
  const activeCount = symptoms.filter(s => !s.endDate || new Date(s.endDate) > new Date()).length
  const endedCount = symptoms.length - activeCount

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>ログインが必要です</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-800">症状管理</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              すべて ({symptoms.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filter === 'active' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              進行中 ({activeCount})
            </button>
            <button
              onClick={() => setFilter('ended')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filter === 'ended' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              終了 ({endedCount})
            </button>
          </div>
          <button
            onClick={() => {
              setEditingSymptom(null)
              setIsFormOpen(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
          >
            + 新規登録
          </button>
        </div>
      </div>

      {/* フォームモーダル */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingSymptom ? '症状を編集' : '症状を登録'}</h2>
            <SymptomForm
              symptom={editingSymptom}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* 終了日設定モーダル */}
      {endingSymptom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">症状を終了</h2>
            <p className="text-gray-600 mb-4">
              「{endingSymptom.name}」の終了日を入力してください。
            </p>
            <form
              onSubmit={e => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const endDate = formData.get('endDate') as string
                handleEndConfirm(endDate)
              }}
            >
              <input
                type="date"
                name="endDate"
                defaultValue={formatDate(new Date(), 'YYYY-MM-DD')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  終了する
                </button>
                <button
                  type="button"
                  onClick={() => setEndingSymptom(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 一覧 */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : filteredSymptoms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filter === 'all' ? (
            <>
              <p>症状が登録されていません</p>
              <button onClick={() => setIsFormOpen(true)} className="mt-4 text-blue-600 hover:underline">
                最初の症状を登録する
              </button>
            </>
          ) : filter === 'active' ? (
            <p>進行中の症状はありません</p>
          ) : (
            <p>終了した症状はありません</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSymptoms.map(symptom => (
            <SymptomCard
              key={symptom.id}
              symptom={symptom}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onEnd={handleEnd}
              onReopen={handleReopen}
              onUpdated={fetchSymptoms}
            />
          ))}
        </div>
      )}
    </div>
  )
}

