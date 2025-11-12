import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ButtonResponseNodeType } from './types'
import type { NodePanelProps } from '@/app/components/workflow/types'
import useAvailableVarList from '@/app/components/workflow/nodes/_base/hooks/use-available-var-list'
import useConfig from './use-config'
import Field from '../_base/components/field'
import ButtonResponseList from './components/button-response-list'
import Textarea from '@/app/components/base/textarea'


const i18nPrefix = 'workflow.nodes.buttonResponse'


const Panel: FC<NodePanelProps<ButtonResponseNodeType>> = ({
  id,
  data,
}) => {
  const { t } = useTranslation()

  const {
    readOnly,
    inputs,
    handleButtonResponseChange,
    handleResponseTitleChange,
    filterVar
  } = useConfig(id, data)

  const { availableVars, availableNodesWithParent } = useAvailableVarList(id, {
    onlyLeafNodeVar: false,
    hideChatVar: false,
    hideEnv: false,
    filterVar,
  })

  return (
    <div className="mt-2 mb-2 px-4 space-y-4">
        <Field title={t(`${i18nPrefix}.responseTitle.title`)} tooltip={t(`${i18nPrefix}.responseTitle.subtitle`)}>
           <Textarea disabled={readOnly} onChange={(e)=>handleResponseTitleChange(e.target.value)} value={inputs.response_title!} placeholder={t(`${i18nPrefix}.responseTitle.subtitle`)||""}></Textarea>
        </Field>
        <Field title={t(`${i18nPrefix}.buttonResponse.title`)} tooltip={t(`${i18nPrefix}.buttonResponse.subtitle`)}>
          <div className='space-y-4'>
            <ButtonResponseList
                inputs={inputs.button_answers}
                onChange={handleButtonResponseChange}
            />
          </div>
        </Field>
    </div>
  );
}

export default React.memo(Panel)
