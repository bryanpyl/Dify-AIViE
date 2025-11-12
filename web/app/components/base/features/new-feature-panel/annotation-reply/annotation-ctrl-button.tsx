'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from "react";
import { useHover } from "ahooks";
import { useTranslation } from 'react-i18next'
import cn from "@/utils/classnames";
import {
  RiEditLine,
  RiFileEditLine,
} from '@remixicon/react'
import {
  MessageCheckRemove,
  MessageFastPlus,
} from "@/app/components/base/icons/src/vender/line/communication";
import ActionButton from '@/app/components/base/action-button'
import Tooltip from '@/app/components/base/tooltip'
import { addAnnotation, delAnnotation } from '@/service/annotation'
import Toast from '@/app/components/base/toast'
import { useProviderContext } from '@/context/provider-context'
import { useModalContext } from '@/context/modal-context'
import { MessageFast } from "@/app/components/base/icons/src/vender/solid/communication";
import { Edit04 } from "@/app/components/base/icons/src/vender/line/general";
import RemoveAnnotationConfirmModal from "@/app/components/app/annotation/remove-annotation-confirm-modal";
import { PermissionActionType } from "@/models/common";

type Props = {
  appId: string;
  messageId?: string
  annotationId?: string;
  className?: string;
  cached: boolean
  query: string;
  answer: string;
  onAdded: (annotationId: string, authorName: string) => void;
  onEdit: () => void;
  onRemoved: () => void;
  annotationPermission?: PermissionActionType;
}

const AnnotationCtrlButton: FC<Props> = ({
  className,
  cached,
  query,
  answer,
  appId,
  messageId,
  annotationId,
  onAdded,
  onEdit,
  onRemoved,
  annotationPermission,
}) => {
  const { t } = useTranslation();
  const { plan, enableBilling } = useProviderContext();
  const isAnnotationFull = (enableBilling && plan.usage.annotatedResponse >= plan.total.annotatedResponse)
  const { setShowAnnotationFullModal } = useModalContext()
  const [showModal, setShowModal] = useState(false);
  const cachedBtnRef = useRef<HTMLDivElement>(null);
  const isCachedBtnHovering = useHover(cachedBtnRef);
  const [addAnnotationPermission, setAddAnnotationPermission] =
    useState<boolean>(false);
  const [editAnnotationPermission, setEditAnnotationPermission] =
    useState<boolean>(false);
    const [deleteAnnotationPermission, setDeleteAnnotationPermission] =
    useState<boolean>(false);
  useEffect(() => {
    if (annotationPermission) {
      setAddAnnotationPermission(annotationPermission.add!);
      setEditAnnotationPermission(annotationPermission.edit!);
      setDeleteAnnotationPermission(annotationPermission.delete!)
    }
  }, [annotationPermission]);
  const handleAdd = async () => {
    if (isAnnotationFull) {
      setShowAnnotationFullModal();
      return;
    }
    const res: any = await addAnnotation(appId, {
      message_id: messageId,
      question: query,
      answer,
    });
    Toast.notify({
      message: t('common.api.actionSuccess') as string,
      type: 'success',
    });
    onAdded(res.id, res.account?.name)
  };
  const handleRemove = async () => {
    await delAnnotation(appId, annotationId!);
    Toast.notify({
      message: t("common.api.actionSuccess") as string,
      type: "success",
    });
    onRemoved();
    setShowModal(false);
  };

  return (
    <div className={cn("inline-block", className)}>
      <div className="inline-flex p-0.5 space-x-0.5 rounded-lg bg-white border border-gray-100 shadow-md text-gray-500 cursor-pointer">
        {cached ? (
          <div>
            <div
              ref={cachedBtnRef}
              className={cn(
                (isCachedBtnHovering && deleteAnnotationPermission)
                  ? "bg-[#FEF3F2] text-[#D92D20]"
                  : "bg-[#EEF4FF] text-[#444CE7]",
                "flex p-1 space-x-1 items-center rounded-md leading-4 text-xs font-medium"
              )}
              onClick={() => {if (deleteAnnotationPermission)setShowModal(true)}}
            >
              {(isCachedBtnHovering && deleteAnnotationPermission) ? (
                <>
                <MessageCheckRemove className="w-4 h-4" />
                <div>{t("appDebug.feature.annotation.remove")}</div>
              </>
              ) : (
                <>
                <MessageFast className="w-4 h-4" />
                <div>{t("appDebug.feature.annotation.cached")}</div>
              </>
              )}
            </div>
          </div>
        ) : (answer && addAnnotationPermission) ? (
          <Tooltip popupContent={t("appDebug.feature.annotation.add")}>
            <div
              className="p-1 rounded-md hover:bg-[#EEF4FF] hover:text-[#444CE7] cursor-pointer"
              onClick={handleAdd}
            >
              <MessageFastPlus className="w-4 h-4" />
            </div>
          </Tooltip>
        ) : null}
        {editAnnotationPermission && (
          <Tooltip popupContent={t("appDebug.feature.annotation.edit")}>
            <div
              className="p-1 cursor-pointer rounded-md hover:bg-black/5"
              onClick={onEdit}
            >
              <Edit04 className="w-4 h-4" />
            </div>
          </Tooltip>
        )}
      </div>
      <RemoveAnnotationConfirmModal
        isShow={showModal}
        onHide={() => setShowModal(false)}
        onRemove={handleRemove}
      />
    </div>
  );
};
export default React.memo(AnnotationCtrlButton)
