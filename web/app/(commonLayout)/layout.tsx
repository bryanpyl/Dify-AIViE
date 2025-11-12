import React from 'react'
import type { ReactNode } from 'react'
import SwrInitializer from '@/app/components/swr-initializer'
import { AppContextProvider } from '@/context/app-context'
import { PermissionCheckProvider } from '@/context/permission-context'
import GA, { GaType } from '@/app/components/base/ga'
import HeaderWrapper from '@/app/components/header/header-wrapper'
import Header from '@/app/components/header'
import { EventEmitterContextProvider } from '@/context/event-emitter'
import { ProviderContextProvider } from '@/context/provider-context'
import { ModalContextProvider } from '@/context/modal-context'
import GotoAnything from '@/app/components/goto-anything'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <GA gaType={GaType.admin} />
      <SwrInitializer>
        <AppContextProvider>
          <PermissionCheckProvider>
            <EventEmitterContextProvider>
              <ProviderContextProvider>
                <ModalContextProvider>
                  <HeaderWrapper>
                    <Header />
                  </HeaderWrapper>
                  {children}
                </ModalContextProvider>
              </ProviderContextProvider>
            </EventEmitterContextProvider>
          </PermissionCheckProvider>
        </AppContextProvider>
      </SwrInitializer>
    </>
  )
}

export const metadata = {
  title: 'Dify',
}

export default Layout
