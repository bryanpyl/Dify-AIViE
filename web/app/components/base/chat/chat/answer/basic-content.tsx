import type { FC } from 'react'
import { memo } from 'react'
import type { ChatItem } from '../../types'
import { Markdown } from '@/app/components/base/markdown'
import cn from '@/utils/classnames'

type BasicContentProps = {
  item: ChatItem
  aivieAppType:string,
  botResponse?:boolean|null
}
const BasicContent: FC<BasicContentProps> = ({
  item,
  aivieAppType, 
  botResponse
}) => {
  const {
    annotation,
    content,
    nodeResponse
  } = item

  if (annotation?.logAnnotation)
    return <Markdown content={annotation?.logAnnotation.content || ''} />

  return (
    <Markdown
      className={cn(
        item.isError && '!text-[#F04438]',
      )}
      content={content}
      nodeResponse={nodeResponse}
      aivieApp={aivieAppType}
      botResponse={typeof botResponse==='boolean'?botResponse:false}
    />
  )
}

export default memo(BasicContent)
