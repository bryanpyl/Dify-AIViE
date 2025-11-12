'use client'
import type { FC } from 'react'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ToolProviderList from '@/app/components/tools/provider-list'
import useDocumentTitle from '@/hooks/use-document-title'

const ToolsList: FC = () => {
  const router = useRouter()
  const { t } = useTranslation()
  useDocumentTitle(t('common.menus.tools'))

  useEffect(() => {
    if (typeof window !== 'undefined')
      document.title = `${t('tools.title')} - Dify`
  }, [router, t])

  // useEffect(() => {
  //   if (isCurrentWorkspaceDatasetOperator)
  //     return router.replace('/datasets')
  // }, [isCurrentWorkspaceDatasetOperator, router])

  return <ToolProviderList />
}
export default React.memo(ToolsList)
