import type { Fetcher } from 'swr'
import { del, get, patch, post, put } from './base'
import { GroupListResponse, GroupDetailResponse, RoleResponse, RoleDetailResponse,ModuleListResponse, ModuleDetailResponse, SubModuleResponse, NewRoleResponse, GeneralResponse, UpdateRoleResponse } from '@/models/account'

// NOTE: Member APIs 🔥
export const CreateRoleAccountJoin: Fetcher<GeneralResponse, {role_id:string, account_id:string[]}>=({role_id, account_id})=>{
    return post <GeneralResponse>('/role-account-joins/create', {body:{role_id, account_id}})
}

export const UpdateRoleAccountJoin: Fetcher<GeneralResponse, {role_id:string, account_id:string[]}>=({role_id, account_id})=>{
    return post <GeneralResponse>('/role-account-joins/update', {body:{role_id, account_id}})
}

export const DeleteRoleAccountJoin: Fetcher<GeneralResponse, {role_id:string, account_id:string[]}>=({role_id, account_id})=>{
    return post <GeneralResponse>('/role-account-joins/delete', {body:{role_id, account_id}})
}

// NOTE: Role APIs 🔥
export const fetchRoleList: Fetcher<RoleResponse, {params?:Record<string,any>}> = ({params})=>{
    return get <RoleResponse>('/roles',{params})
}

export const fetchRoleDetail: Fetcher<RoleDetailResponse, {id:string}> = ({id})=>{
    return get <RoleDetailResponse>(`/roles/${id}`)
}

export const fetchPermissionList: Fetcher<ModuleDetailResponse[], {params?:Record<string,any>}> = ({params})=>{
    return get<ModuleDetailResponse[]>('/permissions',{params})
}

export const fetchModuleList: Fetcher<ModuleListResponse, {params?:Record<string,any>}>= ({params})=>{
    return get<ModuleListResponse>('/modules',{params})
}

export const UpdateRoleDetail: Fetcher<UpdateRoleResponse, {id:string,name:string, description:string}>= ({id,name, description})=>{
    return patch<UpdateRoleResponse>(`/roles/${id}`,{body:{name:name,description:description}})
}

export const DeleteRole: Fetcher<GeneralResponse, {id:string}>= ({id})=>{
    return del<GeneralResponse>(`/roles/${id}`)
}

// export const DeleteRolePermissionBindings: Fetcher<>=()=>{
//     return del<>('/')
// }

// NOTE: Group APIs 🔥
export const fetchGroupList:Fetcher<GroupListResponse, { params?: Record<string,any> }> = ({ params }) => {
    return get<GroupListResponse>('/groups', { params })
}

export const AddNewGroup: Fetcher<GroupDetailResponse, { name: string, agency_name: string, description: string }> = ({ name, agency_name, description }) => {
    return post<GroupDetailResponse>('/groups', { body: { name, agency_name, description } })
}

export const fetchGroupDetail: Fetcher<GroupDetailResponse, { id: string }>=({ id }) => {
    return get<GroupDetailResponse>(`/groups/${id}`)
}

export const UpdateGroupDetail: Fetcher<GroupDetailResponse, { id: string, name: string, agency_name: string, description: string }>=({ id, name, agency_name, description }) => {
    return patch <GroupDetailResponse>(`/groups/${id}`, { body: { name, agency_name, description } })
}

export const DeleteGroup: Fetcher<GeneralResponse, { id: string }> = ({ id }) => {
    return del <GeneralResponse>(`/groups/${id}`)
}

export const AddGroupBindings: Fetcher<GeneralResponse, {group_id:string, target_id:string[],type:string}> = ({group_id, target_id, type})=>{
    return post <GeneralResponse> ('/group-bindings/create', {body:{group_id,target_id,type}})
}

// NOTE: Can only be used for Knowledge and Application Bindings!
export const updateGroupBindings: Fetcher<GeneralResponse, { group_id: string, target_id: string[], type: string }> = ({ group_id, target_id, type }) => {
    return post<GeneralResponse>('/group-bindings/update', { body: { group_id, target_id, type } })
}

export const removeGroupBindings: Fetcher<string, { group_id: string, target_id: string[], type: string }> = ({ group_id, target_id, type }) => {
    return post<string>('/group-bindings/remove', { body: { group_id, target_id, type } })
}

export const fetchTargetIdByGroup: Fetcher<string[], { params?: Record<string, any> }> = ({ params }) => {
    return get <string[]>('/group-bindings/by-group', { params });
}

export const DeleteGroupBindings: Fetcher<GeneralResponse, {group_id:string, target_id:string[], type:string}>= ({group_id, target_id, type})=>{
    return post<GeneralResponse>('/group-bindings/remove',{body:{group_id, target_id, type}})
}

export const fetchGroupIdByTarget: Fetcher<string[], { params?: Record<string, any> }> = ({ params }) => {
    return get <string[]>('/group-bindings/by-target', { params });
}

export const AddNewRole: Fetcher <NewRoleResponse,{name:string, description:string}> = ({name, description})=>{
    return post <NewRoleResponse>('/roles',{body:{name,description}})
}

export const AddRolePermissionBindings: Fetcher<GeneralResponse, {role_id:string, permission_id:string[]}>= ({role_id, permission_id})=>{
    return post <GeneralResponse>('/role-bindings/create', {body:{role_id, permission_id}})
}

export const UpdateRolePermissionBindings: Fetcher<GeneralResponse, {role_id:string, permission_id:string[], module_id:string}>= ({role_id, permission_id, module_id})=>{
    return post <GeneralResponse>('/role-bindings/update', {body:{role_id, permission_id, module_id}})
}
