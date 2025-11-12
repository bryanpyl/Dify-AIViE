import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'ahooks'
import {
  RiAlertFill,
  RiBrainLine,
} from '@remixicon/react'
import SystemModelSelector from './system-model-selector'
import ProviderAddedCard, { UPDATE_MODEL_PROVIDER_CUSTOM_MODEL_LIST } from './provider-added-card'
import type {
  CustomConfigurationModelFixedFields,
  ModelProvider,
} from './declarations'
import {
  ConfigurationMethodEnum,
  CustomConfigurationStatusEnum,
  ModelTypeEnum,
} from './declarations'
import {
  useDefaultModel,
  useUpdateModelList,
  useUpdateModelProviders,
} from './hooks'
import InstallFromMarketplace from './install-from-marketplace'
import { useProviderContext } from '@/context/provider-context'
import { useModalContextSelector } from '@/context/modal-context'
import { useEventEmitterContextContext } from '@/context/event-emitter'
import cn from '@/utils/classnames'
import { useGlobalPublicStore } from '@/context/global-public-context'
import { usePermissionCheck } from '@/context/permission-context'

type Props = {
  searchText: string
}

const FixedModelProvider = ['langgenius/openai/openai', 'langgenius/anthropic/anthropic']

const ModelProviderPage = ({ searchText }: Props) => {
  const debouncedSearchText = useDebounce(searchText, { wait: 500 })
  const { t } = useTranslation()
  const { eventEmitter } = useEventEmitterContextContext()
  const updateModelProviders = useUpdateModelProviders()
  const updateModelList = useUpdateModelList()
  const { data: textGenerationDefaultModel } = useDefaultModel(ModelTypeEnum.textGeneration)
  const { data: embeddingsDefaultModel } = useDefaultModel(ModelTypeEnum.textEmbedding)
  const { data: rerankDefaultModel } = useDefaultModel(ModelTypeEnum.rerank)
  const { data: speech2textDefaultModel } = useDefaultModel(ModelTypeEnum.speech2text)
  const { data: ttsDefaultModel } = useDefaultModel(ModelTypeEnum.tts)
  const { modelProviders: providers } = useProviderContext()
  const setShowModelModal = useModalContextSelector(state => state.setShowModelModal)
  const { permissions } = usePermissionCheck()
  const { enable_marketplace } = useGlobalPublicStore(s => s.systemFeatures)
  const defaultModelNotConfigured = !textGenerationDefaultModel && !embeddingsDefaultModel && !speech2textDefaultModel && !rerankDefaultModel && !ttsDefaultModel
  const [configuredProviders, notConfiguredProviders] = useMemo(() => {
    const configuredProviders: ModelProvider[] = []
    const notConfiguredProviders: ModelProvider[] = []

    providers.forEach((provider) => {
      if (
        provider.custom_configuration.status === CustomConfigurationStatusEnum.active
        || (
          provider.system_configuration.enabled === true
          && provider.system_configuration.quota_configurations.find(item => item.quota_type === provider.system_configuration.current_quota_type)
        )
      )
        configuredProviders.push(provider)
      else
        notConfiguredProviders.push(provider)
    })

    configuredProviders.sort((a, b) => {
      if (FixedModelProvider.includes(a.provider) && FixedModelProvider.includes(b.provider))
        return FixedModelProvider.indexOf(a.provider) - FixedModelProvider.indexOf(b.provider) > 0 ? 1 : -1
      else if (FixedModelProvider.includes(a.provider))
        return -1
      else if (FixedModelProvider.includes(b.provider))
        return 1
      return 0
    })

    return [configuredProviders, notConfiguredProviders]
  }, [providers])
  const [filteredConfiguredProviders, filteredNotConfiguredProviders] = useMemo(() => {
    const filteredConfiguredProviders = configuredProviders.filter(
      provider => provider.provider.toLowerCase().includes(debouncedSearchText.toLowerCase())
        || Object.values(provider.label).some(text => text.toLowerCase().includes(debouncedSearchText.toLowerCase())),
    )
    const filteredNotConfiguredProviders = notConfiguredProviders.filter(
      provider => provider.provider.toLowerCase().includes(debouncedSearchText.toLowerCase())
        || Object.values(provider.label).some(text => text.toLowerCase().includes(debouncedSearchText.toLowerCase())),
    )

    return [filteredConfiguredProviders, filteredNotConfiguredProviders]
  }, [configuredProviders, debouncedSearchText, notConfiguredProviders])

  const handleOpenModal = (
    provider: ModelProvider,
    configurateMethod: ConfigurationMethodEnum,
    CustomConfigurationModelFixedFields?: CustomConfigurationModelFixedFields,
  ) => {
    setShowModelModal({
      payload: {
        currentProvider: provider,
        currentConfigurationMethod: configurateMethod,
        currentCustomConfigurationModelFixedFields: CustomConfigurationModelFixedFields,
      },
      onSaveCallback: () => {
        updateModelProviders()

        if (configurateMethod === ConfigurationMethodEnum.predefinedModel) {
          provider.supported_model_types.forEach((type) => {
            updateModelList(type)
          })
        }

        if (configurateMethod === ConfigurationMethodEnum.customizableModel && provider.custom_configuration.status === CustomConfigurationStatusEnum.active) {
          eventEmitter?.emit({
            type: UPDATE_MODEL_PROVIDER_CUSTOM_MODEL_LIST,
            payload: provider.provider,
          } as any)

          if (CustomConfigurationModelFixedFields?.__model_type)
            updateModelList(CustomConfigurationModelFixedFields?.__model_type)
        }
      },
    })
  }

  return (
    <div className='relative -mt-2 pt-1'>
      <div className={cn('mb-2 flex items-center')}>
        <div className='system-md-semibold grow text-text-primary'>{t('common.modelProvider.models')}</div>
        <div className={cn(
          'relative flex shrink-0 items-center justify-end gap-2 rounded-lg border border-transparent p-px',
          defaultModelNotConfigured && 'border-components-panel-border bg-components-panel-bg-blur pl-2 shadow-xs',
        )}>
          {defaultModelNotConfigured && <div className='absolute bottom-0 left-0 right-0 top-0 opacity-40' style={{ background: 'linear-gradient(92deg, rgba(247, 144, 9, 0.25) 0%, rgba(255, 255, 255, 0.00) 100%)' }} />}
          {defaultModelNotConfigured && (
            <div className='system-xs-medium flex items-center gap-1 text-text-primary'>
              <RiAlertFill className='h-4 w-4 text-text-warning-secondary' />
              {t('common.modelProvider.notConfigured')}
            </div>
          )}
          <SystemModelSelector
            notConfigured={defaultModelNotConfigured}
            textGenerationDefaultModel={textGenerationDefaultModel}
            embeddingsDefaultModel={embeddingsDefaultModel}
            rerankDefaultModel={rerankDefaultModel}
            speech2textDefaultModel={speech2textDefaultModel}
            ttsDefaultModel={ttsDefaultModel}
          />
        </div>
      </div>
      {!permissions.settingsModel.add && !filteredConfiguredProviders?.length && (
        <div className='mb-2 rounded-[10px] bg-workflow-process-bg p-4'>
          <div className='flex h-10 w-10 items-center justify-center rounded-[10px] border-[0.5px] border-components-card-border bg-components-card-bg shadow-lg backdrop-blur'>
            <RiBrainLine className='h-5 w-5 text-text-primary' />
          </div>
          <div className='system-sm-medium mt-2 text-text-secondary'>{t('common.modelProvider.emptyProviderTitle')}</div>
          <div className='system-xs-regular mt-1 text-text-tertiary'>{t('common.modelProvider.emptyProviderTip')}</div>
        </div>
      )}
      {!!filteredConfiguredProviders?.length && (
        <div className='relative'>
          {filteredConfiguredProviders?.map(provider => (
            <ProviderAddedCard
              key={provider.provider}
              provider={provider}
              onOpenModal={(configurateMethod: ConfigurationMethodEnum, currentCustomConfigurationModelFixedFields?: CustomConfigurationModelFixedFields) => handleOpenModal(provider, configurateMethod, currentCustomConfigurationModelFixedFields)}
            />
          ))}
        </div>
      )}
      {permissions.settingsModel.add && !!filteredNotConfiguredProviders?.length && (
        <>
          <div className='system-md-semibold mb-2 flex items-center pt-2 text-text-primary'>{t('common.modelProvider.toBeConfigured')}</div>
          <div className='relative'>
            {filteredNotConfiguredProviders?.map(provider => (
              <ProviderAddedCard
                notConfigured
                key={provider.provider}
                provider={provider}
                onOpenModal={(configurateMethod: ConfigurationMethodEnum) => handleOpenModal(provider, configurateMethod)}
              />
            ))}
          </div>
        </>
      )}
      {
        enable_marketplace && (
          <InstallFromMarketplace
            providers={providers}
            searchText={searchText}
          />
        )
      }
    </div>
  )
}

export default ModelProviderPage
