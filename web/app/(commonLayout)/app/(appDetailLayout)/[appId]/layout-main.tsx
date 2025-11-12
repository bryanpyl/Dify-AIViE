'use client'
import type { FC } from 'react'
import { useUnmount } from 'ahooks'
import React, { useCallback, useEffect, useState } from 'react'
import { notFound, usePathname, useRouter } from 'next/navigation'
import {
  RiDashboard2Fill,
  RiDashboard2Line,
  RiFileList3Fill,
  RiFileList3Line,
  RiTerminalBoxFill,
  RiTerminalBoxLine,
  RiTerminalWindowFill,
  RiTerminalWindowLine,
} from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { useContextSelector } from 'use-context-selector'
import s from './style.module.css'
import cn from '@/utils/classnames'
import { useStore } from '@/app/components/app/store'
import AppSideBar from '@/app/components/app-sidebar'
import type { NavIcon } from '@/app/components/app-sidebar/navLink'
import { fetchAppDetail, fetchAppSSO } from '@/service/apps'
import { fetchAppDetailDirect } from '@/service/apps'
import AppContext, { useAppContext } from '@/context/app-context'
import { usePermissionCheck } from '@/context/permission-context'
import Loading from '@/app/components/base/loading'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import type { App } from '@/types/app'
import useDocumentTitle from '@/hooks/use-document-title'
import { useStore as useTagStore } from '@/app/components/base/tag-management/store'
import dynamic from 'next/dynamic'
import AppUnavailable from '@/app/components/base/app-unavailable'
import useSWR from 'swr'

const TagManagementModal = dynamic(() => import('@/app/components/base/tag-management'), {
  ssr: false,
})

export type IAppDetailLayoutProps = {
  children: React.ReactNode
  appId: string
}

