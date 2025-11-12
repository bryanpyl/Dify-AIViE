"use client";

import { useEffect, useState } from "react";
import type { FC, ReactNode } from "react";
import useSWR from "swr";
import { fetchAppDetail } from "@/service/apps";
import { fetchTargetIdBasedOnTagName } from "@/service/tag";
import {
  createContext,
  useContext,
  useContextSelector,
} from "use-context-selector";
import { ModelModeType, ModelConfig, RETRIEVE_TYPE, Resolution, TransferMethod } from "@/types/app";
import { PromptMode } from "@/models/debug";
import { RerankingModeEnum } from "@/models/datasets";
import { SupportUploadFileTypes } from "@/app/components/workflow/types";
import { WeightedScoreEnum } from '@/models/datasets'

const initialDataset = {
  retrieval_model: RETRIEVE_TYPE.oneWay,
  reranking_model: {
    reranking_provider_name: '',
    reranking_model_name: '',
  },
  top_k: 0,
  score_threshold_enabled: false,
  score_threshold: null,
  datasets: {
    datasets: [
      {
        dataset: {
          enabled: true,
          id: '',
        }
      }
    ]
  } as any,
  reranking_mode: RerankingModeEnum.RerankingModel,
  weights: {
    weight_type: WeightedScoreEnum.SemanticFirst,
    vector_setting: {
      vector_weight: 0,
      embedding_provider_name: '',
      embedding_model_name: '',
    },
    keyword_setting: {
      keyword_weight: 0,
    },
  },
  reranking_enable: false,
}
const initialModel = {
    provider: '',
    name: '',
    mode: ModelModeType.unset,
    completion_params: {
      max_tokens: 0,
      temperature: 0,
      top_p: 0,
      echo: false,
      stop: [],
      presence_penalty: 0,
      frequency_penalty: 0
    }
}
const initialModelConfig = {
  opening_statement: '',
  pre_prompt: '',
  prompt_type: PromptMode.simple,
  chat_prompt_config: {},
  completion_prompt_config: {},
  user_input_form: [],
  more_like_this: {
    enabled: false,
  },
  suggested_questions_after_answer: {
    enabled: false,
  },
  speech_to_text: {
    enabled: false
  },
  text_to_speech: {
    enabled: false,
  },
  retriever_resource: {
    enabled: false,
  },
  sensitive_word_avoidance: {
    enabled: false,
  },
  agent_mode: {
    enabled: false,
    tools: []
  },
  model: initialModel,
  dataset_configs: initialDataset,
  file_upload: {
    image: {
      enabled: false, 
      number_limits: 0,
      detail: Resolution.low, 
      transfer_methods: [TransferMethod.all], 
      image_file_size_limit: ''
    }, 
    allowed_file_upload_methods: [TransferMethod.all],
      allowed_file_types: [SupportUploadFileTypes.image, SupportUploadFileTypes.document],
      allowed_file_extensions: [''],
      max_length: 0,
      number_limits: 0
  }
}

export type SandboxContextValue = {
  app_id: string;
  app_model_config: ModelConfig | null;
  dataset_id: string;
  handleGetCurrentDatasetId: (datasetId: string) => void; 
  sandboxKnowledgeIdInitialized: boolean;
  sandboxContextInitialized: boolean;
  sandboxContextInitializedError: boolean;
  sandboxQueryContent: string; 
  handleUpdateQuery: (queryContent: string) => void;
  triggerMutate: () => void;
  setTriggerMutate: (fn: () => void) => void, 
};

const SandboxContext = createContext<SandboxContextValue>({
  app_id: "",
  app_model_config: initialModelConfig,
  dataset_id: "",
  handleGetCurrentDatasetId: () => {},
  sandboxKnowledgeIdInitialized: false,
  sandboxContextInitialized: false, 
  sandboxContextInitializedError: false,
  sandboxQueryContent: '',
  handleUpdateQuery: () => {},
  triggerMutate: () => {},
  setTriggerMutate: () => {}
});

const sandbox_tag = "sandbox";

const sandboxAppKey = (url: string, tags: string, subtype: string) => {
  if (tags && subtype) {
    const params: any = {
      url: url,
      params: {
        tag_name: tags,
        tag_subtype: subtype,
      },
    };
    return params;
  } else return null;
};

