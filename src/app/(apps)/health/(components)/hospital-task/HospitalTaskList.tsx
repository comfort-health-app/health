'use client'

import {useState, useEffect, useCallback, useMemo} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {Hospital} from '@prisma/client'
import {getHospitals} from '../../(lib)/hospital-actions'
import {
  getHospitalTasks,
  createHospitalTask,
  updateHospitalTask,
  deleteHospitalTask,
  HospitalTaskWithRelations,
  HospitalTaskFormData,
} from '../../(lib)/hospital-task-actions'
import HospitalTaskForm from './HospitalTaskForm'
import HospitalTaskCard from './HospitalTaskCard'

export default function HospitalTaskList() {
  const {session} = useGlobal()
  const [tasks, setTasks] = useState<HospitalTaskWithRelations[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<HospitalTaskWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchHospitals = useCallback(async () => {
    if (!session?.id) return

    const result = await getHospitals({userId: session.id, includeInactive: true})
    if (result.success && result.data) {
      setHospitals(result.data)
    }
  }, [session?.id])

  const fetchTasks = useCallback(async () => {
    if (!session?.id) return

    setIsLoading(true)
    try {
      const result = await getHospitalTasks({userId: session.id, includeCompleted: showCompleted})
      if (result.success && result.data) {
        setTasks(result.data)
      }
    } catch (error) {
      console.error('病院タスク取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.id, showCompleted])

  useEffect(() => {
    fetchHospitals()
  }, [fetchHospitals])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 病院ごとにグループ化
  const groupedTasks = useMemo(() => {
    const groups: {[hospitalId: number]: {hospital: Hospital; tasks: HospitalTaskWithRelations[]}} = {}

    tasks.forEach(task => {
      if (!groups[task.hospitalId]) {
        groups[task.hospitalId] = {
          hospital: task.Hospital,
          tasks: [],
        }
      }
      groups[task.hospitalId].tasks.push(task)
    })

    return Object.values(groups)
  }, [tasks])

  const handleSubmit = async (data: HospitalTaskFormData) => {
    if (!session?.id) return

    setIsSubmitting(true)
    try {
      if (editingTask) {
        const result = await updateHospitalTask(editingTask.id, data)
        if (result.success) {
          await fetchTasks()
          setEditingTask(null)
          setIsFormOpen(false)
        } else {
          alert(result.error)
        }
      } else {
        const result = await createHospitalTask({...data, userId: session.id})
        if (result.success) {
          await fetchTasks()
          setIsFormOpen(false)
        } else {
          alert(result.error)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (task: HospitalTaskWithRelations) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleDelete = async (task: HospitalTaskWithRelations) => {
    if (!confirm('このタスクを削除しますか？')) return

    const result = await deleteHospitalTask(task.id)
    if (result.success) {
      await fetchTasks()
    } else {
      alert(result.error)
    }
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingTask(null)
  }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">病院タスク</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={e => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            完了を含む
          </label>
          <button
            onClick={() => {
              setEditingTask(null)
              setIsFormOpen(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + 新規登録
          </button>
        </div>
      </div>

      {/* フォームモーダル */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingTask ? 'タスクを編集' : 'タスクを登録'}</h2>
            {hospitals.filter(h => h.active).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>先に病院を登録してください</p>
                <a href="/health/hospital" className="mt-4 inline-block text-blue-600 hover:underline">
                  病院マスタへ
                </a>
              </div>
            ) : (
              <HospitalTaskForm
                task={editingTask}
                hospitals={hospitals.filter(h => h.active)}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      )}

      {/* 一覧（病院ごとにグループ化） */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : groupedTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>タスクがありません</p>
          {hospitals.filter(h => h.active).length > 0 ? (
            <button onClick={() => setIsFormOpen(true)} className="mt-4 text-blue-600 hover:underline">
              最初のタスクを登録する
            </button>
          ) : (
            <a href="/health/hospital" className="mt-4 inline-block text-blue-600 hover:underline">
              先に病院を登録する
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTasks.map(group => (
            <div key={group.hospital.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-bold text-gray-800">
                  {group.hospital.name}
                  <span className="ml-2 text-sm font-normal text-gray-500">- {group.hospital.department}</span>
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {group.tasks.map(task => (
                  <HospitalTaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUpdated={fetchTasks}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

