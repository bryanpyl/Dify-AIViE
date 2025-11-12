import React from 'react'
import OverviewMain from './index'

export type IDevelopProps = {
  params: Promise<{ appId: string }>
}

const Overview = async (props: IDevelopProps) => {
  const params = await props.params

  const {
    appId,
  } = params

  return (
    <OverviewMain appId={appId} />
  )
}

export default Overview