export type SandboxContextProviderProps = {
  children: ReactNode;
};

export const SandboxContextProvider: FC<SandboxContextProviderProps> = ({
  children,
}) => {
  const [sandboxAppId, setSandboxAppId] = useState<string>("");
  const [currentDatasetId, setCurrentDatasetId] = useState<string>("");
  const [sandboxAppModelConfig, setSandboxAppModelConfig] =
    useState<ModelConfig|null>(null);
  const [sandboxAppInitializedError, setSandboxAppInitializedError] = useState<boolean>(false);
  const [sandboxAppInitialized, setSandboxAppInitialized] = useState<boolean>(false);
  const [sandboxKnowledgeIdInitialized, setSandboxKnowledgeInitialized] = useState<boolean>(false);
  const [sandboxQueryContent, setSandboxQueryContent] = useState<string|null>(null)
  const [triggerMutate, setTriggerMutate] = useState<(() => void) | undefined>(undefined);

  const {
    data: appId,
    isLoading: appIdIsLoading,
    error: appIdError,
  } = useSWR(
    sandboxAppKey("search-tag-name", sandbox_tag, "app"),
    fetchTargetIdBasedOnTagName
  );

  const {
    data: sandboxAppData,
    isLoading: sandboxAppDataIsLoading,
    error: sandboxAppDataError,
  } = useSWR(
    sandboxAppId ? { url: "apps", id: sandboxAppId } : null,
    fetchAppDetail
  );

  useEffect(() => {
    if (appId) {
        setSandboxAppId(appId?.target_id);
    }
  }, [appId]);

  useEffect(() => {
    if (sandboxAppData) {
      setSandboxAppModelConfig(sandboxAppData.model_config);
    }
  }, [sandboxAppData]);


  const handleGetCurrentDatasetId= (datasetId:string) =>{
    if (datasetId){
      setCurrentDatasetId(datasetId)
      setSandboxKnowledgeInitialized(true)
    }
  }

  const handleUpdateQuery = (queryContent:string) =>{
    setSandboxQueryContent(queryContent)
  }

  useEffect(() => {
    if (sandboxAppModelConfig && currentDatasetId && sandboxKnowledgeIdInitialized) {
      const dataset_configs = sandboxAppModelConfig.dataset_configs?.datasets?.datasets
      if (dataset_configs && dataset_configs.length === 0){
        
        const updatedAppModelConfig = {
          ...sandboxAppModelConfig,
          dataset_configs: {
            ...sandboxAppModelConfig.dataset_configs,
            datasets: {
              datasets: [
                {
                  dataset: {
                  enabled: true, 
                  id: currentDatasetId
                }
              }
              ]
            } as any,
            reranking_enable: true,
          }, 
        }
        setSandboxAppModelConfig(updatedAppModelConfig)
        setSandboxAppInitialized(true) 
      }
      else if (!dataset_configs) {
        setSandboxAppInitialized(false)
        setSandboxAppInitializedError(true)
      }
    }
    // else if (!sandboxKnowledgeIdInitialized&&!sandboxAppInitialized &&!currentDatasetId){
    //   setSandboxAppInitializedError(true)
    // }
  }, [currentDatasetId, sandboxAppInitialized, sandboxKnowledgeIdInitialized, sandboxAppModelConfig])

  return (
    <SandboxContext.Provider
      value={{
        app_id: sandboxAppId,
        app_model_config: sandboxAppModelConfig,
        dataset_id: currentDatasetId,
        handleGetCurrentDatasetId: handleGetCurrentDatasetId,
        sandboxKnowledgeIdInitialized: sandboxKnowledgeIdInitialized,
        sandboxContextInitialized: sandboxAppInitialized,
        sandboxContextInitializedError: sandboxAppInitializedError,
        sandboxQueryContent: sandboxQueryContent!,
        handleUpdateQuery: handleUpdateQuery,
        triggerMutate: triggerMutate!, 
        setTriggerMutate: setTriggerMutate
      }}
    >
      {children}
    </SandboxContext.Provider>
  );
};

export const useSandboxContext = () => useContext(SandboxContext);

export default SandboxContext;
