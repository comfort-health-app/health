'use client'

import {useState, useEffect} from 'react'
import {PurchaseWithRelations, PurchasePhase2Data} from '../../(lib)/purchase-actions'
import {getPersons, PersonWithRelations} from '../../(lib)/person-actions'
import {getPurchaseLocations, createPurchaseLocation, PurchaseLocationWithRelations} from '../../(lib)/purchase-location-actions'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  purchase: PurchaseWithRelations
  onSubmit: (data: PurchasePhase2Data) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function PurchasePhase2Form({purchase, onSubmit, onCancel, isSubmitting = false}: Props) {
  const {session} = useGlobal()
  const [persons, setPersons] = useState<PersonWithRelations[]>([])
  const [purchaseLocations, setPurchaseLocations] = useState<PurchaseLocationWithRelations[]>([])
  const [newLocationName, setNewLocationName] = useState('')
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)
  const isOnline = purchase.category === 'ONLINE'
  const isDirect = purchase.category === 'DIRECT'

  // purchaseLocationIdの初期値を設定（PurchaseLocationMasterからも取得）
  const initialPurchaseLocationId = purchase.purchaseLocationId || purchase.PurchaseLocationMaster?.id || undefined
  const initialPurchaseLocation = purchase.purchaseLocation || purchase.PurchaseLocationMaster?.name || ''
  const initialLocationInputMode = initialPurchaseLocationId ? 'select' : initialPurchaseLocation ? 'freetext' : 'select'

  const [formData, setFormData] = useState<PurchasePhase2Data>({
    orderer: purchase.orderer || '',
    ordererId: purchase.ordererId || purchase.PersonOrderer?.id || undefined,
    paymentMethod: purchase.paymentMethod || (isDirect ? '現金' : ''),
    paymentDate: purchase.paymentDate
      ? formatDate(new Date(purchase.paymentDate), 'YYYY-MM-DD')
      : isDirect
        ? ''
        : formatDate(new Date(), 'YYYY-MM-DD'),
    expectedArrival: purchase.expectedArrival ? formatDate(new Date(purchase.expectedArrival), 'YYYY-MM-DD') : '',
    expectedArrivalUndefined: purchase.expectedArrivalUndefined || false,
    purchaseLocationId: initialPurchaseLocationId,
    purchaseLocation: initialPurchaseLocation,
    receiptDate: purchase.receiptDate ? formatDate(new Date(purchase.receiptDate), 'YYYY-MM-DD') : '',
  })

  const [locationInputMode, setLocationInputMode] = useState<'select' | 'freetext'>(initialLocationInputMode)

  useEffect(() => {
    const fetchData = async () => {
      if (session?.id) {
        const [personsResult, locationsResult] = await Promise.all([getPersons(session.id), getPurchaseLocations(session.id)])
        if (personsResult.success && personsResult.data) {
          setPersons(personsResult.data.filter(p => p.active))
        }
        if (locationsResult.success && locationsResult.data) {
          setPurchaseLocations(locationsResult.data.filter(l => l.active))
        }
      }
    }
    fetchData()
  }, [session?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleCreateLocation = async () => {
    if (!session?.id || !newLocationName.trim()) return

    setIsCreatingLocation(true)
    try {
      const result = await createPurchaseLocation({
        userId: session.id,
        name: newLocationName.trim(),
      })
      if (result.success && result.data) {
        setPurchaseLocations([...purchaseLocations, result.data])
        setFormData({
          ...formData,
          purchaseLocationId: result.data.id,
          purchaseLocation: '',
        })
        setNewLocationName('')
        setLocationInputMode('select')
      } else {
        alert(result.error)
      }
    } finally {
      setIsCreatingLocation(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{purchase.itemName}</span>
          <span className="mx-2">-</span>
          <span className={isDirect ? 'text-blue-600' : 'text-purple-600'}>{isDirect ? '直接購入' : 'ネット購入'}</span>
        </div>
      </div>

      {isDirect && (
        <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
          直接購入の場合、決済日・到着予定日・領収書出力日・受取日は自動的に登録日時が設定されます。
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          注文者 <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.ordererId || ''}
          onChange={e => {
            const personId = e.target.value ? parseInt(e.target.value) : undefined
            const person = persons.find(p => p.id === personId)
            setFormData({
              ...formData,
              ordererId: personId,
              orderer: person?.name || '',
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">選択してください</option>
          {persons.map(person => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>

      {isDirect && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">購入場所</label>
          <div className="space-y-2">
            {/* 入力モード切り替え */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="locationInputMode"
                  checked={locationInputMode === 'select'}
                  onChange={() => {
                    setLocationInputMode('select')
                    setFormData({...formData, purchaseLocation: ''})
                  }}
                  className="text-blue-600"
                />
                <span className="text-sm">選択</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="locationInputMode"
                  checked={locationInputMode === 'freetext'}
                  onChange={() => {
                    setLocationInputMode('freetext')
                    setFormData({...formData, purchaseLocationId: undefined, purchaseLocation: ''})
                  }}
                  className="text-blue-600"
                />
                <span className="text-sm">直接入力</span>
              </label>
            </div>

            {locationInputMode === 'select' ? (
              <div className="space-y-2">
                <select
                  value={formData.purchaseLocationId || ''}
                  onChange={e => {
                    const locationId = e.target.value ? parseInt(e.target.value) : undefined
                    setFormData({
                      ...formData,
                      purchaseLocationId: locationId,
                      purchaseLocation: '',
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {purchaseLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {/* 新しい購入場所を追加 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={e => setNewLocationName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="新しい購入場所を追加"
                  />
                  <button
                    type="button"
                    onClick={handleCreateLocation}
                    disabled={isCreatingLocation || !newLocationName.trim()}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isCreatingLocation ? '追加中...' : '追加'}
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={formData.purchaseLocation || ''}
                onChange={e => setFormData({...formData, purchaseLocation: e.target.value, purchaseLocationId: undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：スーパーA、コンビニB"
              />
            )}
          </div>
        </div>
      )}

      {isOnline && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支払方法</label>
              <input
                type="text"
                value={formData.paymentMethod || ''}
                onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：クレジットカード"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">決済日</label>
              <input
                type="date"
                value={formData.paymentDate || ''}
                onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">到着予定日</label>
              <div className="space-y-2">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="expectedArrivalType"
                      checked={!formData.expectedArrivalUndefined}
                      onChange={() => setFormData({...formData, expectedArrivalUndefined: false})}
                      className="text-blue-600"
                    />
                    <span className="text-sm">日付指定</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="expectedArrivalType"
                      checked={formData.expectedArrivalUndefined === true}
                      onChange={() => setFormData({...formData, expectedArrivalUndefined: true, expectedArrival: ''})}
                      className="text-blue-600"
                    />
                    <span className="text-sm">未定</span>
                  </label>
                </div>
                {!formData.expectedArrivalUndefined && (
                  <input
                    type="date"
                    value={formData.expectedArrival || ''}
                    onChange={e => setFormData({...formData, expectedArrival: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">領収書出力日</label>
              <input
                type="date"
                value={formData.receiptDate || ''}
                onChange={e => setFormData({...formData, receiptDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.orderer}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : '購入を記録'}
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
