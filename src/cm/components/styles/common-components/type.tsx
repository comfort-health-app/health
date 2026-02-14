import {CSSProperties} from 'react'
import {twMerge} from 'tailwind-merge'

export type htmlProps = {
  id?: string
  className?: string
  ref?: any
  style?: CSSProperties
  type?: 'button' | 'submit'
  disabled?: boolean

  onClick?: any
  onKeyDown?: any
  onBlur?: any
  onMouseEnter?: any
  onMouseLeave?: any
  onMouseDown?: any

  children?: React.ReactNode
}

export type elementNameString = `wrapper` | `label` | `value`
export type customClasses = {
  [key in elementNameString]?: string
}
export type customStyles = {
  [key in elementNameString]?: CSSProperties
}

export type styling = {
  classes?: customClasses
  styles?: customStyles
}

export const mergeHtmlProps = (htmlProps: htmlProps, uniqueProps?: any) => {
  const newObject = {...htmlProps}
  Object.keys(uniqueProps ?? {}).forEach(key => {
    if (typeof uniqueProps[key] === `object`) {
      newObject[key] = {...uniqueProps[key], ...newObject[key]}
    }
  })

  if (uniqueProps.className) {
    if (newObject.className) {
      newObject.className = twMerge(uniqueProps.className, newObject.className)
    } else {
      newObject.className = uniqueProps.className
    }
  }

  return newObject
}
