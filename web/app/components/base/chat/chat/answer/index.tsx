import type {
  FC,
  ReactNode,
} from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ChatConfig,
  ChatItem,
} from '../../types'
import { AivieAppType } from '@/types/app'
import Operation from './operation'
import AgentContent from './agent-content'
import BasicContent from './basic-content'
import SuggestedQuestions from './suggested-questions'
import More from './more'
import WorkflowProcessItem from './workflow-process'
import LoadingAnim from '@/app/components/base/chat/chat/loading-anim'
import Citation from '@/app/components/base/chat/chat/citation'
import { EditTitle } from '@/app/components/app/annotation/edit-annotation-modal/edit-item'
import type { AppData } from '@/models/share'
import AnswerIcon from '@/app/components/base/answer-icon'
import { ChevronRight } from '@/app/components/base/icons/src/vender/line/arrows'
import cn from '@/utils/classnames'
import { FileList } from '@/app/components/base/file-uploader'
import ContentSwitch from '../content-switch'
import ChatThinking from '@/app/components/base/chat-thinking'
import { useEmbeddedChatbotContext } from '../../embedded-chatbot/context'

type AnswerProps = {
  item: ChatItem
  question: string
  index: number
  config?: ChatConfig
  answerIcon?: ReactNode
  responding?: boolean
  showPromptLog?: boolean
  chatAnswerContainerInner?: string
  hideProcessDetail?: boolean
  appData?: AppData
  noChatInput?: boolean
  switchSibling?: (siblingMessageId: string) => void
}
const Answer: FC<AnswerProps> = ({
  item,
  question,
  index,
  config,
  answerIcon,
  responding,
  showPromptLog,
  chatAnswerContainerInner,
  hideProcessDetail,
  appData,
  noChatInput,
  switchSibling,
}) => {
  const { t } = useTranslation()
  const {
    content,
    citation,
    agent_thoughts,
    more,
    annotation,
    workflowProcess,
    allFiles,
    message_files,
    nodeResponse,
    timestamp,
  } = item
  const hasAgentThoughts = !!agent_thoughts?.length
  const {avatarName} = useEmbeddedChatbotContext()

  const aivieApp = appData?.site?.title.includes(AivieAppType.Dayang)?AivieAppType.Dayang:AivieAppType.other;

  const [containerWidth, setContainerWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const getContainerWidth = () => {
    if (containerRef.current)
      setContainerWidth(containerRef.current?.clientWidth + 16)
  }
  useEffect(() => {
    getContainerWidth()
  }, [])

  const isJsonContent = useMemo(()=>{
    try{
      JSON.parse(content)
      return true
    }catch(error){
      return false
    }
  },[content])

  const getContentWidth = () => {
    if (contentRef.current)
      setContentWidth(contentRef.current?.clientWidth)
  }

  useEffect(() => {
    if (!responding)
      getContentWidth()
  }, [responding])

  // Recalculate contentWidth when content changes (e.g., SVG preview/source toggle)
  useEffect(() => {
    if (!containerRef.current)
      return
    const resizeObserver = new ResizeObserver(() => {
      getContentWidth()
    })
    resizeObserver.observe(containerRef.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const handleSwitchSibling = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev')
      item.prevSibling && switchSibling?.(item.prevSibling)
    else
      item.nextSibling && switchSibling?.(item.nextSibling)
  }, [switchSibling, item.prevSibling, item.nextSibling])

  return (
    <div className='mb-2 flex last:mb-0'>
      <div className='relative h-10 w-10 shrink-0'>
         {/* {aivieApp===AivieAppType.Dayang?<AnswerIcon iconType='image' imageUrl={appData?.site.icon_url}/>:<AnswerIcon/>} */}
        {answerIcon || <AnswerIcon />}
        {responding && (
          <div className='absolute left-[-3px] top-[-3px] flex h-4 w-4 items-center rounded-full border-[0.5px] border-divider-subtle bg-background-section-burn pl-[6px] shadow-xs'>
            <LoadingAnim type='avatar' />
          </div>
        )}
      </div>
      <div className='chat-answer-container group ml-4 w-0 grow pb-4' ref={containerRef}>
        <div className={cn('group relative pr-10', chatAnswerContainerInner)}>
          <div
            ref={contentRef}
            className={cn('relative inline-block px-4 py-3 max-w-full bg-chat-bubble-bg rounded-2xl border border-gray-200 shadow-md body-lg-regular text-text-primary w-full', workflowProcess && 'w-full')}
          >
            {
              !responding && (
                <Operation
                  hasWorkflowProcess={!!workflowProcess}
                  maxSize={containerWidth - contentWidth - 4}
                  contentWidth={contentWidth}
                  item={item}
                  question={question}
                  index={index}
                  showPromptLog={showPromptLog}
                  noChatInput={noChatInput}
                />
              )
            }
            {/** Render the normal steps */}
            {
              workflowProcess && !hideProcessDetail && (
                <WorkflowProcessItem
                data={workflowProcess}
                item={item}
                hideProcessDetail={hideProcessDetail}
              />
                
              )
            }
            {/** Hide workflow steps by its settings in siteInfo */}
            {
              workflowProcess && !hideProcessDetail && appData?.site.show_workflow_steps && (
                <WorkflowProcessItem
                  data={workflowProcess}
                  item={item}
                  hideProcessDetail={hideProcessDetail}
                  readonly={hideProcessDetail && appData ? !appData.site.show_workflow_steps : undefined}
                />
              )
            }
            {/* Render workflow process */}
            {
              responding && !content && !hasAgentThoughts && (
                 <ChatThinking app_agent={avatarName}/>
                // <div className='flex items-center justify-center w-6 h-5'>
                //   <LoadingAnim type='text' />
                // </div>
              )
            }
            {
              !isJsonContent&&content && !hasAgentThoughts && (
                <BasicContent item={item} aivieAppType={avatarName} botResponse={true} />
              )
            }
            {
              (hasAgentThoughts) && (
                <AgentContent
                  item={item}
                  responding={responding}
                  content={content}
                />
              )
            }
            {
              !!allFiles?.length && (
                <FileList
                  className='my-1'
                  files={allFiles}
                  showDeleteAction={false}
                  showDownloadAction
                  canPreview
                />
              )
            }
            {
              !!message_files?.length && (
                <FileList
                  className='my-1'
                  files={message_files}
                  showDeleteAction={false}
                  showDownloadAction
                  canPreview
                />
              )
            }
            {
              annotation?.id && annotation.authorName && (
                <EditTitle
                  className='mt-1'
                  title={t('appAnnotation.editBy', { author: annotation.authorName })}
                />
              )
            }
            <SuggestedQuestions item={item} buttonResponse={isJsonContent} />
            {
              !!citation?.length && !responding && (
                <Citation data={citation} showHitInfo={config?.supportCitationHitInfo} />
              )
            }
            {
              item.siblingCount && item.siblingCount > 1 && item.siblingIndex !== undefined && (
                <ContentSwitch
                  count={item.siblingCount}
                  currentIndex={item.siblingIndex}
                  prevDisabled={!item.prevSibling}
                  nextDisabled={!item.nextSibling}
                  switchSibling={handleSwitchSibling}
                />
              )
            }
          </div>
        </div>
        <p className='mt-2 system-2xs-semibold-uppercase text-text-tertiary'>
          {timestamp
            ? new Date(timestamp * 1000).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : ''}
        </p>
        <More more={more} />
      </div>
    </div>
  )
}

export default memo(Answer)
