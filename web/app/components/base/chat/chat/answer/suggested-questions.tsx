import type { FC } from 'react'
import { memo, useCallback, useRef, useEffect, useState } from 'react'
import type { ChatItem } from '../../types'
import { useChatContext } from '../context'
import { useEmbeddedChatbotContext } from '../../embedded-chatbot/context'
import cn from '@/utils/classnames'

type SuggestedQuestionsProps = {
  item: ChatItem
  buttonResponse:boolean
}
const SuggestedQuestions: FC<SuggestedQuestionsProps> = ({
  item,
  buttonResponse=false
}) => {
  const { onSend } = useChatContext()
  const {isInactive} = useEmbeddedChatbotContext()
  const isInactiveRef = useRef(isInactive)
  const [chatButton, setChatButton] = useState<string[]>()
  const [chatResponseTitle, setResponseTitle] = useState<string>("")

  const {
    isOpeningStatement,
    suggestedQuestions,
    nodeResponse,
    content
  } = item

  // if (!isOpeningStatement || !suggestedQuestions?.length)
  //   return null

  useEffect (()=>{
    isInactiveRef.current = !isInactive
  },[isInactive])

  useEffect(()=>{
    if (buttonResponse&&content){
      const parsedContent = JSON.parse(content)
      const result = parsedContent.answer?parsedContent.answer:parsedContent.outputs.answer
      if (result){
        const buttonContent = result.button_answers.map((item:any)=>item.content)
        const responseTitle = result.response_title
        setChatButton(buttonContent)
        setResponseTitle(responseTitle)
      }
    }
    if (suggestedQuestions?.length){
      setChatButton(suggestedQuestions)
    }
  },[item])

  const handleClick = useCallback((question:string)=>{
    if (isInactiveRef.current){
      onSend?.(question)
    } 
  },[isInactiveRef.current, onSend])

  return (
    <div className='flex flex-col w-full gap-y-1'>
      {chatResponseTitle&&<p className={cn('markdown-body flex flex-1')}>{chatResponseTitle}</p>}      
      <div className='flex flex-wrap'>
        {chatButton?.filter(q => !!q && q.trim()).map((question, index) => (
          <div
            key={index}
            className={`mt-1 mr-1 max-w-full last:mr-0 shrink-0 py-[5px] leading-[18px] items-center px-4 rounded-lg border border-gray-200 shadow-xs bg-white text-xs font-medium text-primary-600 ${isInactiveRef.current?'cursor-pointer':'cursor-default'}`}
            onClick={() => handleClick(question)}
          >
            {question}
          </div>)
        )}
      </div>
    </div>
  )
}

export default memo(SuggestedQuestions)
