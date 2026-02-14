'use client'

import {useState, useEffect, useCallback} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {Hospital} from '@prisma/client'
import {getHospitals} from '../../(lib)/hospital-actions'
import {
  getMedicalVisits,
  createMedicalVisit,
  updateMedicalVisit,
  deleteMedicalVisit,
  MedicalVisitWithRelations,
  MedicalVisitFormData,
} from '../../(lib)/medical-visit-actions'
import {getSymptoms, SymptomWithRelations} from '../../(lib)/symptom-actions'
import MedicalVisitForm from './MedicalVisitForm'
import MedicalVisitCard from './MedicalVisitCard'

export default function MedicalVisitList() {
  const {session, query} = useGlobal()
  const [visits, setVisits] = useState<MedicalVisitWithRelations[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [symptoms, setSymptoms] = useState<SymptomWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterHospitalId, setFilterHospitalId] = useState<number | null>(null)
  const [filterSymptomId, setFilterSymptomId] = useState<number | null>(Number(query.symptomId) || null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState<MedicalVisitWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchHospitals = useCallback(async () => {
    if (!session?.id) return

    const result = await getHospitals({userId: session.id, includeInactive: true})
    if (result.success && result.data) {
      setHospitals(result.data)
    }
  }, [session?.id])

  const fetchSymptoms = useCallback(async () => {
    if (!session?.id) return

    const result = await getSymptoms({userId: session.id, includeEnded: true})
    if (result.success && result.data) {
      setSymptoms(result.data)
    }
  }, [session?.id])

  const fetchVisits = useCallback(async () => {
    if (!session?.id) return

    setIsLoading(true)
    try {
      const result = await getMedicalVisits({
        userId: session.id,
        hospitalId: filterHospitalId || undefined,
        symptomId: filterSymptomId || undefined,
      })
      if (result.success && result.data) {
        setVisits(result.data)
      }
    } catch (error) {
      console.error('通院履歴取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.id, filterHospitalId, filterSymptomId])

  useEffect(() => {
    fetchHospitals()
    fetchSymptoms()
  }, [fetchHospitals, fetchSymptoms])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  const handleSubmit = async (data: MedicalVisitFormData) => {
    if (!session?.id) return

    setIsSubmitting(true)
    try {
      if (editingVisit) {
        const result = await updateMedicalVisit(editingVisit.id, data)
        if (result.success) {
          await fetchVisits()
          setEditingVisit(null)
          setIsFormOpen(false)
        } else {
          alert(result.error)
        }
      } else {
        const result = await createMedicalVisit({...data, userId: session.id})
        if (result.success) {
          await fetchVisits()
          setIsFormOpen(false)
        } else {
          alert(result.error)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (visit: MedicalVisitWithRelations) => {
    setEditingVisit(visit)
    setIsFormOpen(true)
  }

  const handleDelete = async (visit: MedicalVisitWithRelations) => {
    if (!confirm('この通院履歴を削除しますか？関連する画像も削除されます。')) return

    const result = await deleteMedicalVisit(visit.id)
    if (result.success) {
      await fetchVisits()
    } else {
      alert(result.error)
    }
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingVisit(null)
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
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-800">通院履歴</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={filterHospitalId || ''}
            onChange={e => setFilterHospitalId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            <option value="">すべての病院</option>
            {hospitals.map(hospital => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name} - {hospital.department}
              </option>
            ))}
          </select>
          <select
            value={filterSymptomId || ''}
            onChange={e => setFilterSymptomId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[180px]"
          >
            <option value="">すべての症状</option>
            {symptoms.map(symptom => {
              const isActive = !symptom.endDate || new Date(symptom.endDate) > new Date()
              return (
                <option key={symptom.id} value={symptom.id}>
                  {symptom.name} {!isActive ? '(終了)' : ''}
                </option>
              )
            })}
          </select>
          <button
            onClick={() => {
              setEditingVisit(null)
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingVisit ? '通院履歴を編集' : '通院履歴を登録'}</h2>
            {hospitals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>先に病院を登録してください</p>
                <a href="/health/hospital" className="mt-4 inline-block text-blue-600 hover:underline">
                  病院マスタへ
                </a>
              </div>
            ) : (
              <MedicalVisitForm
                visit={editingVisit}
                hospitals={hospitals.filter(h => h.active)}
                symptoms={symptoms}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      )}

      {/* 一覧 */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : visits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filterHospitalId || filterSymptomId ? (
            <p>該当する通院履歴がありません</p>
          ) : (
            <>
              <p>通院履歴がありません</p>
              {hospitals.length > 0 ? (
                <button onClick={() => setIsFormOpen(true)} className="mt-4 text-blue-600 hover:underline">
                  最初の通院履歴を登録する
                </button>
              ) : (
                <a href="/health/hospital" className="mt-4 inline-block text-blue-600 hover:underline">
                  先に病院を登録する
                </a>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map(visit => (
            <MedicalVisitCard
              key={visit.id}
              visit={visit}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onImageUploaded={fetchVisits}
            />
          ))}
        </div>
      )}
    </div>
  )
}
