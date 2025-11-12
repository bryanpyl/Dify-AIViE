'use client'

import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { createContext, useContext, useContextSelector } from 'use-context-selector'
import type { FC, ReactNode } from 'react'
import { fetchAppList } from '@/service/apps'
import Loading from '@/app/components/base/loading'
import { fetchCurrentWorkspace, fetchLangGeniusVersion, fetchUserProfile, getSystemFeatures } from '@/service/common'
import type { ICurrentWorkspace, LangGeniusVersionResponse, UserProfileResponse } from '@/models/common'
import MaintenanceNotice from '@/app/components/header/maintenance-notice'
import { noop } from 'lodash-es'
import { setZendeskConversationFields } from '@/app/components/base/zendesk/utils'
import { ZENDESK_FIELD_IDS } from '@/config'
import type { SystemFeatures } from '@/types/feature'
import { defaultSystemFeatures } from '@/types/feature'
import { Theme } from '@/types/app'
import type { App } from '@/types/app'
import { fetchGroupIdByTarget, fetchGroupDetail, fetchTargetIdByGroup } from '@/service/account'
import type { GroupDetailResponse } from '@/models/account'

export type AppContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  apps: App[]
  systemFeatures: SystemFeatures
  mutateApps: VoidFunction
  userProfile: UserProfileResponse
  mutateUserProfile: VoidFunction
  currentWorkspace: ICurrentWorkspace
  // isCurrentWorkspaceManager: boolean
  // isCurrentWorkspaceOwner: boolean
  // isCurrentWorkspaceEditor: boolean
  // isCurrentWorkspaceDatasetOperator: boolean
  mutateCurrentWorkspace: VoidFunction
  pageContainerRef: React.RefObject<HTMLDivElement | null>
  langGeniusVersionInfo: LangGeniusVersionResponse
  useSelector: typeof useSelector
  isContextInitialized: boolean
  isLoadingCurrentWorkspace: boolean
  isLoadingCurrentUserProfile: boolean
  groupId: string
  userGroupDetail?: GroupDetailResponse
  mutateUserGroupDetail:VoidFunction
}

const initialLangeniusVersionInfo = {
  current_env: '',
  current_version: '',
  latest_version: '',
  release_date: '',
  release_notes: '',
  version: '',
  can_auto_update: false,
}

const userProfilePlaceholder = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  avatar_url: '',
  is_password_set: false,
}


const initialWorkspaceInfo: ICurrentWorkspace = {
  id: '',
  name: '',
  plan: '',
  status: '',
  created_at: 0,
  // role: 'normal',
  // new_role: '',
  role: '',
  providers: [],
  in_trail: true,
}

const initialGroupDetailInfo = {
  id: '', 
  name: '', 
  agency_name: '', 
  description: '', 
  knowledge_count: 0,
  app_count: 0, 
  user_count: 0, 
  role_count: 0,
  app_id: '', 
  chat_token: ''
}

const AppContext = createContext<AppContextValue>({
 theme: Theme.light,
  systemFeatures: defaultSystemFeatures,
  setTheme: () => { },
  apps: [],
  mutateApps: () => { },
  userProfile: {
    id: '',
    name: '',
    email: '',
    avatar: '',
    is_password_set: false,
  },
  currentWorkspace: initialWorkspaceInfo,
  // isCurrentWorkspaceManager: false,
  // isCurrentWorkspaceOwner: false,
  // isCurrentWorkspaceEditor: false,
  // isCurrentWorkspaceDatasetOperator: false,
  mutateUserProfile: () => { },
  mutateCurrentWorkspace: () => { },
  pageContainerRef: createRef(),
  langGeniusVersionInfo: initialLangeniusVersionInfo,
  useSelector,
  isContextInitialized: false,
  isLoadingCurrentWorkspace: false,
  isLoadingCurrentUserProfile: false,
  groupId: '',
  userGroupDetail: initialGroupDetailInfo,
  mutateUserGroupDetail: () => {}
})

export function useSelector<T>(selector: (value: AppContextValue) => T): T {
  return useContextSelector(AppContext, selector)
}

export type AppContextProviderProps = {
  children: ReactNode
}

