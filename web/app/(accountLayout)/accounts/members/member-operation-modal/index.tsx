import Input from "@/app/components/base/input";
import Modal from "@/app/components/base/modal";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReactMultiEmail } from "react-multi-email";
import cn from "@/utils/classnames";
import s from "./index.module.css";
import useSWRInfinite from "swr/infinite";
import { GroupListResponse, group, role } from "@/models/account";
import { AddGroupBindings, fetchGroupDetail, fetchGroupList, fetchRoleList, CreateRoleAccountJoin, UpdateRoleAccountJoin } from "@/service/account";
import { RiCheckLine, RiArrowDropDownLine, RiArrowDropUpLine } from "@remixicon/react";
import {Key2Line} from '@/app/components/base/icons/src/vender/line/accountManagement'
import { systemRole } from "@/models/account";
import Button from "@/app/components/base/button";
import { fetchMembersPage, inviteMember } from "@/service/common";
import { useContext } from "use-context-selector";
import { ToastContext } from "@/app/components/base/toast";
import { useAppContext } from "@/context/app-context";
import { usePermissionCheck } from '@/context/permission-context'
import useSWR from "swr";
import 'react-multi-email/dist/style.css'
import Loading from "@/app/components/base/loading";

export enum MemberModalVariant {
  add = "Add",
  edit = 'Edit'
}

interface MemberOperationModalProps {
  accountId?:string,
  onSuccess: () => void;
  variant: MemberModalVariant;
  superadminMode?: boolean;
  showModal: boolean;
  setShowModal: (value: boolean) => void;
}

