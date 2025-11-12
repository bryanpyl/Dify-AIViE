export enum systemRole {
    superadmin="Superadministrator",
    systemOperator="System Operator",
    groupAdmin="Administrator",
    chatUser="Chat User"
}

export type group = {
    /** ID of the group*/ 
    id: string, 
    /** Name of the group*/ 
    name: string, 
    /** Name of the agency*/ 
    agency_name: string, 
    /** Description of the group*/ 
    description: string, 
    /** Binding count of the group*/ 
    knowledge_count: number,
    app_count: number, 
    user_count: number, 
    role_count: number
}


export type GroupDetailResponse = group & {
    app_id?: string, 
    chat_token?: string
}

export type GroupListResponse = {
    data: group[],
    total:number,
    page:number,
    limit:number,
    has_more:boolean,
}

export type GeneralResponse = {
    code: string, 
    message: string, 
    status: number
}

export type permission = {
    id: string, 
    name:string, 
    is_superadmin_only: boolean, 
    is_selected?:boolean
}

export type module = {
    id: string, 
    name: string
}

export type sub_module = {
    name:string, 
    description: string, 
    permissions: permission[]
}

export type SubModuleResponse = sub_module

export type ModuleListResponse = module[]

export type ModuleDetailResponse = {
    name:string, 
    sub_modules: sub_module[]
}

export type role = {
    id: string, 
    name: string, 
    description: string, 
    group_id: string, 
    user_count: string,
}

export type RoleDetailResponse = role;

export type RoleResponse = role[] ;

export type newRole = {
    id: string, 
    name: string, 
    description: string, 
    // group_id: string, 
    user_count: string,
}

export type NewRoleResponse = newRole;

export type UpdateRoleResponse = newRole;
