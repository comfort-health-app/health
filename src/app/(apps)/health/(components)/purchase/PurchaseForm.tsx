'use client'

import {useState, useEffect} from 'react'
import {PurchaseWithRelations, PurchaseFormData} from '../../(lib)/purchase-actions'
import {getPersons, PersonWithRelations} from '../../(lib)/person-actions'
import {getPurchaseLocations, PurchaseLocationWithRelations} from '../../(lib)/purchase-location-actions'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  purchase?: PurchaseWithRelations | null
  onSubmit: (data: PurchaseFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function PurchaseForm({purchase, onSubmit, onCancel, isSubmitting = false}: Props) {
  const {session} = useGlobal()
  const [persons, setPersons] = useState<PersonWithRelations[]>([])
  const [purchaseLocations, setPurchaseLocations] = useState<PurchaseLocationWithRelations[]>([])

  // purchaseLocationIdの初期値を設定（PurchaseLocationMasterからも取得）
  const initialPurchaseLocationId = purchase?.purchaseLocationId || purchase?.PurchaseLocationMaster?.id || undefined
  const initialPurchaseLocation = purchase?.purchaseLocation || purchase?.PurchaseLocationMaster?.name || ''

  const [isCustomLocation, setIsCustomLocation] = useState(!!(initialPurchaseLocation && !initialPurchaseLocationId))

  const [formData, setFormData] = useState<PurchaseFormData>({
    itemName: purchase?.itemName || '',
    requester: purchase?.requester || '',
    requesterId: purchase?.requesterId || purchase?.PersonRequester?.id || undefined,
    category: purchase?.category || 'ONLINE',
    deadline: purchase?.deadline ? formatDate(new Date(purchase.deadline), 'YYYY-MM-DD') : '',
    orderer: purchase?.orderer || '',
    ordererId: purchase?.ordererId || purchase?.PersonOrderer?.id || undefined,
    paymentMethod: purchase?.paymentMethod || '',
    paymentDate: purchase?.paymentDate ? formatDate(new Date(purchase.paymentDate), 'YYYY-MM-DD') : '',
    expectedArrival: purchase?.expectedArrival ? formatDate(new Date(purchase.expectedArrival), 'YYYY-MM-DD') : '',
    expectedArrivalUndefined: purchase?.expectedArrivalUndefined || false,
    receiptDate: purchase?.receiptDate ? formatDate(new Date(purchase.receiptDate), 'YYYY-MM-DD') : '',
    receiver: purchase?.receiver || '',
    receiverId: purchase?.receiverId || purchase?.PersonReceiver?.id || undefined,
    receivedDate: purchase?.receivedDate ? formatDate(new Date(purchase.receivedDate), 'YYYY-MM-DD') : '',
    memo: purchase?.memo || '',
    purchaseLocation: initialPurchaseLocation,
    purchaseLocationId: initialPurchaseLocationId,
  })

  useEffect(() => {
    const fetchPersons = async () => {
      if (session?.id) {
        const result = await getPersons(session.id)
        if (result.success && result.data) {
          const activePersons = result.data.filter(p => p.active)
          setPersons(activePersons)

          // requesterIdが設定されていないが、requesterが設定されている場合、逆引きして設定
          if (purchase && !formData.requesterId && purchase.requester) {
            const matchedPerson = activePersons.find(p => p.name === purchase.requester)
            if (matchedPerson) {
              setFormData(prev => ({
                ...prev,
                requesterId: matchedPerson.id,
              }))
            }
          }
        }
      }
    }
    const fetchPurchaseLocations = async () => {
      if (session?.id) {
        const result = await getPurchaseLocations(session.id)
        if (result.success && result.data) {
          setPurchaseLocations(result.data.filter(loc => loc.active))
        }
      }
    }
    fetchPersons()
    fetchPurchaseLocations()
  }, [session?.id, purchase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const isOnline = formData.category === 'ONLINE'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* フェーズ1: 買いたい時 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold text-gray-700 mb-3">基本情報</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              注文品 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.itemName}
              onChange={e => setFormData({...formData, itemName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：USBケーブル"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                依頼者 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.requesterId || ''}
                onChange={e => {
                  const personId = e.target.value ? parseInt(e.target.value) : undefined
                  const person = persons.find(p => p.id === personId)
                  setFormData({
                    ...formData,
                    requesterId: personId,
                    requester: person?.name || '',
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                区分 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    value="ONLINE"
                    checked={formData.category === 'ONLINE'}
                    onChange={() => setFormData({...formData, category: 'ONLINE'})}
                    className="text-blue-600"
                  />
                  <span className="text-sm">ネット</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    value="DIRECT"
                    checked={formData.category === 'DIRECT'}
                    onChange={() => setFormData({...formData, category: 'DIRECT'})}
                    className="text-blue-600"
                  />
                  <span className="text-sm">直接</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
            <input
              type="date"
              value={formData.deadline || ''}
              onChange={e => setFormData({...formData, deadline: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 直接購入の場合は購入場所 */}
          {formData.category === 'DIRECT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">購入場所</label>
              <div className="flex gap-2 mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="purchaseLocationType"
                    checked={!isCustomLocation}
                    onChange={() => {
                      setIsCustomLocation(false)
                      setFormData({...formData, purchaseLocation: '', purchaseLocationId: undefined})
                    }}
                    className="text-blue-600"
                  />
                  <span className="text-sm">マスタから選択</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="purchaseLocationType"
                    checked={isCustomLocation}
                    onChange={() => {
                      setIsCustomLocation(true)
                      setFormData({...formData, purchaseLocationId: undefined, purchaseLocation: ''})
                    }}
                    className="text-blue-600"
                  />
                  <span className="text-sm">フリーテキスト</span>
                </label>
              </div>
              {!isCustomLocation ? (
                <select
                  value={formData.purchaseLocationId || ''}
                  onChange={e => {
                    const locationId = e.target.value ? parseInt(e.target.value) : undefined
                    const location = purchaseLocations.find(loc => loc.id === locationId)
                    setFormData({
                      ...formData,
                      purchaseLocationId: locationId,
                      purchaseLocation: location?.name || '',
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {purchaseLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
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
          )}
        </div>
      </div>

      {/* フェーズ2以降（編集時のみ表示） */}
      {purchase && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-gray-700 mb-3">購入情報</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">注文者</label>
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
                >
                  <option value="">選択してください</option>
                  {persons.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支払方法</label>
                <input
                  type="text"
                  value={formData.paymentMethod || ''}
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={!isOnline ? '現金' : '例：クレジットカード'}
                  disabled={!isOnline}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">決済日</label>
                <input
                  type="date"
                  value={formData.paymentDate || ''}
                  onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isOnline}
                />
              </div>

              {isOnline && (
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
              )}
            </div>

            {isOnline && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">領収書出力日</label>
                  <input
                    type="date"
                    value={formData.receiptDate || ''}
                    onChange={e => setFormData({...formData, receiptDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">受取確認日</label>
                  <input
                    type="date"
                    value={formData.receivedDate || ''}
                    onChange={e => setFormData({...formData, receivedDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {isOnline && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">受取者</label>
                <select
                  value={formData.receiverId || ''}
                  onChange={e => {
                    const personId = e.target.value ? parseInt(e.target.value) : undefined
                    const person = persons.find(p => p.id === personId)
                    setFormData({
                      ...formData,
                      receiverId: personId,
                      receiver: person?.name || '',
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {persons.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 備考 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
        <textarea
          value={formData.memo || ''}
          onChange={e => setFormData({...formData, memo: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.itemName || !formData.requester}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : purchase ? '更新' : '登録'}
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
