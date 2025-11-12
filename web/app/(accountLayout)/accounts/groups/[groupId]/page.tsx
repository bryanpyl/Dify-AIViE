"use client";
import Input from "@/app/components/base/input";
import React, { useCallback, useState, useEffect } from "react";
import Button from "@/app/components/base/button";
import Textarea from "@/app/components/base/textarea";
import Loading from "@/app/components/base/loading";
import type { HtmlContentProps } from "@/app/components/base/popover";
import {
  RiSettings2Line,
  RiEditLine,
} from "@remixicon/react";
import CustomPopover from "@/app/components/base/popover";
import {
  fetchGroupDetail,
  UpdateGroupDetail,
  DeleteGroup,
} from "@/service/account";
import { useContext } from "use-context-selector";
import { notFound, useRouter } from "next/navigation";
import { ToastContext } from "@/app/components/base/toast";
import useSWR from "swr";
import Confirm from "@/app/components/base/confirm";
import KnowledgeSelectionModal from "./KnowledgeSelectionModal";
import { useParams } from "next/navigation";
import ApplicationSelectionModal from "./ApplicationSelectionModal";
import { useAppContext } from "@/context/app-context";
import { useTranslation } from "react-i18next";
import OverviewSelection, { GroupOverviewOptions } from "./OverviewSelection";
import { usePermissionCheck } from "@/context/permission-context";

