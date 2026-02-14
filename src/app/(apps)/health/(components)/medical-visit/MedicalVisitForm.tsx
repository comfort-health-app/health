'use client'

import {useState, useEffect} from 'react'
import {Hospital} from '@prisma/client'
import {MedicalVisitFormData, MedicalVisitWithRelations} from '../../(lib)/medical-visit-actions'
import {SymptomWithRelations} from '../../(lib)/symptom-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  visit?: MedicalVisitWithRelations | null
  hospitals: Hospital[]
  symptoms: SymptomWithRelations[]
  onSubmit: (data: MedicalVisitFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function MedicalVisitForm({visit, hospitals, symptoms, onSubmit, onCancel, isSubmitting = false}: Props) {
  const [formData, setFormData] = useState<MedicalVisitFormData>({
    hospitalId: visit?.hospitalId || (hospitals[0]?.id ?? 0),
    visitDate: visit ? formatDate(new Date(visit.visitDate), 'YYYY-MM-DD') : formatDate(new Date(), 'YYYY-MM-DD'),
    visitTime: visit?.visitTime || '',
    departmentAtVisit: visit?.departmentAtVisit || '',
    doctorNameAtVisit: visit?.doctorNameAtVisit || '',
    treatment: visit?.treatment || '',
    doctorComment: visit?.doctorComment || '',
    memo: visit?.memo || '',
    symptomIds: visit?.MedicalVisitSymptom?.map(s => s.symptomId) || [],
  })

  // 病院選択時に診療科と先生名を自動入力
  useEffect(() => {
    if (!visit && formData.hospitalId) {
      const selectedHospital = hospitals.find(h => h.id === formData.hospitalId)
      if (selectedHospital) {
        setFormData(prev => ({
          ...prev,
          departmentAtVisit: selectedHospital.department,
          doctorNameAtVisit: selectedHospital.doctorName,
        }))
      }
    }
  }, [formData.hospitalId, hospitals, visit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleHospitalChange = (hospitalId: number) => {
    const selectedHospital = hospitals.find(h => h.id === hospitalId)
    setFormData(prev => ({
      ...prev,
      hospitalId,
      departmentAtVisit: selectedHospital?.department || '',
      doctorNameAtVisit: selectedHospital?.doctorName || '',
    }))
  }

  const handleSymptomToggle = (symptomId: number) => {
    setFormData(prev => ({
      ...prev,
      symptomIds: prev.symptomIds?.includes(symptomId)
        ? prev.symptomIds.filter(id => id !== symptomId)
        : [...(prev.symptomIds || []), symptomId],
    }))
  }

  // 進行中の症状のみ表示（または既に紐付いている症状）
  const availableSymptoms = symptoms.filter(s => {
    const isActive = !s.endDate || new Date(s.endDate) > new Date()
    const isLinked = formData.symptomIds?.includes(s.id)
    return isActive || isLinked
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            病院 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.hospitalId}
            onChange={e => handleHospitalChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">選択してください</option>
            {hospitals.map(hospital => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name} - {hospital.department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            診察日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.visitDate}
            onChange={e => setFormData({...formData, visitDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">診察時刻</label>
          <input
            type="time"
            inputMode="numeric"
            pattern="[0-9]{2}:[0-9]{2}"
            value={formData.visitTime || ''}
            onChange={e => setFormData({...formData, visitTime: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">その時の科</label>
          <input
            type="text"
            value={formData.departmentAtVisit || ''}
            onChange={e => setFormData({...formData, departmentAtVisit: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例：皮膚科"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">その時の先生</label>
          <input
            type="text"
            value={formData.doctorNameAtVisit || ''}
            onChange={e => setFormData({...formData, doctorNameAtVisit: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例：田中先生"
          />
        </div>
      </div>

      {/* 症状選択セクション */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            関連する症状 <span className="text-xs text-gray-500 font-normal">（複数選択可）</span>
          </label>
          {availableSymptoms.length === 0 && (
            <a
              href="/health/symptom"
              target="_blank"
              className="text-xs text-orange-600 hover:text-orange-800 hover:underline"
            >
              症状を登録 →
            </a>
          )}
        </div>
        {availableSymptoms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableSymptoms.map(symptom => {
              const isSelected = formData.symptomIds?.includes(symptom.id)
              const isActive = !symptom.endDate || new Date(symptom.endDate) > new Date()
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => handleSymptomToggle(symptom.id)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : isActive
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {symptom.name}
                  {!isActive && ' (終了)'}
                  {isSelected && (
                    <svg
                      className="inline-block w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-2">
            症状が登録されていません。
            <a href="/health/symptom" target="_blank" className="text-orange-600 hover:text-orange-800 hover:underline ml-1">
              症状管理ページ
            </a>
            で症状を登録してください。
          </div>
        )}
        {formData.symptomIds && formData.symptomIds.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            選択中: {formData.symptomIds.length}件
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">処置内容</label>
        <textarea
          value={formData.treatment || ''}
          onChange={e => setFormData({...formData, treatment: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="処置内容を入力"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">先生からのコメント</label>
        <textarea
          value={formData.doctorComment || ''}
          onChange={e => setFormData({...formData, doctorComment: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="先生からのコメントを入力"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
        <textarea
          value={formData.memo || ''}
          onChange={e => setFormData({...formData, memo: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="備考を入力"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.hospitalId}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : visit ? '更新' : '登録'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
