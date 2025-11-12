'use client'
import {
  useEffect,
  useState,
  useRef,
} from 'react'
import { useAsyncEffect } from 'ahooks'
import { useTranslation } from 'react-i18next'
import {
  EmbeddedChatbotContext,
  useEmbeddedChatbotContext,
} from './context'
import { useEmbeddedChatbot, activityStatus } from './hooks'
import { checkOrSetAccessToken } from '@/app/components/share/utils'
import { isDify } from './utils'
import { useThemeContext } from './theme/theme-context'
import AppUnavailable from '@/app/components/base/app-unavailable'
import { CssTransform } from './theme/utils'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import LogoHeader from '@/app/components/base/logo/logo-embedded-chat-header'
import ConfigPanel from '@/app/components/base/chat/embedded-chatbot/config-panel'
import Header from '@/app/components/base/chat/embedded-chatbot/header'
import ChatWrapper from '@/app/components/base/chat/embedded-chatbot/chat-wrapper'
import DifyLogo from '@/app/components/base/logo/dify-logo'
import cn from '@/utils/classnames'
import useDocumentTitle from '@/hooks/use-document-title'
import { useGlobalPublicStore } from '@/context/global-public-context'
import { DEFAULT_CHATBOT_ACTIVE_TIMEOUT_MS } from '@/config'
import { AivieAppType } from '@/types/app'

