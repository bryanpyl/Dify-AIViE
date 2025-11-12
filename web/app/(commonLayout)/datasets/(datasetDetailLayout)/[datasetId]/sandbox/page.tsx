'use client'

import React, {useEffect} from 'react'
import Main from '@/app/components/datasets/sandbox'
import { SandboxContextProvider, useSandboxContext } from '@/context/sandbox-context'
import DebugSandbox from '@/app/components/app/configuration/debug/debug-sandbox'
import { useDatasetDetailContextWithSelector } from '@/context/dataset-detail'

const SandBoxPage = ()=>{
  const currentDataset = useDatasetDetailContextWithSelector(
    (ctx) => ctx.dataset
  );
  const { handleGetCurrentDatasetId } = useSandboxContext();

  useEffect(() => {
    if (currentDataset) {
      handleGetCurrentDatasetId(currentDataset.id);
    }
  }, [currentDataset]);

  return (
      <div className='h-full flex flex-row flex-grow flex-shrink-0 py-3 px-4'>
          <Main/>
          <DebugSandbox/>        
      </div>
  )
}

export default SandBoxPage
