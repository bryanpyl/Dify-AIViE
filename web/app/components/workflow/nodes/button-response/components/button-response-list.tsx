import React, { FC, useCallback } from 'react'
import produce from 'immer'
import ButtonResponseItem from './button-response-item'
import AddButton from '../../_base/components/add-button'
import { useTranslation } from 'react-i18next'
import { ButtonResponseNodeType, buttonResponse } from '../types'
import list from '../../parameter-extractor/components/extract-parameter/list'
const i18nPrefix = 'workflow.nodes.buttonResponse'
type ButtonResponseListProps = {
    inputs:buttonResponse[],
    onChange: (inputs:buttonResponse[])=>void,
    readonly?:boolean
}

const ButtonResponseList:FC<ButtonResponseListProps> = ({
    inputs,
    onChange,
    readonly,
})=>{
    const {t} = useTranslation()

    const handleButtonResponseListUpdate = useCallback((index:number)=>{
        return (value:buttonResponse) => {
            const newList = produce(inputs, (draft)=>{
                draft[index] = value
            })
            onChange(newList)
        }
    },[inputs, onChange])

    const handleAddNewButtonResponse = useCallback(()=>{
        const addNewList = produce(inputs,(draft)=>{
            draft.push({
                id:`${inputs.length+1}`,
                content:''
            })
        })
        onChange(addNewList)
    },[inputs,onChange])

    const handleRemoveButtonResponse = useCallback((index:number)=>{
        const removeNewList = produce(inputs,(draft)=>{
            draft.splice(index,1)
        })
        onChange(removeNewList)

    },[inputs,onChange])
    return (
        <>
            {inputs.map((input, idx)=>
                <ButtonResponseItem
                    key={idx}
                    payload={input}
                    onChange={handleButtonResponseListUpdate(idx)}
                    onRemove={()=>handleRemoveButtonResponse(idx)}
                    index={idx+1}
                    readonly={readonly}
                ></ButtonResponseItem>
            )}
            <AddButton
                    onClick={!readonly?handleAddNewButtonResponse:()=>{}}
                    text={t(`${i18nPrefix}.addButton`)}
            ></AddButton>
        </>

        
        
    )
}

export default React.memo(ButtonResponseList)