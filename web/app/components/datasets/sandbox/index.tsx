"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LightEmptyFolder } from "@/app/components/base/icons/src/public/vector-illustration";
import SearchInput from "@/app/components/base/search-input";
import useSWRInfinite from "swr/infinite";
import { fetchTestingRecords } from "@/service/datasets";
import { HitTestingRecordsResponse, HitTestingRecord } from "@/models/datasets";
import { useSandboxContext } from "@/context/sandbox-context";
import useTimestamp from '@/hooks/use-timestamp'
import { debounce } from 'lodash-es'
import { useDebounceFn } from 'ahooks'
import HistoryPreviewTooltip from "./components/history-preview-tooltip";
import Loading from "../../base/loading";
import AdminHelp from "../../base/error-handling/AdminHelp";
import useBreakpoints, {MediaType} from "@/hooks/use-breakpoints";

const SandboxDebugPanel = () => {
  const media = useBreakpoints()
  const xl = media === MediaType.xl
  const { t } = useTranslation();
  const { formatTime } = useTimestamp()
  const { dataset_id, handleUpdateQuery, setTriggerMutate, sandboxKnowledgeIdInitialized } = useSandboxContext();
  const resultContainerRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null);
  const [searchKeywords, setSearchKeywords] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const dataLoadingRef = useRef<boolean>(false);

  const debugRecordDataLimit = xl ? 12 : 10;
  const getKey = (
    pageIndex: number,
    previousPageData: HitTestingRecordsResponse,
    datasetId: string,
    keywords?: string
  ) => {
    if (pageIndex === 0 || (previousPageData.data.length)) {
      const params = {
        limit: debugRecordDataLimit,
        page: pageIndex + 1,
        source_type: 'sandbox',
        keywords: keywords ? keywords : ''
      };

      return {
        datasetId,
        params,
      };
    } else return null;
  };

  const {
    data: debugRecordData,
    isLoading: debugRecordIsLoading,
    setSize,
    error,
    mutate: debugRecordMutate,
  } = useSWRInfinite(
    (pageIndex: number, previousPageData: HitTestingRecordsResponse) =>
    {
      if (dataset_id)
        return getKey(pageIndex, previousPageData, dataset_id, searchKeywords)
      else
        return null
    },
    fetchTestingRecords
  );

  useEffect(() => {
    dataLoadingRef.current = debugRecordIsLoading
  }, [debugRecordIsLoading])

  const handleScroll = useCallback(debounce(() => {
    if (!dataLoadingRef.current) {
      const {scrollTop, clientHeight} = resultContainerRef.current!
      const anchorOffset = anchorRef.current!.offsetTop
      const fetchDistance = anchorOffset - scrollTop - clientHeight
      if (fetchDistance < 100) {
        setSize((size) => size+1)
      }
    }
  }, 30), [setSize])

  useEffect(() => {
    const container = resultContainerRef.current
    if (container) {
      container.addEventListener('scroll',handleScroll)
      return () => container.removeEventListener('scroll',handleScroll)
    }
    else {
      return 
    }
  }, [handleScroll])

  useEffect(() => {
    if (debugRecordMutate) {
      setTriggerMutate(() => () => {
        debugRecordMutate();
      })
    }
  }, [debugRecordMutate])

  const {run: handleSearchQuery} = useDebounceFn(() => {
    setSearchKeywords(search)
  }, {wait:500})

  const handleSearchQueryUpdate = (value:string) => {
    setSearch(value)
    handleSearchQuery()
  }

  return (
    <div className="flex flex-col flex-1 h-full py-2 px-3">
      <div className="flex flex-col justify-center mb-4">
        <h1 className="text-base font-semibold text-text-primary">
          {t("datasetSandbox.title")}
        </h1>
        <p className="mt-0.5 text-[13px] leading-4 font-normal text-text-tertiary">
          {t("datasetSandbox.desc")}
        </p>
      </div>
      <div className="flex flex-1 flex-col pt-2 min-h-0">
        <div className="flex flex-col mb-4 space-y-2">
          <h1 className="text-base font-semibold text-text-primary">
            {t("datasetSandbox.debugHistory.title")}
          </h1>
          <div className="flex items-center justify-between flex-wrap">
            <SearchInput
              placeholder={t('datasetSandbox.debugHistory.placeholder')??""}
              showClearIcon={false}
              value={searchKeywords}
              onChange={handleSearchQueryUpdate}
              white={true}
              className="w-full flex-row-reverse"
            ></SearchInput>
          </div>
          {/* <p className='system-sm-regular text-text-tertiary'>{t('datasetSandbox.debugHistory.desc')}</p> */}
        </div>

        <div ref={resultContainerRef} className="relative flex flex-col overflow-y-auto rounded-lg grow">

        {!sandboxKnowledgeIdInitialized ? 
        // If dataset_id is not initialized, show AdminHelp 
        (
          <div className="flex-1 flex w-full grow justify-center items-center bg-gray-50 rounded-lg border border-gray-200">
            <AdminHelp
              title={t('common.help.adminHelp.title')}
              desc={t('common.help.adminHelp.desc')}
              wrapperClassname="max-w-[80%]"
            ></AdminHelp>
          </div>
        ) : 
        // If dataset_id is initialized

        // check if the useSWRInfinite is still fetching data, show loading icon
        debugRecordIsLoading ? (
          <div className="flex grow justify-center items-center">
            <Loading></Loading>
          </div>
        ) : 
        // useSWRInfinite finished fetching data and data is Empty (no data returned)
        debugRecordData?.[0]?.data?.length == 0 ? (
          <div className="flex flex-1 justify-center items-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex h-full flex-col space-y-3 justify-center items-center">
              <LightEmptyFolder className="max-h-32 max-w-32"></LightEmptyFolder>
              <p className="system-md-semibold text-text-secondary">
                {searchKeywords
                  ? t("datasetSandbox.debugHistory.noResult")
                  : t("datasetSandbox.debugHistory.emptyResult")}
              </p>
              <p className="system-xs-regular text-text-tertiary text-center">
                {searchKeywords
                  ? t("datasetSandbox.debugHistory.noResultDesc")
                  : t("datasetSandbox.debugHistory.emptyResultDesc")}
              </p>
            </div>
          </div>
        ) : 
        // useSWRInfinite finished fetching data and data is Not Empty (show table)
        (
          <div>
            <table
              className={
                "w-full border-collapse border-0 text-[13px] leading-4 text-text-secondary "
              }
            >
              <thead className="sticky top-0 h-7 leading-7  text-xs text-text-tertiary font-medium uppercase">
                <tr>
                  <td className="pl-3 w-10 rounded-l-lg bg-background-section-burn">
                    #
                  </td>
                  <td className="bg-background-section-burn">
                    {t("datasetHitTesting.table.header.text")}
                  </td>
                  <td className="pl-2 w-44 rounded-r-lg bg-background-section-burn">
                    {t("datasetHitTesting.table.header.time")}
                  </td>
                </tr>
              </thead>
              <tbody>
                {debugRecordData?.map(
                  ({ data: HitTestingRecord, limit }, pageIndex) =>
                    HitTestingRecord.map((hitTesting, recordIndex) => {
                      const globalIndex = pageIndex * limit + recordIndex + 1;
                      return (
                        <tr
                          key={hitTesting.id}
                          onClick={() => handleUpdateQuery(hitTesting.content)}
                          className="group border-b border-divider-subtle h-10 xl:h-14 hover:bg-background-default-hover cursor-pointer"
                        >
                          <td className="py-2 px-2">
                            <p className="system-sm-regular text-text-tertiary">
                              {globalIndex}
                            </p>
                          </td>
                          <td className="py-2 px-0.5 group">
                            <HistoryPreviewTooltip
                              query={hitTesting.content}
                              answer={hitTesting.answer}
                            >
                              <div className="flex flex-col space-y-1">
                                <span>
                                  {hitTesting.content
                                    .split(
                                      new RegExp(`(${searchKeywords})`, "gi")
                                    )
                                    .map((words, index) => (
                                      <span
                                        key={index}
                                        className={`${
                                          searchKeywords &&
                                          words
                                            .toLowerCase()
                                            .includes(
                                              searchKeywords.toLowerCase()
                                            )
                                            ? "system-sm-semibold text-text-primary"
                                            : "system-sm-regular"
                                        }`}
                                      >
                                        {words}
                                      </span>
                                    ))}
                                </span>
                                <p className="system-xs-regular text-text-tertiary line-clamp-2">
                                  {hitTesting.answer}
                                </p>
                              </div>
                            </HistoryPreviewTooltip>
                          </td>
                          <td className="py-2 px-2">
                            <p className="system-sm-regular text-text-secondary">
                              {formatTime(
                                hitTesting.created_at,
                                t("datasetHitTesting.dateTimeFormat") as string
                              )}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
            <div ref={anchorRef} className="h-2"></div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SandboxDebugPanel);
