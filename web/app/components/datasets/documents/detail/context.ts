import type { ChunkingMode, ParentMode } from '@/models/datasets'
import { createContext, useContextSelector } from 'use-context-selector'

type DocumentContextValue = {
  datasetId?: string
  documentId?: string
  docForm?: ChunkingMode
  mode?: string
  parentMode?: ParentMode
}

export const DocumentContext = createContext<DocumentContextValue>({})

export const useDocumentContext = <T>(selector: (value: DocumentContextValue) => T): T => {
  return useContextSelector(DocumentContext, selector)
}
