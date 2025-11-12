import React from 'react'
import { useTranslation } from 'react-i18next'
import { Group3Line, UserLine, UserCommunityLine, Key2Line } from '@/app/components/base/icons/src/vender/line/accountManagement'
import { Group3Fill, UserFill, UserCommunityFill, Key2Fill } from '@/app/components/base/icons/src/vender/solid/accountManagement'
import {
  RiRobot2Fill,
  RiRobot2Line,
} from '@remixicon/react'
import {
  RiBook2Fill,
  RiBook2Line,
} from '@remixicon/react'
import NavLink from '@/app/components/app-sidebar/navLink';
import { useAppContext } from '@/context/app-context';
import { usePermissionCheck } from '@/context/permission-context'

export enum AccountType {
    SystemLevel='system-level',
    GroupLevel='group-level'
  }

export type AccountTypeProps = {
    accountType: AccountType
}

const AccountSidebar: React.FC<AccountTypeProps>=({accountType})=>{
  const { t } = useTranslation()
  const { userGroupDetail } = useAppContext()
  const { permissions, isSystemRole } = usePermissionCheck()
  const navigation = [
    {"name": t('account.accountMenu.myAccount'), "href": "/accounts", "icon": UserLine, "selectedIcon": UserFill},
    ...(permissions.groupManagement.view ?
      [{"name": t('account.accountMenu.groupManagement'), "href": permissions.groupManagement.view && isSystemRole ? '/accounts/groups' : `/accounts/groups/${userGroupDetail?.id}`, "icon": UserCommunityLine, "selectedIcon": UserCommunityFill}] : []
    ),
    ...(permissions.groupRolesAndPerms.view ?
      [{"name": t('account.accountMenu.rolesPermission'), "href": "/accounts/roles", "icon": Key2Line, "selectedIcon": Key2Fill},] : []
    ),
    ...(permissions.groupMemberManagement.view ?
      [{"name": t('account.accountMenu.groupMembers'), "href": "/accounts/members", "icon": Group3Line, "selectedIcon": Group3Fill}] : []
    ),
  ]

  const workspaceNavigation = [
    ...(
      permissions.applicationManagement.view
        ? [{
          "name": t('account.workspaceMenu.appStudio'),
          "href": "/apps",
          "icon": RiRobot2Line,
          "selectedIcon": RiRobot2Fill
        }]
      : permissions.applicationOrchestration.view
        ? [{
          "name": t('account.workspaceMenu.appStudio'),
          "href": `/app/${userGroupDetail?.app_id}/configuration`,
          "icon": RiRobot2Line,
          "selectedIcon": RiRobot2Fill
        }]
      : permissions.applicationLogsAnnotation.view
        ? [{
          "name": t('account.workspaceMenu.appStudio'),
          "href": `/app/${userGroupDetail?.app_id}/logs`,
          "icon": RiRobot2Line,
          "selectedIcon": RiRobot2Fill
        }]
      : permissions.applicationSiteManagement.view || permissions.applicationPerformanceMonitoring.view
        ? [{
          "name": t('account.workspaceMenu.appStudio'),
          "href": `/app/${userGroupDetail?.app_id}/overview`,
          "icon": RiRobot2Line,
          "selectedIcon": RiRobot2Fill
        }]
      : []
    ),
    {
      "name": t('account.workspaceMenu.knowledgeBase'),
      "href": "/datasets",
      "icon": RiBook2Line,
      "selectedIcon": RiBook2Fill
    },
  ]

  return (
    <div className="box-border shrink-0 h-full flex flex-col bg-background-default-subtle border-r border-divider-burn transition-all min-w-[216px] md:max-w-96 md:py-5 px-5 space-y-5">
      {accountType == AccountType.GroupLevel ? (
        <div className="flex gap-2 items-stretch">
          <div className="flex-shrink-0 items-center justify-center p-3 bg-blue-50 rounded-md h-fit">
              <UserCommunityLine className="w-4 h-4 text-[#444CE7]" />
          </div>

          <div className="flex flex-col w-full min-w-0 justify-center">
              <h2 className="system-sm-semibold text-text-secondary truncate w-full overflow-hidden whitespace-nowrap">
              {userGroupDetail?.name}
              </h2>
              <p className="mt-1 text-text-tertiary system-2xs-medium">
              {userGroupDetail?.agency_name}
              </p>
          </div>
        </div>
      ) : null
      }

      <div className="flex flex-col gap-3 border-b border-b-gray-200 py-2">
        <h2 className="system-md-semibold text-text-secondary">
          {t('account.accountMenu.title')}
        </h2>
        <div className="grow space-y-2">
          {navigation.map((item, index) => {
            return (
              <NavLink
                key={index}
                iconMap={{selected: item.selectedIcon, normal: item.icon}}
                name={item.name}
                href={item.href}
              />
            );
          })}
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        <h2 className="system-md-semibold text-text-secondary">
          {t('account.workspaceMenu.title')}
        </h2>
        <div className="grow space-y-2">
          {workspaceNavigation.map((item, index) => {
            return (
              <NavLink key={index}
                iconMap={{selected: item.selectedIcon, normal: item.icon}}
                name={item.name}
                href={item.href}>
              </NavLink>
            )
          })}
        </div>
      </div>
    </div>
  );
}

export default React.memo(AccountSidebar)