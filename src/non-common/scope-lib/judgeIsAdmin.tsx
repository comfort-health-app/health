import {SessionFaker} from 'src/non-common/SessionFaker'

type roleArray = string[] | string
type session = any
export function roleIs(roleArray: roleArray, session: session) {
  typeof roleArray === 'string' && (roleArray = [roleArray])
  return roleArray.includes(session?.role)
}

export function typeIs(roleArray: roleArray, session: session) {
  typeof roleArray === 'string' && (roleArray = [roleArray])
  return roleArray.includes(session?.type)
}

export function userIs(key, roleArray: roleArray, session: session) {
  typeof roleArray === 'string' && (roleArray = [roleArray])
  return roleArray.includes(session?.[key])
}

export const judgeIsAdmin = (session: session, query) => {
  const admin = roleIs('管理者', session)

  const getGlobalUserId = () => {
    const targetModels = SessionFaker.getTargetModels()

    const models = targetModels?.map(item => `g_${item.name}Id`)
    const model = models.find(model => query?.[model]) ?? ''

    let result: number
    if (!admin) {
      result = 0
    } else {
      result = Number(query?.[model] ?? 0)
    }
    return Number(result)
  }

  return {
    admin,
    getGlobalUserId,
    globalUserId: getGlobalUserId(),
  }
}
