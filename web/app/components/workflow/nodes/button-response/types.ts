import type { CommonNodeType, Variable } from '@/app/components/workflow/types'


export type buttonResponse = {
    id:string,
    content:string
}
export type ButtonResponseNodeType = CommonNodeType & {
  variables: Variable[]
  button_answers:buttonResponse[]
  response_title:string|undefined
}
