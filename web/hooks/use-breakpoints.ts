'use client'
import React from 'react'

export enum MediaType {
  mobile = 'mobile',
  tablet = 'tablet',
  pc = 'pc',
  xl='xl',
  '2xl'='2xl',
  '2k'='2k'
}

const useBreakpoints = () => {
  const [width, setWidth] = React.useState(globalThis.innerWidth)
  const media = (() => {
    if (width <= 640) //max width is 640px
      return MediaType.mobile
    if (width <= 768) // width is between 641px - 768px
      return MediaType.tablet
    if (width<=1280) // width is between 769px - 1280px
      return MediaType.pc
    if (width<=1920) // width is between 1281px - 1920px
      return MediaType.xl
    if (width<=2560) // width is between 1921px - 2560px
      return MediaType['2xl']
    return MediaType['2k']  // width is greater than 2561px
  })()

  React.useEffect(() => {
    const handleWindowResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  return media
}

export default useBreakpoints
