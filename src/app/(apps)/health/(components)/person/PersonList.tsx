'use client'

import {useState, useEffect, useCallback} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {getPersons, createPerson, updatePerson, deletePerson, PersonWithRelations} from '../../(lib)/person-actions'

type ModalType = 'create' | 'edit' | null

export default function PersonList() {
  const {session} = useGlobal()
  const [persons, setPersons] = useState<PersonWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedPerson, setSelectedPerson] = useState<PersonWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({name: '', active: true})

  const fetchPersons = useCallback(async () => {
    if (!session?.id) return

    setIsLoading(true)
    try {
      const result = await getPersons(session.id)
      if (result.success && result.data) {
        setPersons(result.data)
      }
    } catch (error) {
      console.error('担当者取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.id])

  useEffect(() => {
    fetchPersons()
  }, [fetchPersons])

  const handleCreate = async () => {
    if (!session?.id) return
    if (!formData.name.trim()) {
      alert('担当者名を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createPerson({
        userId: session.id,
        name: formData.name,
        active: formData.active,
      })
      if (result.success) {
        await fetchPersons()
        closeModal()
      } else {
        alert(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedPerson) return
    if (!formData.name.trim()) {
      alert('担当者名を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updatePerson(selectedPerson.id, {
        name: formData.name,
        active: formData.active,
      })
      if (result.success) {
        await fetchPersons()
        closeModal()
      } else {
        alert(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (person: PersonWithRelations) => {
    if (!confirm(`「${person.name}」を削除しますか？`)) return

    const result = await deletePerson(person.id)
    if (result.success) {
      await fetchPersons()
    } else {
      alert(result.error)
    }
  }

  const openCreate = () => {
    setFormData({name: '', active: true})
    setSelectedPerson(null)
    setModalType('create')
  }

  const openEdit = (person: PersonWithRelations) => {
    setFormData({name: person.name, active: person.active})
    setSelectedPerson(person)
    setModalType('edit')
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedPerson(null)
    setFormData({name: '', active: true})
  }

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>ログインが必要です</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 mx-auto w-fit">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">担当者マスタ</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          + 新規登録
        </button>
      </div>

      {/* リスト */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : persons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>担当者が登録されていません</p>
          <button onClick={openCreate} className="mt-4 text-blue-600 hover:underline">
            最初の担当者を登録する
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">担当者名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {persons.map(person => (
                <tr key={person.id} className={person.active ? '' : 'opacity-60'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{person.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {person.active ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">有効</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">無効</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEdit(person)} className="text-blue-600 hover:text-blue-900 mr-4">
                      編集
                    </button>
                    <button onClick={() => handleDelete(person)} className="text-red-600 hover:text-red-900">
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* モーダル */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{modalType === 'create' ? '担当者を登録' : '担当者を編集'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  担当者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：田中"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({...formData, active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">有効</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-4 mt-4">
              <button
                onClick={modalType === 'create' ? handleCreate : handleUpdate}
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '保存中...' : '保存'}
              </button>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