const MemberOperationModal: React.FC<MemberOperationModalProps> = ({
  accountId,
  onSuccess,
  variant,
  superadminMode = false,
  showModal,
  setShowModal,
}) => {
  const { t } = useTranslation();
  const { groupId } = useAppContext();
  const { isSuperadministrator, isSystemRole } = usePermissionCheck();
  const { notify } = useContext(ToastContext);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [showMemberGroup, setShowMemberGroup] = useState(false);
  const [showMemberRole, setShowMemberRole] = useState(false);
  const [memberGroup, setMemberGroup] = useState<{
    group_name: string;
    group_id: string;
  } | null>(null);
  const [memberRole, setMemberRole] = useState<{
    role_name: string;
    role_id: string;
    role_desc: string;
  } | null>(null);
  // NOTE: Available for Edit Detail only
  const [username, setUsername] = useState("");
  const [userEmail, setUserEmail] = useState("");
  /**This is to represent the users that have been removed from group, but still exists in Account and TenantAccount table */
  const [userNoGroup, setUserNoGroup] = useState(false);
  const [isUserSuperadmin, setIsUserSuperadmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupMemberSelectionError, setGroupMemberSelectionError] =
    useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // NOTE: To fetch member's data for Edit Detail
  const { data: memberData, mutate: memberDataMutate } = useSWR(
    () =>
      accountId
        ? {
            url: "/workspaces/current/members-page",
            params: {
              account_id: accountId || "",
            },
          }
        : null,
    fetchMembersPage
  );

  const getGroupKey = (
    pageIndex: number,
    previousPageData: any
    // keyword?: string
  ) => {
    if (!pageIndex || previousPageData.has_more)
      return { params: { page: pageIndex + 1, limit: 10, keyword: "" } };
    return null;
  };
  const {
    data: groupListData,
    isLoading,
    setSize,
    mutate,
  } = useSWRInfinite(
    (pageIndex: number, previousPageData: GroupListResponse) =>
      getGroupKey(pageIndex, previousPageData),
    fetchGroupList
    //   { revalidateFirstPage: true }
  );

  const { data: groupDetail } = useSWR(
    !isSystemRole ? { id: groupId } : null,
    fetchGroupDetail
  );

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && previousPageData.length === 0) return null;
    return {
      params: {
        page: pageIndex + 1,
        keyword: "",
        group_id: memberGroup?.group_id || "",
      },
    };
  };

  const {
    data: roleList,
    isLoading: roleListLoading,
    mutate: roleMutate,
  } = useSWRInfinite(getKey, fetchRoleList);

  const resetRole = (roleName: systemRole) => {
    const allRoles = roleList!.flatMap((page) => page);
    const initiateRole = allRoles.find(
      (member: role) => member.name === roleName
    );
    setMemberRole({
      role_id: initiateRole!.id,
      role_name: initiateRole!.name,
      role_desc: initiateRole!.description,
    });
  };

  useEffect(() => {
    if (!isSystemRole && groupDetail) {
      setMemberGroup({ group_name: groupDetail.name, group_id: groupId });
    }
  }, [isSystemRole, groupDetail]);

  useEffect(() => {
    if (roleList && !memberGroup && !superadminMode) {
      resetRole(systemRole.groupAdmin);
    } else if (
      roleList &&
      superadminMode &&
      variant === MemberModalVariant.add
    ) {
      resetRole(systemRole.systemOperator);
    }
  }, [roleList, memberGroup, superadminMode, variant]);

  useEffect(() => {
    if (showMemberRole && dropdownRef.current) {
      dropdownRef.current.focus();
      dropdownRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showMemberRole]);

  useEffect(() => {
    // Load the data for Edit Member Modal
    if (memberData?.total === 1) {
      const targetMemberId = memberData.data[0];
      setUsername(targetMemberId.name);
      setUserEmail(targetMemberId.email);

      if (targetMemberId.group_id) {
        setMemberGroup({
          group_name: targetMemberId.group_name,
          group_id: targetMemberId.group_id,
        });
      }
      setUserNoGroup(targetMemberId.group_id ? false : true);

      if (targetMemberId.role_id && roleList?.length) {
        const currentRole = roleList
          ?.flatMap((page) => page)
          .find(
            (selectedRole: role) => selectedRole.id === targetMemberId.role_id
          );

        if (currentRole!.name === systemRole.superadmin) setIsUserSuperadmin(true);

        setMemberRole({
          role_id: currentRole!.id,
          role_name: currentRole!.name,
          role_desc: currentRole!.description,
        });
      }
    }
  }, [memberData, roleList]);

  useEffect(() => {
    if (variant === MemberModalVariant.edit) {
      setShowLoading(memberRole?.role_id ? true : false);
    }
  }, [memberRole, variant]);

  const handleAddGroupMember = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // STEP 1: Add Group Member into Account & Tenant
      const { result, accounts, invitation_results } = await inviteMember({
        url: "/workspaces/current/members/invite-email",
        body: { emails: emailList },
      });

      if (result === "success" && accounts.length > 0) {
        const roleAccountJoinResponse = await CreateRoleAccountJoin({
          role_id: memberRole!.role_id,
          account_id: accounts,
        });
        if (
          !superadminMode &&
          (roleAccountJoinResponse.status === 200 ||
            roleAccountJoinResponse.code === "success")
        ) {
          const groupBindingResponse = await AddGroupBindings({
            group_id: memberGroup!.group_id,
            target_id: accounts,
            type: "user",
          });

          if (
            groupBindingResponse.status === 200 ||
            groupBindingResponse.code === "success"
          ) {
            notify({
              type: "success",
              message: "Group member successfully added",
            });
            setIsSubmitting(false);
            setShowModal(false);
            setMemberGroup(null);
            setMemberRole(null);
            onSuccess();
          }
        } else if (superadminMode) {
          notify({
            type: "success",
            message: "System operator successfully added",
          });
          setIsSubmitting(false);
          setShowModal(false);
          setMemberGroup(null);
          setMemberRole(null);
          onSuccess();
        }
      } else {
        setIsSubmitting(false);
        notify({ type: "error", message: "Error occurred. Try again later." });
      }
    } catch (e) {
      setIsSubmitting(false);
      notify({ type: "error", message: "Error occurred. Try again later." });
    }
  }, [memberGroup, memberRole, emailList]);

  const handleUpdateGroupMember = useCallback(async () => {
    setIsSubmitting(true);

    // If group user, only update Role
    try {
      if (memberGroup) {
        const groupBindingResponse = await AddGroupBindings({
          group_id: memberGroup!.group_id,
          target_id: [accountId!],
          type: "user",
        });
      }

      const roleAccountJoinResponse = await UpdateRoleAccountJoin({
        role_id: memberRole!.role_id,
        account_id: [accountId!],
      });

      if (
        roleAccountJoinResponse.status === 200 ||
        roleAccountJoinResponse.code === "success"
      ) {
        notify({
          type: "success",
          message: "Group Member successfully updated",
        });
        setIsSubmitting(false);
        setShowModal(false);
        setMemberGroup(null);
        setMemberRole(null);
        onSuccess();
      }
    } catch (e) {
      setIsSubmitting(false);
      notify({ type: "error", message: "Error occurred. Try again later." });
    }
  }, [memberRole, accountId, memberGroup]);

  return (
    <Modal
      title={
        variant === MemberModalVariant.add
          ? 
            superadminMode? t("accountMember.operation.addSystemOperator.title")
            : t("accountMember.operation.addMember.title")
          : superadminMode
          ? t("accountMember.operation.viewSystemUserDetail.title")
          : t("accountMember.operation.editGroupMember.title")
      }
      groupModalUse
      overflowVisible
      isShow={showModal}
      closable
      groupClassName="h-auto max-h-[90vh]"
      onClose={() => setShowModal(false)}
    >
      {isLoading ? (
        <Loading type="area" />
      ) : (
        <>
          <div className="mb-3 text-[13px] text-gray-500">
            {variant === MemberModalVariant.add? 
              superadminMode? t("accountMember.operation.addSystemOperator.subtitle")
                  : t("accountMember.operation.addMember.subtitle")
              : 
              superadminMode? t("accountMember.operation.viewSystemUserDetail.subtitle")
              : t("accountMember.operation.editGroupMember.subtitle")}
          </div>
          <div className="flex flex-col flex-grow w-full space-y-6 2xl:space-y-8 p-2 my-4 h-auto overflow-y-scroll">
            {variant === MemberModalVariant.add && (
              <>
                <div className="flex flex-col flex-shrink-0">
                  <div className="flex flex-col mb-1 gap-1">
                    <label className="system-sm-semibold">
                      {t(
                        `accountMember.operation.fields.emailAddress.${
                          superadminMode ? "systemOperator" : "groupMembers"
                        }.title`
                      )}
                    </label>
                    <span className="system-xs-regular text-text-tertiary">
                      {t(
                        `accountMember.operation.fields.emailAddress.${
                          superadminMode ? "systemOperator" : "groupMembers"
                        }.subtitle`
                      )}
                    </span>
                  </div>
                  <ReactMultiEmail
                    className="w-full pt-2 px-3 outline-none border-none text-xs text-[#101828] rounded-lg overflow-y-auto"
                    autoFocus
                    emails={emailList}
                    inputClassName="bg-transparent"
                    onChange={setEmailList}
                    getLabel={(email, index, removeEmail) => (
                      <div data-tag key={index} className={cn(s.emailTag)}>
                        <div data-tag-item>{email}</div>
                        <span
                          data-tag-handle
                          onClick={() => removeEmail(index)}
                        >
                          ×
                        </span>
                      </div>
                    )}
                    placeholder={t(
                      "accountMember.operation.fields.emailAddress.placeholder"
                    )}
                  />
                </div>
              </>
            )}

            {variant === MemberModalVariant.edit && (
              <>
                <div className="flex flex-col flex-shrink-0">
                  <div className="flex flex-col mb-3 gap-1">
                    <label className="system-sm-semibold">
                      {t("accountMember.operation.fields.username.title")}
                    </label>
                    <span className="system-xs-regular text-text-tertiary">
                      {t("accountMember.operation.fields.username.subtitle")}
                    </span>
                  </div>
                  <Input
                    disabled
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                    }}
                    placeholder={
                      t(
                        "accountMember.operation.fields.username.placeholder"
                      ) || ""
                    }
                  />
                </div>

                <div className="flex flex-col flex-shrink-0">
                  <div className="flex flex-col mb-3 gap-1">
                    <label className="system-sm-semibold">
                      {t(
                        "accountMember.operation.fields.emailAddress.groupMember.title"
                      )}
                    </label>
                    <span className="system-xs-regular text-text-tertiary">
                      {t(
                        "accountMember.operation.fields.emailAddress.groupMember.subtitle"
                      )}
                    </span>
                  </div>
                  <Input
                    disabled
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                    }}
                    placeholder={
                      t(
                        "accountMember.operation.fields.username.placeholder"
                      ) || ""
                    }
                  />
                </div>
              </>
            )}

            {!isUserSuperadmin && !superadminMode && (
              <div className="flex flex-col flex-shrink-0">
                <div className="flex flex-col mb-3 gap-1">
                  <label className="system-sm-semibold">
                    {t("accountMember.operation.fields.groupSelection.title")}
                  </label>
                  <span className="system-xs-regular text-text-tertiary">
                    {t(
                      "accountMember.operation.fields.groupSelection.subtitle"
                    )}
                  </span>
                </div>

                <div className="w-full relative">
                  <div
                    className={`w-full py-2 px-3 text-xs rounded-lg 
                      ${
                        variant === MemberModalVariant.add
                          ? memberGroup
                            ? "text-text-primary"
                            : "text-text-placeholder"
                          : userNoGroup
                          ? "text-text-primary"
                          : "text-components-input-text-filled-disabled"
                      }
                      ${
                        (variant === MemberModalVariant.edit && !userNoGroup) || (variant===MemberModalVariant.add && !isSystemRole)
                          ? "outline-none border-none bg-components-input-bg-disabled hover:cursor-text"
                          : `border ${
                              groupMemberSelectionError
                                ? "border-text-destructive"
                                : "border-gray-200"
                            } hover:cursor-pointer`
                      }
                    `}
                    onClick={() => {
                      if ((variant === MemberModalVariant.edit && !userNoGroup) || (variant === MemberModalVariant.add && !isSystemRole)) {
                        null;
                      }
                      else {
                        setShowMemberRole(false);
                        setShowMemberGroup((prev) => !prev);
                        setGroupMemberSelectionError(false);
                      }
                    }}
                  >
                    {memberGroup
                      ? memberGroup.group_name
                      : t(
                          "accountMember.operation.fields.groupSelection.placeholder"
                        )}
                  </div>
                  {groupMemberSelectionError && (
                    <span className="system-xs-semibold text-text-destructive">
                      {t(`accountMember.operation.fields.error.groupMember`)}
                    </span>
                  )}

                  {showMemberGroup && (
                    <div className="absolute left-0 z-10 w-full overflow-y-scroll mt-1 bg-white border border-gray-200 rounded-lg shadow-md ">
                      <div className="px-2 py-4">
                        {groupListData?.map(({ data: group }) =>
                          group.map((group_data) => (
                            <div
                              key={group_data.id}
                              className={`flex flex-col justify-center p-2 space-y-1 system-sm-medium 
                                        text-text-secondary transition-all duration-150 ease-in-out
                                        hover:bg-gray-50 rounded-lg hover:cursor-pointer ${
                                          group_data.id ===
                                          memberGroup?.group_id
                                            ? "bg-sky-50"
                                            : ""
                                        }`}
                              onClick={() => {
                                setShowMemberGroup(false);
                                // resetRole();
                                setMemberGroup({
                                  group_id: group_data.id,
                                  group_name: group_data.name,
                                });
                              }}
                            >
                              <h6
                                className={`inline-flex items-center gap-2 system-sm-semibold ${
                                  group_data.id === memberGroup?.group_id
                                    ? "text-text-accent"
                                    : "text-text-secondary"
                                }`}
                              >
                                {group_data.name}{" "}
                                <span
                                  className={`system-2xs-semibold-uppercase ${
                                    group_data.id === memberGroup?.group_id
                                      ? "text-text-accent"
                                      : "text-text-tertiary"
                                  }`}
                                >
                                  {group_data.agency_name}
                                </span>
                              </h6>
                              <p className="system-xs-regular text-text-tertiary">
                                {group_data.description}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div className="relative w-full">
              <div
                className={`flex flex-row space-x-3 justify-between items-center w-full bg-white border border-gray-200 shadow-md px-5 py-8 rounded-lg`}
              >
                <div className="flex flex-row space-x-4 items-center">
                  <div className="rounded-full h-auto p-3 bg-primary-500">
                    <Key2Line className="text-white w-4 h-4"></Key2Line>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <h6 className="system-sm-regular">
                      {(variant === MemberModalVariant.edit
                        ? t(
                            "accountMember.operation.fields.editRoleSelection.title"
                          )
                        : emailList.length > 1
                        ? t(
                            "accountMember.operation.fields.roleSelection.titleForMultipleMember"
                          )
                        : t(
                            "accountMember.operation.fields.roleSelection.titleForSingleMember"
                          )) + " "}
                      <span className="system-sm-semibold">
                        {memberRole?.role_name}
                      </span>
                    </h6>
                    <p className="system-xs-regular text-text-tertiary">
                      {memberRole?.role_desc}
                    </p>
                  </div>
                </div>
                {!superadminMode && (
                  <div
                    className={`flex flex-shrink-0 gap-2 system-sm-semibold  ${
                      memberGroup
                        ? "cursor-pointer text-text-accent"
                        : "cursor-not-allowed text-text-tertiary"
                    }`}
                    onClick={() => {
                      if (memberGroup) {
                        setShowMemberRole((prev) => !prev);
                      } else {
                        setGroupMemberSelectionError(true);
                      }
                    }}
                  >
                    {variant === MemberModalVariant.add
                      ? t(
                          "accountMember.operation.fields.roleSelection.actionBtnLabel"
                        )
                      : t(
                          "accountMember.operation.fields.editRoleSelection.actionBtnLabel"
                        )}
                    <RiArrowDropDownLine className="w-4 h-4"></RiArrowDropDownLine>
                  </div>
                )}
              </div>
              {showMemberRole && (
                <div
                  ref={dropdownRef}
                  className="absolute w-full max-h-[250px] z-10 left-0 mt-1 overflow-y-scroll bg-white border border-gray-200 rounded-lg shadow-md"
                >
                  <div className="px-2 py-4 space-y-1">
                    {roleList
                      ?.flatMap((roles) =>
                        roles.filter(
                          (role) =>
                            role.name !== systemRole.superadmin &&
                            role.name !== systemRole.systemOperator
                        )
                      )
                      .map((group_role) => (
                        <div
                          key={group_role.id}
                          className={`flex flex-col w-full space-y-1 p-2 
                        hover:bg-gray-50 rounded-lg 
                        hover:cursor-pointer transition-all duration-150 
                        ease-in-out 
                        ${
                          group_role.id === memberRole?.role_id
                            ? "bg-sky-50 text-text-accent"
                            : ""
                        }`}
                          onClick={() => {
                            setMemberRole({
                              role_name: group_role.name,
                              role_id: group_role.id,
                              role_desc: group_role.description,
                            });
                            setShowMemberRole(false);
                          }}
                        >
                          <h6
                            className={`inline-flex items-center gap-2 system-sm-semibold ${
                              group_role.id === memberRole?.role_id
                                ? "text-text-accent"
                                : "text-text-secondary"
                            }`}
                          >
                            {group_role.name}
                            {!group_role.group_id && (
                              <span
                                className={`rounded-lg border border-gray-200 px-2 py-1 system-2xs-medium text-text-tertiary`}
                              >
                                System Role
                              </span>
                            )}
                          </h6>
                          <p className={`system-xs-regular text-text-tertiary`}>
                            {group_role.description}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={`flex flex-row items-center justify-end`}>
            {/* {step!==1?<span className='system-2xs-semibold-uppercase text-text-accent'>{selectedPerm.length} permission selected </span>:null} */}
            <div className="flex flex-row gap-2 justify-end">
              <Button
                onClick={() => {
                  setShowModal(false);
                  setMemberGroup(null);
                  setMemberRole(null);
                  setUserNoGroup(false)
                  setUserEmail("");
                  setUsername("");
                }}
              >
                {t("common.operation.cancel")}
              </Button>
              {!(superadminMode && variant === MemberModalVariant.edit) && (
                <Button
                  loading={isSubmitting}
                  disabled={
                    variant === MemberModalVariant.add
                      ? superadminMode
                        ? !(emailList.length > 0)
                        : !(emailList && memberGroup && memberRole)
                      : // if variant === Edit
                      isSuperadministrator
                      ? userNoGroup
                        ? !(memberGroup && memberRole)
                        : !(memberRole?.role_id !== memberData?.data[0].role_id)
                      : !(memberRole?.role_id !== memberData?.data[0].role_id)
                  }
                  variant="primary"
                  onClick={async () => {
                    variant === MemberModalVariant.add
                      ? await handleAddGroupMember()
                      : await handleUpdateGroupMember();
                  }}
                >
                  {t("common.operation.submit")}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default React.memo(MemberOperationModal);
