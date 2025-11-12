import { BlockEnum } from '../../types'
import type { NodeDefault } from '../../types'
import { genNodeMetaData } from '@/app/components/workflow/utils'
import type { ButtonResponseNodeType } from './types'
import { BlockClassificationEnum } from '../../block-selector/types'

const metaData = genNodeMetaData({
  classification: BlockClassificationEnum.Utilities,
  sort: 4.5,
  type: BlockEnum.ButtonResponse,
  isRequired: false,
  isUndeletable: false,
  isStart: false,
  isSingleton: false,
  isTypeFixed: true,
})

const nodeDefault: NodeDefault<ButtonResponseNodeType> = {
    metaData,
    defaultValue:{
        // variables:[],
        response_title:'',
        button_answers:[
            {
                id:'1',
                content:'',
            }
        ],
    },
    checkValid(payload: ButtonResponseNodeType, t:any) {
        let errorMessages=''
        if (payload.button_answers.length===0 || !payload.button_answers[0].content){
            errorMessages = t('workflow.errorMsg.fieldRequired', { field: t('workflow.nodes.buttonResponse.buttonResponse.title') })
        }
        return {
            isValid: !errorMessages,  
            errorMessage: errorMessages
        }        
    },
}

export default nodeDefault