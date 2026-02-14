'use client'

import {useEffect, useCallback} from 'react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import {isServer} from '@cm/lib/methods/common'

interface UseElementScrollPositionProps {
  elementRef: any
  scrollKey?: string // オプションで特定のキーを指定可能
}

interface ScrollPosition {
  value: number
  timestamp: number
}

export const useElementScrollPosition = ({elementRef, scrollKey}: UseElementScrollPositionProps) => {
  const {pathname, searchParams} = useGlobal()
  const storageKey = `elementScroll_${scrollKey || ''}${pathname}${searchParams}`

  const getScrollPosition = useCallback(() => {
    if (isServer) return null
    return sessionStorage.getItem(storageKey)
  }, [storageKey])

  // セッションストレージのエラーハンドリングを追加
  const setScrollPosition = useCallback(
    (scrollPosition: string) => {
      if (isServer) return
      try {
        sessionStorage.setItem(storageKey, scrollPosition)
      } catch (error) {
        console.warn('Failed to save scroll position:', error)
      }
    },
    [storageKey]
  )

  const saveScrollPosition = useCallback(() => {
    if (isServer || !elementRef.current) return

    const start = performance.now()
    const current = String(elementRef.current.scrollTop)

    if (current !== '0') {
      setScrollPosition(current)
    }

    const end = performance.now()
    if (end - start > 16.67) {
      console.warn('Element scroll position save took too long:', end - start)
    }
  }, [elementRef, setScrollPosition])

  const restoreScrollPosition = useCallback(() => {
    if (isServer || !elementRef.current) return

    const tryRestore = (attempts = 0) => {
      const current = String(elementRef.current?.scrollTop)
      const savedPosition = getScrollPosition()

      if (current !== savedPosition && savedPosition) {
        if (elementRef.current) {
          elementRef.current.scrollTop = parseInt(savedPosition)
        }

        if (attempts < 2) {
          setTimeout(() => tryRestore(attempts + 1), 100)
        }
      }
    }

    tryRestore()
  }, [elementRef, getScrollPosition])

  useEffect(() => {
    if (isServer || !elementRef.current) return

    const element = elementRef.current
    const handleScroll = () => requestAnimationFrame(saveScrollPosition)

    saveScrollPosition()
    restoreScrollPosition()

    element.addEventListener('scroll', handleScroll, {passive: true})

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [pathname, searchParams, saveScrollPosition, restoreScrollPosition, elementRef])
}
