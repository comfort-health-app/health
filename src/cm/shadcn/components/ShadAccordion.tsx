'use client'
import React, {Fragment} from 'react'

// import Accordion from 'src/cm/components/utils/Accordions/Accordion'
import {useState} from 'react'
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@cm/shadcn/components/ui/accordion'

type ItemType = {
  trigger: React.ReactNode
  children: React.ReactNode
}
export default function ShadAccordion(props: {
  stateController?: [
    //
    openAccodionIndex: string,
    setOpenAccodionIndex: (value: string) => void,
  ]
  defaultOpenIndex?: number
  items: ItemType[]
}) {
  const {items = [], defaultOpenIndex = `0`} = props

  const [openAccodionIndex, setOpenAccodionIndex] = props.stateController ?? useState(defaultOpenIndex)

  const accordionTriggerClass = `rounded-sm bg-primary-main px-2 py-1.5 text-white`

  return (
    <Accordion type="single" collapsible={false} value={String(openAccodionIndex)} onValueChange={setOpenAccodionIndex}>
      {items.map((item, idx) => {
        const {trigger, children} = item
        const value = String(idx)

        return (
          <Fragment key={idx}>
            <AccordionItem value={value} className={`border-none`}>
              <AccordionTrigger className={accordionTriggerClass}>{item.trigger}</AccordionTrigger>

              <AccordionContent>{children}</AccordionContent>
            </AccordionItem>
          </Fragment>
        )
      })}
    </Accordion>
  )
}
