import {arr__findCommonValues} from '@cm/class/ArrHandler/array-utils/data-operations'
import {anyObject} from '@cm/types/utility-types'

import {judgeIsAdmin, roleIs, typeIs} from 'src/non-common/scope-lib/judgeIsAdmin'

type GroupieScopeType = {
  schoolId?: number
  teacherId?: number
  classroomId?: number
  isSchoolLeader: boolean
}

type AdvantageScopeType = {
  isCoach: boolean
  isStudent: boolean
}

type getScopeOptionsProps = {query?: anyObject; roles?: any[]}

export const getScopes = (session: anyObject, options: getScopeOptionsProps) => {
  const {query, roles} = options ?? {}

  const roleNames = (roles ?? []).map(d => d.name)
  const login = session?.id ? true : false
  const {admin, getGlobalUserId} = judgeIsAdmin(session, query)

  const result = {
    login,
    admin,
    getGlobalUserId,
    getGroupieScopes: () => {
      const schoolId = !admin ? session?.schoolId : Number(query?.g_schoolId ?? 0)

      const teacherId = !admin ? session?.id : Number(query?.g_teacherId ?? 0)
      const isSchoolLeader = typeIs(['責任者'], session)

      let result: GroupieScopeType = {
        schoolId,
        teacherId,
        isSchoolLeader,
      }

      result = addAdminToRoles(result, session) as GroupieScopeType
      return result
    },

    getAdvantageProps: () => {
      const isCoach = session?.membershipName === 'コーチ' && login
      const isStudent = session?.membershipName === '生徒' && login
      const result: AdvantageScopeType = {isCoach, isStudent}
      return result
    },

    getAquepotScopes: () => {
      const isCustomer = session.customerNumber && session.email
      const isUser = session.apps
      return {
        isUser,
        aqCustomerId: admin ? Number(query?.g_aqCustomerId ?? 0) : isCustomer ? session?.id : undefined,
      }
    },

    getTbmScopes: () => {
      const userId = !admin ? session?.id : Number(query?.g_userId ?? session?.id ?? 0)
      const tbmBaseId = !admin ? session?.tbmBaseId : Number(query?.g_tbmBaseId ?? session?.tbmBaseId ?? 0)

      const isSystemAdmin = !!arr__findCommonValues([`管理者`], roleNames)

      return {userId, tbmBaseId, isSystemAdmin}
    },

    getShinseiScopes: () => {
      const data = {
        isKanrisha: !!arr__findCommonValues([`管理者`], roleNames),
        isKojocho: !!arr__findCommonValues([`工場長`], roleNames),
        isHacchuTanto: !!arr__findCommonValues([`発注担当者`], roleNames),
        isTokatsu: !!arr__findCommonValues([`統括`], roleNames),
        isBucho: !!arr__findCommonValues([`部長`], roleNames),
        isYakuin: !!arr__findCommonValues([`役員`], roleNames),
      }
      const isNormalUser = !Object.values(data).some(data => data)
      return {...data, isNormalUser}
    },
  }

  return result
}

const addAdminToRoles: (targetObject: any, session: anyObject) => anyObject = (targetObject, session) => {
  // const result: anyObject = {...targetObject}
  Object.keys(targetObject).forEach(key => {
    const value = targetObject[key]
    targetObject[key] = value

    if (typeof targetObject[key] !== 'object' && roleIs(['管理者'], session) && targetObject[key] === false) {
      targetObject[key] = true
    }
  })

  return targetObject
}
