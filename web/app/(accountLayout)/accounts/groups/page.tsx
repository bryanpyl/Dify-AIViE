"use client";
import React, { useState, useCallback, useEffect, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next'
import NewGroupCard from "./NewGroupCard";
import { fetchGroupList } from "@/service/account";
import { GroupListResponse, group } from "@/models/account";
import useSWRInfinite from "swr/infinite";
import GroupCard from "./GroupCard";
import useSWR from "swr";
import { useRouter } from 'next/navigation'
import Input from "@/app/components/base/input";
import { useDebounceFn } from "ahooks";
import { debounce } from 'lodash-es'
import { useAppContext } from "@/context/app-context";
import { fetchGroupIdByTarget } from '@/service/account';
import { usePermissionCheck } from "@/context/permission-context";
import Loading from "@/app/components/base/loading";
import { ScrollContext } from '../layout'
import { LightEmptyFolder } from "@/app/components/base/icons/src/public/vector-illustration";

const getKey = (pageIndex: number, previousPageData: any, keyword: string) => {
  if (!pageIndex || previousPageData.has_more || !keyword)
    return { params: { page: pageIndex + 1, limit: 11, keyword: keyword } };
  return null;
};

const groupsOverview = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { permissions, isSystemRole, handleNoViewPermission } = usePermissionCheck()
  const { userProfile } = useAppContext()
  const scrollRef = useContext(ScrollContext);
  const anchorRef = useRef<HTMLDivElement>(null);
  const dataLoadingRef = useRef<boolean>(false);
  const { data: groupId } = useSWR(
    {
      params: {
        target_id: userProfile.id,
        type: "user",
      }
    }, fetchGroupIdByTarget,
  );
  
  useEffect(()=>{
    if (!isSystemRole){
      router.push(`/accounts/groups/${groupId}`)
    }
  }, [isSystemRole, groupId])

  
  const [searchKeyword, setSearchKeywords] = useState("");
  const { data, isLoading, setSize, mutate } = useSWRInfinite(
    (pageIndex: number, previousPageData: GroupListResponse) =>
      getKey(pageIndex, previousPageData, searchKeyword),
    fetchGroupList,
    { revalidateFirstPage: true }
  );

  useEffect(()=>{
    dataLoadingRef.current=isLoading
  },[isLoading])

  const { run: debouncedSetSearchKeyword } = useDebounceFn(
    (value: string) => {
      setSearchKeywords(value);
    },
    { wait: 500 }
  );
  const handleKeywordsChange = (value: string) => {
    debouncedSetSearchKeyword(value);
  };

  const handleScroll = useCallback(
    debounce(() => {
      if (!dataLoadingRef.current && anchorRef.current) {
        const anchor = anchorRef.current;
        const anchorRect = anchor.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Distance from anchor to bottom of viewport
        const distanceFromBottom = anchorRect.top - windowHeight;
        if (distanceFromBottom < 100) {
          setSize((size) => size + 1);
        }
      }
    }, 50),
    [setSize, data]
  );

  useEffect(() => {
    scrollRef?.current?.addEventListener('scroll', handleScroll);
    return () => scrollRef?.current?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);


  if (!permissions.groupManagement.view) handleNoViewPermission()
  
  return (
    <div className="flex flex-col h-full mx-auto py-5 px-6 w-full space-y-5">
      <div className="flex flex-row w-full pt-2 pb-3 items-end">
        <div className="flex flex-col flex-1">
          <h4 className="title-xl-semi-bold text-text-primary mb-1">
            {t("accountGroup.overview.title")}
          </h4>
          <p className="system-sm-regular text-text-tertiary">
            {t("accountGroup.overview.subtitle")}
          </p>
        </div>

        <Input
          showLeftIcon
          placeholder="Search Group"
          wrapperClassName="w-[200px]"
          onChange={(e) => {
            handleKeywordsChange(e.target.value);
          }}
        ></Input>
      </div>
      <div className="grow w-full bg-background-default">
        {searchKeyword && (
          isLoading ? (
            <div className="flex flex-col h-full justify-center">
              <Loading type="area" />
            </div>
          ) : (
            data?.[0]?.data?.length == 0 && (
              <div className="h-full justify-center bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex h-full flex-col space-y-3 justify-center items-center">
                  <LightEmptyFolder className="max-h-32 max-w-32"></LightEmptyFolder>
                  <p className="system-md-semibold text-text-secondary">
                    {t("accountGroup.overview.noResult.title")}
                  </p>
                  <p className="system-xs-regular text-text-tertiary text-center">
                    {t("accountGroup.overview.noResult.subtitle")}
                  </p>
                </div>
              </div>
            )
          )
        )}
         
          <div className="grid mobile:grid-col-1 tablet:grid-col-2 pc:grid-cols-4 gap-3">
            {permissions.groupManagement.add && !searchKeyword && (
              <NewGroupCard onSuccess={mutate}></NewGroupCard>
            )}
            {data?.map(({ data: group }) =>
              group.map((group_data) => (
                <GroupCard
                  key={group_data.id}
                  groupDetail={group_data}
                ></GroupCard>
              ))
            )}
          </div>
        <div ref={anchorRef} className="h-1"></div>
      </div>
    </div>
  );
};

export default React.memo(groupsOverview);
