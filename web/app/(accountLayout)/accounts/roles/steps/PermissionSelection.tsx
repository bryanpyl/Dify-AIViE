import { fetchPermissionList } from "@/service/account";
import React, {useEffect, useMemo, useRef, useState} from "react";
import useSWRInfinite from "swr/infinite";
import Loading from "@/app/components/base/loading";
import SelectionCard, {SelectionVariant} from "../../groups/[groupId]/SelectionCard";
import { KeyedMutator } from "swr";

interface PermissionSelectionProps {
  customRole:boolean;
  disableEditing?:boolean;
  moduleId: string;
  roleId?:string;
  selectedPermission: string[];
  onUpdateSelectedPermissions: (value: string[]) => void;
  onMutatePermissions?: (mutate:KeyedMutator<any[]>) => void;
}

const PermissionSelection: React.FC<PermissionSelectionProps> = ({
  customRole,
  disableEditing,
  moduleId,
  roleId,
  onUpdateSelectedPermissions,
  onMutatePermissions
}) => {
  const [internalSelectedPermissions, setInternalSelectedPermissions] = useState<string[]>([]);
  const hasInitialized = useRef(false);
  const getPermissionKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && previousPageData.length === 0) return null;
    return {
      params: { page: pageIndex + 1, module_id: moduleId, role_id: roleId || "" },
    };
  };

  const {
    data: permissionList,
    isLoading,
    isValidating,
    mutate: permissionMutate,
  } = useSWRInfinite(getPermissionKey, fetchPermissionList);

  const submodules = permissionList
  ?.flatMap((page) => page.flatMap((module) => module.sub_modules || []))
  .filter((submodule)=>
    !customRole?true:!submodule.permissions?.every((permission) => permission.is_superadmin_only)
  );

  const handleSelectionUpdate = (value:string)=>{
    const newSelected = internalSelectedPermissions.includes(value)?internalSelectedPermissions.filter((p)=>p!==value):[...internalSelectedPermissions,value];
    setInternalSelectedPermissions(newSelected)
    onUpdateSelectedPermissions(newSelected)
    // setInternalSelectedPermissions(
    //   (prev)=>prev.includes(value)?
    //   prev.filter((p)=> p!==value):[...prev,value])

    // onUpdateSelectedPermissions(
    //   internalSelectedPermissions.includes(value)
    //     ? internalSelectedPermissions.filter((p) => p !== value)
    //     : [...internalSelectedPermissions, value]
    // );
  }

  const bindedPermission = useMemo(() => {
    return submodules?.flatMap((submodule) => submodule.permissions || [])
      .filter((permission) => permission.is_selected)
      .map((permission) => permission.id);
  }, [submodules]);
  
  useEffect(() => {
    if (!hasInitialized.current && roleId && bindedPermission) {
      setInternalSelectedPermissions([...bindedPermission]);
      onUpdateSelectedPermissions([...bindedPermission]);
      hasInitialized.current = true;
    }
  }, [roleId, bindedPermission, onUpdateSelectedPermissions]);

  useEffect(() => {
    if (onMutatePermissions) {
      onMutatePermissions(permissionMutate); // Provide mutate function to parent
    }
  }, [onMutatePermissions, permissionMutate]);


  return (
    <>
      {isLoading || isValidating ? (
        <div className='h-full w-full'>
          <Loading type="area" />
        </div>
      ) : (
        <div className="flex flex-col py-3 px-2 space-y-3 min-h-0">
          {submodules?.map((submodule) => (
            <div key={submodule.name} className="flex flex-col my-2">
              <h6 className="text-text-primary system-md-semibold">
                {submodule.name}
              </h6>
              <p className='text-text-tertiary system-xs-regular'>{submodule.description}</p>
              <div className='my-3 grid grid-cols-2 gap-3'>
                {submodule.permissions?.filter((permission)=>!customRole?true:!permission.is_superadmin_only)
                .map((permission)=>(
                    <SelectionCard key={permission.id} disabled={disableEditing} variant={SelectionVariant.Permission} selected={internalSelectedPermissions.includes(permission.id)} data={permission} onClick={()=>{handleSelectionUpdate(permission.id)}}></SelectionCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default React.memo(PermissionSelection)
