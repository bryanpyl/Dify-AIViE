import Button from "@/app/components/base/button";
import Input from "@/app/components/base/input";
import Modal from "@/app/components/base/modal";
import Stepper from "@/app/components/base/stepper";
import Textarea from "@/app/components/base/textarea";
import React, { useState, useEffect, useReducer, useCallback } from "react";
import { useTranslation } from "react-i18next";
import RoleInformation, {Action} from "./steps/RoleInformation";
import { fetchModuleList, AddNewRole, updateGroupBindings, AddRolePermissionBindings, AddGroupBindings } from "@/service/account";
import useSWRInfinite from "swr/infinite";
import { useAppContext } from "@/context/app-context";
import { useContext } from "use-context-selector";
import { ToastContext } from "@/app/components/base/toast";
import PermissionSelection from "./steps/PermissionSelection";

interface CreateRoleModalProp {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  onSuccess: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProp> = ({
  showModal,
  setShowModal,
  onSuccess,
}) => {
  const { groupId} = useAppContext()
  const { t } = useTranslation();
  const { notify } = useContext(ToastContext);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRole,setSelectedRole] = useState<string[]>([])
  const [selectedPerm,setselectedPerm] = useState<string[]>([])
  const [totalSteps, setTotalSteps] = useState<Record<string,any>[]>([
    {name: "Role Information", id: ""}
  ]);

  const getModuleKey = (pageIndex: number, previousPageData:any) =>
    previousPageData && previousPageData.length === 0
      ? null
      : ({ params: { page: pageIndex + 1} });

  const {
    data: moduleList,
    isLoading: moduleIsLoading,
    isValidating: moduleIsValidating,
    mutate: moduleMutate
  } = useSWRInfinite(
    getModuleKey,
    fetchModuleList
  )

  const handleCreateNewRole = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const createNewRole = await AddNewRole({
        name: roleName,
        description: roleDesc
      })
      // PERFORM GROUP BINDING
      if (createNewRole.id) {
        const groupBindingResponse = await AddGroupBindings({
          group_id: groupId,
          target_id: [createNewRole.id],
          type: "role"
        })

        if (groupBindingResponse.status === 200 || groupBindingResponse.code === 'success') {
          await AddRolePermissionBindings({
            role_id: createNewRole.id,
            permission_id: selectedPerm
          })
          setIsSubmitting(false)
          notify({ type: "success", message: "Custom role added successfully" });
          setShowModal(false)
          onSuccess()
        }        
      }
    } catch (e) {
      setIsSubmitting(false)
      notify({ type: "error", message: "Error occurred. Try again later." });
    }
  }, [roleName, roleDesc, selectedPerm, AddNewRole, updateGroupBindings, AddRolePermissionBindings])

  
  useEffect(() => {
    if (!moduleList) return;
    const allModules = moduleList.flat();
    const updatedSteps = allModules
      .filter(module => !(module.name.includes("Settings")))
      .map(module => {
        let newName;
        if (module.name.includes("Studio")) {
          newName="Studio Access"
        }
        else if (module.name.includes("Knowledge")) {
          newName="Knowledge Access"
        }
        else if (module.name.includes("Account")) {
          newName="Account Access"
        }
        else if (module.name.includes("Report")) {
          newName="Report Access"
        }
        else if (module.name.includes("Settings")) {
          newName="Settings Access"
        }
        return {
          name: newName,
          id: module.id
        }
      });
    setTotalSteps([{ name: "Role Information", id: "" }, ...updatedSteps]);
  }, [moduleList])

  const NEXT_STEP = "NEXT_STEP";
  const PREV_STEP = "PREV_STEP";

  const stepperReducer = (state: number, action: { type: string }) => {
    switch (action.type) {
      case NEXT_STEP:
        return Math.min(state+1, totalSteps.length)

      case PREV_STEP:
        return Math.max(state-1,1)

      default: 
        return state
    }
  }
  const [step, dispatch] = useReducer(stepperReducer, 1)

  const renderStepContent = () => {
    if (step === 1) {
      return <RoleInformation wrapperClassName="mt-5" action={Action.add} roleName={roleName} setRoleName={setRoleName} roleDesc={roleDesc} setRoleDesc={setRoleDesc} />
    }
    else{
      return <PermissionSelection customRole={true} moduleId={totalSteps[step-1].id} selectedPermission={selectedPerm} onUpdateSelectedPermissions={setselectedPerm} />
    }
  }

  return (
    <Modal
      // title={t("accountRole.operation.addRole.title")}
      groupModalUse
      closable
      isShow={showModal}
      // wrapperClassName="min-h-[90%] !important"
      onClose={() => setShowModal(false)}
      groupClassName="h-auto max-h-[90vh]"
    >
      <div className="flex flex-col w-full py-4 px-6 h-full">
        <div className="my-3 flex-none">
          <Stepper currentStep={step} totalSteps={totalSteps}></Stepper>
        </div>
        <div className='grow overflow-hidden space-y-4'>
          <div className="flex flex-col h-[calc(80vh-140px)] overflow-y-auto">
            {renderStepContent()}
          </div>
          <div
            className={`flex flex-row ${
              step === 1 ? "justify-end" : "items-center justify-between"
            }`}
          >
            {step !== 1 ? (
              <span className="system-2xs-semibold-uppercase text-text-accent">
                {selectedPerm.length} permission selected{" "}
              </span>
            ) : null}
            <div className="flex flex-row gap-2 justify-end">
              <Button
                onClick={() => {
                  step === 1
                    ? setShowModal(false)
                    : dispatch({ type: PREV_STEP });
                }}
              >
                {step === 1
                  ? t("common.operation.cancel")
                  : t("common.operation.previous")}
              </Button>
              <Button
                loading={isSubmitting}
                disabled={!roleDesc || !roleName}
                variant="primary"
                onClick={() => {
                  if (step !== totalSteps.length) {
                    dispatch({ type: NEXT_STEP });
                  } else {
                    handleCreateNewRole();
                  }
                }}
              >
                {step !== totalSteps.length
                  ? t("common.operation.next")
                  : t("common.operation.submit")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(CreateRoleModal);
