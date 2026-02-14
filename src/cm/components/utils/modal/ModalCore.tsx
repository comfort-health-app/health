'use client'
import React, {JSX} from 'react'

import ShadModal from '@cm/shadcn/components/ShadModal'

export type basicModalPropType = {
  Trigger?: JSX.Element
  withPaper?: boolean
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  style?: object
  alertOnClose?: string | boolean
  closeBtn?: boolean | JSX.Element

  open?: any
  setopen?: any
}
export type ModalCorePropType = basicModalPropType & {
  open?: any
  setopen?: any
}

const getAlertOnClose = (props: ModalCorePropType) => {
  let result: any = `保存されていないデータは破棄されますが、よろしいですか？`
  if (typeof props.alertOnClose === `string`) {
    result = props.alertOnClose
  } else if (!props.alertOnClose) {
    result = false
  }
  return result
}

export const ModalCore = React.memo((props: ModalCorePropType) => {
  const {Trigger, style, children, title, description, withPaper = true} = props
  const alertOnClose = getAlertOnClose(props)

  const open = props.open

  const setopen = alertOnClose
    ? prev => {
        if (confirm(String(alertOnClose))) {
          props.setopen(false)
        } else {
          props.setopen(!prev)
        }
      }
    : props.setopen

  const modalStyle = {
    width: 'fit-content',
    height: 'fit-content',
    maxHeight: '80vh', //スマホ時に、アドレスバーで隠れてしまうので、これ以上上げない
    maxWidth: '95vw',
    overflow: 'auto',
    ...style,
  }

  return (
    <ShadModal
      {...{
        open,
        setopen,
        style: modalStyle,
        Trigger,
        title,
        description,
        children,
        withPaper,
      }}
    />
  )
})
