import { PermissionType } from "@/models/common"

export const getRedirectionPath = (
  permissions: PermissionType,
  app: { id: string, mode: string },
) => {
  if (!permissions) {
    return `/app/${app.id}/overview`
  }
  else {
    if (app.mode === 'workflow' || app.mode === 'advanced-chat')
      return `/app/${app.id}/workflow`
    else
      return `/app/${app.id}/configuration`
  }
}

export const getRedirection = (
  permissions: PermissionType,
  app: any,
  redirectionFunc: (href: string) => void,
) => {
  if (permissions.applicationOrchestration.view){ 
    if (app.mode === 'workflow' || app.mode === 'advanced-chat') redirectionFunc(`/app/${app.id}/workflow`)
    else redirectionFunc (`/app/${app.id}/configuration`)
  }
  else {
    if (permissions.applicationLogsAnnotation.view) redirectionFunc(`/app/${app.id}/logs`)
    else redirectionFunc(`/app/${app.id}/overview`)
  }
}