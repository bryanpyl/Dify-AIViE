"use client"

import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from "swr"
import { createContext, useContext, useContextSelector } from 'use-context-selector'
import type { FC, ReactNode } from "react"
import { fetchCurrentWorkspace } from "@/service/common"
import type { ICurrentWorkspace, PermissionType } from "@/models/common"
import MaintenanceNotice from "@/app/components/header/maintenance-notice"
import { errorType } from '@/types/app'
import Loading from '@/app/components/base/loading'

export type PermissionCheckValue = {
  permissions: PermissionType
  currentWorkspace: ICurrentWorkspace
  isSystemRole: boolean
  isSuperadministrator: boolean
  mutateCurrentWorkspace: VoidFunction
  pageContainerRef: React.RefObject<HTMLDivElement>
  handleNoViewPermission: VoidFunction
};

// TODO: Further modification is needed :)
const initialWorkspaceInfo: ICurrentWorkspace = {
  id: "",
  name: "",
  plan: "",
  status: "",
  created_at: 0,
  // role: "normal",
  // new_role: "",
  role: "",
  providers: [],
  in_trail: true,
  permissions: [],
};

const initialPermissionValue: PermissionType = {
  applicationManagement: {
    add: false,
    view: false,
    edit: false,
    delete: false
  },
  applicationOrchestration: {
    view: false,
    edit: false
  },
  applicationLogsAnnotation: {
    add: false,
    view: false,
    edit: false,
    delete: false
  },
  applicationSiteManagement: {
    view: false,
    edit: false,
  },
  applicationApiService: {
    add: false,
    view: false,
    edit: false,
    delete: false,
  },
  applicationPerformanceMonitoring: {
    view: false,
  },
  knowledgeManagement: {
    add: false,
    view: false,
    delete: false,
  },
  knowledgeDocumentManagement: {
    add: false,
    view: false,
    edit: false,
    delete: false,
  },
  knowledgeSandbox: {
    view: false,
  },
  knowledgeGeneralSettings: {
    view: false,
    edit: false,
  },
  knowledgeAdvancedSettings: {
    view: false,
    edit: false,
  },
  knowledgeApiService: {
    add: false,
    view: false,
    delete: false,
  },
  settingsModel: {
    add: false,
    view: false,
    edit: false,
    delete: false,
  },
  settingsDataSource: {
    add: false,
    view: false,
    delete: false,
  },
  settingsApiExtension: {
    add: false,
    view: false,
    edit: false,
    delete: false,
  },
  groupManagement: {
    add: false,
    view: false,
    edit: false,
    delete: false,
  },
  groupRolesAndPerms: {
    add: false,
    view: false,
    edit: false,
    delete: false,
  },
  groupMemberManagement: {
    add: false,
    view: false,
    edit: false,
    delete: false,
  },
}

const PermissionCheck = createContext<PermissionCheckValue>({
  permissions: initialPermissionValue,
  currentWorkspace: initialWorkspaceInfo,
  isSystemRole: false,
  isSuperadministrator: false,
  mutateCurrentWorkspace: () => {},
  pageContainerRef: createRef(),
  handleNoViewPermission: () => {}
});

export function useSelector<T>(selector: (value: PermissionCheckValue) => T): T {
  return useContextSelector(PermissionCheck, selector)
}

export type PermissionCheckProviderProps = {
  children: ReactNode
}

