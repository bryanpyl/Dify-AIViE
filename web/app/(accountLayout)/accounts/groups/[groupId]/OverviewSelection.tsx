import React, { useEffect, useState } from "react";

import {
  RiArrowDropRightLine
} from "@remixicon/react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

export enum GroupOverviewOptions {
  knowledge = "Knowledge",
  member = "Member",
  application = "Application",
}

interface OverviewSelectionProps {
  type: GroupOverviewOptions;
  count?: number;
  onClick?: (value: boolean) => void;
  last?: boolean;
}

const OverviewSelection: React.FC<OverviewSelectionProps> = ({
  type,
  count,
  onClick,
  last
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [overviewDetail, setOverviewDetail] = useState<{
    title: string;
    subtitle: string;
  }>({title: "", subtitle: ""});

  useEffect(() => {
    if (type === GroupOverviewOptions.knowledge) {
      setOverviewDetail({
        title: t("accountGroup.groupBindingsOverview.knowledgeBase.title"),
        subtitle: t(
          "accountGroup.groupBindingsOverview.knowledgeBase.subtitle"
        ),
      });
    } else if (type === GroupOverviewOptions.member) {
      setOverviewDetail({
        title: t("accountGroup.groupBindingsOverview.groupMember.title"),
        subtitle: t(
          "accountGroup.groupBindingsOverview.groupMember.subtitle"
        ),
      });
    }
    else{
      setOverviewDetail({
        title: t("accountGroup.groupBindingsOverview.linkedApplication.title"),
        subtitle: t(
          "accountGroup.groupBindingsOverview.linkedApplication.subtitle"
        ),
      });
    }
  }, [type]);

  return (
    <div
      onClick={() => {
        if (type!==GroupOverviewOptions.member&&onClick) onClick(true)
        else router.push('/accounts/members')
      }
    }
      className={`flex flex-row justify-between items-center ${last?"":"border-b border-gray-100"} rounded-lg px-3 py-4 hover:cursor-pointer hover:bg-gray-50`}
    >
      <div className="flex flex-col space-y-1 min-w-0">
        <h5 className="flex items-center system-md-semibold text-text-primary gap-2">
        {overviewDetail!.title}
          <span className="system-2xs-semibold-uppercase bg-blue-50 text-[#444CE7] rounded-md px-2 py-auto">
            {count}
          </span>
        </h5>
        <p className="text-text-tertiary system-xs-regular">
        {overviewDetail!.subtitle}
        </p>
      </div>
      <RiArrowDropRightLine
        className={`w-8 h-8 text-text-accent`}
      />
    </div>
  );
};

export default React.memo(OverviewSelection);
