'use client'

import * as React from 'react'
import {useState, useEffect} from 'react'
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@cm/shadcn/components/ui/accordion'
import {cn} from '@cm/shadcn/lib/utils'

export type AccordiongPropType = {
  // styling?: styling
  label: React.ReactNode
  children?: React.ReactNode
  // exclusiveTo?: boolean
  defaultOpen?: boolean
  closable?: boolean

  className?: string
}

const MyAccordion = React.forwardRef<HTMLDivElement, AccordiongPropType>(
  ({label, children, defaultOpen = false, closable = true, className, ...props}, ref) => {
    const [value, setValue] = useState<string>(defaultOpen ? 'item-1' : '')

    // closableがfalseの場合は常に開いた状態にする
    useEffect(() => {
      if (closable === false) {
        setValue('item-1')
      }
    }, [closable])

    const handleValueChange = (newValue: string) => {
      if (closable === false) return // closableがfalseの場合は変更を許可しない
      setValue(newValue)
    }

    // closableがfalseの場合は通常のdivとして表示
    if (closable === false) {
      return (
        <div
          ref={ref}
          className={cn(
            'rounded-lg border bg-card text-card-foreground shadow-sm',
            'p-4 space-y-3',
            // styling?.classes?.wrapper,
            className
          )}
          // style={styling?.styles?.wrapper}
          {...props}
        >
          <div
            className={cn(
              'text-muted-foreground'
              // styling?.classes?.value
            )}
            // style={styling?.styles?.value}
          >
            {children}
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm'
          // styling?.classes?.wrapper, className
        )}
        // style={styling?.styles?.wrapper}
        {...props}
      >
        <Accordion type="single" collapsible value={value} onValueChange={handleValueChange} className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger
              className={cn(
                'px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors',
                'text-left font-semibold text-foreground',
                '[&[data-state=open]>svg]:rotate-180'
                // styling?.classes?.label
              )}
              // style={styling?.styles?.label}
            >
              <span className="flex-1">{label}</span>
            </AccordionTrigger>
            <AccordionContent
              className={cn(
                'px-4 pb-2 pt-0',
                'text-muted-foreground',
                'data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up'
                // styling?.classes?.value
              )}
              // style={styling?.styles?.value}
            >
              <div className="pt-2">{children}</div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  }
)

MyAccordion.displayName = 'MyAccordion'

export default MyAccordion
