"use client";
import React, { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { RiAddLine, RiFilter3Line, RiCloseCircleFill } from "@remixicon/react";
import { useTranslation } from "react-i18next";
import CreateRoleModal from "./CreateRoleModal";
import { fetchRoleList, fetchGroupList } from "@/service/account";
import RoleCard from "./card/RoleCard";
import { systemRole } from "@/models/account";
import { useAppContext } from "@/context/app-context";
import { usePermissionCheck } from '@/context/permission-context'
import { GroupListResponse } from "@/models/account";
import Input from "@/app/components/base/input";
import { useDebounceFn } from "ahooks";

const getGroupKey = (
  pageIndex: number,
  previousPageData: any,
  keyword?: string
) => {
  if (!pageIndex || previousPageData.has_more || !keyword)
    return {params: {page: pageIndex + 1, limit: 10, keyword: keyword}};
  return null;
};

const RolePage = () => {
  const { t } = useTranslation();
  const { groupId } = useAppContext();
  const { permissions, isSuperadministrator, isSystemRole } = usePermissionCheck();
  const [showAddRole, setShowAddRole] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState("");
  const [filterGroup, setFilterGroup] = useState<{id:string, name:string}>({id:"",name:""});
  const [searchKeyword, setSearchKeyword] = useState("");

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && previousPageData.length === 0) return null;
    return {
      params: {
        page: pageIndex + 1,
        keyword: searchKeyword,
        group_id: isSystemRole ? (filterGroupId || "") : groupId,
      },
    };
  };

  const {
    data: roleList,
    isLoading,
    isValidating,
    mutate: roleMutate,
  } = useSWRInfinite(getKey, fetchRoleList);

  const {
    data: groupListData,
    isLoading: groupListDataIsLoading,
    setSize,
    mutate,
  } = useSWRInfinite(
    (pageIndex: number, previousPageData: GroupListResponse) =>
      getGroupKey(pageIndex, previousPageData, searchKeyword),
    fetchGroupList
  );

  const handleGroupIdFilter = (id: string, name: string) => {
    setFilterGroupId(id);
    setFilterGroup({id:id, name:name})
    setShowFilterDropdown(false);
  };

  const {run: debouncedSetSearchKeyword} = useDebounceFn(
    (value: string)=>{
      setSearchKeyword(value);
    },
    {wait: 500}
  )

  const handleKeywordsChange = (value: string) => {
    debouncedSetSearchKeyword(value)
  }

  return (
    <>
      <div className="grow xl:max-w-[1200px] flex-col mx-auto py-5 px-6 w-full space-y-8">
        <div className="flex flex-row w-full pt-2 pb-3 items-center justify-between">
          <div className="flex flex-col flex-1 space-y-1">
            <h4 className="title-xl-semi-bold text-text-primary mb-1">
              {t("accountRole.overview.title")}
            </h4>
            <p className="system-sm-regular text-text-tertiary">
            {t("accountRole.overview.subtitle")}
            </p>
          </div>
        </div>

        <div className="grow flex-col mx-2">
          <div className='grow space-y-3'>
            <div className="grow flex justify-between items-stretch">
              <div className="grow flex space-x-2 items-stretch">
                <Input
                  showLeftIcon
                  placeholder="Search Role"
                  wrapperClassName="w-[250px]"
                  onChange={(e) => {
                    handleKeywordsChange(e.target.value)
                  }}
                ></Input>
                {isSuperadministrator && (
                  <div className="relative">
                    <div
                      onClick={() => setShowFilterDropdown((prev) => !prev)}
                      className="hover:cursor-pointer hover:bg-gray-50 hover:text-text-primary px-3 h-full py-auto rounded-lg items-center flex gap-2 text-text-tertiary system-sm-medium border border-gray-200"
                    >
                      {filterGroup.name ? (
                        <>
                          <RiCloseCircleFill className='w-4 h-4' onClick={() => handleGroupIdFilter("", "")} />
                          <p className='system-xs-semibold text-text-primary'>{filterGroup.name}</p>
                        </>
                      ) : (
                        <>
                          <RiFilter3Line className="w-4 h-4 text-text-secondary" />
                          Filter
                        </>
                      )}
                    </div>
                    <div className={`absolute left-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-10 transition-all duration-200 ease-in-out transform ${showFilterDropdown?'opacity-100 scale-100':'opacity-0 scale-95 pointer-events-none'}`}>
                      <div className="flex flex-col px-4 py-3 space-y-2">
                        {/* Only filter by group if user is superadmin*/}
                        <p className='system-sm-semibold text-text-tertiary'>Groups</p>
                        {groupListData?.map(({ data: group }) =>
                          group.map((group_data, index) => (
                            <div
                              key={group_data.id}
                              className={`flex items-center px-2 py-2 system-sm-regular 
                                    text-text-secondary hover:text-text-accent
                                    hover:bg-sky-50 rounded-lg hover:cursor-pointer`}
                              onClick={() =>
                                handleGroupIdFilter(group_data.id, group_data.name)
                              }
                            >
                              {group_data.name}
                            </div>
                          ))
                        )}
                        {/* UX Enhancement - Filter by Role Type */}
                        {/* <br></br>
                        <p className='system-sm-semibold text-text-tertiary'>Role Type</p>
                        <div className='flex flex-col px-2 py-2 space-y-2'>
                          <div className='grow flex items-center py-2 space-x-2'>
                            <Checkbox checked={false}></Checkbox> 
                            <p className='system-sm-regular text-text-secondary'>Default Role</p>
                          </div>

                          <div className='grow flex items-center py-2 space-x-2'>
                            <Checkbox checked={false}></Checkbox>
                            <p className='system-sm-regular text-text-secondary'>Custom Role</p>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {permissions.groupRolesAndPerms.add && (
                <div
                  className="px-3 py-auto bg-primary-500 text-white inline-flex items-center gap-2 justify-center cursor-pointer rounded-md"
                  onClick={() => setShowAddRole(true)}
                >
                  <RiAddLine className="w-4 h-4"></RiAddLine>
                  <span className="system-sm-semibold">
                    {t("accountRole.operation.addRole.btnLabel")}
                  </span>
                </div>
              )}
            </div>

            <div className="grow flex-col space-y-1">
              {(roleList ?? [])
                .flatMap((page) => page)
                .filter((role) => {
                  if (isSuperadministrator) return true
                  else {
                    if (isSystemRole) return role.name!==systemRole.superadmin
                    else return role.name!==systemRole.superadmin && role.name!==systemRole.systemOperator
                  }
                })
                .map((role, index, array) => (
                  <RoleCard
                    groupNameTag={
                      groupListData
                        ?.flatMap((page) => page.data)
                        .find((group) => group.id === role.group_id)?.name || "N/A"
                    }
                    key={role.id}
                    groupId={role.group_id}
                    role={role}
                    isLast={index === array.length - 1}
                    customRole={role.group_id !== null}
                    mutateRoleList={roleMutate}
                  ></RoleCard>
                ))}
            </div>
          </div>
        </div>
      </div>

      {showAddRole && (
        <CreateRoleModal
          showModal={showAddRole}
          setShowModal={setShowAddRole}
          onSuccess={roleMutate}
        ></CreateRoleModal>
      )}
    </>
  );
};

export default React.memo(RolePage);
