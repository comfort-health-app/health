'use client'
import {R_Stack} from 'src/cm/components/styles/common-components/common-components'

import React, {useMemo} from 'react'
import {cn} from '@cm/shadcn/lib/utils'

export const DisplayedState = React.memo((props: {col; record; value}) => {
  const {col, record, value} = props
  const rStackClass = useMemo(() => getR_StackClass(col), [col?.type])

  return (
    <R_Stack
      id={`${col.id}-${record.id}`}
      className={cn(
        //
        `  h-full items-start  break-words  `,
        rStackClass
      )}
    >
      <div className={`text-start `}>{value}</div>
      {col.affix?.label && <div>{renderAffix()}</div>}
    </R_Stack>
  )

  function renderAffix() {
    return <span style={{marginLeft: 1, color: 'gray', fontSize: '0.6rem'}}>{col.affix.label}</span>
  }
})

export function getR_StackClass(col) {
  // const convertedType = DH__switchColType({type: col.type})
  let rStackClass = `justify-center`

  if (col.type === 'number') {
    rStackClass = 'justify-end'
  }
  if (col.type === 'text') {
    rStackClass = 'justify-start'
  }

  if (col.forSelect) {
    rStackClass = 'justify-center'
  }

  return rStackClass
}
