'use client'

import Redirector from '@cm/components/utils/Redirector'
import useWindowSize from '@cm/hooks/useWindowSize'
import React from 'react'

export default function HealthPage() {
  const {PC} = useWindowSize()
  if (PC) {
    return <Redirector {...{redirectPath: '/health/dashboard'}} />
  } else {
    return <Redirector {...{redirectPath: '/health/dashboard'}} />
  }
}
