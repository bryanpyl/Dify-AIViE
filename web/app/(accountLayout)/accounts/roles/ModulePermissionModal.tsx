import React, { useCallback, useEffect, useState } from "react";
import PermissionSelection from "./steps/PermissionSelection";
import Modal from "@/app/components/base/modal";
import { UpdateRolePermissionBindings } from "@/service/account";
import Button from "@/app/components/base/button";
import { useTranslation } from "react-i18next";
import { useContext } from "use-context-selector";
import { ToastContext } from "@/app/components/base/toast";
import { usePermissionCheck } from '@/context/permission-context'

interface ModulePermissionModalProps {
  customRole: boolean;
  title: string;
  roleId: string;
  moduleId: string;
  showModal: boolean;
  setShowModal: (value: boolean) => void;
}

const ModulePermissionModal: React.FC<ModulePermissionModalProps> = ({
  customRole,
  title,
  roleId,
  moduleId,
  showModal,
  setShowModal,
}) => {
  const { t } = useTranslation();
  const { notify } = useContext(ToastContext);
  const { permissions } = usePermissionCheck();
  const [selectedPerm, setselectedPerm] = useState<string[]>([]);
  const [editPermission, setEditPermission] = useState(false);
  const [mutatePermissions, setMutatePermissions] =  useState<(() => void) | null>(null);
  const [selectedPermissionNum, setSelectedPermissionNum] = useState(0);

  const handleSelectionUpdate = useCallback(async() => {
    try {
      await UpdateRolePermissionBindings({
        role_id: roleId,
        permission_id: selectedPerm,
        module_id: moduleId,
      });
      setShowModal(false)
      mutatePermissions?.();
      setEditPermission(false)
      notify({ type: "success", message: "Permission updated successfully." });
    }
    catch(e) {
      notify({ type: "error", message: "Error occurred. Try again later." });
    }
  }, [roleId, selectedPerm, UpdateRolePermissionBindings])

  useEffect(() => {
    if (selectedPerm.length && editPermission){
      setSelectedPermissionNum(selectedPerm.length)
    }
  }, [selectedPerm, editPermission]);

  return (
    <Modal
      title={title}
      groupModalUse
      isShow={showModal}
      closable
      wrapperClassName="min-h-[90%] !important"
      onClose={() => setShowModal(false)}
    >
      <div className={`mt-3 flex-grow overflow-y-auto max-h-[calc(80vh-140px)] ${
        !editPermission ? 'group-hover:cursor-not-allowed' : ''
      }`}>
        <PermissionSelection
          customRole={customRole}
          disableEditing={!editPermission}
          moduleId={moduleId}
          roleId={roleId}
          selectedPermission={selectedPerm}
          onUpdateSelectedPermissions={setselectedPerm}
          onMutatePermissions={(mutate)=>setMutatePermissions(()=>mutate)}
        ></PermissionSelection>
      </div>

      {customRole && (
        <div
          className={`px-2 py-3 flex flex-row ${
            editPermission ? "items-center justify-between" : "justify-end"
          }`}
        >
          {editPermission && (
            <span className="system-2xs-semibold-uppercase text-text-accent">
              {selectedPermissionNum} PERMISSION SELECTED
            </span>
          )}
          <div className="flex flex-row gap-2 justify-end">
            {permissions.groupRolesAndPerms.edit ?
              <>
                <Button
                  onClick={() => {
                    setShowModal(false);
                  }}
                >
                  {t("common.operation.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    editPermission
                      ? await handleSelectionUpdate()
                      : setEditPermission(true);
                  }}
                >
                  {editPermission
                    ? t("common.operation.saveChanges")
                    : t("accountRole.operation.editPermission.title")}
                </Button>
              </>
            :
              <>
                <Button
                  onClick={() => {
                    setShowModal(false);
                  }}
                >
                  {t("common.operation.close")}
                </Button>
              </>
            }
          </div>
        </div>
      )}
    </Modal>
  );
};

export default React.memo(ModulePermissionModal);
