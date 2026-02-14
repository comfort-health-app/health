'use client'

import {useState, useEffect} from 'react'
import {debounce} from 'lodash'

export const appbarHeight = 40
export const footerHeight = 40
export const headerMargin = 0
export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState({width: 0, height: 0})

  const handleResize = () => {
    const data = {width: window.innerWidth, height: window.innerHeight}

    setWindowSize(data)
  }

  useEffect(() => {
    const handleResizeDebounced = debounce(handleResize, 100)
    // window.addEventListener('resize', handleResizeDebounced)
    handleResize()
    // return () => window.removeEventListener('resize', handleResizeDebounced)
  }, [])
  const width = windowSize?.width ?? 0
  const height = windowSize?.height ?? 0
  const currentDevice = GetDevice(width)
  const SP = currentDevice === 'SP'
  const TB = currentDevice === 'TB'
  const PC = currentDevice === 'PC'
  const device = {SP, TB, PC}
  const useWindowSizeDeps = [width]

  const bodyHeihgt = height - appbarHeight - headerMargin
  return {
    appbarHeight,
    footerHeight,
    bodyHeihgt,
    headerMargin,
    useWindowSizeDeps,
    currentDevice,
    width,
    height,
    device,
    SP,
    TB,
    PC,
  }
}

export const getWindow: () => {width: number; height: number} = () => {
  const result = typeof window === 'undefined' ? {width: 0, height: 0} : {width: window.innerWidth, height: window.innerHeight}
  return result
}

export const GetDevice: (width: number) => 'SP' | 'TB' | 'PC' = (width: number) => {
  if (width <= 599) {
    return 'SP'
  } else if (599 < width && width < 959) {
    return 'TB'
  } else if (width >= 959) {
    return 'PC'
  } else {
    return 'SP'
  }
}
