import React from 'react'
import { group } from '@/models/account'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { RiAddLine } from '@remixicon/react'
import {UserCommunityLine} from '@/app/components/base/icons/src/vender/line/accountManagement'

export type GroupProps = {
    groupDetail:group
}

const GroupCard = ({groupDetail}:GroupProps)=>{
    const router = useRouter()
    const handleClick = ()=>{
      router.push(`./groups/${groupDetail.id}`)
    }
    const { t } = useTranslation()

    return (
      <div className="relative hover:cursor-pointer col-span-1 inline-flex flex-col gap-8 justify-start h-[160px] bg-components-card-bg rounded-xl border-[0.5px] border-gray-200 py-5 px-5"
        onClick={handleClick}
      >
        <div className="flex flex-row min-w-0 gap-2">
          <div className="flex flex-shrink-0 items-center justify-center p-3 bg-blue-50 rounded-md h-fit">
            <UserCommunityLine className="w-4 h-4 text-text-accent" />
          </div>
          <div className="flex flex-col w-full min-w-0 justify-around">
            <h2 className="system-sm-semibold text-text-secondary truncate w-full overflow-hidden whitespace-nowrap">
              {groupDetail.name}
            </h2>
            <p className = 'system-2xs-regular uppercase text-text-tertiary'>{groupDetail.agency_name}</p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="system-xs-regular text-wrap line-clamp-3 text-text-tertiary truncate w-full overflow-hidden whitespace-nowrap">
            {groupDetail.description}
          </p>
        </div>
      </div>
    )
}

export default React.memo(GroupCard)
