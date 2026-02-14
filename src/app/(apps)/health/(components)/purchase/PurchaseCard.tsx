'use client'

import {useState} from 'react'
import {PurchaseWithRelations, deletePurchaseImage} from '../../(lib)/purchase-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import PurchaseImageUploader from './PurchaseImageUploader'

type Props = {
  purchase: PurchaseWithRelations
  onEdit: (purchase: PurchaseWithRelations) => void
  onDelete: (purchase: PurchaseWithRelations) => void
  onPhase2: (purchase: PurchaseWithRelations) => void
  onPhase3A: (purchase: PurchaseWithRelations) => void
  onPhase3B: (purchase: PurchaseWithRelations) => void
  onUpdated: () => void
}

export default function PurchaseCard({purchase, onEdit, onDelete, onPhase2, onPhase3A, onPhase3B, onUpdated}: Props) {
  const [showImages, setShowImages] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  const isPurchased = !!purchase.paymentDate
  const isReceived = !!purchase.receivedDate
  const hasReceipt = !!purchase.receiptDate

  const isOnline = purchase.category === 'ONLINE'
  const isDirect = purchase.category === 'DIRECT'

  // ステータスの計算
  const getStatus = () => {
    if (!isPurchased) return {label: '未購入', color: 'bg-gray-100 text-gray-600'}
    if (isDirect) return {label: '完了', color: 'bg-green-100 text-green-600'}
    if (!isReceived) return {label: '配送中', color: 'bg-yellow-100 text-yellow-600'}
    if (!hasReceipt) return {label: '領収書未', color: 'bg-orange-100 text-orange-600'}
    return {label: '完了', color: 'bg-green-100 text-green-600'}
  }

  const status = getStatus()

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('この画像を削除しますか？')) return

    setDeletingImageId(imageId)
    try {
      const result = await deletePurchaseImage(imageId)
      if (result.success) {
        onUpdated()
      } else {
        alert(result.error)
      }
    } finally {
      setDeletingImageId(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg text-gray-800">{purchase.itemName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>{status.label}</span>
            <span
              className={`px-2 py-0.5 rounded text-xs ${isDirect ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}
            >
              {isDirect ? '直接' : 'ネット'}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">依頼者: {purchase.requester || purchase.PersonRequester?.name || '-'}</div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(purchase)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(purchase)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {purchase.deadline && (
          <div>
            <span className="text-gray-500">期限: </span>
            <span className="text-gray-700">{formatDate(new Date(purchase.deadline), 'MM/DD')}</span>
          </div>
        )}
        {isPurchased && (
          <>
            <div>
              <span className="text-gray-500">注文者: </span>
              <span className="text-gray-700">{purchase.orderer || '-'}</span>
            </div>
            {isDirect && (purchase.PurchaseLocationMaster || (purchase as any).purchaseLocation) && (
              <div>
                <span className="text-gray-500">購入場所: </span>
                <span className="text-gray-700">
                  {purchase.PurchaseLocationMaster?.name || (purchase as any).purchaseLocation}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">支払: </span>
              <span className="text-gray-700">{purchase.paymentMethod || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">決済日: </span>
              <span className="text-gray-700">
                {purchase.paymentDate ? formatDate(new Date(purchase.paymentDate), 'MM/DD') : '-'}
              </span>
            </div>
            {isOnline && (
              <>
                <div>
                  <span className="text-gray-500">到着予定: </span>
                  <span className="text-gray-700">
                    {(purchase as any).expectedArrivalUndefined
                      ? '未定'
                      : purchase.expectedArrival
                        ? formatDate(new Date(purchase.expectedArrival), 'MM/DD')
                        : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">受取: </span>
                  <span className="text-gray-700">
                    {purchase.receivedDate
                      ? `${formatDate(new Date(purchase.receivedDate), 'MM/DD')} (${purchase.receiver})`
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">領収書: </span>
                  <span className="text-gray-700">
                    {purchase.receiptDate ? formatDate(new Date(purchase.receiptDate), 'MM/DD') : '-'}
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {purchase.memo && (
        <div className="mt-2 text-sm text-gray-500">
          <span>備考: </span>
          {purchase.memo}
        </div>
      )}

      {/* アクションボタン */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap">
        {!isPurchased && (
          <button
            onClick={() => onPhase2(purchase)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            購入を記録
          </button>
        )}

        {isPurchased && isOnline && !isReceived && (
          <button
            onClick={() => onPhase3A(purchase)}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            受取を記録
          </button>
        )}

        {isPurchased && isOnline && isReceived && !hasReceipt && (
          <button
            onClick={() => onPhase3B(purchase)}
            className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
          >
            領収書を記録
          </button>
        )}
      </div>

      {/* 画像セクション */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowImages(!showImages)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showImages ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            画像 ({purchase.PurchaseImage.length})
          </button>
          <button onClick={() => setShowUploader(!showUploader)} className="text-xs text-blue-600 hover:text-blue-800">
            + 追加
          </button>
        </div>

        {showUploader && (
          <div className="mt-2">
            <PurchaseImageUploader
              purchaseId={purchase.id}
              onUploaded={() => {
                onUpdated()
                setShowUploader(false)
              }}
            />
          </div>
        )}

        {showImages && purchase.PurchaseImage.length > 0 && (
          <div className="grid grid-cols-4 gap-1 mt-2">
            {purchase.PurchaseImage.map(image => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.originalName}
                  className="w-full h-16 object-cover rounded cursor-pointer"
                  onClick={() => window.open(image.url, '_blank')}
                />
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  disabled={deletingImageId === image.id}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
