import {useRef, useMemo} from 'react'
import {getMyTableDefault} from 'src/cm/constants/defaults'
import {useElementScrollPosition} from '@cm/hooks/scrollPosition/useElementScrollPosition'
import {useSearchHandler} from '@cm/components/DataLogic/TFs/MyTable/components/SearchHandler/useSearchHandler/useSearchHandler'
import {Z_INDEX} from '@cm/lib/constants/constants'

import useTrActions from '../components/Tbody/useTrActions'
import {TableConfigPropsType} from '../components/TableConfig'

import {UseRecordsReturn} from '@cm/components/DataLogic/TFs/PropAdjustor/hooks/useRecords/useRecords'
import {ClientPropsType2} from '@cm/components/DataLogic/TFs/PropAdjustor/types/propAdjustor-types'
import useMyTableParams from '@cm/components/DataLogic/TFs/MyTable/hooks/useMyTableParams'

interface MyTableLogicProps {
  ClientProps2: ClientPropsType2 & {
    UseRecordsReturn?: UseRecordsReturn
  }
}

export const useMyTableLogic = (props: MyTableLogicProps) => {
  const ClientProps2 = useMemo(
    () => ({
      ...props.ClientProps2,
      myTable: {...getMyTableDefault(), ...props.ClientProps2.myTable},
      useGlobalProps: props.ClientProps2?.useGlobalProps,
    }),
    [props.ClientProps2]
  )

  const {editType, columns, dataModelName, setformData, myTable, formData, useGlobalProps, records, setrecords, deleteRecord} =
    ClientProps2

  // 🔧 無限スクロール関連のデータを分離
  const infiniteScrollData = useMemo(() => {
    const {fetchNextPage, hasMore, isInfiniteScrollMode, setInfiniteScrollMode} = ClientProps2.UseRecordsReturn || {}

    return {
      fetchNextPage: fetchNextPage || (() => Promise.resolve()),
      hasMore: hasMore || false,
      isInfiniteScrollMode: isInfiniteScrollMode || false,
      setInfiniteScrollMode,
    }
  }, [ClientProps2.UseRecordsReturn])

  // 🔧 テーブル関連のデータを分離
  const tableData = useMemo(() => {
    const recordCount = records?.length ?? 0
    const totalCount = ClientProps2.totalCount ?? 0
    const {configPosition = 'top', showHeader} = myTable ?? {}

    const emptyDataStyle = {
      width: myTable?.style?.width,
      minWidth: myTable?.style?.minWidth,
      margin: 'auto',
    }

    return {
      records,
      recordCount,
      totalCount,
      configPosition,
      showHeader,
      emptyDataStyle,
    }
  }, [records, ClientProps2.totalCount, myTable])

  // 🔧 MyTableParams関連
  const myTableParamsArgs = useMemo(
    () => ({
      columns,
      dataModelName,
      useGlobalProps,
      myTable,
      records,
      setrecords,
    }),
    [columns, dataModelName, useGlobalProps, myTable, records, setrecords]
  )

  const {
    columnCount,
    tableStyleRef,
    tableStyle,
    methods: {getPaginationProps, handleDragEndMemo},
    dndProps: {items, sensors},
  } = useMyTableParams(myTableParamsArgs)

  // 🔧 TrActions関連
  const trActionsArgs = useMemo(
    () => ({
      records,
      setrecords,
      deleteRecord,
      setformData,
      columns,
      editType,
      myTable,
      dataModelName,
      useGlobalProps,
    }),
    [records, setrecords, deleteRecord, setformData, columns, editType, myTable, dataModelName, useGlobalProps]
  )

  const {RowActionButtonComponent} = useTrActions(trActionsArgs)

  // 🔧 スクロール関連
  const tableId = useMemo(() => ['table', dataModelName, myTable?.tableId].join('_'), [dataModelName, myTable?.tableId])
  const elementRef = useRef<HTMLDivElement>(null)

  useElementScrollPosition({
    elementRef,
    scrollKey: tableId,
  })

  const {SearchingStatusMemo} = useSearchHandler({
    columns: ClientProps2.columns,
    dataModelName: ClientProps2.dataModelName,
    useGlobalProps: ClientProps2.useGlobalProps,
  })

  // 🔧 スタイル関連のデータを分離
  const styleData = useMemo(() => {
    const TableConfigProps: TableConfigPropsType = {
      columns,
      myTable,
      dataModelName,
      useGlobalProps,
      records,
      setformData,
      configPosition: tableData.configPosition,
      getPaginationProps,
      columnCount,
    }

    const rows = ClientProps2.columns
      .filter(cols => {
        return cols.reduce((prev, col) => prev || !col?.td?.hidden, false)
      })
      .map(row => {
        return row.map(col => {
          const withLabel = tableData.showHeader ? false : true
          return {...col, td: {...col.td, withLabel}}
        })
      })

    const mainTableProps = {
      myTable,
      columns,
      elementRef,
      tableStyleRef,
      tableStyle,
      sensors,
      handleDragEndMemo,
      items,
      showHeader: tableData.showHeader,
      TableConfigProps,
      useGlobalProps,
      ClientProps2,
      rows,
      getPaginationProps,
      RowActionButtonComponent,
    }

    const paginationProps = {
      totalCount: ClientProps2.totalCount,
      recordCount: tableData.recordCount,
      myTable,
      getPaginationProps,
      useGlobalProps,
      records,
    }

    const sectionStyle = {
      maxWidth: '80%',
      zIndex: Z_INDEX.thead,
    }

    return {
      TableConfigProps,
      mainTableProps,
      paginationProps,
      sectionStyle,
    }
  }, [
    columns,
    myTable,
    dataModelName,
    useGlobalProps,
    records,
    setformData,
    tableData,
    getPaginationProps,
    columnCount,
    ClientProps2,
    elementRef,
    tableStyleRef,
    tableStyle,
    sensors,
    handleDragEndMemo,
    items,
    RowActionButtonComponent,
  ])

  return {
    ClientProps2,
    infiniteScrollData,
    tableData,
    searchData: {SearchingStatusMemo},
    styleData,
    elementRef,
  }
}