export const PermissionCheckProvider: FC<PermissionCheckProviderProps> = ({
  children,
}) => {
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const { data: currentWorkspaceResponse, mutate: mutateCurrentWorkspace } = useSWR({ url: '/workspaces/current', params: {} }, fetchCurrentWorkspace)

  const [currentWorkspace, setCurrentWorkspace] = useState<ICurrentWorkspace>(initialWorkspaceInfo)

  const [permissionInitialized, setPermissionInitialized] = useState<boolean>(false)

  const isSystemRole = useMemo(() => (currentWorkspace.role?.includes('Superadministrator') || currentWorkspace.role?.includes('System Operator')) ?? false, [currentWorkspace.role])

  const isSuperadministrator = useMemo(() => (currentWorkspace.role?.includes('Superadministrator') ?? false), [currentWorkspace.role])

  const permissions:PermissionType = useMemo(()=> {
    const handlePermissionChecking = (key:string)=> currentWorkspace.permissions?.includes(key) ?? false
    
    return {
    // Studio 
    applicationManagement: {
      add: handlePermissionChecking('create-application'),
      view: handlePermissionChecking('view-application'),
      edit: handlePermissionChecking('edit-application'),
      delete: handlePermissionChecking('delete-application')
    },
    applicationOrchestration: {
      view: handlePermissionChecking('view-orchestration'),
      edit: handlePermissionChecking('edit-orchestration')
    },
    applicationLogsAnnotation: {
      add: handlePermissionChecking('create-logs-and-annotation'),
      view: handlePermissionChecking('view-logs-and-annotation'),
      edit: handlePermissionChecking('edit-logs-and-annotation'),
      delete: handlePermissionChecking('delete-logs-and-annotation')
    },
    applicationSiteManagement: {
      view: handlePermissionChecking('view-site-settings'),
      edit: handlePermissionChecking('edit-site-settings'),
    },
    applicationApiService:{
      add:handlePermissionChecking('create-studio-api-key'),
      view:handlePermissionChecking('view-api-settings'),
      edit:handlePermissionChecking('edit-studio-api-key'),
      delete:handlePermissionChecking('delete-studio-api-key')
    },
    applicationPerformanceMonitoring: {
      view: handlePermissionChecking('view-performance-analysis'),
    },
    // Knowledge Base
    knowledgeManagement: {
      add: handlePermissionChecking('create-knowledge'),
      view: handlePermissionChecking('view-knowledge'),
      delete: handlePermissionChecking('delete-knowledge')
    },
    knowledgeDocumentManagement: {
      add: handlePermissionChecking('add-document'),
      view: handlePermissionChecking('view-document'),
      edit: handlePermissionChecking('edit-document'),
      delete: handlePermissionChecking('delete-document')
    },
    knowledgeSandbox: {
      view: handlePermissionChecking('view-sandbox'),
    },
    knowledgeGeneralSettings: {
      view: handlePermissionChecking('view-general-settings'),
      edit: handlePermissionChecking('edit-general-settings'),
    },
    knowledgeAdvancedSettings: {
      view: handlePermissionChecking('view-advanced-settings'),
      edit: handlePermissionChecking('edit-advanced-settings'),
    },
    knowledgeApiService: {
      add: handlePermissionChecking('create-knowledge-api-key'),
      view: handlePermissionChecking('view-api-documentation'),
      delete: handlePermissionChecking('delete-knowledge-api-key')
    },
    // Group Management
    groupManagement: {
      add: handlePermissionChecking('create-group'),
      view: handlePermissionChecking('view-group'),
      edit: handlePermissionChecking('edit-group'),
      delete: handlePermissionChecking('delete-group')
    },
    groupRolesAndPerms: {
      add: handlePermissionChecking('create-role-and-permission'),
      view: handlePermissionChecking('view-role-and-permission'),
      edit: handlePermissionChecking('edit-role-and-permission'),
      delete: handlePermissionChecking('delete-role')
    },
    groupMemberManagement: {
      add: handlePermissionChecking('add-group-member'),
      view: handlePermissionChecking('view-group-member'),
      edit: handlePermissionChecking('edit-group-member'),
      delete: handlePermissionChecking('delete-group-member')
    },
    // Settings
    settingsModel: {
      add: handlePermissionChecking('add-model'),
      view: handlePermissionChecking('view-model'),
      edit: handlePermissionChecking('edit-model'),
      delete: handlePermissionChecking('delete-model')
    },
    settingsDataSource: {
      add: handlePermissionChecking('add-data-source'),
      view: handlePermissionChecking('view-data-source'),
      edit: handlePermissionChecking('edit-data-source'),
      delete: handlePermissionChecking('delete-data-source')
    },
    settingsApiExtension: {
      add: handlePermissionChecking('add-api-extension'),
      view: handlePermissionChecking('view-api-extension'),
      edit: handlePermissionChecking('edit-api-extension'),
      delete: handlePermissionChecking('delete-api-extension')
    },
  }}, [currentWorkspace.permissions])

  const handleNoViewPermission = (): void => {
    const error = new Error ('Unauthorised')
    error.errorCode = errorType.unauthorized;
    throw error;
  }

  useEffect(() => {
    if (currentWorkspaceResponse){
      setCurrentWorkspace(currentWorkspaceResponse)
      setPermissionInitialized(true)
    }
  }, [currentWorkspaceResponse])

  if (!permissionInitialized){
    return(
      <Loading type='app' />
    )
  }

  return (
    <PermissionCheck.Provider value={{
        permissions,
        pageContainerRef,
        currentWorkspace,
        isSystemRole,
        isSuperadministrator,
        mutateCurrentWorkspace,
        handleNoViewPermission
    }}>
      <div className='flex flex-col h-full overflow-y-auto'>
        {globalThis.document?.body?.getAttribute('data-public-maintenance-notice') && <MaintenanceNotice />}
        <div ref={pageContainerRef} className='grow relative flex flex-col overflow-y-auto overflow-x-hidden bg-background-body'>
            {children}
        </div>
      </div>
    </PermissionCheck.Provider>
  );
};

export const usePermissionCheck = () => useContext(PermissionCheck);

export default PermissionCheck;
