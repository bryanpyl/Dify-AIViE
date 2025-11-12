import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Fragment, cloneElement, useRef } from 'react'
import cn from '@/utils/classnames'

export type HtmlContentProps = {
  open?: boolean
  onClose?: () => void
  onClick?: () => void
}

type IPopover = {
  className?: string
  htmlContent: React.ReactNode
  popupClassName?: string
  popoverClassName?:string
  trigger?: 'click' | 'hover'
  position?: 'bottom' | 'br' | 'bl'
  btnElement?: string | React.ReactNode
  btnClassName?: string | ((open: boolean) => string)
  btnClassNameSecondary?:string
  manualClose?: boolean
  disabled?: boolean
}

const timeoutDuration = 100

export default function CustomPopover({
  trigger = 'hover',
  position = 'bottom',
  htmlContent,
  popupClassName,
  popoverClassName,
  btnElement,
  className,
  btnClassName,
  btnClassNameSecondary,
  manualClose,
  disabled = false,
}: IPopover) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeOutRef = useRef<number | null>(null)

  const onMouseEnter = (isOpen: boolean) => {
    timeOutRef.current && window.clearTimeout(timeOutRef.current)
    !isOpen && buttonRef.current?.click()
  }

  const onMouseLeave = (isOpen: boolean) => {
    timeOutRef.current = window.setTimeout(() => {
      isOpen && buttonRef.current?.click()
    }, timeoutDuration)
  }

  return (
    <Popover className={`relative ${popoverClassName}`}>
      {({ open }: { open: boolean }) => {
        return (
          <>
            <div
              {...(trigger !== 'hover'
                ? {}
                : {
                  onMouseLeave: () => onMouseLeave(open),
                  onMouseEnter: () => onMouseEnter(open),
                })}
            >
              <PopoverButton
                ref={buttonRef}
                disabled={disabled}
                className={cn(
                  'group inline-flex items-center bg-components-button-secondary-bg px-3 py-2 rounded-lg text-base border border-components-button-secondary-border font-medium hover:bg-components-button-secondary-bg-hover hover:border-components-button-secondary-border-hover focus:outline-none',
                  'group flex items-center bg-components-button-secondary-bg px-3 rounded-lg text-base border border-components-button-secondary-border font-medium hover:bg-components-button-secondary-bg-hover hover:border-components-button-secondary-border-hover focus:outline-none',
                  open && 'bg-components-button-secondary-bg-hover border-components-button-secondary-border',
                  (btnClassName && typeof btnClassName === 'string') && btnClassName,
                  btnClassNameSecondary,
                  (btnClassName && typeof btnClassName !== 'string') && btnClassName?.(open),
                )}
              >
                {btnElement}
              </PopoverButton>
              <Transition as={Fragment}>
                <PopoverPanel
                  className={cn(
                    'absolute z-10 mt-1 w-full max-w-sm px-4 sm:px-0 lg:max-w-3xl',
                    position === 'bottom' && 'left-1/2 -translate-x-1/2',
                    position === 'bl' && 'left-0',
                    position === 'br' && 'right-0',
                    className,
                  )}
                  {...(trigger !== 'hover'
                    ? {}
                    : {
                      onMouseLeave: () => onMouseLeave(open),
                      onMouseEnter: () => onMouseEnter(open),
                    })
                  }
                >
                  {({ close }) => (
                    <div
                      className={cn('w-fit min-w-[130px] overflow-hidden rounded-lg bg-components-panel-bg shadow-lg ring-1 ring-black/5', popupClassName)}
                      {...(trigger !== 'hover'
                        ? {}
                        : {
                          onMouseLeave: () => onMouseLeave(open),
                          onMouseEnter: () => onMouseEnter(open),
                        })
                      }
                    >
                      {cloneElement(htmlContent as React.ReactElement, {
                        open,
                        onClose: close,
                        ...(manualClose
                          ? {
                            onClick: close,
                          }
                          : {}),
                      })}
                    </div>
                  )}
                </PopoverPanel>
              </Transition>
            </div>
          </>
        )
      }}
    </Popover>
  )
}
