import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/app/components/base/modal";
import useSWR from "swr";
import type { DataSetListResponse } from "@/models/datasets";
import { fetchDatasets } from "@/service/datasets";
import { fetchTargetIdByGroup, updateGroupBindings } from "@/service/account";
import SelectionCard, {SelectionVariant} from "./SelectionCard";
import Input from "@/app/components/base/input";
import { useDebounceFn } from "ahooks";
import Pagination from "@/app/components/base/pagination";
import Button from "@/app/components/base/button";
import { Dataset } from "@/app/components/base/prompt-editor/plugins/context-block";
import { useContext } from "use-context-selector";
import { ToastContext } from "@/app/components/base/toast";
import { useAppContext } from "@/context/app-context";
import { current } from "immer";
import { useTranslation } from "react-i18next";
import CustomPagination from "@/app/components/base/custom-pagination";
import { useRouter } from "next/navigation";
import { usePermissionCheck } from "@/context/permission-context";

interface KnowledgeSelectionModalProps {
  disabled?:boolean,
  currentGroupId: string,
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  onSuccess:()=>void;
}

const KnowledgeSelectionModal: React.FC<KnowledgeSelectionModalProps> = ({
  disabled=false,
  currentGroupId,
  showModal,
  setShowModal,
  onSuccess
}) => {
  const { t } = useTranslation()
  const router = useRouter();
  const { permissions, isSystemRole } = usePermissionCheck()
  const { notify } = useContext(ToastContext)
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterGroupId, setFilterGroupId] = useState('');
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);

  useEffect(() => {
    if (!isSystemRole) {
      setFilterGroupId(currentGroupId)
    }
  }, [isSystemRole, currentGroupId])

  const [currentPage, setCurrentPage] = useState(1);
  const limitData = isSystemRole ? 10 : 6;
  const [assignedKnowledgeIds, setAssignedKnowledgeIds] = useState<string[]>([]);

  // Fetch data with SWR
  const { data, isLoading } = useSWR(
    {
      url: "datasets",
      params: {
        page: currentPage,
        limit: limitData,
        keyword: searchKeyword || undefined,
        group_id: isSystemRole ? undefined : currentGroupId
      },
    },
    fetchDatasets
  );

  const datasets = data?.data || [];

  // Error: maximum update depth exceeded
  // useEffect(()=>{
  //   setSelectedKnowledge((prev)=>{
  //     const newSelection = datasets?.filter((data)=>data.is_selected).map((data)=>data.id)||[];
  //     return Array.from(new Set([...prev,...newSelection]))
  //   });
  // },[datasets]);

  useEffect(() => {
    if (!datasets?.length) return;

    // For safety: auto-check datasets that are assigned
    setSelectedKnowledge((prev) => {
      const autoChecked = datasets
        .filter((d) => assignedKnowledgeIds.includes(d.id))
        .map((d) => d.id);

      const merged = Array.from(new Set([...prev, ...autoChecked]));
      return merged;
    });
  }, [datasets, assignedKnowledgeIds]);

  
  const datasetsCount = data?.total ?? 0;

  const handleResetStates=()=>{
    setSearchKeyword('')
    setFilterGroupId('')
    setSelectedKnowledge([])
    setCurrentPage(1)
  }

  // Extract dataset items
  const hasNextPage = data?.has_more; // Check if there is a next page

  const { run: debouncedSetSearchKeyword } = useDebounceFn((value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1)
  });

  const handleKeywordsChange = (value: string) => {
    debouncedSetSearchKeyword(value);
  };

  const handleSelection = (id:string)=>{
    setSelectedKnowledge((prev)=>
      prev.includes(id)?prev.filter((item)=>item!==id):[...prev,id])
  };

  const handlePageChange = (newPage:number)=>{
    setCurrentPage(newPage)
  }

  const onUpdate = useCallback(async()=>{
    try{
      await updateGroupBindings({
        group_id: currentGroupId,
        target_id: selectedKnowledge,
        type: "knowledge"
      })
      notify({ type: "success", message: "Knowledge base updated successfully" });
      handleResetStates();
      setShowModal(false);
    }
    catch(e){
      notify({type:"error",message:"Failed to update knowledge."})
    }
  }, [selectedKnowledge])

  const handleUpdateKnowledge = async ()=>{
    await onUpdate();
    onSuccess();
  }

  return (
    <Modal
      title={isSystemRole ? t('accountGroup.groupBindingsOverview.knowledgeBase.knowledgeSelection.titleSuperadmin') : t('accountGroup.groupBindingsOverview.knowledgeBase.knowledgeSelection.titleNonSuperadmin')}
      description={isSystemRole ? t('accountGroup.groupBindingsOverview.knowledgeBase.knowledgeSelection.subtitleSuperadmin') : t('accountGroup.groupBindingsOverview.knowledgeBase.knowledgeSelection.subtitleNonSuperadmin')}
      groupModalUse
      groupClassName= "xl:min-h-[80vh] 2xl:min-h-[50vh] h-[50vh]"
      closable
      isShow={showModal}
      onClose={() => setShowModal(false)}
    >
      <div className="flex flex-col h-full p-5 gap-y-3 ">
        {/* Search Input */}
        <div className='flex flex-row justify-between'>
          <Input
            showLeftIcon
            placeholder={t('accountGroup.groupBindingsOverview.knowledgeBase.knowledgeSelection.searchPlaceholder') || ''}
            wrapperClassName="w-[250px] mr-0"
            onChange={(e) => {
              handleKeywordsChange(e.target.value);
            }}
          ></Input>

          {/* Pagination Controls */}
          { datasetsCount > limitData && (
            <CustomPagination
              onPageChange={handlePageChange}
              limitPerPage={limitData}
              totalData={datasetsCount}
              currentPage={currentPage}
            />
          )}
        </div>

        {/* List of Knowledge Base Items */}
        <div className='grow overflow-y-auto'>
          <div className={`${isSystemRole ? "grid grid-cols-2 gap-4":"grid grid-cols-2 gap-4"}`}>
            {datasets?.map((data, index) => {
              return (
                <SelectionCard
                  disabled={disabled}
                  variant={isSystemRole ? SelectionVariant.Dataset:SelectionVariant.DatasetRead}
                  selected={selectedKnowledge.includes(data.id)}
                  key={data.id}
                  data={data}
                  readOnly={!permissions.knowledgeDocumentManagement.view}
                  onClick={() => {
                    if (permissions.groupManagement.edit && isSystemRole){
                      handleSelection(data.id)
                    } else {
                      if (permissions.knowledgeDocumentManagement.view){
                        window.open(`/datasets/${data.id}/documents`, '_blank');
                      }
                    }
                  }}
                ></SelectionCard>
              );
            })}
          </div>
        </div>

        {isSystemRole && <div className="flex flex-row gap-2 justify-between items-center">
          <span className="system-2xs-semibold-uppercase text-text-accent">
            {selectedKnowledge.length}{' '}{selectedKnowledge.length<=1?t('accountGroup.groupBindingsOverview.knowledgeBase.knowledgeSelection.lessThanOneSelectedPrompt'):t('accountGroup.groupBindingsOverview.knowledgeBase.knowledgeSelection.moreThanOneSelectedPrompt')}
          </span>
          <div className='flex flex-row space-x-2'>
            <Button onClick={() => setShowModal(false)}>{t('common.operation.cancel')}</Button>
            <Button
              disabled={selectedKnowledge.length==0||disabled}
              variant="primary"
              onClick={handleUpdateKnowledge}
            >
              {t('common.operation.saveChanges')}
            </Button>
          </div>
        </div>}
      </div>
    </Modal>
  );
};

export default React.memo(KnowledgeSelectionModal);
