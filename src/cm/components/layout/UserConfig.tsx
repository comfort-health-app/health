import {R_Stack} from '@cm/components/styles/common-components/common-components'
import {T_LINK} from '@cm/components/styles/common-components/links'
import {Paper} from '@cm/components/styles/common-components/paper'
import {LabelValue} from '@cm/components/styles/common-components/ParameterCard'

import MyPopover from '@cm/components/utils/popover/MyPopover'
import {CircleUserIcon} from 'lucide-react'
import useGlobal from '@cm/hooks/globalHooks/useGlobal'
import useWindowSize from '@cm/hooks/useWindowSize'
import {HREF} from '@cm/lib/methods/urls'
import {signOut} from 'next-auth/react'
import React, {useMemo} from 'react'
import {sleep} from '@cm/lib/methods/common'

// 型定義を改善
interface UserConfigSession {
  scopes: {login: boolean}
  name: string
  email?: string
  roles: Array<{name: string}>
}

interface UserConfigProps {
  session?: UserConfigSession
  rootPath?: string
  query?: any
  width?: number
}

// スタイル定数をコンポーネント外に移動
const STYLING_CONFIG = {styles: {wrapper: {padding: 0, width: '100%'}}} as const

export const UserConfig = React.memo(() => {
  const {roles, accessScopes, session, rootPath, query, router, toggleLoad} = useGlobal()
  const {width} = useWindowSize()

  // 幅計算をメモ化
  const dimensions = useMemo(() => {
    const maxWidth = Math.min(width * 0.8, 400)
    const minWidth = Math.min(width * 0.8, 240)
    return {maxWidth, minWidth}
  }, [width])

  // ログアウトURLをメモ化
  const logoutHref = useMemo(() => HREF('/logout', {rootPath}, query), [rootPath, query])
  const loginHref = useMemo(() => HREF('/login', {rootPath}, query), [rootPath, query])

  // ロール名の文字列をメモ化
  const roleNames = useMemo(() => session?.roles?.map(role => role.name).join(','), [session?.roles])

  if (!session?.scopes.login) {
    return <T_LINK href={loginHref}>ログイン</T_LINK>
  }

  return (
    <div>
      <MyPopover mode="click" button={<CircleUserIcon className=" text-gray-500 onHover" />}>
        <Paper>
          <R_Stack style={dimensions}>
            <LabelValue styling={STYLING_CONFIG} label="氏名" value={session?.name} />
            <LabelValue styling={STYLING_CONFIG} label="Email" value={session?.email} />
            <LabelValue styling={STYLING_CONFIG} label="権限" value={roleNames} />
            <R_Stack className="w-full justify-end">
              <button
                className={`t-link`}
                onClick={async () => {
                  toggleLoad(
                    async () => {
                      await signOut({redirect: false})
                      await sleep(500)
                      router.push(`/login`)
                    },
                    {refresh: false, mutate: false}
                  )
                }}
              >
                ログアウト
              </button>
            </R_Stack>
          </R_Stack>
        </Paper>
      </MyPopover>
    </div>
  )
})

UserConfig.displayName = 'UserConfig'
