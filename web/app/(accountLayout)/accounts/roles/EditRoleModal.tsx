import Modal from "@/app/components/base/modal";
import React, { useCallback, useState, useEffect } from "react";
import useSWR from "swr";
import Button from "@/app/components/base/button";
import { useTranslation } from "react-i18next";
import { fetchGroupDetail, fetchRoleDetail, UpdateRoleDetail } from "@/service/account";
import { useContext } from "use-context-selector";
import { ToastContext } from "@/app/components/base/toast";
import RoleInformation,{Action} from "./steps/RoleInformation";

interface EditRoleModalProps {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  onSuccess: () => void;
  roleId:string;
  isSuperadmin: boolean;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  showModal,
  setShowModal,
  onSuccess = () => {},
  roleId,
  isSuperadmin
}) => {
  const { t } = useTranslation();
  const { notify } = useContext(ToastContext);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const {data:roleDetail, isLoading:roleDetailLoading, mutate:roleDetailMutate} = useSWR(
    {id:roleId}, fetchRoleDetail
  )

  // const {data:groupDetail, isLoading:groupDetailLoading} = useSWR(
  //   {id:roleDetail?.group_id},
  //   fetchGroupDetail
  // )

  useEffect(() => {
    if (roleDetail) {
      setRoleName(roleDetail.name)
      setRoleDesc(roleDetail.description)
    }
  }, [roleDetail])

  const handleUpdateRole = useCallback(async () => {
    try {
      await UpdateRoleDetail({
        id: roleDetail!.id,
        name: roleName,
        description: roleDesc,
      });

      onSuccess();
      setShowModal(false);
      notify({ type: "success", message: "Role updated successfully" });
    } catch (e) {
      notify({ type: "error", message: "Error occurred. Try again later." });
    }
  }, [roleName, roleDesc, UpdateRoleDetail]);

  return (
    <Modal
      title="Edit Role"
      description={
        <div className='text-[13px] text-gray-500'>
          Update role's information
        </div>
      }
      groupModalUse
      closable
      isShow={showModal}
      // groupClassName="2xl:h-[60vh]"
      groupClassName="h-auto max-h-[90vh]"
      // groupClassName= "xl:min-h-[80vh] 2xl:min-h-[60vh] h-[70vh] 2xl:h-[60vh]"
      // wrapperClassName="min-h-[90%] !important"
      onClose={() => setShowModal(false)}
    >
      <div className="flex flex-col w-full p-6 h-full space-y-4">
        <RoleInformation
          isSuperadmin={isSuperadmin}
          action={Action.edit}
          groupId={roleDetail?.group_id}
          roleName={roleName}
          setRoleName={setRoleName}
          roleDesc={roleDesc}
          setRoleDesc={setRoleDesc}
        />

        <div className={`flex flex-row items-center justify-end`}>
          <div className="flex flex-row gap-2 justify-end">
            <Button
              onClick={() => {
                setRoleName("");
                setRoleDesc("");
                setShowModal(false);
              }}
            >
              {t("common.operation.cancel")}
            </Button>
            <Button
              //   loading={isSubmitting}
              disabled={!roleDesc || !roleName || (roleName===roleDetail?.name && roleDesc===roleDetail?.description)}
              variant="primary"
              onClick={async () => {
                await handleUpdateRole();
              }}
            >
              {t("common.operation.saveChanges")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(EditRoleModal);
