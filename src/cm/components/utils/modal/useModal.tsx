import {useCallback, useState} from 'react'
import {basicModalPropType, ModalCore} from '@cm/components/utils/modal/ModalCore'

const useModal = (props?: {defaultOpen?: boolean; defaultState?: any; alertOnClose?: boolean}) => {
  const [open, setopen] = useState<any>(props?.defaultState || props?.defaultOpen ? true : false)
  const handleOpen = (openValue?: any) => setopen(openValue || true)
  const handleClose = (closeValue?: any) => setopen(closeValue || false)

  const Modal = useCallback(
    (modalProps: basicModalPropType) => {
      return (
        <ModalCore
          {...{
            ...props,
            open,
            setopen,
            ...modalProps,
          }}
        >
          {modalProps.children}
        </ModalCore>
      )
    },
    [open, handleClose, props]
  )

  return {
    Modal,
    handleOpen,
    handleClose,
    open,
    setopen,
  }
}

export default useModal
