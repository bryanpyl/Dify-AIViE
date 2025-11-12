import React, { FC } from 'react'
import { LightAdmin, DarkAdmin } from '@/app/components/base/icons/src/public/vector-illustration'

type AdminHelpProps = {
  title: string, 
  desc: string, 
  wrapperClassname?: string,
  iconWrapperClassname?: string
}

const AdminHelp:FC<AdminHelpProps> = ({
  title, 
  desc, 
  wrapperClassname,
  iconWrapperClassname
}) => {
  return (
    <div className={`${wrapperClassname ? wrapperClassname : ''} flex h-full flex-col space-y-3 justify-center items-center`}>
      <LightAdmin className={`${iconWrapperClassname ? iconWrapperClassname : 'max-w-32 max-h-32 2xl:max-w-40 2xl:max-h-40'}`} />
      <p className="system-md-semibold text-text-secondary">{title}</p>
      <p className="system-xs-regular text-text-tertiary text-center">{desc}</p>
    </div>
  )
}

export default React.memo(AdminHelp)
