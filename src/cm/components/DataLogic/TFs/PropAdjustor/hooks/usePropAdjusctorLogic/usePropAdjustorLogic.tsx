import {useMemo} from 'react'

import {useMergeWithCustomViewParams} from '@cm/components/DataLogic/TFs/PropAdjustor/hooks/usePropAdjusctorLogic/useMergeWithCustomViewParams'
import useColumns from '@cm/components/DataLogic/TFs/PropAdjustor/hooks/usePropAdjusctorLogic/useColumns'
import useRecords, {UseRecordsReturn} from '@cm/components/DataLogic/TFs/PropAdjustor/hooks/useRecords/useRecords'
import useInitFormState from '@cm/hooks/useInitFormState'
import useEditForm from '@cm/components/DataLogic/TFs/PropAdjustor/hooks/usePropAdjusctorLogic/useEditForm'
import useMyTable from '@cm/components/DataLogic/TFs/PropAdjustor/hooks/usePropAdjusctorLogic/useMyTable'
import useAdditional from '@cm/components/DataLogic/TFs/PropAdjustor/hooks/usePropAdjusctorLogic/useAdditional'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'

import {ClientPropsType2, UsePropAdjustorLogicProps} from '@cm/components/DataLogic/TFs/PropAdjustor/types/propAdjustor-types'

// usePropAdjustorLogic
export const usePropAdjustorLogic = ({
  ClientProps,
  serverFetchProps,
  initialModelRecords,
  fetchTime,
}: UsePropAdjustorLogicProps) => {
  const useGlobalProps = useGlobal()

  const UseRecordsReturn: UseRecordsReturn = useRecords({
    serverFetchProps,
    initialModelRecords,
    fetchTime,
  })

  const {prismaDataExtractionQuery, easySearchPrismaDataOnServer} = UseRecordsReturn
  const modelData = useMemo(() => UseRecordsReturn?.records?.[0], [UseRecordsReturn?.records])
  const {formData, setformData} = useInitFormState(null, [modelData])

  const columns = useColumns({
    useGlobalProps,
    UseRecordsReturn,
    dataModelName: ClientProps.dataModelName,
    ColBuilder: ClientProps.ColBuilder,
    ColBuilderExtraProps: ClientProps.ColBuilderExtraProps,
  })

  const additional = useAdditional({
    additional: ClientProps.additional,
    prismaDataExtractionQuery,
  })

  const EditForm = useEditForm({
    PageBuilderGetter: ClientProps.PageBuilderGetter,
    PageBuilder: ClientProps.PageBuilder,
    dataModelName: ClientProps.dataModelName,
  })

  const myTable = useMyTable({
    columns,
    displayStyle: ClientProps.displayStyle,
    myTable: ClientProps.myTable,
  })

  const ClientProps2: ClientPropsType2 = useMergeWithCustomViewParams({
    ...ClientProps,
    ...UseRecordsReturn,
    additional,
    EditForm,
    myTable,
    useGlobalProps,
    columns,
    formData,
    setformData,
    UseRecordsReturn,
    prismaDataExtractionQuery,
  })

  return {
    ClientProps2,
    UseRecordsReturn,
    modelData,
    easySearchPrismaDataOnServer,
    useGlobalProps,
  }
}