export const AppContextProvider: FC<AppContextProviderProps> = ({ children }) => {
  const pageContainerRef = useRef<HTMLDivElement>(null)
  
  const { data: appList, mutate: mutateApps } = useSWR({ url: '/apps', params: { page: 1, limit: 30, name: '' } }, fetchAppList)
  const { data: userProfileResponse, mutate: mutateUserProfile, isLoading: isLoadingCurrentUserProfile, error: userProfileError } = useSWR({ url: '/account/profile', params: {} }, fetchUserProfile)
  const { data: currentWorkspaceResponse, mutate: mutateCurrentWorkspace, isLoading: isLoadingCurrentWorkspace } = useSWR({ url: '/workspaces/current', params: {} }, fetchCurrentWorkspace)
  const { data: systemFeatures } = useSWR({ url: '/console/system-features' }, getSystemFeatures, {
    fallbackData: defaultSystemFeatures,
  })

  const [isInitialized, setIsInitialized] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfileResponse>(userProfilePlaceholder)
  const [groupId, setGroupId]= useState('')
  const [userGroupDetail, setUserGroupDetail] = useState<GroupDetailResponse>(initialGroupDetailInfo)
  const [langGeniusVersionInfo, setLangGeniusVersionInfo] = useState<LangGeniusVersionResponse>(initialLangeniusVersionInfo)
  const [currentWorkspace, setCurrentWorkspace] = useState<ICurrentWorkspace>(initialWorkspaceInfo)
  // const isCurrentWorkspaceManager = useMemo(() => ['owner', 'admin'].includes(currentWorkspace.role), [currentWorkspace.role])
  // const isCurrentWorkspaceOwner = useMemo(() => currentWorkspace.role === 'owner', [currentWorkspace.role])
  // const isCurrentWorkspaceEditor = useMemo(() => ['owner', 'admin', 'editor'].includes(currentWorkspace.role), [currentWorkspace.role])
  // const isCurrentWorkspaceDatasetOperator = useMemo(() => currentWorkspace.role === 'dataset_operator', [currentWorkspace.role])
  
  const {data: groupIdResponse, isLoading: groupIdResponseIsLoading, mutate: mutateGroupDetail} = useSWR(
    userProfile?.id? {
      params: {
        target_id:userProfile?.id,
        type:'user'
      }
    } : null, fetchGroupIdByTarget
  )

  const {data: groupBindingAppId, mutate: mutateGroupBindingAppId, isLoading: isLoadingGroupBindingAppId} = useSWR(
    groupIdResponse?.[0]?{
      params: {
        group_id: groupIdResponse?.[0],
        type: "app",
      },
    }:null,
    fetchTargetIdByGroup
  );

  const {data: userGroupDetailResponse, mutate: mutateUserGroupDetail}= useSWR(
    groupIdResponse?.[0]?{
      id:groupIdResponse?.[0]
    }:null,
    fetchGroupDetail
  )
  
  const updateUserProfileAndVersion = useCallback(async () => {
    if (userProfileResponse && !userProfileResponse.bodyUsed) {
      try {
        const result = await userProfileResponse.json()
        setUserProfile(result)
        const current_version = userProfileResponse.headers.get('x-version')
        const current_env = process.env.NODE_ENV === 'development' ? 'DEVELOPMENT' : userProfileResponse.headers.get('x-env')
        const versionData = await fetchLangGeniusVersion({ url: '/version', params: { current_version } })
        setLangGeniusVersionInfo({ ...versionData, current_version, latest_version: versionData.version, current_env })
      }
      catch (error) {
        console.error('Failed to update user profile:', error)
        if (userProfile.id === '')
          setUserProfile(userProfilePlaceholder)
      }
    }
    else if (userProfileError && userProfile.id === '') {
      setUserProfile(userProfilePlaceholder)
    }
  }, [userProfileResponse, userProfileError, userProfile.id])

  useEffect(() => {
    updateUserProfileAndVersion()
  }, [updateUserProfileAndVersion, userProfileResponse])

  useEffect(() => {
    if (currentWorkspaceResponse)
      setCurrentWorkspace(currentWorkspaceResponse)
  }, [currentWorkspaceResponse])

  // #region Zendesk conversation fields
  useEffect(() => {
    if (ZENDESK_FIELD_IDS.ENVIRONMENT && langGeniusVersionInfo?.current_env) {
      setZendeskConversationFields([{
        id: ZENDESK_FIELD_IDS.ENVIRONMENT,
        value: langGeniusVersionInfo.current_env.toLowerCase(),
      }])
    }
  }, [langGeniusVersionInfo?.current_env])

  useEffect(() => {
    if (ZENDESK_FIELD_IDS.VERSION && langGeniusVersionInfo?.version) {
      setZendeskConversationFields([{
        id: ZENDESK_FIELD_IDS.VERSION,
        value: langGeniusVersionInfo.version,
      }])
    }
  }, [langGeniusVersionInfo?.version])

  useEffect(() => {
    if (ZENDESK_FIELD_IDS.EMAIL && userProfile?.email) {
      setZendeskConversationFields([{
        id: ZENDESK_FIELD_IDS.EMAIL,
        value: userProfile.email,
      }])
    }
  }, [userProfile?.email])

  useEffect(() => {
    if (ZENDESK_FIELD_IDS.WORKSPACE_ID && currentWorkspace?.id) {
      setZendeskConversationFields([{
        id: ZENDESK_FIELD_IDS.WORKSPACE_ID,
        value: currentWorkspace.id,
      }])
    }
  }, [currentWorkspace?.id])
  // #endregion Zendesk conversation fields

  useEffect(() => {
    if (groupIdResponse && userGroupDetailResponse && groupBindingAppId) {
      setGroupId(groupIdResponse[0]);
      setUserGroupDetail((prev) => ({
        ...prev,
        id: userGroupDetailResponse.id || prev.id,
        name: userGroupDetailResponse.name || prev.name,
        agency_name: userGroupDetailResponse.agency_name || prev.agency_name,
        description: userGroupDetailResponse.description || prev.description,
        knowledge_count:
          userGroupDetailResponse.knowledge_count ?? prev.knowledge_count,
        app_count: userGroupDetailResponse.app_count ?? prev.app_count,
        user_count: userGroupDetailResponse.user_count ?? prev.user_count,
        role_count: userGroupDetailResponse.role_count ?? prev.role_count,
        chat_token: userGroupDetailResponse.chat_token || prev.chat_token,
        app_id: groupBindingAppId[0] || prev.app_id,
      }));
      setIsInitialized(true);
    } else if (currentWorkspaceResponse && userProfileResponse && (currentWorkspace.role === 'Superadministrator' || currentWorkspace.role === 'System Operator')) {
      setIsInitialized(true);
    }
  }, [
    currentWorkspaceResponse,
    userProfileResponse,
    groupBindingAppId,
    groupIdResponse,
    userGroupDetailResponse,
  ]);

  const [theme, setTheme] = useState<Theme>(Theme.light)
  const handleSetTheme = useCallback((theme: Theme) => {
    setTheme(theme)
    globalThis.document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    globalThis.document.documentElement.setAttribute('data-theme', theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!appList || !userProfile)
    return <Loading type='app' />

  return (
    <AppContext.Provider value={{
      theme,
      setTheme: handleSetTheme,
      apps: appList.data,
      systemFeatures: { ...defaultSystemFeatures, ...systemFeatures },
      mutateApps,
      userProfile,
      mutateUserProfile,
      pageContainerRef,
      langGeniusVersionInfo,
      useSelector,
      currentWorkspace,
      // isCurrentWorkspaceManager,
      // isCurrentWorkspaceOwner,
      // isCurrentWorkspaceEditor,
      // isCurrentWorkspaceDatasetOperator,
      mutateCurrentWorkspace,
      isContextInitialized: isInitialized,
      isLoadingCurrentWorkspace,
      isLoadingCurrentUserProfile,
      groupId,
      userGroupDetail,
      mutateUserGroupDetail
    }}>
      <div className='flex h-full flex-col overflow-y-auto'>
        {globalThis.document?.body?.getAttribute('data-public-maintenance-notice') && <MaintenanceNotice />}
        <div className='relative flex grow flex-col overflow-y-auto overflow-x-hidden bg-background-body'>
          {children}
        </div>
      </div>
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)

export default AppContext
