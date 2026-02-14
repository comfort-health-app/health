import {cn} from '@cm/shadcn/lib/utils'
import {R_Stack} from '@cm/components/styles/common-components/common-components'
import EmptyPlaceholder from '@cm/components/utils/loader/EmptyPlaceHolder'
import {ReactNode} from 'react'
import {htmlProps, styling} from 'src/cm/components/styles/common-components/type'
import {cl} from 'src/cm/lib/methods/common'

const getStyles = styling => {
  const {wrapper, label, value} = styling?.styles ?? {}
  return {wrapper, label, value}
}
const getClasses = styling => {
  const {
    wrapper = `p-1 leading-4 col-stack gap-0.5`,
    label = cn(
      //
      `text-xs  text-gray-500 px-1 py-0.5 gap-0`,
      `bg-gradient-to-r from-gray-100 to-gray-50`,
      `rounded-lg shadow-sm`,
      `transition-all duration-200 hover:shadow-md`
    ),
    value = ``,
  } = styling?.classes ?? {}
  return {wrapper, label, value}
}

const spread = (styling, key: `label` | `value` | `wrapper`) => {
  return {
    style: getStyles(styling)[key],
    className: getClasses(styling)[key],
  }
}

export const LabelValue = (props: htmlProps & {label?: any; value?: any; styling?: styling; children?: any}) => {
  const {styling, label, value, className, style, children, ...rest} = props

  return (
    <div
      style={spread(styling, `wrapper`).style}
      className={cl(`row-stack  flex-nowrap items-center gap-1 `, spread(styling, `wrapper`).className)}
      {...rest}
    >
      {label && (
        <dt>
          <R_Stack {...spread(styling, `label`)}>
            <div>{label}</div>
            <span className={!label ? 'opacity-0' : ''}>:</span>
          </R_Stack>
        </dt>
      )}

      {(value || children) && (
        <dd {...spread(styling, `value`)}>
          <span>{value || children}</span>
        </dd>
      )}
    </div>
  )
}
export const ParameterCard = (props: {label: any; value: any; styling?: styling; children?: any}) => {
  const {label, value, children, styling} = props

  return (
    <div className={`relative w-fit border-[.0313rem] shadow-md`}>
      <div className={`border-primary-main  absolute left-0 h-full border-l-[.25rem]`} style={{minWidth: 5}}></div>
      <div style={getStyles(styling).wrapper} className={getClasses(styling).wrapper}>
        <div style={getStyles(styling).label} className={getClasses(styling).label}>
          {label}
        </div>
        <div style={getStyles(styling).value} className={getClasses(styling).value}>
          {value || children}
        </div>
      </div>
    </div>
  )
}

export const KeyValue = (props: {label: string; children?: ReactNode}) => {
  return (
    <R_Stack className={`gap-[2px] `}>
      {props.label && <small>{props.label}:</small>}
      {props.children ? (
        <span className={`text-sm`}>{props.children}</span>
      ) : (
        <EmptyPlaceholder className={`text-orange-500`}>-</EmptyPlaceholder>
      )}
    </R_Stack>
  )
}
