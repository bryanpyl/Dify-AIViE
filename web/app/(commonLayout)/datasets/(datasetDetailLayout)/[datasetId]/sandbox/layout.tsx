'use client'

import React from 'react'
import { SandboxContextProvider } from "@/context/sandbox-context"

const SandboxContextLayout= ({children}:{children:React.ReactNode})=>{
  return (
    <SandboxContextProvider>
      {children}
    </SandboxContextProvider>
  )
}

export default React.memo(SandboxContextLayout)
