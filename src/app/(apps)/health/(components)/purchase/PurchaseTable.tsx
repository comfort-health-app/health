'use client'

import {PurchaseWithRelations} from '../../(lib)/purchase-actions'
import {formatDate} from '@cm/class/Days/date-utils/formatters'

type Props = {
  purchases: PurchaseWithRelations[]
  onEdit: (purchase: PurchaseWithRelations) => void
  onDelete: (purchase: PurchaseWithRelations) => void
  onPhase2: (purchase: PurchaseWithRelations) => void
  onPhase3A: (purchase: PurchaseWithRelations) => void
  onPhase3B: (purchase: PurchaseWithRelations) => void
}

export default function PurchaseTable({purchases, onEdit, onDelete, onPhase2, onPhase3A, onPhase3B}: Props) {
  const getStatus = (purchase: PurchaseWithRelations) => {
    const isPurchased = !!purchase.paymentDate
    const isReceived = !!purchase.receivedDate
    const hasReceipt = !!purchase.receiptDate
    const isDirect = purchase.category === 'DIRECT'

    if (!isPurchased) return {label: '未購入', color: 'bg-gray-100 text-gray-600'}
    if (isDirect) return {label: '完了', color: 'bg-green-100 text-green-600'}
    if (!isReceived) return {label: '配送中', color: 'bg-yellow-100 text-yellow-600'}
    if (!hasReceipt) return {label: '領収書未', color: 'bg-orange-100 text-orange-600'}
    return {label: '完了', color: 'bg-green-100 text-green-600'}
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">区分</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">依頼者</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">期限</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">決済日</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">到着予定</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受取日</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases.map(purchase => {
              const status = getStatus(purchase)
              const isPurchased = !!purchase.paymentDate
              const isReceived = !!purchase.receivedDate
              const hasReceipt = !!purchase.receiptDate
              const isOnline = purchase.category === 'ONLINE'

              return (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{purchase.itemName}</div>
                    {purchase.memo && <div className="text-xs text-gray-500 mt-1">{purchase.memo}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        purchase.category === 'DIRECT' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      {purchase.category === 'DIRECT' ? '直接' : 'ネット'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{purchase.requester}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {purchase.deadline ? formatDate(new Date(purchase.deadline), 'MM/DD') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {purchase.paymentDate ? formatDate(new Date(purchase.paymentDate), 'MM/DD') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {purchase.expectedArrival ? formatDate(new Date(purchase.expectedArrival), 'MM/DD') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {purchase.receivedDate
                      ? `${formatDate(new Date(purchase.receivedDate), 'MM/DD')}${purchase.receiver ? ` (${purchase.receiver})` : ''}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(purchase)} className="text-blue-600 hover:text-blue-800" title="編集">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      {!isPurchased && (
                        <button
                          onClick={() => onPhase2(purchase)}
                          className="text-green-600 hover:text-green-800"
                          title="購入を記録"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      )}
                      {isPurchased && isOnline && !isReceived && (
                        <button
                          onClick={() => onPhase3A(purchase)}
                          className="text-green-600 hover:text-green-800"
                          title="受取を記録"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </button>
                      )}
                      {isPurchased && isOnline && isReceived && !hasReceipt && (
                        <button
                          onClick={() => onPhase3B(purchase)}
                          className="text-orange-600 hover:text-orange-800"
                          title="領収書を記録"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => onDelete(purchase)} className="text-red-600 hover:text-red-800" title="削除">
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
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
