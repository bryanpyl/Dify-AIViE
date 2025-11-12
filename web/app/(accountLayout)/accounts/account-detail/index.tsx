'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useContext } from 'use-context-selector'
import s from './index.module.css'
import AvatarWithEdit from './AvatarWithEdit'
import type { IItem } from '@/app/components/header/account-setting/collapse'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import { updateUserProfile } from '@/service/common'
import { useAppContext } from '@/context/app-context'
import { ToastContext } from '@/app/components/base/toast'
import AppIcon from '@/app/components/base/app-icon'
import Input from '@/app/components/base/input'

const titleClassName = `
  system-sm-semibold text-text-secondary
`
const descriptionClassName = `
  mt-1 body-xs-regular text-text-tertiary
`

export default function AccountPage() {
  const { t } = useTranslation()
  const { systemFeatures } = useAppContext()
  const { mutateUserProfile, userProfile, apps } = useAppContext()
  const { notify } = useContext(ToastContext)
  const [editNameModalVisible, setEditNameModalVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [editing, setEditing] = useState(false)

  const handleEditName = () => {
    setEditNameModalVisible(true)
    setEditName(userProfile.name)
  }
  const handleSaveName = async () => {
    try {
      setEditing(true)
      await updateUserProfile({ url: 'account/name', body: { name: editName } })
      notify({ type: 'success', message: t('common.actionMsg.modifiedSuccessfully') })
      mutateUserProfile()
      setEditNameModalVisible(false)
      setEditing(false)
    }
    catch (e) {
      notify({ type: 'error', message: (e as Error).message })
      setEditNameModalVisible(false)
      setEditing(false)
    }
  }

  const showErrorMessage = (message: string) => {
    notify({
      type: 'error',
      message,
    })
  }

  const renderAppItem = (item: IItem) => {
    return (
      <div className='flex px-3 py-1'>
        <div className='mr-3'>
          <AppIcon size='tiny' />
        </div>
        <div className='mt-[3px] system-sm-medium text-text-secondary'>{item.name}</div>
      </div>
    )
  }

  return (
    <>
      <div className='pt-2 pb-3 mb-2'>
        <h4 className='title-xl-semi-bold text-text-primary'>{t('accountDetail.myAccount')}</h4>
      </div>
      <div className='grow flex-col mx-auto max-w-[90%]'>
        <div className='mb-8 p-6 rounded-xl flex items-center bg-gradient-to-r from-background-gradient-bg-fill-chat-bg-2 to-background-gradient-bg-fill-chat-bg-1'>
          <AvatarWithEdit avatar={userProfile.avatar_url ?? null} name={userProfile.name} onSave={ mutateUserProfile } size={64} />
          <div className='ml-4'>
            <p className='system-xl-semibold text-text-primary'>{userProfile.name}</p>
            <p className='system-xs-regular text-text-tertiary'>{userProfile.email}</p>
          </div>
        </div>
        <div className='mb-8'>
          <div className={titleClassName}>{t('accountDetail.name')}</div>
          <div className='flex items-center justify-between gap-2 w-full mt-2'>
            <div className='flex-1 bg-components-input-bg-normal rounded-lg p-2 system-sm-regular text-components-input-text-filled '>
              <span className='pl-1'>{userProfile.name}</span>
            </div>
            <div className='bg-components-button-tertiary-bg rounded-lg py-2 px-3 cursor-pointer system-sm-medium text-components-button-tertiary-text' onClick={handleEditName}>
              {t('common.operation.edit')}
            </div>
          </div>
        </div>
        <div className='mb-8'>
          <div className={titleClassName}>{t('accountDetail.email')}</div>
          <div className='flex items-center justify-between gap-2 w-full mt-2'>
            <div className='flex-1 bg-components-input-bg-normal rounded-lg p-2 system-sm-regular text-components-input-text-filled '>
              <span className='pl-1'>{userProfile.email}</span>
            </div>
          </div>
        </div>
      </div>
      {
        editNameModalVisible && (
          <Modal
            isShow
            onClose={() => setEditNameModalVisible(false)}
            className={s.modal}
          >
            <div className='mb-6 title-2xl-semi-bold text-text-primary'>{t('accountDetail.editName')}</div>
            <div className={titleClassName}>{t('accountDetail.name')}</div>
            <Input className='mt-2'
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <div className='flex justify-end mt-10'>
              <Button className='mr-2' onClick={() => setEditNameModalVisible(false)}>{t('common.operation.cancel')}</Button>
              <Button
                disabled={editing || !editName}
                variant='primary'
                onClick={handleSaveName}
              >
                {t('common.operation.save')}
              </Button>
            </div>
          </Modal>
        )
      }
    </>
  )
}