const groupDetailPage = () => {
  const { t } = useTranslation();
  const {
    mutateUserGroupDetail,
    userGroupDetail,
    isContextInitialized
  } = useAppContext();
  const { permissions, isSystemRole, handleNoViewPermission } = usePermissionCheck()
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();
  const { notify } = useContext(ToastContext);
  const [editGroup, setEditGroup] = useState(false);

  const [deleteGroup, setDeleteGroup] = useState(false);
  const {
    data: groupDetail,
    isLoading,
    isValidating,
    error,
    mutate,
  } = useSWR({ id: groupId }, fetchGroupDetail);

  const [newGroupName, setNewGroupName] = useState("");
  const [newAgencyName, setNewAgencyName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  useEffect(() => {
    if (groupDetail){
      setNewGroupName(groupDetail?.name ?? "");
      setNewAgencyName(groupDetail?.agency_name ?? "");
      setNewGroupDesc(groupDetail?.description ?? "");
    }
    if (error){
      notFound()
      return
    } 
    if (groupDetail && userGroupDetail && !isSystemRole && isContextInitialized){
      if (userGroupDetail.id!==groupId) {
        handleNoViewPermission()
      }
    }
  }, [groupDetail, error, userGroupDetail, isSystemRole, isContextInitialized]);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [showApplication, setShowApplication] = useState(false);

  const Operations = (props: HtmlContentProps) => {
    return (
      <div className="relative w-full py-1">
        <button
          className="flex items-center justify-start hover:bg-gray-100 rounded-lg cursor-pointer w-[calc(100%-0.5rem)] py-[6px] px-3 mx-1"
          onClick={() => setEditGroup(true)}
        >
          <span className="text-text-tertiary system-sm-regular">
            {t("accountGroup.detail.operation.editGroup.title")}
          </span>
        </button>

        <button
          className="flex items-center justify-start hover:bg-gray-100 rounded-lg cursor-pointer w-[calc(100%-0.5rem)] py-[6px] px-3 mx-1"
          onClick={() => setDeleteGroup(true)}
        >
          <span className="text-text-tertiary system-sm-regular">
            {t("accountGroup.detail.operation.deleteGroup.title")}
          </span>
        </button>
      </div>
    );
  };

  const onConfirmUpdate = useCallback(async () => {
    try {
      const updateData = {
        id: groupDetail!.id,
        name: newGroupName,
        agency_name: newAgencyName,
        description: newGroupDesc,
      };
      await UpdateGroupDetail(updateData);
      mutate();
      mutateUserGroupDetail();
      notify({ type: "success", message: "Group updated successfully" });
      setEditGroup(false);
    } catch (e) {
      notify({ type: "error", message: "Failed to update." });
    }
  }, [newGroupName, newAgencyName, newGroupDesc]);

  const onConfirmDelete = useCallback(async () => {
    try {
      await DeleteGroup({ id: groupDetail!.id });
      setDeleteGroup(false);
      router.replace("/accounts/groups");
      notify({ type: "success", message: "Group successfully deleted" });
    } catch (e) {
      notify({ type: "error", message: `Failed to delete. ${e}` });
    }
  }, [groupDetail]);

  const handleUpdateGroup = async () => {
    await onConfirmUpdate();
  };

  const handleDeleteGroup = async () => {
    await onConfirmDelete();
  };

  if (!permissions.groupManagement.view) handleNoViewPermission()

  return (
    <>
      {isLoading || isValidating ? (
        <div className="w-full h-full flex justify-center items-center">
          <Loading type="area"></Loading>
        </div>
      ) : (
        <div className="grow xl:max-w-[1200px] flex-col mx-auto py-5 px-6 w-full space-y-5">
          <div className="flex flex-row w-full pt-2 items-center">
            <div className="flex flex-col flex-1">
              <h4 className="title-xl-semi-bold text-text-primary mb-1">
                {t("accountGroup.detail.title")}
              </h4>
            </div>
            {editGroup ? (
              <div className="flex flex-shrink-0 gap-2">
                <Button onClick={() => setEditGroup(false)}>
                  {t("common.operation.cancel")}
                </Button>
                <Button variant="primary" onClick={handleUpdateGroup}>
                  {t("common.operation.saveChanges")}
                </Button>
              </div>
            ) : (permissions.groupManagement.edit && permissions.groupManagement.delete) ? (
              <div className="group-hover:!flex-shrink-0">
                <CustomPopover
                  htmlContent={<Operations />}
                  position="br"
                  trigger="click"
                  btnElement={
                    <div className="inline-flex items-center gap-2 justify-center cursor-pointer rounded-md text-primary-600">
                      <RiSettings2Line className="w-4 h-4"></RiSettings2Line>
                      <span className="system-sm-semibold">
                        {t("accountGroup.detail.operation.groupSettings")}
                      </span>
                    </div>
                  }
                  btnClassName={(open) =>
                    open
                      ? "bg-sky-50 text-text-accent"
                      : "bg-transparent border border-components-button-secondary-border"
                  }
                ></CustomPopover>
              </div>
            ) : (permissions.groupManagement.edit && !permissions.groupManagement.delete)?(
              <div
                className="p-2 bg-components-button-secondary-bg text-[13px] font-medium shadow-xs text-primary-600 border border-components-button-secondary-border inline-flex items-center gap-2 justify-center cursor-pointer rounded-lg"
                onClick={() => setEditGroup(true)}
              >
                <RiEditLine className="w-4 h-4"></RiEditLine>
                <span className="system-sm-semibold">
                  {t("accountGroup.detail.operation.editGroup.title")}
                </span>
              </div>
            ):null}
          </div>
          {/* <div className="grow flex-col mx-auto max-w-[90%]"></div> */}
          <div className="grow flex-col mx-2 space-y-8">
            <hr className="border-1 border-gray-100"></hr>
            <div className='flex flex-col space-y-6'>
              <h5 className="title-lg-semi-bold text-text-primary">
                {t("accountGroup.generalInfo.title")}
              </h5>
              <div className="grid grid-cols-[1fr_2fr] p-5 gap-y-12 gap-x-6">
                <div className="inline-flex flex-col max-w-full">
                  <h6 className="title-sm-semi-bold text-text-primary">
                    {t("accountGroup.fields.groupName.title")}
                  </h6>
                  <span className="system-xs-regular text-text-tertiary">
                    {t("accountGroup.fields.groupName.subtitle")}
                  </span>
                </div>
                <Input
                  disabled={editGroup ? false : true}
                  placeholder={t("accountGroup.fields.groupName.placeholder")}
                  value={newGroupName}
                  onChange={(e) => {
                    setNewGroupName(e.target.value);
                  }}
                ></Input>

                <div className="inline-flex flex-col max-w-full">
                  <h6 className="title-sm-semi-bold text-text-primary">
                    {t("accountGroup.fields.agencyName.title")}
                  </h6>
                  <span className="system-xs-regular text-text-tertiary">
                    {t("accountGroup.fields.agencyName.subtitle")}
                  </span>
                </div>
                <Input
                  disabled={editGroup ? false : true}
                  placeholder={t("accountGroup.fields.agencyName.placeholder")}
                  value={newAgencyName}
                  onChange={(e) => {
                    setNewAgencyName(e.target.value);
                  }}
                ></Input>

                <div className="inline-flex flex-col max-w-full">
                  <h6 className="title-sm-semi-bold text-text-primary">
                    {t("accountGroup.fields.groupDesc.title")}
                  </h6>
                  <span className="system-xs-regular text-text-tertiary">
                    {t("accountGroup.fields.groupDesc.subtitle")}
                  </span>
                </div>
                <Textarea
                  disabled={editGroup ? false : true}
                  placeholder={t("accountGroup.fields.groupDesc.placeholder")}
                  value={newGroupDesc}
                  onChange={(e) => {
                    setNewGroupDesc(e.target.value);
                  }}
                ></Textarea>
              </div>
            </div>
            <hr className="border-1 border-gray-100"></hr>
            <div className="flex flex-col space-y-6">
              <h5 className="title-lg-semi-bold text-text-primary">
                {t("accountGroup.groupBindingsOverview.title")}
              </h5>
              <div className="flex flex-col space-y-1 p-3">
                <OverviewSelection type={GroupOverviewOptions.knowledge} count={groupDetail?.knowledge_count} onClick={setShowKnowledgeBase}></OverviewSelection>
                <OverviewSelection type={GroupOverviewOptions.member} count={groupDetail?.user_count}></OverviewSelection>
                {isSystemRole && <OverviewSelection type={GroupOverviewOptions.application} onClick={setShowApplication}></OverviewSelection>}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteGroup && (
        <Confirm
          title={t("accountGroup.detail.operation.deleteGroup.title")}
          content={t("accountGroup.detail.operation.deleteGroup.subtitle")}
          isShow={deleteGroup}
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeleteGroup(false)}
        />
      )}

      {showKnowledgeBase && groupDetail?.id && (
        <KnowledgeSelectionModal
          disabled={!permissions.groupManagement.edit}
          currentGroupId={groupDetail?.id}
          showModal={showKnowledgeBase}
          setShowModal={setShowKnowledgeBase}
          onSuccess={mutate}
        ></KnowledgeSelectionModal>
      )}
      {showApplication && groupDetail?.id && (
        <ApplicationSelectionModal
          disabled={!permissions.groupManagement.edit}
          currentGroupId={groupDetail?.id}
          showModal={showApplication}
          setShowModal={setShowApplication}
          onSuccess={mutate}
        />
      )}
    </>
  );
};

export default React.memo(groupDetailPage);
