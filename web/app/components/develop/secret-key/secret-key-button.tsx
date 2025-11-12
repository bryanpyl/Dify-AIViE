'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiKey2Line } from '@remixicon/react'
import Button from '@/app/components/base/button'
import SecretKeyModal from '@/app/components/develop/secret-key/secret-key-modal'

export enum ApiSourceType {
  app = 'app',
  dataset = 'dataset',
}

type ISecretKeyButtonProps = {
  className?: string
  appId?: string
  iconCls?: string
  textCls?: string
  type: ApiSourceType
}

const SecretKeyButton = ({ className, appId, iconCls, textCls, type }: ISecretKeyButtonProps) => {
  const [isVisible, setVisible] = useState(false)
  const { t } = useTranslation()
  return (
    <>
      <Button
        className={`px-3 ${className}`}
        onClick={() => setVisible(true)}
        size='small'
        variant='ghost'
      >
        <div className={'flex h-3.5 w-3.5 items-center justify-center'}>
          <RiKey2Line className='h-3.5 w-3.5 text-text-tertiary' />
        </div>
        <div className={`system-xs-medium px-[3px] text-text-tertiary ${textCls}`}>{t('appApi.apiKey')}</div>
      </Button>
      <SecretKeyModal isShow={isVisible} onClose={() => setVisible(false)} appId={appId} type={type} />
    </>
  )
}

export default SecretKeyButton
