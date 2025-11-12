"use client";
import React, { useCallback, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import relativeTime from 'dayjs/plugin/relativeTime'
import { useContext } from "use-context-selector";
import { RiUserAddLine, RiEditLine, RiDeleteBin6Line, RiEyeLine } from "@remixicon/react";
import { useTranslation } from "react-i18next";
import { fetchMembersPage, deleteMember } from "@/service/common";
import { removeGroupBindings, DeleteRoleAccountJoin } from "@/service/account";
import I18n from "@/context/i18n";
import { useAppContext } from "@/context/app-context";
import { usePermissionCheck } from '@/context/permission-context'
import Avatar from "@/app/components/base/avatar";
import { useProviderContext } from "@/context/provider-context";
import { Plan } from "@/app/components/billing/type";
import Input from "@/app/components/base/input";
import Pagination from "@/app/components/base/pagination";
import { APP_PAGE_LIMIT } from "@/config";
import { useDebounceFn } from "ahooks";
import Confirm from "@/app/components/base/confirm";
import { useRouter } from "next/navigation";
import { ToastContext } from "@/app/components/base/toast";
import MemberOperationModal, {
  MemberModalVariant,
} from "./member-operation-modal";
import CustomPopover, { HtmlContentProps } from "@/app/components/base/popover";
import { systemRole } from "@/models/account";
dayjs.extend(relativeTime)

const MembersPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { notify } = useContext(ToastContext);
  const { locale } = useContext(I18n);

  const {
    userProfile,
  } = useAppContext();

  const { permissions, isSuperadministrator, isSystemRole } = usePermissionCheck();
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [limit, setLimit] = React.useState<number>(APP_PAGE_LIMIT);
  const [searchKeyword, setSearchKeywords] = useState("");
  const { data, mutate } = useSWR(
    {
      url: "/workspaces/current/members-page",
      params: { page: currentPage + 1, limit: limit, keyword: searchKeyword },
    },
    fetchMembersPage
  );
  const total = data?.total;

  const [deleteMemberGroupId, setDeleteMemberGroupId] = useState("");
  const [deleteMemberId, setDeleteMemberId] = useState("");
  const [deleteMemberName, setDeleteMemberName] = useState("");
  const [deleteMemberRoleId, setDeleteMemberRoleId] = useState("");

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddSystemOperatorModal, setShowAddSystemOperatorModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showEditSystemOperatorModal, setShowEditSystemOperatorModal] = useState(false);
  const [editMemberId, setEditMemberId] = useState("");
  const accounts = data?.data || [];

  const { plan, enableBilling } = useProviderContext();
  const isNotUnlimitedMemberPlan =
    enableBilling && plan.type !== Plan.team && plan.type !== Plan.enterprise;
  const isMemberFull =
    enableBilling &&
    isNotUnlimitedMemberPlan &&
    accounts.length >= plan.total.teamMembers;

  const { run: debouncedSetSearchKeyword } = useDebounceFn(
    (value: string) => {
      setSearchKeywords(value);
      setCurrentPage(0);
    },
    { wait: 500 }
  );

  const handleKeywordsChange = (value: string) => {
    debouncedSetSearchKeyword(value);
  };

  const onConfirmDelete = useCallback(async () => {
    try {
      if (deleteMemberRoleId) {
        await DeleteRoleAccountJoin({ 
          role_id: deleteMemberRoleId,
          account_id: [deleteMemberId],
        });
      }

      if (deleteMemberGroupId) {
        await removeGroupBindings({
          group_id: deleteMemberGroupId,
          target_id: [deleteMemberId],
          type: "user",
        });
      } else {
        await deleteMember({
          url: `/workspaces/current/members/${deleteMemberId}/delete`,
        });
      }

      setDeleteMemberGroupId("");
      setDeleteMemberId("");
      setDeleteMemberName("")
      setDeleteMemberRoleId("");
      router.replace("/accounts/members");
      notify({ type: "success", message: "Member successfully deleted." });
    } catch (e) {
      notify({ type: "error", message: `Failed to delete. ${e}` });
    }
  }, [deleteMemberId]);

  const handleDeleteMember = async () => {
    await onConfirmDelete();
    mutate();
  };

  const Operations = (props:HtmlContentProps) =>{
    return (
      <div className="relative flex flex-col gap-y-1 w-auto py-1.5 px-1">
        <div
          className="flex flex-col space-y-1 max-w-[250px] items-start justify-start hover:bg-gray-100 rounded-md cursor-pointer py-[6px] px-3 mx-0"
          onClick={() =>
            permissions.groupMemberManagement.add &&
            !isMemberFull &&
            setShowAddMemberModal(true)
          }
        >
          <span className="text-text-primary system-sm-semibold">
            {t("common.members.inviteGroupMember")}
          </span>
          <span className="text-start text-text-tertiary system-xs-regular text-wrap">
            {t("common.members.inviteGroupMemberSubtitle")}
          </span>
        </div>

        <button
          className="flex flex-col space-y-1 max-w-[250px] items-start justify-start hover:bg-gray-100 rounded-md cursor-pointer py-[6px] px-3 mx-0"
          onClick={() =>
            permissions.groupMemberManagement.add &&
            !isMemberFull &&
            setShowAddSystemOperatorModal(true)
          }
        >
          <span className="text-text-primary system-sm-semibold">
            {t("common.members.inviteSystemOperatorTitle")}
          </span>
          <span className="text-start text-text-tertiary system-xs-regular text-wrap">
            {t("common.members.inviteSystemOperatorSubtitle")}
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grow flex-col mx-auto py-5 px-6 w-full space-y-5">
        <div className="flex flex-row w-full pt-2 pb-3 items-end">
          <div className="flex flex-col flex-1">
            <h4 className="title-xl-semi-bold text-text-primary mb-1">
              {t("accountGroup.members.title")}
            </h4>
            <p className="system-sm-regular text-text-tertiary">
              {t("accountGroup.members.subtitle")}
            </p>
          </div>

          <div className="flex items-stretch space-x-3">
            <Input
              showLeftIcon
              placeholder="Search"
              wrapperClassName="w-[200px]"
              onChange={(e) => {
                handleKeywordsChange(e.target.value);
              }}
            ></Input>

            {permissions.groupMemberManagement.add && isSuperadministrator ? (
              <CustomPopover
                htmlContent={<Operations />}
                position="br"
                trigger="click"
                className="w-max"
                btnElement={
                  <div
                    className={`flex h-full items-center gap-2 text-[13px] font-medium justify-center text-primary-600 cursor-pointer rounded-md ${
                      permissions.groupMemberManagement.add && !isMemberFull
                        ? "cursor-pointer"
                        : "grayscale opacity-50 cursor-default"
                    }`}
                  >
                    <RiUserAddLine className="w-4 h-4" />
                    {t("common.members.invite")}
                  </div>
                }
                btnClassName={(open) =>
                  open
                    ? "bg-sky-50 text-text-accent"
                    : "bg-transparent border border-components-button-secondary-border"
                }
                btnClassNameSecondary="h-full py-0"
                popoverClassName="flex shadow-xs"
              ></CustomPopover>
            ) : (
              <div
                className={`shrink-0 flex items-center py-[7px] px-3 border-[0.5px] border-gray-200
              text-[13px] font-medium text-primary-600 bg-white
              shadow-xs rounded-lg ${
                permissions.groupMemberManagement.add && !isMemberFull
                  ? "cursor-pointer"
                  : "grayscale opacity-50 cursor-default"
              }`}
                onClick={() =>
                  permissions.groupMemberManagement.add &&
                  !isMemberFull &&
                  setShowAddMemberModal(true)
                }
              >
                <RiUserAddLine className="w-4 h-4 mr-2 " />
                {t("common.members.invite")}
              </div>
            )}
          </div>
        </div>
        <div className="grow overflow-visible lg:overflow-visible">
          <div className="flex items-center py-[7px] border-b border-divider-regular min-w-[480px]">
            <div className="shrink-0 w-[96px] px-3 system-xs-medium-uppercase text-text-tertiary">
              #
            </div>
            <div className="grow px-3 system-xs-medium-uppercase text-text-tertiary">
              {t("common.members.name")}
            </div>
            {isSystemRole && (
              <div className="shrink-0 max-w-[150px] flex-auto px-3 text-xs font-medium text-gray-500">
                {t("common.members.group")}
              </div>
            )}
            <div className="shrink-0 flex-auto max-w-[150px] px-3 system-xs-medium-uppercase text-text-tertiary">
              {t("common.members.role")}
            </div>
            <div className="shrink-0 w-[104px] system-xs-medium-uppercase text-text-tertiary">
              {t("common.members.lastActive")}
            </div>
            {permissions.groupMemberManagement.edit &&
              permissions.groupMemberManagement.delete && (
                <>
                  <div className="shrink-0 w-[96px] px-3 system-xs-medium-uppercase text-text-tertiary">
                    Action
                  </div>
                </>
              )}
          </div>
          <div className="min-w-[480px] relative">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className="flex border-b border-divider-subtle"
              >
                <div className="shrink-0 w-[96px] px-3 flex items-center align-middle system-xs-regular text-text-tertiary">
                  {index + 1}
                </div>
                <div className="grow flex items-center py-2 px-3">
                  <Avatar
                    avatar={account.avatar_url||null}
                    size={24}
                    className="mr-2"
                    name={account.name}
                  />
                  <div className="">
                    <div className="text-text-secondary system-sm-medium">
                      {account.name}
                      {account.status === "pending" && (
                        <span className="ml-1 system-xs-regular text-[#DC6803]">
                          {t("common.members.pending")}
                        </span>
                      )}
                      {userProfile.email === account.email && (
                        <span className="system-xs-regular text-text-tertiary">
                          {t("common.members.you")}
                        </span>
                      )}
                    </div>
                    <div className="text-text-tertiary system-xs-regular">
                      {account.email}
                    </div>
                  </div>
                </div>
                {isSystemRole && (
                  <div className="shrink-0 flex-auto max-w-[150px] flex items-center">
                    {account.group_name ? (
                      <div className="px-3 text-[13px] text-gray-700">
                        {account.group_name}
                      </div>
                    ) : (
                      <div className="px-3 text-[13px] text-gray-400">
                        {t("common.members.na")}
                      </div>
                    )}
                  </div>
                )}
                <div className="shrink-0 flex-auto max-w-[150px] w-full flex items-center">
                  <div className="w-full">
                    {account.role_name ? (
                      <div className="px-3 text-[13px] text-gray-700">
                        {account.role_name}
                      </div>
                    ) : (
                      <div className="px-3 text-[13px] text-gray-400">
                        {t("common.members.na")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center w-[104px] py-2 system-xs-regular text-text-secondary">
                  {dayjs(
                    Number(account.last_active_at || account.created_at) * 1000
                  )
                    .locale(locale === "zh-Hans" ? "zh-cn" : "en")
                    .fromNow()
                  }
                </div>
                {permissions.groupMemberManagement.edit &&
                  permissions.groupMemberManagement.delete && (
                    <>
                      <div className="shrink-0 w-[96px] px-3 flex items-center space-x-3">
                        {permissions.groupMemberManagement.edit &&
                          (isSystemRole &&
                            (account.role_name === systemRole.superadmin || account.role_name === systemRole.systemOperator) ? (
                              <RiEyeLine
                                className="w-4 h-4 text-text-placeholder cursor-pointer hover:text-text-accent"
                                onClick={() => {
                                  setEditMemberId(account.id);
                                  setShowEditSystemOperatorModal(true);
                                }}
                              />
                            ) : (
                              <RiEditLine
                                className="w-4 h-4 text-text-placeholder cursor-pointer hover:text-text-accent"
                                onClick={() => {
                                  setEditMemberId(account.id);
                                  setShowEditMemberModal(true);
                                }}
                              />
                            )
                          )
                        }
                        {isSystemRole && isSuperadministrator &&
                          permissions.groupMemberManagement.delete ? (
                            <RiDeleteBin6Line
                              className={`w-4 h-4 text-text-placeholder ${
                                !account.group_name &&
                                account.id !== userProfile.id
                                  ? "hover:text-red-500 cursor-pointer"
                                  : "hover:cursor-not-allowed"
                              }`}
                              onClick={() => {
                                if (
                                  !account.group_name &&
                                  account.id !== userProfile.id
                                ) {
                                  setDeleteMemberId(account.id);
                                  setDeleteMemberName(account.name);
                                  setDeleteMemberRoleId(account.role_id);
                                }
                              }}
                            />
                          ) : permissions.groupMemberManagement.delete ? (
                            <RiDeleteBin6Line
                              className={`w-4 h-4 text-text-placeholder ${
                                account.group_name &&
                                account.id !== userProfile.id
                                  ? "hover:text-red-500 cursor-pointer"
                                  : "hover:cursor-not-allowed"
                              }`}
                              onClick={() => {
                                if (
                                  account.group_name &&
                                  account.id !== userProfile.id
                                ) {
                                  setDeleteMemberGroupId(account.group_id);
                                  setDeleteMemberId(account.id);
                                  setDeleteMemberName(account.name);
                                  setDeleteMemberRoleId(account.role_id);
                                }
                              }}
                            />
                          ) : (
                            <></>
                          )
                        }
                      </div>
                    </>
                  )}
              </div>
            ))}
          </div>
          {/* Show Pagination only if the total is more than the limit */}
          {total && total > APP_PAGE_LIMIT ? (
            <Pagination
              current={currentPage}
              onChange={setCurrentPage}
              total={total}
              limit={limit}
              onLimitChange={setLimit}
            />
          ) : null}
        </div>
      </div>
      {(deleteMemberId || deleteMemberGroupId) && (
        <Confirm
          title={
            deleteMemberGroupId
              ? t("accountGroup.members.operation.removeFromGroup.title", {
                  name: deleteMemberName,
                })
              : t("accountGroup.members.operation.deleteMember.title", {
                  name: deleteMemberName,
                })
          }
          content={
            deleteMemberGroupId
              ? t("accountGroup.members.operation.removeFromGroup.subtitle")
              : t("accountGroup.members.operation.deleteMember.subtitle")
          }
          isShow={!!deleteMemberId || !!deleteMemberGroupId}
          onConfirm={handleDeleteMember}
          onCancel={() => {
            setDeleteMemberId("");
            setDeleteMemberGroupId("");
            setDeleteMemberName("");
            setDeleteMemberRoleId("");
          }}
        />
      )}
      {showAddMemberModal && (
        <MemberOperationModal
          variant={MemberModalVariant.add}
          onSuccess={mutate}
          showModal={showAddMemberModal}
          setShowModal={setShowAddMemberModal}
        ></MemberOperationModal>
      )}

      {showAddSystemOperatorModal && (
        <MemberOperationModal
          variant={MemberModalVariant.add}
          onSuccess={mutate}
          showModal={showAddSystemOperatorModal}
          setShowModal={setShowAddSystemOperatorModal}
          superadminMode={true}
        ></MemberOperationModal>
      )}

      {showEditMemberModal && (
        <MemberOperationModal
          accountId={editMemberId}
          variant={MemberModalVariant.edit}
          onSuccess={mutate}
          showModal={showEditMemberModal}
          setShowModal={setShowEditMemberModal}
        />
      )}

      {showEditSystemOperatorModal && (
        <MemberOperationModal
          accountId={editMemberId}
          variant={MemberModalVariant.edit}
          onSuccess={mutate}
          showModal={showEditSystemOperatorModal}
          setShowModal={setShowEditSystemOperatorModal}
          superadminMode={true}
        />
      )}
    </>
  );
};

export default MembersPage;
