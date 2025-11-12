import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { useLocalStorageState } from 'ahooks'
import produce from 'immer'
import type {
  ChatConfig,
  ChatItem,
  Feedback,
} from '../types'
import { CONVERSATION_ID_INFO } from '../constants'
import { buildChatItemTree, getProcessedInputsFromUrlParams, getProcessedSystemVariablesFromUrlParams, getProcessedUserVariablesFromUrlParams } from '../utils'
import { addFileInfos, sortAgentSorts } from '../../../tools/utils'
import { getProcessedFilesFromResponse } from '../../file-uploader/utils'
import {
  fetchAppInfo,
  fetchAppMeta,
  fetchAppParams,
  fetchChatList,
  fetchConversations,
  generationConversationName,
  updateFeedback,
} from '@/service/share'
import type {
  // AppData,
  ConversationItem,
} from '@/models/share'
import { useToastContext } from '@/app/components/base/toast'
import { changeLanguage } from '@/i18n/i18n-config/i18next-config'
import { InputVarType } from '@/app/components/workflow/types'
import { noop } from 'lodash-es'
import { useGetUserCanAccessApp } from '@/service/access-control'
import { useGlobalPublicStore } from '@/context/global-public-context'

import { AivieAppType, TransferMethod } from '@/types/app'
import { OperationAction } from '../chat/answer/operation'

export enum activityStatus {
  ACTIVE='Active',
  INACTIVE='Inactive'
}


function getFormattedChatList(messages: any[]) {
  const newChatList: ChatItem[] = []
  messages.forEach((item) => {
    const questionFiles = item.message_files?.filter((file: any) => file.belongs_to === 'user') || []
    newChatList.push({
      id: `question-${item.id}`,
      content: item.query,
      isAnswer: false,
      message_files: getProcessedFilesFromResponse(questionFiles.map((item: any) => ({ ...item, related_id: item.id }))),
      parentMessageId: item.parent_message_id || undefined,
      timestamp: item.created_at,
    })
    const answerFiles = item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || []
    newChatList.push({
      id: item.id,
      content: item.answer,
      agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
      feedback: item.feedback,
      isAnswer: true,
      citation: item.retriever_resources,
      message_files: getProcessedFilesFromResponse(answerFiles.map((item: any) => ({ ...item, related_id: item.id }))),
      parentMessageId: `question-${item.id}`,
      timestamp: item.created_at,
    })
  })
  return newChatList
}

