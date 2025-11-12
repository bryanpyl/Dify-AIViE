'use client'
import React, { createContext, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslation } from "react-i18next"
import AccountSidebar, {AccountType} from './account-sidebar'
import { usePermissionCheck } from '@/context/permission-context'

export const ScrollContext = createContext<RefObject<HTMLDivElement>|null>(null)

const AccountLayout = ({ children }: { children:ReactNode }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname()
    const isGroups = pathname.endsWith('/groups')
    const isRoles = pathname.endsWith('/roles')
    const isMembers = pathname.endsWith('/members')

    const { permissions, isSystemRole, handleNoViewPermission } = usePermissionCheck()

    if (
      (isGroups && !permissions.groupManagement.view) ||
      (isRoles && !permissions.groupRolesAndPerms.view) ||
      (isMembers && !permissions.groupMemberManagement.view)
    ) {
      return (
        <>
          {
            handleNoViewPermission()
          }
        </>
      )
    }

    if (isSystemRole) {}

    return (
      <div className='flex h-full w-full overflow-hidden'>
        <AccountSidebar accountType={isSystemRole ? AccountType.SystemLevel : AccountType.GroupLevel} />
        <ScrollContext.Provider value={scrollRef}>
        <div ref={scrollRef} className='flex-1 relative flex flex-col overflow-y-auto'>
            {children}
        </div>
        </ScrollContext.Provider>
        
      </div>
    )
}

export default React.memo(AccountLayout)
