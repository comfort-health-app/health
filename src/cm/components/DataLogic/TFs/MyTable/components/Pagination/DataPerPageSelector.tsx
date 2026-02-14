import {R_Stack} from 'src/cm/components/styles/common-components/common-components'
import {cl} from 'src/cm/lib/methods/common'

const DataPerPageSelector = ({take, changeDataPerPage, totalCount, page, countPerPage, partClasses}) => {
  return (
    <R_Stack className={` border-primary-main     `}>
      <div className={cl(partClasses.inputGroupClass, `   `)}>
        <label className={partClasses.labelClass}>表示数</label>
        <select
          className={partClasses.selectClass}
          value={take}
          onChange={e => {
            changeDataPerPage(e, page)
          }}
        >
          {[Math.min(countPerPage), 100, 300, 500, Math.max(1000, totalCount)].map(count => {
            return <option key={count}>{count}</option>
          })}
        </select>
      </div>
    </R_Stack>
  )
}
export default DataPerPageSelector
