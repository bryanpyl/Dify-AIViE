import React from 'react'
import type { ReactNode } from 'react'
import Header from './header'
import SwrInitor from '@/app/components/swr-initializer'
import { AppContextProvider } from '@/context/app-context'
import { PermissionCheckProvider } from '@/context/permission-context'
import GA, { GaType } from '@/app/components/base/ga'
import HeaderWrapper from '@/app/components/header/header-wrapper'
import { EventEmitterContextProvider } from '@/context/event-emitter'
import { ProviderContextProvider } from '@/context/provider-context'
import { ModalContextProvider } from '@/context/modal-context'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <GA gaType={GaType.admin} />
      <SwrInitor>
        <AppContextProvider>
          <PermissionCheckProvider>
            <EventEmitterContextProvider>
              <ProviderContextProvider>
                <ModalContextProvider>
                  <HeaderWrapper>
                    <Header />
                  </HeaderWrapper>
                  <div className='bg-components-panel-bg relative flex flex-col overflow-y-auto shrink-0 h-0 grow'>
                    {children}
                  </div>
                </ModalContextProvider>
              </ProviderContextProvider>
            </EventEmitterContextProvider>
          </PermissionCheckProvider>
        </AppContextProvider>
      </SwrInitor>
    </>
  )
}

export const metadata = {
  title: 'Dify',
}

export default Layout
