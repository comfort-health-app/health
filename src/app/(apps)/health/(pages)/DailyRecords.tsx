'use client'

import {formatDate} from '@cm/class/Days/date-utils/formatters'
import {HEALTH_CATEGORY_LABELS, HEALTH_CATEGORY_COLORS} from '../(constants)/types'
import {CsvTable} from '@cm/components/styles/common-components/CsvTable/CsvTable'
import {COLORS} from '@cm/lib/constants/constants'

interface HealthRecord {
  id: number
  category: string
  recordDate: string
  recordTime: string
  bloodSugarValue?: number
  Medicine?: {
    name: string
  }
  medicineUnit?: number
  walkingShortDistance?: number
  walkingMediumDistance?: number
  walkingLongDistance?: number
  walkingExercise?: number
  memo?: string
}

interface DailyRecordsProps {
  userId: number
  date: string
  records: HealthRecord[]
  onEdit: (record: HealthRecord) => void
  onDelete: (id: number) => void
  refreshTrigger?: number
}

export default function DailyRecords({userId, date, records, onEdit, onDelete, refreshTrigger}: DailyRecordsProps) {
  const formatRemarks = (record: HealthRecord) => {
    const parts: string[] = []

    if (record.category === 'medicine' && record.Medicine) {
      parts.push(record.Medicine.name)
      if (record.medicineUnit) {
        parts.push(`${record.medicineUnit}単位`)
      }
    } else if (record.category === 'blood_sugar' && record.bloodSugarValue) {
      parts.push(`${record.bloodSugarValue}`)
    }

    if (record.memo) {
      parts.push(record.memo)
    }

    return parts.join(' / ')
  }

  const getWalkingData = (record: HealthRecord) => {
    if (record.category !== 'walking') return null

    return {
      shortDistance: record.walkingShortDistance || 0,
      mediumDistance: record.walkingMediumDistance || 0,
      longDistance: record.walkingLongDistance || 0,
      exercise: record.walkingExercise || 0,
    }
  }

  const tdBorderClass = 'border-b-2 border-gray-300 border-r-[1px] !p-1 !px-2 text-sm'

  return (
    <>
      <div>
        {records.length === 0 ? (
          <p className="text-gray-500 text-center py-8">この日の記録はありません</p>
        ) : (
          <div className={``}>
            {CsvTable({
              records: records.map(record => {
                const walkingData = getWalkingData(record)
                return {
                  csvTableRow: [
                    {
                      label: '時刻',
                      style: {
                        minWidth: 50,
                        position: 'sticky',
                        left: 0,
                        background: COLORS.table.thead,
                      },
                      className: tdBorderClass,
                      // cellValue: record.recordDate + ' ' + record.recordTime,
                      cellValue: formatDate(new Date(`${formatDate(record.recordDate)} ${record.recordTime}`), 'M/D(ddd)HH:mm'),
                    },
                    {
                      label: 'カテゴリ',
                      style: {minWidth: 90},
                      className: tdBorderClass,
                      cellValue: (
                        <div
                          className="px-2 py-1 rounded-md"
                          style={{
                            backgroundColor:
                              HEALTH_CATEGORY_COLORS[record.category as keyof typeof HEALTH_CATEGORY_COLORS] + '20',
                            color: HEALTH_CATEGORY_COLORS[record.category as keyof typeof HEALTH_CATEGORY_COLORS],
                          }}
                        >
                          {HEALTH_CATEGORY_LABELS[record.category as keyof typeof HEALTH_CATEGORY_LABELS]}
                        </div>
                      ),
                    },
                    {
                      label: '備考',
                      style: {minWidth: 160},
                      className: tdBorderClass,
                      cellValue: record.category === 'walking' ? '' : formatRemarks(record),
                    },
                    {
                      label: '短距離',
                      style: {minWidth: 50},
                      className: tdBorderClass,
                      cellValue: walkingData ? walkingData.shortDistance || '' : '',
                    },
                    {
                      label: '中距離',
                      style: {minWidth: 50},
                      className: tdBorderClass,
                      cellValue: walkingData ? walkingData.mediumDistance || '' : '',
                    },
                    {
                      label: '長距離',
                      style: {minWidth: 50},
                      className: tdBorderClass,
                      cellValue: walkingData ? walkingData.longDistance || '' : '',
                    },
                    {
                      label: '運動',
                      style: {minWidth: 50},
                      className: tdBorderClass,
                      cellValue: walkingData ? walkingData.exercise || '' : '',
                    },
                    {
                      label: '操作',
                      style: {minWidth: 50},
                      className: tdBorderClass,
                      cellValue: (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => onEdit(record)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => onDelete(record.id)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          >
                            削除
                          </button>
                        </div>
                      ),
                    },
                  ],
                }
              }),
            }).WithWrapper({className: '!max-w-[90vw] max-h-none overflow-auto'})}
          </div>
        )}
      </div>
    </>
  )
}
