'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
} from '@cm/shadcn/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from '@cm/shadcn/components/ui/drawer'

import {useIsMobile} from '@cm/shadcn/hooks/use-mobile'
import {cn} from '@cm/shadcn/lib/utils'

import React from 'react'
import {JSX} from 'react'

type ShadModalProps = {
  Trigger?: JSX.Element | string

  onOpenAutoFocus?: any
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  style?: React.CSSProperties

  open?: any
  setopen?: any
}

const ShadModal = React.memo((props: ShadModalProps) => {
  const {Trigger, children, onOpenAutoFocus = e => e.preventDefault(), title, description, footer, className = '', style} = props
  const mobile = useIsMobile()

  const [openState, setopenState] = React.useState(false)
  //

  const open = props?.open ?? openState
  const setopen = props?.setopen ?? setopenState

  const headerClass = title || description ? '' : 'hidden'
  const footerClass = footer ? '' : 'hidden'

  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={setopen}>
        {Trigger && (
          <DrawerTrigger asChild onClick={() => setopen?.(true)}>
            {Trigger}
          </DrawerTrigger>
        )}

        <DrawerPortal>
          <DrawerContent
            style={style}
            onOpenAutoFocus={onOpenAutoFocus}
            className={cn(`ModalContent rounded-lg   shadow-md  ${className}`)}
          >
            <div className="mx-auto w-full ">
              <DrawerHeader className={headerClass}>
                <DrawerTitle>{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
              </DrawerHeader>

              <div className="w-fit mx-auto ">{children}</div>

              <DrawerFooter className={footerClass}>{footer}</DrawerFooter>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setopen}>
      {Trigger && (
        <DialogTrigger asChild onClick={() => setopen?.(true)}>
          {Trigger}
        </DialogTrigger>
      )}

      <DialogPortal>
        <DialogContent
          showCloseButton={true}
          onOpenAutoFocus={onOpenAutoFocus}
          style={{
            ...style,
            width: 'fit-content',
            maxHeight: '90vh',
            maxWidth: '95vw',
            overflow: 'auto',
          }}
          className={cn(` ModalContent w-fit mx-auto shadow-lg shadow-gray-500   ${className}`)}
        >
          <DialogHeader className={headerClass}>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="w-fit mx-auto ">{children}</div>
          <DialogFooter className={footerClass}>{footer}</DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
})

ShadModal.displayName = 'ShadModal'
export default ShadModal