const AppDetailLayout: FC<IAppDetailLayoutProps> = (props) => {
  const {
    children,
    appId, // get appId in path
  } = props
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const { permissions, handleNoViewPermission } = usePermissionCheck()
  const { isLoadingCurrentWorkspace } = useAppContext()
  const { appDetail, setAppDetail, setAppSidebarExpand } = useStore(useShallow(state => ({
    appDetail: state.appDetail,
    setAppDetail: state.setAppDetail,
    setAppSidebarExpand: state.setAppSidebarExpand,
  })))
  const showTagManagementModal = useTagStore(s => s.showTagManagementModal)
  const [isLoadingAppDetail, setIsLoadingAppDetail] = useState(true)
  const [appDetailRes, setAppDetailRes] = useState<App | null>(null)
  const [navigation, setNavigation] = useState<Array<{
    name: string
    href: string
    icon: NavIcon
    selectedIcon: NavIcon
  }>>([])
  const systemFeatures = useContextSelector(AppContext, state => state.systemFeatures)

  const getNavigationConfig = useCallback((appId: string, mode: string) => {
    const navConfig = [
      ...(permissions.applicationOrchestration.view
        ? [{
          name: t('common.appMenus.promptEng'),
          href: `/app/${appId}/${(mode === 'workflow' || mode === 'advanced-chat') ? 'workflow' : 'configuration'}`,
          icon: RiTerminalWindowLine,
          selectedIcon: RiTerminalWindowFill,
        }]
        : []
      ),
      ...(permissions.applicationApiService.view
        ? [{
          name: t('common.appMenus.apiAccess'),
          href: `/app/${appId}/develop`,
          icon: RiTerminalBoxLine,
          selectedIcon: RiTerminalBoxFill,
        }]
        : []
      ),
      ...(permissions.applicationLogsAnnotation.view
        ? [{
          name: mode !== 'workflow'
            ? t('common.appMenus.logAndAnn')
            : t('common.appMenus.logs'),
          href: `/app/${appId}/logs`,
          icon: RiFileList3Line,
          selectedIcon: RiFileList3Fill,
        }]
        : []
      ),
      ...((permissions.applicationPerformanceMonitoring.view ||permissions.applicationSiteManagement.view || permissions.applicationApiService.view) ? [{
        name: t('common.appMenus.overview'),
        href: `/app/${appId}/overview`,
        icon: RiDashboard2Line,
        selectedIcon: RiDashboard2Fill,
      }]:[]),
    ]
    return navConfig
  }, [t, permissions])

  useDocumentTitle(appDetail?.name || t('common.menus.appDetail'))

  useEffect(() => {
    if (appDetail) {
      if (!appDetail.accessible){
        handleNoViewPermission()
      }

      const localeMode = localStorage.getItem('app-detail-collapse-or-expand') || 'expand'
      const mode = isMobile ? 'collapse' : 'expand'
      setAppSidebarExpand(isMobile ? mode : localeMode)
      // TODO: consider screen size and mode
      // if ((appDetail.mode === 'advanced-chat' || appDetail.mode === 'workflow') && (pathname).endsWith('workflow'))
      //   setAppSidebarExpand('collapse')
    }
  }, [appDetail, isMobile])

  const {data:appDetailData, isLoading, error} = useSWR(
    {url:'/apps',id:appId}, fetchAppDetail
  )

  useEffect(()=>{
    if (appDetailData && !isLoading){
      setAppDetailRes(appDetailData)
      setIsLoadingAppDetail(false)
    }
    if (error){
      notFound()
    }
  },[appDetailData,error,isLoading])

  // useEffect(() => {
  //   setAppDetail()
  //   setIsLoadingAppDetail(true)
  //   fetchAppDetailDirect({ url: '/apps', id: appId }).then((res: App) => {
  //     setAppDetailRes(res)
  //   }).catch((e: any) => {
  //     if (e.status === 404)
  //       router.replace('/apps')
  //   }).finally(() => {
  //     setIsLoadingAppDetail(false)
  //   })
  // }, [appId, pathname])

  useEffect(() => {
    if (!appDetailRes || isLoadingCurrentWorkspace || isLoadingAppDetail)
      return
    const res = appDetailRes
    // redirection
    // if (!canIEditApp && (pathname.endsWith('configuration') || pathname.endsWith('workflow') || pathname.endsWith('logs'))) {
    //   router.replace(`/app/${appId}/overview`)
    //   return
    // }
    // if (!permissions.applicationOrchestration.view){
    //   router.replace(`/app/${appId}/${permissions.applicationLogsAnnotation.view?'logs':'overview'}`)
    //   // return
    // }
    if ((res.mode === 'workflow' || res.mode === 'advanced-chat') && (pathname).endsWith('configuration')) {
      router.replace(`/app/${appId}/workflow`)
    }
    else if ((res.mode !== 'workflow' && res.mode !== 'advanced-chat') && (pathname).endsWith('workflow')) {
      router.replace(`/app/${appId}/configuration`)
    }
    else {
      setAppDetail({ ...res, enable_sso: false })
      setNavigation(getNavigationConfig(appId, res.mode))
      if (systemFeatures.enable_web_sso_switch_component) {
        fetchAppSSO({ appId }).then((ssoRes) => {
          setAppDetail({ ...res, enable_sso: ssoRes.enabled })
        })
      }
    }
  }, [appDetailRes, appId, getNavigationConfig, isLoadingAppDetail, isLoadingCurrentWorkspace, pathname, router, setAppDetail, systemFeatures.enable_web_sso_switch_component])

  useEffect(()=>{
    const overviewPermissionCheck = (permissions.applicationSiteManagement.view || permissions.applicationApiService.view || permissions.applicationPerformanceMonitoring.view)
    if (!permissions.applicationOrchestration.view && !permissions.applicationLogsAnnotation.view && !overviewPermissionCheck)
      handleNoViewPermission()
  },[permissions, handleNoViewPermission])

  useUnmount(() => {
    setAppDetail()
  })

  if (!appDetail) {
    return (
      <div className='flex h-full items-center justify-center bg-background-body'>
        <Loading />
      </div>
    )
  }

  return (
    <div className={cn(s.app, 'relative flex', 'overflow-hidden')}>
      {appDetail && (
        <AppSideBar
          navigation={navigation}
        />
      )}
      <div className="grow overflow-hidden bg-components-panel-bg">
        {children}
      </div>
      {showTagManagementModal && (
        <TagManagementModal type='group' show={showTagManagementModal} />
      )}
    </div>
  )
}
export default React.memo(AppDetailLayout)
