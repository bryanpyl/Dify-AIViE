'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tools } from '@/app/components/base/icons/src/vender/line/others'
import Indicator from '@/app/components/header/indicator'
import WorkflowToolModal from '@/app/components/tools/workflow-tool'
import Toast from '@/app/components/base/toast'
import { createWorkflowToolProvider, fetchWorkflowToolDetailByAppID, saveWorkflowToolProvider } from '@/service/tools'
import type { Emoji, WorkflowToolProviderParameter, WorkflowToolProviderRequest, WorkflowToolProviderResponse } from '@/app/components/tools/types'
import type { InputVar } from '@/app/components/workflow/types'
import type { PublishWorkflowParams } from '@/types/workflow'
import { useInvalidateAllWorkflowTools } from '@/service/use-tools'
import SuggestedAction from '../../app/app-publisher/suggested-action'

type Props = {
  disabled: boolean
  published: boolean
  detailNeedUpdate: boolean
  workflowAppId: string
  icon: Emoji
  name: string
  description: string
  inputs?: InputVar[]
  handlePublish: (params?: PublishWorkflowParams) => Promise<void>
  onRefreshData?: () => void
}

const WorkflowToolConfigureButton = ({
  disabled,
  published,
  detailNeedUpdate,
  workflowAppId,
  icon,
  name,
  description,
  inputs,
  handlePublish,
  onRefreshData,
}: Props) => {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [detail, setDetail] = useState<WorkflowToolProviderResponse>()
  const invalidateAllWorkflowTools = useInvalidateAllWorkflowTools()

  const outdated = useMemo(() => {
    if (!detail)
      return false
    if (detail.tool.parameters.length !== inputs?.length) {
      return true
    }
    else {
      for (const item of inputs || []) {
        const param = detail.tool.parameters.find(toolParam => toolParam.name === item.variable)
        if (!param) {
          return true
        }
        else if (param.required !== item.required) {
          return true
        }
        else {
          if (item.type === 'paragraph' && param.type !== 'string')
            return true
          if (item.type === 'text-input' && param.type !== 'string')
            return true
        }
      }
    }
    return false
  }, [detail, inputs])

  const payload = useMemo(() => {
    let parameters: WorkflowToolProviderParameter[] = []
    if (!published) {
      parameters = (inputs || []).map((item) => {
        return {
          name: item.variable,
          description: '',
          form: 'llm',
          required: item.required,
          type: item.type,
        }
      })
    }
    else if (detail && detail.tool) {
      parameters = (inputs || []).map((item) => {
        return {
          name: item.variable,
          required: item.required,
          type: item.type === 'paragraph' ? 'string' : item.type,
          description: detail.tool.parameters.find(param => param.name === item.variable)?.llm_description || '',
          form: detail.tool.parameters.find(param => param.name === item.variable)?.form || 'llm',
        }
      })
    }
    return {
      icon: detail?.icon || icon,
      label: detail?.label || name,
      name: detail?.name || '',
      description: detail?.description || description,
      parameters,
      labels: detail?.tool?.labels || [],
      privacy_policy: detail?.privacy_policy || '',
      ...(published
        ? {
          workflow_tool_id: detail?.workflow_tool_id,
        }
        : {
          workflow_app_id: workflowAppId,
        }),
    }
  }, [detail, published, workflowAppId, icon, name, description, inputs])

  const getDetail = useCallback(async (workflowAppId: string) => {
    setIsLoading(true)
    const res = await fetchWorkflowToolDetailByAppID(workflowAppId)
    setDetail(res)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (published)
      getDetail(workflowAppId)
  }, [getDetail, published, workflowAppId])

  useEffect(() => {
    if (detailNeedUpdate)
      getDetail(workflowAppId)
  }, [detailNeedUpdate, getDetail, workflowAppId])

  const createHandle = async (data: WorkflowToolProviderRequest & { workflow_app_id: string }) => {
    try {
      await createWorkflowToolProvider(data)
      invalidateAllWorkflowTools()
      onRefreshData?.()
      getDetail(workflowAppId)
      Toast.notify({
        type: 'success',
        message: t('common.api.actionSuccess'),
      })
      setShowModal(false)
    }
    catch (e) {
      Toast.notify({ type: 'error', message: (e as Error).message })
    }
  }

  const updateWorkflowToolProvider = async (data: WorkflowToolProviderRequest & Partial<{
    workflow_app_id: string
    workflow_tool_id: string
  }>) => {
    try {
      await handlePublish()
      await saveWorkflowToolProvider(data)
      onRefreshData?.()
      invalidateAllWorkflowTools()
      getDetail(workflowAppId)
      Toast.notify({
        type: 'success',
        message: t('common.api.actionSuccess'),
      })
      setShowModal(false)
    }
    catch (e) {
      Toast.notify({ type: 'error', message: (e as Error).message })
    }
  }

  return (
    <>
      <SuggestedAction
        showArrow={false}
        disabled={disabled}
        onClick={() => {
          if (!disabled){
            setShowModal(true);
          }
        }}
        icon={<Tools className="w-4 h-4" />}
      >
        {t("workflow.common.configure")}
        {outdated && (
          <Indicator className="ml-1" color={"yellow"} />
        )}
      </SuggestedAction>
      {showModal && (
        <WorkflowToolModal
          isAdd={!published}
          payload={payload}
          onHide={() => setShowModal(false)}
          onCreate={createHandle}
          onSave={updateWorkflowToolProvider}
        />
      )}
    </>
  )
}
export default WorkflowToolConfigureButton
