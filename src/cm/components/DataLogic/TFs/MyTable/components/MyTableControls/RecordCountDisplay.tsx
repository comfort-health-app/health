import React from 'react'

interface RecordCountDisplayProps {
  isInfiniteScrollMode: boolean
  recordCount: number
  totalCount: number
  hasMore: boolean
  getPaginationProps: (args: {totalCount: number}) => any
  isRestoredFromCache?: boolean
}

export const RecordCountDisplay = React.memo<RecordCountDisplayProps>(
  ({isInfiniteScrollMode, recordCount, totalCount, hasMore, getPaginationProps, isRestoredFromCache = false}) => {
    if (isInfiniteScrollMode) {
      // 無限スクロールモードの場合
      const percentage = totalCount > 0 ? Math.round((recordCount / totalCount) * 100) : 0
      return (
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-gray-600">
            <span>
              {recordCount.toLocaleString()}件 / {totalCount.toLocaleString()}件{' '}
            </span>
            {/* <span> ({percentage}%)</span> */}
            {/* {hasMore && <span className="text-blue-500 ml-1">読み込み可能</span>} */}
            {isRestoredFromCache && <span className="text-green-500 ml-1">📋</span>}
          </span>
        </div>
      )
    } else {
      // ページネーションモードの場合
      const paginationInfo = getPaginationProps({totalCount})
      const {from, to} = paginationInfo || {}

      if (from && to && totalCount > 0) {
        return (
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-gray-600">
              {from.toLocaleString()}-{to.toLocaleString()}件 / {totalCount.toLocaleString()}件
              {isRestoredFromCache && <span className="text-green-500 ml-1">📋</span>}
            </span>
          </div>
        )
      } else if (recordCount > 0) {
        return (
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-gray-600">
              {recordCount.toLocaleString()}件{totalCount > 0 && ` / ${totalCount.toLocaleString()}件`}
              {isRestoredFromCache && <span className="text-green-500 ml-1">📋</span>}
            </span>
          </div>
        )
      }
    }
    return null
  }
)

RecordCountDisplay.displayName = 'RecordCountDisplay'
