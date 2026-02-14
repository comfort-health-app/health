'use client'

import {useState, useEffect, useCallback} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {
  getHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  deactivateHospital,
  HospitalWithRelations,
  HospitalFormData,
} from '../../(lib)/hospital-actions'
import HospitalForm from './HospitalForm'
import HospitalCard from './HospitalCard'

export default function HospitalList() {
  const {session} = useGlobal()
  const [hospitals, setHospitals] = useState<HospitalWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingHospital, setEditingHospital] = useState<HospitalWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchHospitals = useCallback(async () => {
    if (!session?.id) return

    setIsLoading(true)
    try {
      const result = await getHospitals({userId: session.id, includeInactive: showInactive})
      if (result.success && result.data) {
        setHospitals(result.data)
      }
    } catch (error) {
      console.error('病院一覧取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.id, showInactive])

  useEffect(() => {
    fetchHospitals()
  }, [fetchHospitals])

  const handleSubmit = async (data: HospitalFormData) => {
    if (!session?.id) return

    setIsSubmitting(true)
    try {
      if (editingHospital) {
        const result = await updateHospital(editingHospital.id, data)
        if (result.success) {
          await fetchHospitals()
          setEditingHospital(null)
          setIsFormOpen(false)
        } else {
          alert(result.error)
        }
      } else {
        const result = await createHospital({...data, userId: session.id})
        if (result.success) {
          await fetchHospitals()
          setIsFormOpen(false)
        } else {
          alert(result.error)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (hospital: HospitalWithRelations) => {
    setEditingHospital(hospital)
    setIsFormOpen(true)
  }

  const handleDelete = async (hospital: HospitalWithRelations) => {
    const hasRelations = (hospital._count?.MedicalVisit ?? 0) > 0 || (hospital._count?.HospitalTask ?? 0) > 0

    if (hasRelations) {
      if (!confirm('この病院には通院履歴またはタスクがあります。無効化しますか？')) return
      const result = await deactivateHospital(hospital.id)
      if (result.success) {
        await fetchHospitals()
      } else {
        alert(result.error)
      }
    } else {
      if (!confirm('この病院を削除しますか？')) return
      const result = await deleteHospital(hospital.id)
      if (result.success) {
        await fetchHospitals()
      } else {
        alert(result.error)
      }
    }
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingHospital(null)
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">病院マスタ</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            無効を含む
          </label>
          <button
            onClick={() => {
              setEditingHospital(null)
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">{editingHospital ? '病院を編集' : '病院を登録'}</h2>
            <HospitalForm
              hospital={editingHospital}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* 一覧 */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : hospitals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>病院が登録されていません</p>
          <button onClick={() => setIsFormOpen(true)} className="mt-4 text-blue-600 hover:underline">
            最初の病院を登録する
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hospitals.map(hospital => (
            <HospitalCard key={hospital.id} hospital={hospital} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

