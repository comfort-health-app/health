'use client'
import {useParams, usePathname, useRouter, useSearchParams} from 'next/navigation'

import {useCallback, useMemo} from 'react'

import {HREF, makeGlobalQuery, makeQuery} from 'src/cm/lib/methods/urls'

export default function useMyNavigation() {
  const router = useRouter()

  const searchParams = useSearchParams()
  const pathname = usePathname() ?? ''
  const rootPath = useMemo(() => pathname?.split('/')[1], [pathname])
  const dynamicRoutingParams = useParams()
  const asPath = useMemo(() => pathname + '?' + searchParams?.toString(), [pathname, searchParams])
  const query = useMemo(() => makeQuery(searchParams), [searchParams])

  const shallowPush = useCallback((href: string) => {
    history.pushState({}, '', href)
  }, [])

  const addQuery = useCallback(
    (additionalQuery = {}, method = 'push', shallow = false) => {
      const newQuery = {...query, ...additionalQuery}
      const path = HREF(pathname, newQuery, makeGlobalQuery(newQuery))
      shallow ? shallowPush(path) : router[method](path)
    },
    [query, pathname, router]
  )
  const shallowAddQuery = query => addQuery(query, `push`, true)
  const getHref = useCallback((path: string, newQuery: any = {}) => HREF(path, newQuery, query), [query])
  const useMyNavigationDependencies = [asPath]
  return {
    getHref,
    router,
    pathname,
    query,
    asPath,
    rootPath,
    searchParams,
    addQuery,
    dynamicRoutingParams,
    useMyNavigationDependencies,
    shallowPush,
    shallowAddQuery,
  }
}
