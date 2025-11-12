import React, { useState, useEffect, useCallback } from "react";
import { role } from "@/models/account";
import useSWR from "swr";
import {
  RiArrowDropDownLine,
  RiArrowDropRightLine,
  RiBook2Line,
  RiRobot2Line,
  RiChat4Line,
  RiSettings2Line,
  RiEditLine,
  RiDeleteBin6Line,
  RiFolderChartLine,
  RemixiconComponentType,
} from "@remixicon/react";
import { Group3Line } from "@/app/components/base/icons/src/vender/line/accountManagement";
import { fetchModuleList, DeleteRole, UpdateRolePermissionBindings, DeleteGroupBindings } from "@/service/account";
import ModulePermissionModal from "../ModulePermissionModal";
import EditRoleModal from "../EditRoleModal";
import Confirm from "@/app/components/base/confirm";
import { useContext } from "use-context-selector";
import { ToastContext } from "@/app/components/base/toast";
import { usePermissionCheck } from '@/context/permission-context'

interface RoleCardProps {
  groupNameTag?: string;
  role: role;
  groupId?: string;
  isLast: boolean;
  customRole: boolean;
  mutateRoleList?: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ groupNameTag, role, groupId, isLast, customRole, mutateRoleList}) => {
  const { notify } = useContext(ToastContext);
  const { permissions, isSystemRole } = usePermissionCheck();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [editRoleId, setEditRoleId] = useState('');
  const [showDeleteRole, setShowDeleteRole] = useState(false);
  const [deleteRoleDetail, setDeleteRoleDetail] = useState<{
    name: string
    id: string
  } | null>(null)
  const [showPermission, setShowPermission] = useState(false);
  const [moduleId, setModuleId] = useState("");
  const [moduleName, setmoduleName] = useState("");
  const [expandRole, setExpandRole] = useState(false);
  const [modules, setModules] = useState<
    { name: string; id: string; icon: RemixiconComponentType }[]
  >([]);
  const toggleExpandRole = () => {
    setExpandRole((prev) => !prev);
  };

  const {
    data: moduleList,
    isLoading: moduleIsLoading,
    isValidating: moduleIsValidating,
    mutate: moduleMutate,
  } = useSWR({}, fetchModuleList);

  useEffect(() => {
    if (!moduleList) return;
    const allModules = moduleList.flat();
    const updatedSteps = allModules
      .filter((module) => (isSystemRole && !customRole) ? true : !module.name.includes("Settings"))
      .map((module) => {
        let newName: string = module.name,
          newIcon: any;
        if (module.name.includes("Studio")) {
          newName = "Studio Access";
          newIcon = RiRobot2Line;
        } else if (module.name.includes("Knowledge")) {
          newName = "Knowledge Access";
          newIcon = RiBook2Line;
        } else if (module.name.includes("Account")) {
          newName = "Account Access";
          newIcon = Group3Line;
        } else if (module.name.includes("Chat")) {
          newName = "Chat Access";
          newIcon = RiChat4Line;
        } else if (module.name.includes("Settings")) {
          newName = "Settings Access";
          newIcon = RiSettings2Line;
        } else if (module.name.includes('Usage Report')){
            newName = 'Report Access';
            newIcon = RiFolderChartLine;
        }
        
        return { name: newName, id: module.id, icon: newIcon };
      });
    setModules(updatedSteps);
  }, [moduleList]);

  const handleShowPermissions = ({
    moduleId,
    moduleName,
  } : {
    moduleId: string;
    moduleName: string;
  }) => {
    setModuleId(moduleId);
    setmoduleName(moduleName);
    setShowPermission(true);
  };

  const handleDeleteRole = useCallback(async() => {
    setIsSubmitting(true)
    try {
      // Delete all permissions bindings
      const deletePermissionBindings = await UpdateRolePermissionBindings({
        role_id: deleteRoleDetail!.id,
        permission_id: [],
        module_id: moduleId,
      })
      // Delete group bindings
      if (deletePermissionBindings.code === 'success' || deletePermissionBindings.status === 200) {
        const deleteGroupBindings = await DeleteGroupBindings({
          group_id: groupId!,
          target_id: [`${deleteRoleDetail!.id}`],
          type: 'role'
        })

        if (deleteGroupBindings.code === 'success' || deleteGroupBindings.status === 200) {
          // Delete role
          await DeleteRole({id: deleteRoleDetail!.id})
          notify({ type: "success", message: "Role has been successfully deleted." })
          mutateRoleList?.()
          setShowDeleteRole(false)
          setIsSubmitting(false)
        }
      }
    }
    catch(e) {
      setIsSubmitting(false)
      notify({ type: "error", message: "Error occurred. Try again later." })
    }
  }, [deleteRoleDetail, groupId])

  return (
    <div
      className={`flex flex-col py-2 gap-0 
        ${expandRole ? "bg-gray-50 rounded-md" : ""} 
        `}
    >
      <div
        className={`flex items-center justify-between px-3 py-4 flex-row w-full min-h-0 
          ${!isLast && !expandRole ? "border-b border-gray-100" : ""}
          rounded-md hover:bg-gray-50 hover:cursor-pointer transition-colors ease-in-out duration-150
          `}
        onClick={toggleExpandRole}
      >
        <div className="flex flex-col space-y-1">
          <h5 className="flex items-center system-md-semibold text-text-secondary gap-2">
            {role.name}
            {role.group_id === null && (
              <span className="inline-flex items-center justify-center system-2xs-medium bg-sky-50 text-text-accent rounded-lg py-0.5 px-2">
                Default
              </span>
            )}
            {(isSystemRole && customRole) && (
              <span className='system-2xs-medium text-text-tertiary bg-white border border-gray-200 rounded-xl px-2 py-1'>
                {groupNameTag}
              </span>
            )}
          </h5>
          <p className="text-text-tertiary system-xs-regular">
            {role.description}
          </p>
        </div>

        <div className="flex justify-center items-center flex-row gap-5">
          {(expandRole && customRole) && (
            <div className="flex text-text-tertiary gap-3">
              {permissions.groupRolesAndPerms.edit && (
                <RiEditLine 
                className="hover:bg-white hover:text-text-accent hover:scale-105 w-4 h-4"
                onClick={() => {
                  setEditRoleId(role.id)
                  setShowEditRole(true)
                }}
                ></RiEditLine>
              )}
              {permissions.groupRolesAndPerms.delete && (
                <RiDeleteBin6Line
                className="hover:bg-white hover:text-red-500 hover:scale-105 w-4 h-4"
                onClick={() => {
                  setDeleteRoleDetail({name: role.name, id: role.id})
                  setShowDeleteRole(true)
                }}></RiDeleteBin6Line>
              )}
            </div>
          )}
          <RiArrowDropDownLine
            className={`w-8 h-8 text-text-accent transition-transform duration-300 ${
              expandRole ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      <div
        className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${
          expandRole ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="flex flex-col bg-white rounded-md py-5 mx-2 px-3 space-y-5">
          {modules.map((module) => (
            <div
              key={module.id}
              className="flex flex-row justify-between items-center text-text-tertiary hover:cursor-pointer hover:text-text-accent transition-colors duration-150 ease-in-out"
              onClick={() =>
                handleShowPermissions({
                  moduleId: module.id,
                  moduleName: module.name,
                })
              }
            >
              <div className="flex space-x-3 items-center">
                <module.icon className="w-4 h-4" />
                <h6 className="system-sm-semibold">{module.name}</h6>
              </div>

              <RiArrowDropRightLine className="w-6 h-6" />
            </div>
          ))}
        </div>
      </div>
      {showPermission && (
        <ModulePermissionModal
          customRole = {customRole}
          title={moduleName}
          roleId={role.id}
          moduleId={moduleId}
          showModal={showPermission}
          setShowModal={setShowPermission}
        />
      )}

      {showEditRole && (
        <EditRoleModal onSuccess={() => mutateRoleList?.()} showModal={showEditRole} setShowModal={setShowEditRole} roleId={editRoleId} isSuperadmin={isSystemRole} />
      )}
      {showDeleteRole && (
        <Confirm
          title='Delete Role'
          content={`Are you sure you want to delete ${deleteRoleDetail?.name}`}
          isShow={showDeleteRole}
          onConfirm={handleDeleteRole}
          onCancel={() => setShowDeleteRole(false)}
        />
      )}
    </div>
  );
};

export default (RoleCard);
