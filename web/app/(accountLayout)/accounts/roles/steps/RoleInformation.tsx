import Button from "@/app/components/base/button";
import Input from "@/app/components/base/input";
import Textarea from "@/app/components/base/textarea";
import React from "react";
import { useTranslation } from "react-i18next";
import { fetchGroupDetail } from "@/service/account";
import useSWR from "swr";
import { UserCommunityLine } from "@/app/components/base/icons/src/vender/line/accountManagement";
import { group } from "console";

export enum Action {
  add = "Add",
  edit = "Edit",
}

interface RoleInformationProps {
  action: Action;
  groupId?:string;
  roleName: string;
  setRoleName: (value: string) => void;
  roleDesc: string;
  setRoleDesc: (value: string) => void;
  isSuperadmin?: boolean;
  wrapperClassName?: string;
}

const RoleInformation: React.FC<RoleInformationProps> = ({
  action,
  groupId,
  roleName,
  setRoleName,
  roleDesc,
  setRoleDesc,
  isSuperadmin,
  wrapperClassName,
}) => {
  const { t } = useTranslation();
  const {data:groupDetail, isLoading:groupDetailLoading} = useSWR(
    {id:groupId||null}, fetchGroupDetail
  )
  return (
    <div className={`grow flex flex-col w-full space-y-8 mt-0 h-auto overflow-y-scroll ${wrapperClassName}`}>
      <div className="flex flex-col flex-shrink-0">
        <div className="flex flex-col mb-3 gap-1">
          <label className="system-sm-semibold">
            {t("accountRole.operation.fields.roleName.title")}
          </label>
          <span className="system-xs-regular text-text-tertiary">
            {t("accountRole.operation.fields.roleName.subtitle")}
          </span>
        </div>
        <Input
          value={roleName}
          onChange={(e) => {
            setRoleName(e.target.value);
          }}
          placeholder={t("accountRole.operation.fields.roleName.placeholder") || ""}
        />
      </div>

      <div className="flex flex-col flex-shrink-0">
        <div className="flex flex-col mb-3 gap-1">
          <label className="system-sm-semibold">
            {t("accountRole.operation.fields.roleDesc.title")}
          </label>
          <span className="system-xs-regular text-text-tertiary">
            {t("accountRole.operation.fields.roleDesc.subtitle")}
          </span>
        </div>
        <Textarea
          className="resize-none"
          placeholder={t("accountRole.operation.fields.roleDesc.placeholder") || ""}
          value={roleDesc}
          onChange={(e) => setRoleDesc(e.target.value)}
        />
      </div>

      {isSuperadmin && action === Action.edit && (
        <div className="flex flex-col flex-grow ">
          <div className="flex flex-col mb-3 gap-1">
            <label className="system-sm-semibold">
              {t("accountRole.operation.fields.groupDetail.title")}
            </label>
            <span className="system-xs-regular text-text-tertiary">
              {t("accountRole.operation.fields.groupDetail.subtitle")}
            </span>
          </div>
          <div className='flex flex-row w-full items-center justify-between gap-2 rounded-lg px-4 py-6 border border-gray-200 bg-gray-50'>
            <div className='flex items-center gap-2'>
              <div className="flex flex-shrink-0 items-center justify-center p-3 bg-blue-50 rounded-md h-fit">
                <UserCommunityLine className="w-4 h-4 text-text-accent" />
              </div>

              <div className='flex flex-col justify-stretch'>
                <h6 className='system-sm-semibold'>{groupDetail?.name}</h6>
                <span className='system-2xs-regular-uppercase text-text-tertiary'>{groupDetail?.agency_name}</span>
              </div>
            </div>

            <div className='system-sm-semibold text-text-primary
             p-2 rounded-lg flex-row flex gap-2 
             hover:text-text-accent hover:bg-white hover:border 
             hover:border-gray-100 hover:inset-shadow-sm hover:cursor-pointer
             transition-all duration-150 ease-in-out' 
             onClick={()=>{
              window.open(`groups/${groupDetail?.id}`,'_blank','noopener,noreferrer')
             }}>
              View Group
            </div>
            


          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RoleInformation);
