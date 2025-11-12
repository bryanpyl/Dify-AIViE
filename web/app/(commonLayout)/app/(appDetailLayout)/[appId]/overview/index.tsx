'use client'
import React from 'react'
import ChartView from './chart-view'
import CardView from './card-view'
import TracingPanel from './tracing/panel'
import ApikeyInfoPanel from '@/app/components/app/overview/apikey-info-panel'
import { usePermissionCheck } from '@/context/permission-context'

type OverviewMainProps = {
    appId:string
}
const OverviewMain:React.FC<OverviewMainProps> = ({appId})=>{
    const { permissions, handleNoViewPermission } = usePermissionCheck()
    if (!permissions.applicationApiService.view && !permissions.applicationSiteManagement.view && !permissions.applicationPerformanceMonitoring.view){
        handleNoViewPermission()
    } 
        
    return (
        <div className="h-full px-4 sm:px-16 py-6 overflow-scroll">
          {/* <ApikeyInfoPanel /> */}
          <TracingPanel />
          <CardView appId={appId} />
          <ChartView appId={appId} />
        </div>
      )
}

export default React.memo (OverviewMain)