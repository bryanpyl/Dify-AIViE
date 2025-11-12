"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useSandboxContext } from "@/context/sandbox-context";
import { useDatasetDetailContextWithSelector } from "@/context/dataset-detail";
import { useChat } from "@/app/components/base/chat/chat/hooks";
import Chat from "@/app/components/base/chat/chat";
import { ChatConfig, ChatItem, OnSend } from "@/app/components/base/chat/types";
import { getLastAnswer } from "@/app/components/base/chat/utils";
import { fetchConversationMessages } from "@/service/debug";
import { useTranslation } from "react-i18next";
import TooltipPlus from '@/app/components/base/tooltip'
import { RefreshCcw01 } from '@/app/components/base/icons/src/vender/line/arrows'
import ActionButton from "@/app/components/base/action-button";
import Loading from "@/app/components/base/loading";
import AdminHelp from "@/app/components/base/error-handling/AdminHelp";
const DebugSandbox = () => {
  const {t} = useTranslation()
  const { app_id, dataset_id, app_model_config, sandboxQueryContent, sandboxContextInitialized, sandboxContextInitializedError, sandboxKnowledgeIdInitialized, handleUpdateQuery, triggerMutate } =
    useSandboxContext();

  const sandboxChatConfig = useMemo(() => {
    if (!app_model_config) return;
    const { model, ...restConfig } = app_model_config;
    const chatConfig: ChatConfig = {
      ...restConfig,
      supportAnnotation: false,
      appId: app_id,
      supportFeedback: false,
      supportCitationHitInfo: true,
    };

    return chatConfig;
  }, [app_id, dataset_id, app_model_config]);

  const {
    chatList,
    setTargetMessageId,
    isResponding,
    handleSend,
    isResponseGenerated,
    suggestedQuestions,
    handleStop,
    handleRestart,
    handleAnnotationAdded,
    handleAnnotationEdited,
    handleAnnotationRemoved,
  } = useChat("", sandboxChatConfig);

  const doSend: OnSend = useCallback(
    (
      message,
      files,
      isRegenerate = false,
      parentAnswer: ChatItem | null = null
    ) => {
      const configData = {
          ...sandboxChatConfig, 
          model:app_model_config!.model
      }

      const data:any = {
          query:message, 
          inputs:[],
          model_config:configData, 
          parent_message_id: getLastAnswer(chatList)?.id 
      }

      handleSend(`apps/${app_id}/chat-messages`, data, 
          {
            onGetConversationMessages: (conversationId, getAbortController) => fetchConversationMessages(app_id, conversationId, getAbortController),
          },
      )
    },
    [app_id, app_model_config, sandboxChatConfig, dataset_id, handleSend]
  );

  useEffect(() => {
    if (isResponseGenerated) {
      triggerMutate?.();
      handleUpdateQuery('');
    }
  }, [isResponseGenerated]);

  return (
    <div className="flex flex-col flex-1 py-2 space-y-2">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-base font-semibold text-text-primary">
          {t("datasetSandbox.debugChat.title")}
        </h1>
        <TooltipPlus popupContent={t("common.operation.refresh")}>
          <ActionButton onClick={handleRestart}>
            <RefreshCcw01 className="w-4 h-4" />
          </ActionButton>
        </TooltipPlus>
      </div>
      <div className="flex flex-1 flex-col bg-background-body rounded-lg justify-center items-center overflow-hidden">
        <div className="w-full max-h-full overflow-auto flex-1 py-2 px-1">
          {sandboxContextInitializedError? (
            <div className='flex h-full grow justify-center'>
              <AdminHelp 
              title={t('common.help.adminHelp.title')} 
              desc={t('common.help.adminHelp.desc')}
              wrapperClassname="max-w-[80%]"
              >
              </AdminHelp>
            </div>
          ): (sandboxContextInitialized) ? (
            <Chat
              config={sandboxChatConfig}
              chatList={chatList}
              isResponding={isResponding}
              chatContainerClassName="px-3 pt-6"
              chatFooterBgClassName="'linear-gradient(0deg, transparent 40%, rgba(255, 255, 255, 0.00) 100%)'"
              chatFooterClassName="px-3 pt-10 pb-0"
              showFeatureBar={false}
              showFileUpload={false}
              // onFeatureBarClick={setShowAppConfigureFeaturesModal}
              suggestedQuestions={suggestedQuestions}
              onSend={doSend}
              switchSibling={(siblingMessageId) =>
                setTargetMessageId(siblingMessageId)
              }
              onStopResponding={handleStop}
              showPromptLog={false}
              onAnnotationEdited={handleAnnotationEdited}
              onAnnotationAdded={handleAnnotationAdded}
              onAnnotationRemoved={handleAnnotationRemoved}
              noSpacing
              prepopulatedQuery={sandboxQueryContent}
            />
          ) : (
            <div className="flex h-full justify-center items-center">
              <Loading></Loading>
            </div>
          )}
          {/* {sandboxContextInitialized ? (
            <Chat
              config={sandboxChatConfig}
              chatList={chatList}
              isResponding={isResponding}
              chatContainerClassName="px-3 pt-6"
              chatFooterBgClassName="'linear-gradient(0deg, transparent 40%, rgba(255, 255, 255, 0.00) 100%)'"
              chatFooterClassName="px-3 pt-10 pb-0"
              showFeatureBar={false}
              showFileUpload={false}
              // onFeatureBarClick={setShowAppConfigureFeaturesModal}
              suggestedQuestions={suggestedQuestions}
              onSend={doSend}
              switchSibling={(siblingMessageId) =>
                setTargetMessageId(siblingMessageId)
              }
              onStopResponding={handleStop}
              showPromptLog
              onAnnotationEdited={handleAnnotationEdited}
              onAnnotationAdded={handleAnnotationAdded}
              onAnnotationRemoved={handleAnnotationRemoved}
              noSpacing
              prepopulatedQuery={sandboxQueryContent}
            />
          ) : (
            <div className="flex h-full justify-center items-center">
              <Loading></Loading>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default React.memo(DebugSandbox);
