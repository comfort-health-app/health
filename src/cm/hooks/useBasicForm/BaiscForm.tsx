'use client'

import React, {Fragment} from 'react'
import {colType, onFormItemBlurType} from '@cm/types/types'
import {C_Stack} from 'src/cm/components/styles/common-components/common-components'
import {FormProvider, UseFormReturn} from 'react-hook-form'
import {AdditionalBasicFormPropType} from 'src/cm/hooks/useBasicForm/useBasicFormProps'
import {useCacheSelectOptionReturnType} from 'src/cm/hooks/useCacheSelectOptions/useCacheSelectOptions'

import {adjustBasicFormProps} from '@cm/hooks/useBasicForm/lib/createBasicFormProps'
import ControlGroup from '@cm/hooks/useBasicForm/molecules/ControlGroup'
import {Card} from '@cm/shadcn/components/ui/card'
import {DynamicGridContainer} from '@cm/components/utils'
import {obj__initializeProperty} from '@cm/class/ObjHandler/transformers'
import {cn} from '@cm/shadcn/lib/utils'

export type useRegisterType = (props: {col: colType; newestRecord: any}) => {
  currentValue: any
  shownButDisabled: boolean
  Register: any
}

export type useResetValueType = (props: {col: colType; field: any}) => void

export type BasicFormType = {
  formData: any
  setformData: any
  values: any
  columns: colType[][]
  latestFormData: any
  extraFormState: any
  setextraFormState: any
  useGlobalProps: any
  Cached_Option_Props: useCacheSelectOptionReturnType
  ReactHookForm: UseFormReturn
  formId: string
  formRef: any
  // useRegister: useRegisterType
  useResetValue: useResetValueType
  onFormItemBlur?: onFormItemBlurType
} & AdditionalBasicFormPropType

const FormSection = React.memo(
  ({columns, ControlOptions, children}: {columns: colType[]; ControlOptions: any; children: React.ReactNode}) => {
    const colFormIndexGroupName = ControlOptions?.showLabel === false ? undefined : columns[0]?.form?.colIndex
    return (
      <>
        {isNaN(colFormIndexGroupName) && colFormIndexGroupName ? (
          <>
            <Card>
              <div className={`  text-primary-main text-center text-lg font-bold `}>{colFormIndexGroupName}</div>
              {children}
            </Card>
          </>
        ) : (
          children
        )}
      </>
    )
  }
)

const BasicForm = (props: BasicFormType) => {
  const {formRef, formId, alignMode, style, ControlOptions, columns, ReactHookForm} = adjustBasicFormProps(props)

  const onSubmit = async e => {
    const handleFormSubmit = props.onSubmit ? ReactHookForm.handleSubmit(props.onSubmit) : undefined
    e.preventDefault()
    const formElement = e.target as HTMLFormElement
    if (formElement?.getAttribute('id') === formId && handleFormSubmit) {
      return await handleFormSubmit(e)
    }
  }

  const ChildComponent = () => {
    if (props.children) {
      return <div className={alignMode === `row` ? `` : 'pb-2 pt-4'}>{props.children}</div>
    }
    return <></>
  }

  const {transposedRowsForForm} = makeFormsByColumnObj(columns)

  return (
    <div className={`w-fit `}>
      <FormProvider {...ReactHookForm}>
        <form {...{ref: formRef, id: formId, onSubmit}}>
          <C_Stack className={`items-center`}>
            <DynamicGridContainer style={style}>
              {transposedRowsForForm.map((columns, i) => {
                return (
                  <Fragment key={i}>
                    <FormSection {...{columns, ControlOptions}}>
                      <div className={cn(alignMode === `row` ? `row-stack` : `col-stack`, `gap-10 gap-x-6`)}>
                        {/* グループ */}
                        {columns.map((col: colType, formItemIndex) => {
                          const uniqueKey = `${i}-${formItemIndex}`
                          return <ControlGroup key={uniqueKey} {...{...props, col, formItemIndex}} />
                        })}

                        {/* ボタン */}
                        {alignMode === `row` && <ChildComponent />}
                      </div>
                    </FormSection>
                  </Fragment>
                )
              })}
            </DynamicGridContainer>

            {alignMode !== `row` && <ChildComponent />}
          </C_Stack>
        </form>
      </FormProvider>
    </div>
  )
}

export default BasicForm

// const useJustifyDirection = ({transposedRowsForForm, useGlobalProps}) => {
//   const {width, SP} = useGlobalProps

//   const [justifyDirection, setjustifyDirection] = useState(`justify-center`)
//   const elems = document?.querySelectorAll(`.formSec`)
//   useEffect(() => {
//     if (elems.length > 0) {
//       const justifyDirection = transposedRowsForForm.length === 1 || SP ? `justify-center` : `justify-start`
//       setjustifyDirection(justifyDirection)
//     }
//   }, [width, transposedRowsForForm, elems, SP])

//   return {justifyDirection}
// }

//カラム作成
const makeFormsByColumnObj = (columns: any) => {
  const validColumnsForEditForm: colType[] = columns.flat().filter(col => col.form && col?.form?.hidden !== true)
  const formsByColumnObj: any = {}

  validColumnsForEditForm.sort((x: colType, y: colType) => {
    return Number(x.originalColIdx) - Number(y.originalColIdx)
  })

  validColumnsForEditForm.forEach((col: colType) => {
    const colIndex = col?.form?.colIndex ?? 0
    obj__initializeProperty(formsByColumnObj, colIndex, [])
    formsByColumnObj[colIndex].push(col)
  })

  const transposedRowsForForm: colType[][] = Object.keys(formsByColumnObj).map(key => {
    return formsByColumnObj[key]
  })
  const colIndexes = Object.keys(formsByColumnObj)

  return {transposedRowsForForm, colIndexes}
}
