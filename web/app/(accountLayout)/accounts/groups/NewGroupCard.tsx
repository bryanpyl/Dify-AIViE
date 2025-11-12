"use client";

import React, { useCallback, useState } from "react";
import { RiAddLine } from "@remixicon/react";
import Modal from "@/app/components/base/modal";
import Input from "@/app/components/base/input";
import Textarea from "@/app/components/base/textarea";
import Button from "@/app/components/base/button";
import { useContext } from "use-context-selector";
import { ToastContext } from "@/app/components/base/toast";
import { AddNewGroup } from "@/service/account";
import { useTranslation } from "react-i18next";

export type newGroupCardProp = {
  onSuccess: ()=>void
}

const newGroupCard:React.FC<newGroupCardProp> = ({onSuccess}) => {
  const {t} = useTranslation()
  const { notify } = useContext(ToastContext);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const onCreate = useCallback(async () => {
    if (!groupName.trim()) {
      notify({ type: "error", message: `Group name is not provided.` });
      return;
    }
    if (!agencyName.trim()) {
      notify({ type: "error", message: "Agency name is not provided." });
      return;
    }
    if (!groupDescription.trim()) {
      notify({ type: "error", message: "Group description is not provided." });
      return;
    }
    try {
      const newGroup = await AddNewGroup({
        name: groupName,
        agency_name: agencyName,
        description: groupDescription,
      });
      notify({ type: "success", message: "Group added successfully" });
    } catch (e) {
      notify({ type: "error", message: "Error occurred. Try again later." });
    }
  }, [groupName, agencyName, groupDescription]);

  return (
    <div
      className="relative hover:cursor-pointer col-span-1 inline-flex flex-col gap-2 justify-around h-[160px] bg-components-card-bg rounded-xl border-[0.5px] border-components-card-border py-5 px-5"
      onClick={() => setShowCreateGroupModal(true)}
    >
      <div className="flex flex-row min-w-0 gap-2">
        <div className="flex flex-shrink-0 items-center justify-center p-3 bg-blue-50 rounded-md h-fit">
          <RiAddLine className="w-4 h-4 text-text-accent" />
        </div>
        <div className="flex flex-col w-full min-w-0 justify-center">
          <h2 className="system-sm-semibold text-text-secondary truncate w-full overflow-hidden whitespace-nowrap">
            {t('accountGroup.overview.create.title')}
          </h2>
        </div>
      </div>

      <div className="min-w-0">
        <p className="system-xs-regular text-balance truncate w-full overflow-hidden whitespace-nowrap text-text-tertiary">
          {t('accountGroup.overview.create.subtitle')}
        </p>
      </div>

      <Modal
        title="Add New Group"
        groupModalUse
        closable
        isShow={showCreateGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
        }}
      >
        <div className="flex justify-start items-center flex-col h-full w-full overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col w-full py-4 space-y-8">
            <div className="flex flex-col flex-shrink-0">
              <div className="flex flex-col mb-3 gap-1">
                <label className="system-sm-semibold">{t('accountGroup.fields.groupName.title')}</label>
                <span className="system-xs-regular text-text-tertiary">
                  {t('accountGroup.fields.groupName.subtitle')}
                </span>
              </div>
              <Input
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                }}
                placeholder={t('accountGroup.fields.groupName.placeholder')}
              />
            </div>

            <div className="flex flex-col flex-shrink-0">
              <div className="flex flex-col mb-3 gap-1">
                <label className="system-sm-semibold">{t('accountGroup.fields.agencyName.title')}</label>
                <span className="system-xs-regular text-text-tertiary">
                  {t('accountGroup.fields.agencyName.subtitle')}
                </span>
              </div>
              <Input
                value={agencyName}
                onChange={(e) => {
                  setAgencyName(e.target.value);
                }}
                placeholder={t('accountGroup.fields.agencyName.placeholder')}
              />
            </div>

            <div className="flex flex-col flex-shrink-0">
              <div className="flex flex-col mb-3 gap-1">
                <label className="system-sm-semibold">{t('accountGroup.fields.groupDesc.title')}</label>
                <span className="system-xs-regular text-text-tertiary">
                  {t('accountGroup.fields.groupDesc.subtitle')}
                </span>
              </div>
              <Textarea
                className="resize-none"
                placeholder={t('accountGroup.fields.groupDesc.placeholder')}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-row gap-2 justify-end">
              <Button onClick={() => setShowCreateGroupModal(false)}>
                {t('accountGroup.overview.create.operation.cancel')}
              </Button>
              <Button
                disabled={!groupName || !agencyName}
                variant="primary"
                onClick={async() => {
                  await onCreate();
                  onSuccess();
                  setGroupName('');
                  setAgencyName('');
                  setGroupDescription('');
                  setShowCreateGroupModal(false);
                }}
              >
                {t('accountGroup.overview.create.operation.create')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(newGroupCard);
