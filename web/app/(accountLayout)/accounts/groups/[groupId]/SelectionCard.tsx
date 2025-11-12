import React, { useState } from "react";
import { DataSet } from "@/models/datasets";
import { App } from "@/types/app";
import Checkbox from "@/app/components/base/checkbox";
import AppIcon from "@/app/components/base/app-icon";
import { permission } from "@/models/account";
import { useTranslation } from "react-i18next";
import {
  RiArrowDropRightLine,
} from "@remixicon/react";

export enum SelectionVariant {
  Dataset = "Dataset",
  DatasetRead = "DatasetRead",
  App = "App",
  Permission = "Permission",
}

interface SelectionCardProps {
  variant: SelectionVariant;
  data: DataSet | App | permission;
  selected?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onClick: () => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  variant,
  data,
  selected,
  disabled = false,
  readOnly = false,
  onClick,
}) => {
  const { t } = useTranslation();
  if (
    variant === SelectionVariant.Dataset ||
    variant === SelectionVariant.Permission
  ) {
    return (
      <div
        className={`py-2 px-3 border-[0.5px] transition-all duration-300ms ease-in-out
                ${disabled ? "hover:cursor-default" : "hover:cursor-pointer"}
                ${
                  selected
                    ? disabled
                      ? "bg-gray-100 border-gray-300"
                      : "bg-blue-50 border-primary-500"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }
             rounded-lg`}
        onClick={disabled ? undefined : onClick}
      >
        <div className="flex flex-row gap-2 items-center justify-between">
          <p
            className={`system-sm-semibold ${
              disabled ? "text-text-tertiary" : "text-text-primary"
            }`}
          >
            {data.name}
          </p>
          <Checkbox checked={selected}></Checkbox>
        </div>
      </div>
    );
  } else if (variant === SelectionVariant.App) {
    const appData = data as App;
    return (
      <div
        className={`h-14 max-w-full w-full overflow-hidden py-2 px-3 ${disabled?'hover:cursor-not-allowed':'hover:cursor-pointer'}  border-[0.5px] ${
          selected
            ? "bg-blue-50 border-primary-500"
            : "bg-white border-gray-300"
        } rounded-lg`}
        onClick={onClick}
      >
        <div className="flex flex-row gap-2 items-center justify-between w-full">
          <div className="flex flex-row gap-2 items-center w-full min-w-0">
            <AppIcon
              size="tiny"
              iconType={appData.icon_type}
              icon={appData.icon}
              background={appData.icon_background}
              imageUrl={appData.icon_url}
            />
            <div className="flex flex-col gap-y-1 w-full min-w-0">
              <p className="system-sm-semibold text-text-primary">
                {appData.name}
              </p>
              <p className="system-xs-regular text-text-tertiary whitespace-nowrap overflow-hidden text-ellipsis w-full min-w-0">
                {appData.description
                  ? appData.description
                  : t(
                      "accountGroup.groupBindingsOverview.linkedApplication.applicationSelection.invalidApplicationDescription"
                    )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (variant === SelectionVariant.DatasetRead) {
    const dataset = data as DataSet;
    return (
      <div
        className={`group h-20 max-w-full w-full overflow-hidden py-3 px-4 hover:cursor-pointer border-[0.5px] hover:bg-gray-50 hover:border-gray-300 rounded-lg`}
        onClick={onClick}
      >
        <div className="flex flex-row gap-2 items-center justify-between w-full">
          <div className="flex flex-row gap-2 items-start w-full min-w-0">
            <div className="flex flex-col gap-y-1 w-full min-w-0">
              <div className='flex flex-row justify-between items-center'>
                <p className="system-xs-semibold text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                    {dataset.name}
                </p>
                <div className='shrink-0 flex flex-row space-x-1 items-center'>
                    {
                      !readOnly && (
                        <span className='system-2xs-semibold-uppercase text-text-accent hidden group-hover:inline transition-all duration-200'>
                          {t('accountGroup.groupBindingsOverview.knowledgeBase.knowledgeSelection.viewKnowledge')}
                        </span>
                      )
                    }
                  <RiArrowDropRightLine className='w-5 h-5 system-2xs-semibold-uppercase text-text-accent'></RiArrowDropRightLine>
                </div>
              </div>
              <p className="text-[11px] font-normal text-text-tertiary w-full min-w-0 overflow-hidden text-ellipsis line-clamp-2">
                {dataset.description
                  ? dataset.description
                  : t(
                      "accountGroup.groupBindingsOverview.linkedApplication.applicationSelection.invalidApplicationDescription"
                    )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default React.memo(SelectionCard);