export const useEmbeddedChatbot = () => {
  const isInstalledApp = false
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const { data: appInfo, isLoading: appInfoLoading, error: appInfoError } = useSWR('appInfo', fetchAppInfo)
  const { isPending: isCheckingPermission, data: userCanAccessResult } = useGetUserCanAccessApp({
    appId: appInfo?.app_id,
    isInstalledApp,
    enabled: systemFeatures.webapp_auth.enabled,
  })

  const handleActivityStatus = (value:activityStatus)=>{
    if (value===activityStatus.ACTIVE){
      setIsInactive(false)
    }
    else setIsInactive(true)
  }

  const appData = useMemo(() => {
    return appInfo
  }, [appInfo])

  const aivieAppType = useMemo(()=>{
    if (appData?.site.title.includes(AivieAppType.Dayang)) return AivieAppType.Dayang
    else return AivieAppType.other
  },[appData])


  const appId = useMemo(() => appData?.app_id, [appData])

  const [userId, setUserId] = useState<string>()
  const [conversationId, setConversationId] = useState<string>()
  const [appInitialized, setAppInitialized] = useState(false)
  const [isInactive,setIsInactive] = useState(false)
  const [chatKey, setChatKey] = useState(null)
  const [customShowConfigPanelBeforeChat, setCustomShowConfigPanelBeforeChat] = useState<boolean|null>(null)
  const [avatarName, setAvatarName] = useState<string>(AivieAppType.other)
  const [avatarBgColor, setAvatarBgColor] = useState<string>("#FFFFFF")
  const [operationAction, setOperationAction] = useState<OperationAction[]|null>([])
  
  useEffect(() => {
    getProcessedSystemVariablesFromUrlParams().then(({ user_id, conversation_id }) => {
      setUserId(user_id)
      setConversationId(conversation_id)
    })
  }, [])

  useEffect(()=>{
    window.parent.postMessage('IFRAME_LOADED','*')
    window.addEventListener('message',(event)=>{
      // const key='chatKey'
      const chatConfig = 'chatConfig'
      const chatWidgetConfig = 'chatWidgetConfig'
      if (event.data[chatConfig]!= null){
        const chatConfigData = event.data[chatConfig]
        if (chatConfigData.key){
          setChatKey(chatConfigData.key)
        }
        if (typeof chatConfigData.showConfigPanel=='boolean'){
          if(!chatConfigData.showConfigPanel){
            setCustomShowConfigPanelBeforeChat(false)
          }
          else{
            setCustomShowConfigPanelBeforeChat(true)
          }
        }
      }
      if (event.data[chatWidgetConfig]!=null){
        const chatWidgetConfigData = event.data[chatWidgetConfig]
        if (chatWidgetConfigData.avatar_name){
          setAvatarName(chatWidgetConfigData.avatar_name)
        }
        if (chatWidgetConfigData.avatar_icon_bgcolor){
          setAvatarBgColor(chatWidgetConfigData.avatar_icon_bgcolor)
        }
      }

    })

    setOperationAction([
      OperationAction.copy, 
      OperationAction.feedback
    ])
  },[])


  useEffect(() => {
    const setLanguageFromParams = async () => {
      // Check URL parameters for language override
      const urlParams = new URLSearchParams(window.location.search)
      const localeParam = urlParams.get('locale')

      // Check for encoded system variables
      const systemVariables = await getProcessedSystemVariablesFromUrlParams()
      const localeFromSysVar = systemVariables.locale

      if (localeParam) {
        // If locale parameter exists in URL, use it instead of default
        await changeLanguage(localeParam)
      }
      else if (localeFromSysVar) {
        // If locale is set as a system variable, use that
        await changeLanguage(localeFromSysVar)
      }
      else if (appInfo?.site.default_language) {
        // Otherwise use the default from app config
        await changeLanguage(appInfo.site.default_language)
      }
    }

    setLanguageFromParams()
  }, [appInfo])

  const [conversationIdInfo, setConversationIdInfo] = useLocalStorageState<Record<string, Record<string, string>>>(CONVERSATION_ID_INFO, {
    defaultValue: {},
  })
  const allowResetChat = !conversationId
  const currentConversationId = useMemo(() => conversationIdInfo?.[appId || '']?.[userId || 'DEFAULT'] || conversationId || '',
    [appId, conversationIdInfo, userId, conversationId])
  const handleConversationIdInfoChange = useCallback((changeConversationId: string) => {
    if (appId) {
      let prevValue = conversationIdInfo?.[appId || '']
      if (typeof prevValue === 'string')
        prevValue = {}
      setConversationIdInfo({
        ...conversationIdInfo,
        [appId || '']: {
          ...prevValue,
          [userId || 'DEFAULT']: changeConversationId,
        },
      })
    }
  }, [appId, conversationIdInfo, setConversationIdInfo, userId])

  const [showConfigPanelBeforeChat, setShowConfigPanelBeforeChat] = useState(true)

  const handleShowConfigPanelBeforeChat=(value:boolean)=>{
    setShowConfigPanelBeforeChat(value)
  }

  const [newConversationId, setNewConversationId] = useState('')
  const chatShouldReloadKey = useMemo(() => {
    if (currentConversationId === newConversationId) return ''
    return currentConversationId
  }, [currentConversationId, newConversationId])

  useEffect(()=>{
    if (appData && aivieAppType){
      setAppInitialized(true)
    }
  },[appData, aivieAppType, chatShouldReloadKey, appInitialized])

  const { data: appParams } = useSWR(['appParams', isInstalledApp, appId], () => fetchAppParams(isInstalledApp, appId))
  const { data: appMeta } = useSWR(['appMeta', isInstalledApp, appId], () => fetchAppMeta(isInstalledApp, appId))
  const { data: appPinnedConversationData } = useSWR(['appConversationData', isInstalledApp, appId, true], () => fetchConversations(isInstalledApp, appId, undefined, true, 100))
  const { data: appConversationData, isLoading: appConversationDataLoading, mutate: mutateAppConversationData } = useSWR(['appConversationData', isInstalledApp, appId, false], () => fetchConversations(isInstalledApp, appId, undefined, false, 100))
  const { data: appChatListData, isLoading: appChatListDataLoading } = useSWR(chatShouldReloadKey ? ['appChatList', chatShouldReloadKey, isInstalledApp, appId] : null, () => fetchChatList(chatShouldReloadKey, isInstalledApp, appId))

  const [clearChatList, setClearChatList] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const appPrevChatList = useMemo(
    () => 
      (currentConversationId && appChatListData?.data.length)
      ? buildChatItemTree(getFormattedChatList(appChatListData.data))
      : 
      [],
    [appChatListData, currentConversationId],
  )

  const [showNewConversationItemInList, setShowNewConversationItemInList] = useState(false)

  const pinnedConversationList = useMemo(() => {
    return appPinnedConversationData?.data || []
  }, [appPinnedConversationData])
  const { t } = useTranslation()
  const newConversationInputsRef = useRef<Record<string, any>>({})
  const [newConversationInputs, setNewConversationInputs] = useState<Record<string, any>>({})
  const [initInputs, setInitInputs] = useState<Record<string, any>>({})
  const [initUserVariables, setInitUserVariables] = useState<Record<string, any>>({})
  const handleNewConversationInputsChange = useCallback((newInputs: Record<string, any>) => {
    newConversationInputsRef.current = newInputs
    setNewConversationInputs(newInputs)
    if (newInputs.key&&!chatKey){
      setChatKey(newInputs.key)
    }
  }, [])
  const inputsForms = useMemo(() => {
    return (appParams?.user_input_form || []).filter((item: any) => !item.external_data_tool).map((item: any) => {
      if (item.paragraph) {
        let value = initInputs[item.paragraph.variable]
        if (value && item.paragraph.max_length && value.length > item.paragraph.max_length)
          value = value.slice(0, item.paragraph.max_length)

        return {
          ...item.paragraph,
          default: value || item.default || item.paragraph.default,
          type: 'paragraph',
        }
      }
      if (item.number) {
        const convertedNumber = Number(initInputs[item.number.variable])
        return {
          ...item.number,
          default: convertedNumber || item.default || item.number.default,
          type: 'number',
        }
      }
      if (item.checkbox) {
        return {
          ...item.checkbox,
          default: false,
          type: 'checkbox',
        }
      }
      if (item.select) {
        const isInputInOptions = item.select.options.includes(initInputs[item.select.variable])
        return {
          ...item.select,
          default: (isInputInOptions ? initInputs[item.select.variable] : undefined) || item.select.default,
          type: 'select',
        }
      }

      if (item['file-list']) {
        return {
          ...item['file-list'],
          type: 'file-list',
        }
      }

      if (item.file) {
        return {
          ...item.file,
          type: 'file',
        }
      }

      if (item.json_object) {
        return {
          ...item.json_object,
          type: 'json_object',
        }
      }

      let value = initInputs[item['text-input'].variable]
      if (value && item['text-input'].max_length && value.length > item['text-input'].max_length)
        value = value.slice(0, item['text-input'].max_length)

      return {
        ...item['text-input'],
        default: value || item.default || item['text-input'].default,
        type: 'text-input',
      }
    })
  }, [initInputs, appParams])

  useEffect(()=>{
    // Check if chatflow requires any input 
    // IF no inputs is required, dont show config panel at all
    if (!inputsForms||inputsForms.length===0){
      handleShowConfigPanelBeforeChat(false)
    }
    // IF inputs are required
    else
    {
      // First: Check if cliuent specify to show configPanel in the embedded js
      if (!customShowConfigPanelBeforeChat && customShowConfigPanelBeforeChat ===false){
        handleShowConfigPanelBeforeChat(false)
      }
      // ELSE: If client did not specify (null) OR specify to SHOW the config panel, proceed to display the config panel
      else{
        handleShowConfigPanelBeforeChat(true)
      }
    } 
  },[inputsForms, customShowConfigPanelBeforeChat])

  const allInputsHidden = useMemo(() => {
    return inputsForms.length > 0 && inputsForms.every(item => item.hide === true)
  }, [inputsForms])

  useEffect(() => {
    // init inputs from url params
    (async () => {
      const inputs = await getProcessedInputsFromUrlParams()
      const userVariables = await getProcessedUserVariablesFromUrlParams()
      setInitInputs(inputs)
      setInitUserVariables(userVariables)
    })()
  }, [])
  useEffect(() => {
    const conversationInputs: Record<string, any> = {}

    inputsForms.forEach((item: any) => {
      if (item.variable==='key' && chatKey){
        conversationInputs['key'] = chatKey
      }
      else {
        conversationInputs[item.variable] = item.default || null
      }
    })
    handleNewConversationInputsChange(conversationInputs)
  }, [handleNewConversationInputsChange, inputsForms, , chatKey])

  const { data: newConversation } = useSWR(newConversationId ? [isInstalledApp, appId, newConversationId] : null, () => generationConversationName(isInstalledApp, appId, newConversationId), { revalidateOnFocus: false })
  const [originConversationList, setOriginConversationList] = useState<ConversationItem[]>([])
  useEffect(() => {
    if (appConversationData?.data && !appConversationDataLoading)
      setOriginConversationList(appConversationData?.data)
  }, [appConversationData, appConversationDataLoading])
  const conversationList = useMemo(() => {
    const data = originConversationList.slice()

    if (showNewConversationItemInList && data[0]?.id !== '') {
      data.unshift({
        id: '',
        name: t('share.chat.newChatDefaultName'),
        inputs: {},
        introduction: '',
        created_at: 0,
      })
    }
    return data
  }, [originConversationList, showNewConversationItemInList, t])

  useEffect(() => {
    if (newConversation) {
      setOriginConversationList(produce((draft) => {
        const index = draft.findIndex(item => item.id === newConversation.id)
        if (index > -1){
          draft[index] = newConversation
          }
        else
          draft.unshift(newConversation)
      }))
    }
  }, [newConversation])

  const currentConversationItem = useMemo(() => {
    let conversationItem = conversationList.find(item => item.id === currentConversationId)

    if (!conversationItem && pinnedConversationList.length)
      conversationItem = pinnedConversationList.find(item => item.id === currentConversationId)

    return conversationItem
  }, [conversationList, currentConversationId, pinnedConversationList])

  const currentConversationLatestInputs = useMemo(() => {
    if (!currentConversationId || !appChatListData?.data.length)
      return newConversationInputsRef.current || {}
    return appChatListData.data.slice().pop().inputs || {}
  }, [appChatListData, currentConversationId])
  const [currentConversationInputs, setCurrentConversationInputs] = useState<Record<string, any>>(currentConversationLatestInputs || {})
  useEffect(() => {
    if (currentConversationItem)
      setCurrentConversationInputs(currentConversationLatestInputs || {})
  }, [currentConversationItem, currentConversationLatestInputs])

  const { notify } = useToastContext()
  const checkInputsRequired = useCallback((silent?: boolean) => {
    if (allInputsHidden)
      return true

    let hasEmptyInput = ''
    let fileIsUploading = false
    const requiredVars = inputsForms.filter(({ required, type }) => required && type !== InputVarType.checkbox)
    if (requiredVars.length) {
      requiredVars.forEach(({ variable, label, type }) => {
        if (hasEmptyInput)
          return

        if (fileIsUploading)
          return

        if (!newConversationInputsRef.current[variable] && !silent)
          hasEmptyInput = label as string

        if ((type === InputVarType.singleFile || type === InputVarType.multiFiles) && newConversationInputsRef.current[variable] && !silent) {
          const files = newConversationInputsRef.current[variable]
          if (Array.isArray(files))
            fileIsUploading = files.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)
          else
            fileIsUploading = files.transferMethod === TransferMethod.local_file && !files.uploadedId
        }
      })
    }

    if (hasEmptyInput) {
      notify({ type: 'error', message: t('appDebug.errorMessage.valueOfVarRequired', { key: hasEmptyInput }) })
      return false
    }

    if (fileIsUploading) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForFileUpload') })
      return
    }

    return true
  }, [inputsForms, notify, t, allInputsHidden])
  const handleStartChat = useCallback((callback?: any) => {
    if (checkInputsRequired()) {
      setShowConfigPanelBeforeChat(false)
      setShowNewConversationItemInList(true)
      callback?.()
    }
  }, [setShowNewConversationItemInList, checkInputsRequired])
  
  const currentChatInstanceRef = useRef<{ handleStop: () => void }>({ handleStop: noop })
  
  const handleChangeConversation = useCallback((conversationId: string) => {
    currentChatInstanceRef.current.handleStop()
    setNewConversationId('')
    handleConversationIdInfoChange(conversationId)

    if (conversationId === '' && !checkInputsRequired(true)){
      setShowConfigPanelBeforeChat(true)
      setClearChatList(false)
    }
    else
      setShowConfigPanelBeforeChat(false)
  }, [handleConversationIdInfoChange, setClearChatList,  setShowConfigPanelBeforeChat, checkInputsRequired])
  
  const handleNewConversation = useCallback(async () => {
    handleActivityStatus(activityStatus.ACTIVE)
    currentChatInstanceRef.current.handleStop()
    setShowNewConversationItemInList(true)
    setNewConversationId('')
    setAppInitialized(false)
    handleChangeConversation('')
    handleNewConversationInputsChange(await getProcessedInputsFromUrlParams())
    setClearChatList(true)

    if (showNewConversationItemInList) {
      handleChangeConversation('')
    }
    else if (currentConversationId) {
      handleConversationIdInfoChange('')
      // setShowConfigPanelBeforeChat(true)
      setShowNewConversationItemInList(true)
      if (chatKey){
        handleNewConversationInputsChange({"key":chatKey})
      }
      else handleNewConversationInputsChange({})
    }
  }, [handleChangeConversation, currentConversationId, handleConversationIdInfoChange, setShowConfigPanelBeforeChat, setShowNewConversationItemInList, showNewConversationItemInList, handleNewConversationInputsChange, setClearChatList])

  const handleNewConversationCompleted = useCallback((newConversationId: string) => {
    setNewConversationId(newConversationId)
    handleConversationIdInfoChange(newConversationId)
    setShowNewConversationItemInList(false)
    mutateAppConversationData()
  }, [mutateAppConversationData, handleConversationIdInfoChange])

  const handleFeedback = useCallback(async (messageId: string, feedback: Feedback) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating, content: feedback.content } }, isInstalledApp, appId)
    notify({ type: 'success', message: t('common.api.success') })
  }, [isInstalledApp, appId, t, notify])

  return {
    operationAction,
    avatarName,
    avatarBgColor,
    chatKey,
    appInitialized,
    aivieAppType,
    isInactive, 
    handleActivityStatus,
    appInfoError,
    appInfoLoading: appInfoLoading || (systemFeatures.webapp_auth.enabled && isCheckingPermission),
    userCanAccess: systemFeatures.webapp_auth.enabled ? userCanAccessResult?.result : true,
    isInstalledApp,
    allowResetChat,
    appId,
    currentConversationId,
    currentConversationItem,
    handleConversationIdInfoChange,
    appData,
    appParams: appParams || {} as ChatConfig,
    appMeta,
    appPinnedConversationData,
    appConversationData,
    appConversationDataLoading,
    appChatListData,
    appChatListDataLoading,
    appPrevChatList,
    pinnedConversationList,
    conversationList,
    setShowNewConversationItemInList,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationInputsChange,
    inputsForms,
    handleNewConversation,
    handleStartChat,
    handleChangeConversation,
    handleNewConversationCompleted,
    newConversationId,
    chatShouldReloadKey,
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
    showConfigPanelBeforeChat,
    setShowConfigPanelBeforeChat,
    handleShowConfigPanelBeforeChat,
  }
}
