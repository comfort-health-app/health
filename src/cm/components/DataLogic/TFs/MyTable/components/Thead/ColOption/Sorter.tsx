import {Button} from 'src/cm/components/styles/common-components/Button'
import {C_Stack, R_Stack} from 'src/cm/components/styles/common-components/common-components'

import {ChevronDownIcon, ChevronUpIcon} from 'lucide-react'

export const Sorter = ({col, addQuery, query}) => {
  const set = key => {
    addQuery({orderBy: key ? col.id : undefined, orderDirection: key})
  }
  const btnClass = `row-stack onHover gap-0.5 t-btn px-4  `

  const btns = [
    {
      label: `昇順`,
      key: `asc`,
      icon: <ChevronUpIcon className={`w-6`} />,
    },
    {
      label: `降順`,
      key: `desc`,
      icon: <ChevronDownIcon className={`w-6`} />,
    },
    {
      label: `解除`,
      key: undefined,
      icon: null,
    },
  ]

  return (
    <div className={`text-sm`}>
      <C_Stack className={` items-start gap-2`}>
        <div>
          <strong>{col.label}</strong>が
        </div>
        <R_Stack className={`gap-4 text-gray-700`}>
          {btns.map((b, i) => {
            const colid = col.id
            const activeByKey = b.key === query.orderDirection
            const activeByColId = colid === query.orderBy
            const active = query.orderDirection && activeByKey && activeByColId
            return (
              <div key={i}>
                <Button color={active ? `blue` : `gray`} className={btnClass} onClick={() => set(b.key)}>
                  {b.icon}
                  {b.label}
                </Button>
              </div>
            )
          })}
        </R_Stack>
      </C_Stack>
    </div>
  )
}

export const SortIcon = (props: {isSet; direction: `asc` | `desc`}) => {
  const {direction, isSet} = props
  const color = direction === 'asc' ? 'text-error-main' : 'text-blue-main'
  const iconClass = `w-5 absolute ${color}`

  return (
    <div className={` onHover relative h-4  w-4 rounded-full text-sm    `}>
      <ChevronUpIcon className={`${iconClass} ${direction === `asc` && isSet ? `` : `opacity-20`} -top-[4px]`} />
      <ChevronDownIcon className={`${iconClass} ${direction === `desc` && isSet ? `` : `opacity-20`}  top-[2px]`} />
    </div>
  )
}
export default Sorter
