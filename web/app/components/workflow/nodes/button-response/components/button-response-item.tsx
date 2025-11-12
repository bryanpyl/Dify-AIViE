import React, { FC, useCallback } from 'react'
import TextEditor from '../../_base/components/editor/text-editor'
import { buttonResponse, ButtonResponseNodeType } from '../types'
import { RiDeleteBinLine } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
const i18nPrefix = 'workflow.nodes.buttonResponse'


type ButtonResponseItemProps = {
    payload:buttonResponse,
    onChange:(value:buttonResponse)=>void
    onRemove: ()=>void,
    index:number
    readonly?:boolean
}

const ButtonResponseItem:FC<ButtonResponseItemProps> = ({
    payload, 
    onChange,
    onRemove,
    index,
    readonly
})=>{
    const {t}= useTranslation()

    const handleButtonResponseItemChange = useCallback((value:string)=>{
      onChange({...payload,content:value})
    },[onChange, payload])

 
    return (
        <TextEditor
        readonly={readonly}
        value={payload.content}
        onChange={handleButtonResponseItemChange}
        title={`${t(`${i18nPrefix}.fieldTitle`)!} ${index}`}
        placeholder={t(`${i18nPrefix}.buttonResponse.placeholder`)||""}
        isInNode
        minHeight={64}
        headerRight={
          <RiDeleteBinLine
            className="mr-1 w-3.5 h-3.5 text-gray-500 cursor-pointer"
            onClick={readonly?()=>{}:onRemove}
          />
        }
      ></TextEditor>
    )
}

export default React.memo(ButtonResponseItem)