import {JSX} from 'react'
// --- フォーム全体の型 ---
import type {ControlOptionType} from '@cm/types/form-control-type'
import type {JSXReturnFunc, anyObject, onFormItemBlurType} from './utility-types'

export type upsertControllerType =
  | {
      validateUpdate?: (props: any) => Promise<any>
      executeUpdate?: (props: any) => Promise<any>
      finalizeUpdate?: (props: {res: any; formData: any}) => void
    }
  | boolean

type myformCreateDeleteMethod = ((props: any) => void) | boolean | anyObject

export type MyFormType = {
  create?: upsertControllerType
  delete?: myformCreateDeleteMethod
  style?: anyObject
  className?: string
  showHeader?: (formData: anyObject) => JSX.Element
  customActions?: JSXReturnFunc
  caption?: JSX.Element | string
  basicFormClassName?: string
  basicFormControlOptions?: ControlOptionType
  onFormItemBlur?: onFormItemBlurType
}
