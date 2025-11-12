import { useCallback, useEffect } from 'react'
import produce from 'immer'
import useVarList from '../_base/hooks/use-var-list'
import type { Var } from '../../types'
import { VarType } from '../../types'
import { useStore } from '../../store'
import type { ButtonResponseNodeType } from './types'
import useNodeCrud from '@/app/components/workflow/nodes/_base/hooks/use-node-crud'
import {
  useNodesReadOnly,
} from '@/app/components/workflow/hooks'

const useConfig = (id: string, payload: ButtonResponseNodeType) => {
  const { nodesReadOnly: readOnly } = useNodesReadOnly()
  const defaultConfig = useStore(s => s.nodesDefaultConfigs)[payload.type]
  const { inputs, setInputs } = useNodeCrud<ButtonResponseNodeType>(id, payload)
 
  // variables
  const { handleVarListChange, handleAddVariable } = useVarList<ButtonResponseNodeType>({
    inputs,
    setInputs,
  })


  useEffect(()=>{
    const isReady = defaultConfig
    if (isReady){
        setInputs({
            ...inputs,
            ...defaultConfig
        })
    }
  },[defaultConfig])

  const handleResponseTitleChange = useCallback((value:string)=>{
    const newInputs = produce(inputs,(draft)=>{
      draft.response_title=value
    })
    setInputs(newInputs)
  },[inputs,setInputs])

  const handleButtonResponseChange = useCallback((value: any) => {
    const newInputs = produce(inputs, (draft) => {
        draft.button_answers = value
    })
    setInputs(newInputs)
  }, [inputs, setInputs])



  const filterVar = useCallback((varPayload: Var) => {
    return varPayload.type !== VarType.arrayObject
  }, [])
  return {
    readOnly,
    inputs,
    handleVarListChange,
    handleAddVariable,
    handleButtonResponseChange,
    handleResponseTitleChange,
    filterVar,
  }
}

export default useConfig
