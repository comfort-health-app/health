'use client'

import useEditableCell from '@cm/components/DataLogic/TFs/MyTable/components/Tbody/TableCell/lib/useEditableCell'

export default function EditableForm({col, record, dataModelName, mutateRecords}) {
  const {RawForm} = useEditableCell({
    col,
    record,
    dataModelName,
    mutateRecords,
  })
  return RawForm
}