const Chatbot = () => {
  const {
    avatarName,
    avatarBgColor,
    isInactive,
    handleActivityStatus,
    isMobile,
    allowResetChat,
    appData,
    appChatListDataLoading,
    chatShouldReloadKey,
    handleNewConversation,
    themeBuilder,
    operationAction,
    chatKey,
    appInitialized,
    showConfigPanelBeforeChat,
    aivieAppType,
    appInfoError,
    appInfoLoading,
    appPrevChatList,
    handleShowConfigPanelBeforeChat,
  } = useEmbeddedChatbotContext()
  const { t } = useTranslation()
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const chatReady = (!showConfigPanelBeforeChat || !!appPrevChatList.length) && appInitialized

  const customConfig = appData?.custom_config
  const site = appData?.site

  const difyIcon = <LogoHeader />

  useEffect(() => {
    themeBuilder?.buildTheme(site?.chat_color_theme, site?.chat_color_theme_inverted)
  }, [site, customConfig, themeBuilder])

  useDocumentTitle(site?.title || 'Chat')

  // User Activity watcher: 
  // const [isActive, setIsActive] = useState(true)
  const chatbotRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout|null>(null);
  const isActiveRef = useRef(isInactive);

  // updating the ref value as soon as the isActive is updated 
  useEffect(()=>{
    isActiveRef.current = !isInactive;
  },[!isInactive])

  const resetTimer = ()=>{
    if (timeoutRef.current){
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(()=>{
      handleActivityStatus(activityStatus.INACTIVE)
      // setIsActive(false)
    },DEFAULT_CHATBOT_ACTIVE_TIMEOUT_MS)
  }

  const handleActivity= ()=>{
    // if we need to reactivate the active status, run this 
    // if (!isActiveRef.current){
    //   // setIsActive(true)
    //   handleActivityStatus(activityStatus.ACTIVE)
    // }

    // else, this is enough
    resetTimer()
  }


  useEffect(()=>{
    // if (aivieAppType===AivieAppType.Dayang) {
    //   handleShowConfigPanelBeforeChat(false)
    // }

    resetTimer()
    const node = chatbotRef.current
    if (node){
      node.addEventListener('click',handleActivity)
      node.addEventListener('keydown',handleActivity)
    }

    return ()=>{
      if (node){
        node.removeEventListener('click',handleActivity)
        node.removeEventListener('keydown',handleActivity)
      }
      if (timeoutRef.current){
        clearTimeout(timeoutRef.current)
      }
    } 
  },[appInitialized])

  if (appInfoLoading) {
    return (
      <Loading type='app' />
    )
  }

  if (appInfoError) {
    return (
      <AppUnavailable />
    )
  }

  return (
    <div className='relative' ref={chatbotRef}>
      <div
        className={cn(
          'flex flex-col rounded-2xl border border-components-panel-border-subtle',
          isMobile ? 'h-[calc(100vh_-_60px)] border-[0.5px] border-components-panel-border shadow-xs' : 'h-[100vh] bg-chatbot-bg',
        )}
        style={isMobile ? Object.assign({}, CssTransform(themeBuilder?.theme?.backgroundHeaderColorStyle ?? '')) : {}}
      >
        <Header
          avatarName={avatarName}
          isMobile={isMobile}
          allowResetChat={allowResetChat}
          title={site?.title || ''}
          // customerIcon={isDify() ? difyIcon : ''}
          appIcon={site?.icon_url}
          appIconBgColor={avatarBgColor}
          theme={themeBuilder?.theme}
          onCreateNewChat={handleNewConversation}
          activeStatus= {!isInactive}
        />
        <div className={cn('flex grow flex-col overflow-y-auto', isMobile && '!h-[calc(100vh_-_3rem)] rounded-2xl bg-chatbot-bg')}>
          {(showConfigPanelBeforeChat && !appChatListDataLoading && !appPrevChatList.length) && (
            <div className={cn('flex w-full items-center justify-center h-full tablet:px-4', isMobile && 'px-4')}>
              <ConfigPanel />
            </div>
          )}
          {appChatListDataLoading && !chatReady &&(
            <Loading type='app' />
          )}
          {chatReady && !appChatListDataLoading && (
            <ChatWrapper key={chatShouldReloadKey} />
          )}
        </div>
      </div>
      {/* powered by */}
      {isMobile && (
        <div className='flex h-[60px] shrink-0 items-center pl-2'>
          {!appData?.custom_config?.remove_webapp_brand && (
            <div className={cn(
              'flex shrink-0 items-center gap-1.5 px-2',
            )}>
              <div className='system-2xs-medium-uppercase text-text-tertiary'>{t('share.chat.poweredBy')}</div>
              {
                systemFeatures.branding.enabled && systemFeatures.branding.workspace_logo
                  ? <img src={systemFeatures.branding.workspace_logo} alt='logo' className='block h-5 w-auto' />
                  : appData?.custom_config?.replace_webapp_logo
                    ? <img src={`${appData?.custom_config?.replace_webapp_logo}`} alt='logo' className='block h-5 w-auto' />
                    : <DifyLogo size='small' />
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const EmbeddedChatbotWrapper = () => {
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const themeBuilder = useThemeContext()

  const {
    appData,
    userCanAccess,
    appParams,
    appMeta,
    appChatListDataLoading,
    currentConversationId,
    currentConversationItem,
    appPrevChatList,
    pinnedConversationList,
    conversationList,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationInputsChange,
    inputsForms,
    handleNewConversation,
    handleStartChat,
    handleChangeConversation,
    handleNewConversationCompleted,
    chatShouldReloadKey,
    isInstalledApp,
    allowResetChat,
    appId,
    handleFeedback,
    currentChatInstanceRef,
    clearChatList,
    setClearChatList,
    isResponding,
    setIsResponding,
    currentConversationInputs,
    setCurrentConversationInputs,
    allInputsHidden,
    initUserVariables,
    operationAction,
    avatarName,
    avatarBgColor,
    chatKey,
    appInitialized,
    aivieAppType,
    isInactive, 
    handleActivityStatus,
    appInfoError,
    appInfoLoading,
    showConfigPanelBeforeChat,
    handleShowConfigPanelBeforeChat,
  } = useEmbeddedChatbot()

  return <EmbeddedChatbotContext.Provider value={{
    userCanAccess,
    appData,
    appParams,
    appMeta,
    appChatListDataLoading,
    currentConversationId,
    currentConversationItem,
    appPrevChatList,
    pinnedConversationList,
    conversationList,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationInputsChange,
    inputsForms,
    handleNewConversation,
    handleStartChat,
    handleChangeConversation,
    handleNewConversationCompleted,
    chatShouldReloadKey,
    isMobile,
    isInstalledApp,
    allowResetChat,
    appId,
    handleFeedback,
    currentChatInstanceRef,
    themeBuilder,
    clearChatList,
    setClearChatList,
    isResponding,
    setIsResponding,
    currentConversationInputs,
    setCurrentConversationInputs,
    allInputsHidden,
    initUserVariables,
    operationAction,
    avatarName,
    avatarBgColor,
    chatKey,
    appInitialized,
    aivieAppType,
    isInactive, 
    handleActivityStatus,
    appInfoError,
    appInfoLoading,
    showConfigPanelBeforeChat,
    handleShowConfigPanelBeforeChat,
  }}>
    <Chatbot />
  </EmbeddedChatbotContext.Provider>
}

const EmbeddedChatbot = () => {
  const [initialized, setInitialized] = useState(false)
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)

  useAsyncEffect(async () => {
    if (!initialized) {
      try {
        await checkOrSetAccessToken()
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknownReason(true)
          setAppUnavailable(true)
        }
      }
      setInitialized(true)
    }
  }, [])

  if (!initialized)
    return null

  if (appUnavailable)
    return <AppUnavailable isUnknownReason={isUnknownReason} />

  return <EmbeddedChatbotWrapper />
}

export default EmbeddedChatbot
