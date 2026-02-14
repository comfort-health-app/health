import {useRegisterOrigin} from '@cm/hooks/useBasicForm/lib/useRegisterOrigin'

export const adjustBasicFormProps = props => {
  const {alignMode = `col`, ControlOptions = {}, ...restProps} = props

  if (alignMode === 'row') {
    ControlOptions.ControlStyle = {...ControlOptions?.ControlStyle, minHeight: undefined}
    ControlOptions.direction = 'horizontal'
  }

  const {latestFormData, ReactHookForm, onFormItemBlur, formData} = restProps
  const columns = props.columns.map(cols => {
    return cols.map(col => {
      const {shownButDisabled, Register} = useRegisterOrigin({
        col,
        newestRecord: latestFormData,
        ReactHookForm,
        onFormItemBlur,
        formData,
        latestFormData,
      })
      return {...col, shownButDisabled, Register}
    })
  })

  return {
    ...restProps,
    columns,
    alignMode,
    // wrapperClass,
    ControlOptions,
  }
}
