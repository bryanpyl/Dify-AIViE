import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/app/components/base/modal";
import useSWR from "swr";
import { fetchAppList } from "@/service/apps";
import type { DataSetListResponse } from "@/models/datasets";
import { fetchTargetIdByGroup, updateGroupBindings } from "@/service/account";
import SelectionCard, { SelectionVariant } from "./SelectionCard";
import Input from "@/app/components/base/input";
import { useDebounceFn } from "ahooks";
import Pagination from "@/app/components/base/pagination";
import Button from "@/app/components/base/button";
import { Dataset } from "@/app/components/base/prompt-editor/plugins/context-block";
import { useContext } from "use-context-selector";
import { ToastContext } from "@/app/components/base/toast";
import { useTranslation } from "react-i18next";
import CustomPagination from "@/app/components/base/custom-pagination";

interface AppSelectionModalProps {
  disabled?:boolean,
  currentGroupId: string;
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  onSuccess: () => void;
}

const AppSelectionModal: React.FC<AppSelectionModalProps> = ({
  disabled=false,
  currentGroupId,
  showModal,
  setShowModal,
  onSuccess,
}) => {
  const { notify } = useContext(ToastContext);
  const { t } = useTranslation();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState("");
  const limitData = 5;
  const {
    data,
    isLoading,
    mutate: mutateApps,
  } = useSWR(
    {
      url: "/apps",
      params: { page: currentPage, limit: limitData, name: searchKeyword },
    },
    fetchAppList
  );

  const { data: selectedApplication, mutate: mutateSelectedApplication } =
    useSWR(
      {
        params: {
          group_id: currentGroupId,
          type: "app",
        },
      },
      fetchTargetIdByGroup
    );
  // const selectedApplicationId = selectedApplication?.[0]
  useEffect(() => {
    if (selectedApplication) {
      setSelectedApp(selectedApplication?.[0]);
    }
  }, [selectedApplication]);

  const appList = data?.data || [];
  const appsTotal = data?.total||0;

  const { run: debouncedSetSearchKeyword } = useDebounceFn((value: string) => {
    setSearchKeyword(value);
  });
  const handleKeywordsChange = (value: string) => {
    debouncedSetSearchKeyword(value);
  };

  const handleSelection = (appId: string) => {
    setSelectedApp(appId);
  };

  const onUpdate = useCallback(async () => {
    try {
      await updateGroupBindings({
        group_id: currentGroupId,
        target_id: [selectedApp],
        type: "app",
      });
      notify({
        type: "success",
        message: "Application has been linked successfully",
      });
      setShowModal(false);
    } catch (e) {
      notify({ type: "error", message: "Failed to link application." });
    }
  }, [selectedApp]);

  const handleUpdateApplication = async () => {
    await onUpdate();
    onSuccess();
    mutateSelectedApplication();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <Modal
      title={t(
        "accountGroup.groupBindingsOverview.linkedApplication.applicationSelection.title"
      )}
      description={t(
        "accountGroup.groupBindingsOverview.linkedApplication.applicationSelection.subtitle"
      )}
      groupModalUse
      groupClassName="h:[80vh] 2xl:max-h-[80vh]"
      closable
      isShow={showModal}
      onClose={() => setShowModal(false)}
    >
      <div className="grow flex flex-col p-5 space-y-2">
        {/* Search Input */}
        <div className="flex flex-row justify-between">
          {/* <p className='system-sm-medium text-text-tertiary'><span className='system-sm-semibold'><span>unknown</span>/{appsTotal}</span> knowledge is selected</p> */}
          <Input
            showLeftIcon
            placeholder={t(
              "accountGroup.groupBindingsOverview.linkedApplication.applicationSelection.searchPlaceholder"
            )}
            wrapperClassName="w-[200px] mr-0"
            onChange={(e) => {
              handleKeywordsChange(e.target.value);
            }}
          ></Input>

          {/* Pagination Controls */}
          {appsTotal > limitData && (
            <CustomPagination
              onPageChange={handlePageChange}
              limitPerPage={limitData}
              totalData={appsTotal}
              currentPage={currentPage}
            ></CustomPagination>
          )}
        </div>

        {/* List of Applications Items */}
        <div className="grow flex flex-col gap-y-3">
          {appList?.map((data, index) => {
            return (
              <SelectionCard
                disabled={disabled}
                variant={SelectionVariant.App}
                selected={selectedApp === data.id}
                key={data.id}
                data={data}
                onClick={() => {
                  if (!disabled){
                    handleSelection(data.id);
                  }
                }}
              ></SelectionCard>
              // <div key={data.id}>{data.name}</div>
            );
          })}
        </div>

        {/* Pagination Controls
        <Pagination
          current={currentPage - 1}
          onChange={(cur) => setCurrentPage(cur + 1)}
          total={appsTotal || 0}
          limit={limitData || 10}
          // onLimitChange={limit => setLimit(limit)}
          className="px-3"
          forGroupBindingPopUpModal = {true}
        /> */}
        <div className="flex flex-row gap-2 justify-end">
          <Button onClick={() => setShowModal(false)}>
            {t("common.operation.cancel")}
          </Button>
          <Button
            // disabled={!groupName || !agencyName}
            disabled={disabled}
            variant="primary"
            onClick={handleUpdateApplication}
          >
            {t("common.operation.saveChanges")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(AppSelectionModal);
