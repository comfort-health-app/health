'use client'

import {useState, useEffect} from 'react'
import {
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_LABELS,
  HEALTH_CATEGORY_COLORS,
  HEALTH_CATEGORY_BG_COLORS,
  WALKING_TYPE_LABELS,
  HealthCategory,
  HealthRecordFormData,
} from '../(constants)/types'
import {StrHandler} from '@cm/class/StrHandler'

interface Medicine {
  id: number
  name: string
  requireUnit: boolean
}

interface HealthRecordFormProps {
  onSubmit: (data: HealthRecordFormData) => void
  onBulkSubmit?: (data: HealthRecordFormData[]) => void
  initialData?: Partial<HealthRecordFormData>
  isEditing?: boolean
  selectedDate?: string
}

interface BulkRecordItem {
  recordTime: string
  bloodSugarValue?: number
  medicineId?: number
  medicineUnit?: number
  walkingShortDistance?: number
  walkingMediumDistance?: number
  walkingLongDistance?: number
  walkingExercise?: number
  memo?: string
}

export default function HealthRecordForm({onSubmit, onBulkSubmit, initialData, isEditing, selectedDate}: HealthRecordFormProps) {
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [formData, setFormData] = useState<HealthRecordFormData>({
    category: HEALTH_CATEGORIES.BLOOD_SUGAR,
    recordDate: selectedDate || new Date().toISOString().split('T')[0],
    recordTime: new Date().toTimeString().slice(0, 5),
    ...initialData,
  })

  const [bulkData, setBulkData] = useState<{
    category: HealthCategory
    recordDate: string
    items: BulkRecordItem[]
  }>({
    category: HEALTH_CATEGORIES.BLOOD_SUGAR,
    recordDate: selectedDate || new Date().toISOString().split('T')[0],
    items: Array.from({length: 10}, () => ({recordTime: ''})),
  })

  const [medicines, setMedicines] = useState<Medicine[]>([])

  // 薬マスタを取得
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch('/health/api/medicines')
        if (response.ok) {
          const data = await response.json()
          setMedicines(data)
        }
      } catch (error) {
        console.error('薬マスタ取得エラー:', error)
      }
    }

    fetchMedicines()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!onBulkSubmit) return

    const dataWithoutTime = bulkData.items.some(item => {
      const hasTime = item.recordTime

      const hasOtherProperty = Object.values(item).some(value => !!value)
      return !hasTime && hasOtherProperty
    })

    if (dataWithoutTime) {
      alert('時刻が入力されていないデータがあります。')
      return
    }

    const validItems = bulkData.items.filter(item => item.recordTime)
    const formattedData: HealthRecordFormData[] = validItems.map(item => ({
      category: bulkData.category,
      recordDate: bulkData.recordDate,
      recordTime: item.recordTime,
      bloodSugarValue: item.bloodSugarValue,
      medicineId: item.medicineId,
      medicineUnit: item.medicineUnit,
      walkingShortDistance: item.walkingShortDistance,
      walkingMediumDistance: item.walkingMediumDistance,
      walkingLongDistance: item.walkingLongDistance,
      walkingExercise: item.walkingExercise,
      memo: item.memo,
    }))

    onBulkSubmit(formattedData)
  }

  const handleInputChange = (field: keyof HealthRecordFormData, value: any) => {
    setFormData(prev => ({...prev, [field]: value}))
  }

  const handleBulkDataChange = (field: 'category' | 'recordDate', value: any) => {
    setBulkData(prev => ({...prev, [field]: value}))
  }

  const handleBulkItemChange = (index: number, field: keyof BulkRecordItem, value: any) => {
    setBulkData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? {...item, [field]: value} : item)),
    }))
  }

  const selectedMedicine = medicines.find(m => m.id === formData.medicineId)

  if (!isBulkMode) {
    return (
      <>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? '健康記録を編集' : '健康記録を登録'}</h2>
          {onBulkSubmit && (
            <button
              type="button"
              onClick={() => setIsBulkMode(true)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition duration-200"
            >
              一括入力
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6  w-[400px]  max-w-[80vw] ">
          {/* 日付選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
            <input
              type="date"
              value={formData.recordDate}
              onChange={e => handleInputChange('recordDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 時刻選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">時刻</label>
            <input
              type="time"
              inputMode="numeric"
              pattern="[0-9]{2}:[0-9]{2}"
              value={formData.recordTime}
              onChange={e => handleInputChange('recordTime', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* カテゴリ選択（ボタン形式） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">カテゴリ</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(HEALTH_CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleInputChange('category', key as HealthCategory)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.category === key ? 'border-2 scale-105 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: formData.category === key ? HEALTH_CATEGORY_BG_COLORS[key as HealthCategory] : '#f9fafb',
                    borderColor: formData.category === key ? HEALTH_CATEGORY_COLORS[key as HealthCategory] : undefined,
                    color: formData.category === key ? HEALTH_CATEGORY_COLORS[key as HealthCategory] : '#374151',
                  }}
                >
                  <div className="font-medium text-sm">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* カテゴリ別の入力フィールド */}
          {formData.category === HEALTH_CATEGORIES.BLOOD_SUGAR && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">血糖値</label>
              <input
                type="number"
                required
                value={formData.bloodSugarValue || ''}
                onChange={e => handleInputChange('bloodSugarValue', parseInt(e.target.value) || undefined)}
                placeholder="血糖値を入力"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {formData.category === HEALTH_CATEGORIES.MEDICINE && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">薬名</label>
                <select
                  value={formData.medicineId || ''}
                  onChange={e => handleInputChange('medicineId', parseInt(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">薬を選択してください</option>
                  {medicines.map(medicine => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMedicine && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">単位</label>
                  {selectedMedicine.requireUnit ? (
                    <input
                      type="number"
                      step="0.1"
                      value={formData.medicineUnit || ''}
                      onChange={e => handleInputChange('medicineUnit', parseFloat(e.target.value) || undefined)}
                      placeholder="単位を入力"
                      required
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value="この薬は単位入力不要です"
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    />
                  )}
                </div>
              )}
            </>
          )}

          {formData.category === HEALTH_CATEGORIES.WALKING && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">歩行ポイント入力</h3>

              {Object.entries(WALKING_TYPE_LABELS).map(([key, label]) => {
                const [first = '', second = ''] = key.split('_')

                const dataKey = [
                  //
                  'walking',
                  StrHandler.capitalizeFirstLetter(first),
                  StrHandler.capitalizeFirstLetter(second),
                ].join('') as keyof HealthRecordFormData

                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <select
                      value={formData[dataKey] || ''}
                      onChange={e => {
                        handleInputChange(dataKey, parseFloat(e.target.value) || 0)
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      {Array.from({length: 50}, (_, i) => i).map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          )}

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メモ（任意）</label>
            <textarea
              value={formData.memo || ''}
              onChange={e => handleInputChange('memo', e.target.value)}
              placeholder="メモを入力"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
          >
            {isEditing ? '更新する' : '登録する'}
          </button>
        </form>
      </>
    )
  }

  // 一括入力モード
  return (
    <form onSubmit={handleBulkSubmit} className="space-y-6  w-[800px] max-w-[90vw] ">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">健康記録を一括登録</h2>
        <button
          type="button"
          onClick={() => setIsBulkMode(false)}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
        >
          単発入力
        </button>
      </div>

      {/* 日付選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
        <input
          type="date"
          value={bulkData.recordDate}
          onChange={e => handleBulkDataChange('recordDate', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* カテゴリ選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">カテゴリ</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(HEALTH_CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleBulkDataChange('category', key as HealthCategory)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                bulkData.category === key ? 'border-2 scale-105 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{
                backgroundColor: bulkData.category === key ? HEALTH_CATEGORY_BG_COLORS[key as HealthCategory] : '#f9fafb',
                borderColor: bulkData.category === key ? HEALTH_CATEGORY_COLORS[key as HealthCategory] : undefined,
                color: bulkData.category === key ? HEALTH_CATEGORY_COLORS[key as HealthCategory] : '#374151',
              }}
            >
              <div className="font-medium text-sm">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 一括入力テーブル */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">記録入力（最大10件）</h3>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full border-collapse border border-gray-300 ">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left font-medium text-gray-700">時刻</th>
                {bulkData.category === HEALTH_CATEGORIES.BLOOD_SUGAR && (
                  <th className="border border-gray-300 p-2 text-left font-medium text-gray-700">血糖値</th>
                )}
                {bulkData.category === HEALTH_CATEGORIES.MEDICINE && (
                  <>
                    <th className="border border-gray-300 p-2 text-left font-medium text-gray-700">薬名</th>
                    <th className="border border-gray-300 p-2 text-left font-medium text-gray-700">単位</th>
                  </>
                )}
                {bulkData.category === HEALTH_CATEGORIES.WALKING && (
                  <>
                    <th className="border border-gray-300 p-2 min-w-16 text-left font-medium text-gray-700 text-xs">短</th>
                    <th className="border border-gray-300 p-2 min-w-16 text-left font-medium text-gray-700 text-xs">中</th>
                    <th className="border border-gray-300 p-2 min-w-16 text-left font-medium text-gray-700 text-xs">長</th>
                    <th className="border border-gray-300 p-2 min-w-16 text-left font-medium text-gray-700 text-xs">運動</th>
                  </>
                )}
                <th className="border border-gray-300 p-2 min-w-40 text-left font-medium text-gray-700">メモ</th>
              </tr>
            </thead>
            <tbody>
              {bulkData.items.map((item, index) => {
                const inputtedTime = item.recordTime
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      <input
                        type="time"
                        value={item.recordTime}
                        onChange={e => handleBulkItemChange(index, 'recordTime', e.target.value)}
                        className="w-full p-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    {bulkData.category === HEALTH_CATEGORIES.BLOOD_SUGAR && (
                      <td className="border border-gray-300 p-2">
                        <input
                          type="number"
                          value={item.bloodSugarValue || ''}
                          onChange={e => handleBulkItemChange(index, 'bloodSugarValue', parseInt(e.target.value) || undefined)}
                          placeholder="血糖値"
                          required={inputtedTime !== ''}
                          className="w-full p-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                    )}
                    {bulkData.category === HEALTH_CATEGORIES.MEDICINE && (
                      <>
                        <td className="border border-gray-300 p-2">
                          <select
                            value={item.medicineId || ''}
                            onChange={e => handleBulkItemChange(index, 'medicineId', parseInt(e.target.value) || undefined)}
                            className="w-full p-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">選択</option>
                            {medicines.map(medicine => (
                              <option key={medicine.id} value={medicine.id}>
                                {medicine.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 p-2">
                          {(() => {
                            const selectedMedicine = medicines.find(m => m.id === item.medicineId)
                            if (!selectedMedicine) {
                              return (
                                <input
                                  type="text"
                                  value=""
                                  disabled
                                  placeholder="薬を選択"
                                  className="w-full p-1 border border-gray-200 rounded bg-gray-100 text-gray-400"
                                />
                              )
                            }
                            if (!selectedMedicine.requireUnit) {
                              return (
                                <input
                                  type="text"
                                  value="不要"
                                  disabled
                                  className="w-full p-1 border border-gray-200 rounded bg-gray-100 text-gray-600"
                                />
                              )
                            }
                            return (
                              <input
                                type="number"
                                step="0.1"
                                value={item.medicineUnit || ''}
                                onChange={e =>
                                  handleBulkItemChange(index, 'medicineUnit', parseFloat(e.target.value) || undefined)
                                }
                                placeholder="単位"
                                required
                                className="w-full p-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            )
                          })()}
                        </td>
                      </>
                    )}
                    {bulkData.category === HEALTH_CATEGORIES.WALKING && (
                      <>
                        <td className="border border-gray-300 p-2">
                          <select
                            value={item.walkingShortDistance || ''}
                            onChange={e => handleBulkItemChange(index, 'walkingShortDistance', parseFloat(e.target.value) || 0)}
                            className="w-full p-0 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">選択</option>
                            {Array.from({length: 50}, (_, i) => i).map(value => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 p-2">
                          <select
                            value={item.walkingMediumDistance || ''}
                            onChange={e => handleBulkItemChange(index, 'walkingMediumDistance', parseFloat(e.target.value) || 0)}
                            className="w-full p-0 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">選択</option>
                            {Array.from({length: 50}, (_, i) => i).map(value => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 p-2">
                          <select
                            value={item.walkingLongDistance || ''}
                            onChange={e => handleBulkItemChange(index, 'walkingLongDistance', parseFloat(e.target.value) || 0)}
                            className="w-full p-0 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">選択</option>
                            {Array.from({length: 50}, (_, i) => i).map(value => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 p-2">
                          <select
                            value={item.walkingExercise || ''}
                            onChange={e => handleBulkItemChange(index, 'walkingExercise', parseFloat(e.target.value) || 0)}
                            className="w-full p-0 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">選択</option>
                            {Array.from({length: 50}, (_, i) => i).map(value => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </td>
                      </>
                    )}
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={item.memo || ''}
                        onChange={e => handleBulkItemChange(index, 'memo', e.target.value)}
                        placeholder="メモ"
                        className="w-full p-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
      >
        一括登録する
      </button>
    </form>
  )
}
