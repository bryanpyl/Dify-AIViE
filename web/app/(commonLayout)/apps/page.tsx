'use client'
import Apps from '@/app/components/apps'

const AppList = () => {
  return (
    <div className='relative flex flex-col overflow-y-auto bg-background-body shrink-0 h-0 grow'>
      <Apps />
      <footer className='px-12 py-6 grow-0 shrink-0'></footer>
    </div >
  )
}

export default AppList
