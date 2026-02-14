'use client'

import {BasicFormType} from '@cm/hooks/useBasicForm/BaiscForm'
import {getFormProps, getStyleProps} from '@cm/hooks/useBasicForm/lib/hookformMethods'
import React, {Fragment, useCallback} from 'react'
import {Controller} from 'react-hook-form'
import {ControlContextType} from '@cm/types/form-control-type'
import {liftUpNewValueOnChange} from '@cm/components/DataLogic/TFs/MyForm/MyForm'
import {DH__switchColType} from '@cm/class/DataHandler/type-converter'
import Label from '@cm/components/DataLogic/TFs/MyForm/components/HookFormControl/util-components/Label'
import {cn} from '@cm/shadcn/lib/utils'
import {Alert} from '@cm/components/styles/common-components/Alert'
import LeftControlRight from './LeftControlRight'
import Description from './Description'

export type ControlGroupPropType = BasicFormType & {
  col
  formItemIndex
  latestFormData
}
export const ControlGroup = React.memo((props: ControlGroupPropType) => {
  const {ReactHookForm, formData, useResetValue, latestFormData, formId, ControlOptions, col, columns} = props

  const messages = ReactHookForm?.formState?.errors
  const {Register} = col

  if (!col?.id && col?.label) {
    return (
      <Fragment>
        <Alert>col.label error</Alert>
      </Fragment>
    )
  } else {
    return (
      <Controller
        name={col.id}
        control={ReactHookForm.control}
        render={({field}) => {
          const errorMessage = messages?.[col.id]?.message?.toString()

          const {id: wrapperId, ControlStyle, isBooleanType} = getStyleProps({ControlOptions, col})

          const currentValue = props.ReactHookForm?.getValues(col.id)

          const type = DH__switchColType({type: col.type})
          const pointerClass = type === `boolean` ? ' cursor-pointer' : ''

          const required = !!col?.form?.register?.required

          col.inputProps = {
            ...col.inputProps,
            placeholder: col.inputProps?.placeholder,
            required,
          }

          const controlContextValue: ControlContextType = {
            ...props,
            ControlStyle,
            ControlOptions,
            errorMessage,
            formId,
            col,
            wrapperId,
            columns,
            field,
            isBooleanType,
            currentValue,
            Register,
            formProps: getFormProps({ControlOptions, isBooleanType, Register, col, errorMessage, currentValue}),
            liftUpNewValueOnChange,
            useResetValue,
            pointerClass,
            type,
          }
          const horizontal = props.alignMode === `row`

          const showDescription = ControlOptions?.showDescription !== false && col.form?.descriptionNoteAfter

          const {reverseLabelTitle} = col.form

          const LabelCallback = useCallback(
            (props: {position: 'left' | 'right'}) => {
              const {position} = props

              if (position === 'left') {
                return (
                  !reverseLabelTitle && (
                    <section className={cn(horizontal ? 'mr-1' : `mb-2`, 'min-w-fit')}>
                      <Label {...{ReactHookForm, col, ControlOptions, required}} />
                    </section>
                  )
                )
              }
              if (position === 'right') {
                return <div>{reverseLabelTitle && <Label {...{ReactHookForm, col, ControlOptions, required}} />}</div>
              }

              return <></>
            },
            [ReactHookForm, reverseLabelTitle, ControlOptions, required, col]
          )

          const offset = 0
          const style = !horizontal
            ? {
                // width: getOffsetWidth(ControlStyle.width, offset),
                // minWidth: getOffsetWidth(ControlStyle.minWidth, offset),
                // maxWidth: getOffsetWidth(ControlStyle.maxWidth, offset),
              }
            : undefined

          return (
            <div
              id={wrapperId}
              style={style}
              className={cn(` ${DH__switchColType({type: col.type}) === `boolean` ? ' cursor-pointer' : ''}  relative `)}
            >
              <div
                className={cn(
                  //
                  `gap-0 w-full`,
                  horizontal ? 'row-stack flex-nowrap　items-center ' : 'col-stack'
                )}
              >
                <LabelCallback position="left" />
                <div>
                  <LeftControlRight
                    {...{
                      col,
                      controlContextValue,
                      shownButDisabled: ControlOptions?.shownButDisabled ?? false,
                    }}
                  />
                </div>
                {showDescription && (
                  <Description
                    {...{
                      col,
                      ControlStyle,
                      currentValue,
                      formData,
                      latestFormData,
                    }}
                  />
                )}

                <LabelCallback position="right" />
              </div>
            </div>
          )
        }}
      />
    )
  }
})

export default ControlGroup
