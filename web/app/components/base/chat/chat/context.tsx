'use client'

import type { ReactNode } from 'react'
import { createContext, useContext } from 'use-context-selector'
import type { ChatProps } from './index'

export type ChatContextValue = Pick<ChatProps, 'config'
  | 'operationAction'
  | 'isResponding'
  | 'chatList'
  | 'showPromptLog'
  | 'questionIcon'
  | 'answerIcon'
  | 'onSend'
  | 'onRegenerate'
  | 'onAnnotationEdited'
  | 'onAnnotationAdded'
  | 'onAnnotationRemoved'
  | 'onFeedback'
>

const ChatContext = createContext<ChatContextValue>({
  chatList: [],
})

type ChatContextProviderProps = {
  children: ReactNode
} & ChatContextValue

export const ChatContextProvider = ({
  operationAction,
  children,
  config,
  isResponding,
  chatList,
  showPromptLog,
  questionIcon,
  answerIcon,
  onSend,
  onRegenerate,
  onAnnotationEdited,
  onAnnotationAdded,
  onAnnotationRemoved,
  onFeedback,
}: ChatContextProviderProps) => {
  return (
    <ChatContext.Provider value={{
      operationAction,
      config,
      isResponding,
      chatList: chatList || [],
      showPromptLog,
      questionIcon,
      answerIcon,
      onSend,
      onRegenerate,
      onAnnotationEdited,
      onAnnotationAdded,
      onAnnotationRemoved,
      onFeedback,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => useContext(ChatContext)

export default ChatContext
