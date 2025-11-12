import React, {useState, useRef} from 'react'
import type { FC } from 'react'
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/app/components/base/portal-to-follow-elem'

type HistoryPreviewTooltipProps = {
  query:string, 
  answer:string,
  children: React.ReactNode
}

const HistoryPreviewTooltip:FC<HistoryPreviewTooltipProps> = ({
  query,
  answer,
  children
}) => {
  const [open,setOpen] = useState<boolean>(false)
  const timeoutRef = useRef<NodeJS.Timeout|null>(null)

  const handleMouseEnter = () => {
      if (timeoutRef.current)
          clearTimeout(timeoutRef.current);
      setOpen(true)
  }

  const handleMouseLeave = () => {
      timeoutRef.current = setTimeout(() => {
          setOpen(false)
      }, 150)
  }

  return (
    <PortalToFollowElem open={open}
      onOpenChange={setOpen}
      placement='right'
      offset={{
          mainAxis: 8,
          crossAxis: -2,
      }}
    >
      <PortalToFollowElemTrigger
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent 
        // className={`transition-all ease-in-out duration-200 transform ${open?'opacity-100 scale-100':'opacity-0 scale-95'}`}
        style={{zIndex:999}} onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}>
          <div className='flex flex-col gap-y-2 bg-white shadow-lg rounded-lg px-5 py-6 max-h-[80vh] max-w-[450px] overflow-y-auto'>
            <p className='system-md-semibold text-text-secondary'>
              {query}
            </p>
            <div className='min-h-0'>
              <p className='system-sm-regular text-text-secondary'>
                {answer}
              </p>
            </div>
          </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}

export default React.memo(HistoryPreviewTooltip)
