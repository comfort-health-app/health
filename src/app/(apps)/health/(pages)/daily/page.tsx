'use client'

import {useState, useEffect} from 'react'
import HealthRecordForm from '../HealthRecordForm'
import DailyRecords from '../DailyRecords'
import DailyChart from '../../(components)/DailyChart/DailyChart'
import {HealthRecordFormData} from '../../(constants)/types'
import {doStandardPrisma} from '@cm/lib/server-actions/common-server-actions/doStandardPrisma/doStandardPrisma'
import {getMidnight} from '@cm/class/Days/date-utils/calculations'
import {Days} from '@cm/class/Days/Days'
import {toastByResult} from '@cm/lib/ui/notifications'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import useModal from '@cm/components/utils/modal/useModal'
import {Paper} from '@cm/components/styles/common-components/paper'
import useWindowSize from '@cm/hooks/useWindowSize'
import {HealthService} from '@app/(apps)/health/(lib)/healthService'
import {Padding} from '@cm/components/styles/common-components/common-components'

// useGlobalの型定義（実際の実装に合わせて調整してください）
interface User {
  id: number
  name: string
}

export default function HealthPage() {
  const {session, query, addQuery} = useGlobal()
  const {PC} = useWindowSize()

  const selectedDate: string = query.date ? query.date : formatDate(getMidnight())
  const setSelectedDate = value => addQuery({date: value})

  const {open: showForm, setopen: setShowForm, Modal} = useModal({alertOnClose: true})
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [records, setRecords] = useState<any[]>([])

  // 日別レコードを取得（案A設計：recordDateがISO形式での検索）
  const fetchDailyRecords = async () => {
    if (!session?.id) return

    try {
      // 指定日の範囲を計算（前日7:00〜当日7:00）

      const {startDate, endDate} = await HealthService.getRecordDateWhere(selectedDate)

      const result = await doStandardPrisma('healthRecord', 'findMany', {
        where: {
          userId: session.id,
          recordDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {Medicine: true},
        orderBy: [{recordDate: 'asc'}, {recordTime: 'asc'}],
      })

      if (result.success) {
        const after7 = Days.hour.add(startDate, 7)
        const before7 = Days.hour.add(endDate, 7)

        const filterByTime = result.result
          .map(rec => {
            return {
              ...rec,
              recordDateTime: new Date(`${formatDate(rec.recordDate, 'YYYY-MM-DD')} ${rec.recordTime}`),
            }
          })
          .filter(record => {
            const isAfter7 = record.recordDateTime.getTime() >= after7.getTime()
            const isBefore7 = record.recordDateTime.getTime() < before7.getTime()
            return isAfter7 && isBefore7
          })
          .sort((a, b) => a.recordDateTime.getTime() - b.recordDateTime.getTime())

        setRecords(filterByTime)
      }
    } catch (error) {
      console.error('レコード取得エラー:', error)
    }
  }

  useEffect(() => {
    fetchDailyRecords()
  }, [session, selectedDate, refreshTrigger])

  const handleFormSubmit = async (data: HealthRecordFormData) => {
    const {recordDate, recordTime, ...rest} = data

    const recordDateISO = getMidnight(new Date(recordDate))

    const payload = {
      userId: session.id,
      recordDate: recordDateISO,
      recordTime,
      ...rest,
    }

    try {
      const result = await doStandardPrisma('healthRecord', 'upsert', {
        where: {
          id: editingRecord?.id || 0,
        },
        create: payload,
        update: payload,
      })

      toastByResult(result)

      // フォームを閉じて、一覧を更新
      setShowForm(false)
      setEditingRecord(null)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('送信エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const handleBulkFormSubmit = async (dataArray: HealthRecordFormData[]) => {
    try {
      const results: any[] = []

      for (const data of dataArray) {
        const {recordDate, recordTime, ...rest} = data
        const recordDateISO = getMidnight(new Date(recordDate))

        const payload = {
          userId: session.id,
          recordDate: recordDateISO,
          recordTime,
          ...rest,
        }

        const result = await doStandardPrisma('healthRecord', 'create', {
          data: payload,
        })

        results.push(result)
      }

      // すべて成功した場合
      if (results.every((r: any) => r.success)) {
        alert(`${dataArray.length}件の記録を登録しました`)
        setShowForm(false)
        setRefreshTrigger(prev => prev + 1)
      } else {
        const successCount = results.filter((r: any) => r.success).length
        alert(`${successCount}/${dataArray.length}件の記録を登録しました（一部失敗）`)
        setRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('一括送信エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この記録を削除しますか？')) {
      return
    }

    try {
      const result = await doStandardPrisma('healthRecord', 'delete', {
        where: {id},
      })

      if (result.success) {
        alert('記録を削除しました')
        setRefreshTrigger(prev => prev + 1)
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const handleNewRecord = () => {
    setEditingRecord(null)
    setShowForm(true)
  }

  if (!session) {
    return <div className="p-4 text-center">ログインが必要です</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-1">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* ヘッダー */}
        <Paper>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">
              <div>健康記録</div>
            </h1>
          </div>

          {/* 日付選択 */}
          <div className="flex gap-4 items-center justify-between">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button onClick={handleNewRecord} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              新規登録
            </button>
          </div>
        </Paper>

        {/* フォーム */}
        <Modal>
          <Padding>
            <HealthRecordForm
              onSubmit={handleFormSubmit}
              onBulkSubmit={handleBulkFormSubmit}
              initialData={
                editingRecord
                  ? {
                      category: editingRecord.category,
                      recordDate: formatDate(new Date(editingRecord.recordDate || selectedDate), 'YYYY-MM-DD'),
                      recordTime: editingRecord.recordTime,
                      bloodSugarValue: editingRecord.bloodSugarValue,
                      medicineId: editingRecord.medicineId,
                      medicineUnit: editingRecord.medicineUnit,
                      walkingShortDistance: editingRecord.walkingShortDistance,
                      walkingMediumDistance: editingRecord.walkingMediumDistance,
                      walkingLongDistance: editingRecord.walkingLongDistance,
                      walkingExercise: editingRecord.walkingExercise,
                      memo: editingRecord.memo,
                    }
                  : {recordDate: selectedDate}
              }
              isEditing={!!editingRecord}
              selectedDate={selectedDate}
            />
          </Padding>
        </Modal>

        {/* グラフ表示 */}
        {PC && (
          <Paper>
            <DailyChart records={records} selectedDate={selectedDate} />
          </Paper>
        )}

        {/* 日別記録一覧 */}
        <Paper className={`px-0`}>
          <DailyRecords
            userId={session.id}
            date={selectedDate}
            records={records}
            onEdit={handleEdit}
            onDelete={handleDelete}
            refreshTrigger={refreshTrigger}
          />
        </Paper>
      </div>
    </div>
  )
}
