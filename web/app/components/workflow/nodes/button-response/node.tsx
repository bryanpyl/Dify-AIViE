import React, {FC} from 'react'
import { useTranslation } from 'react-i18next'
import InfoPanel from '../_base/components/info-panel'
import ReadonlyInputWithSelectVar from '../_base/components/readonly-input-with-select-var'
import { ButtonResponseNodeType } from './types'
import type {NodeProps} from '@/app/components/workflow/types'

const Node:FC<NodeProps<ButtonResponseNodeType>> = ({
    id, 
    data
}) =>{
    const {t} = useTranslation()
    return (
        <div className='mb-1 px-3 py-1'>
              {/* <InfoPanel title={t('workflow.nodes.answer.answer')} content={
                <p>Hello testing</p>
              } /> */}
            </div>
    )
}

export default React.memo(Node)