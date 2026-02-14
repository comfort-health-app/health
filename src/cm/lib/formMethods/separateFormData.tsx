import {additionalPropsType, dataModelNameType} from '@cm/types/types'
import {Days} from '@cm/class/Days/Days'

import {anyObject} from '@cm/types/utility-types'

import {StrHandler} from '@cm/class/StrHandler'

export type myFormDefaultUpsertPropType = {
  latestFormData: anyObject
  extraFormState: anyObject
  dataModelName: dataModelNameType
  additional: additionalPropsType
  formData: any
  columns
}

export const separateFormData = ({latestFormData, additionalPayload, columns}) => {
  // Object.keys(additionalPayload ?? {}).forEach(key => {
  //   if (latestFormData[key]) {
  //     delete additionalPayload[key]
  //   }
  // })

  const prismaDataObject = {...latestFormData, ...additionalPayload}

  const relationIdOrigin = {...prismaDataObject}
  const modelBasicDataOrigin = {...prismaDataObject}

  Object.keys(modelBasicDataOrigin).forEach(key => {
    const col = columns.flat().find(col => col.id === key)
    const isNonDateObject =
      !Array.isArray(modelBasicDataOrigin[key]) &&
      typeof modelBasicDataOrigin[key] === 'object' &&
      !Days.validate.isDate(modelBasicDataOrigin[key]) &&
      modelBasicDataOrigin[key] !== null

    const isRelationalId = key.includes('Id')

    const startsWithCapital = StrHandler.startsWithCapital(key)
    // && Omit.includes(key) //3月27日(木) 削除

    const formHidenTrue = col?.form?.hidden === true

    if (isNonDateObject || isRelationalId || startsWithCapital || formHidenTrue) {
      /**リレーション先の削除 */
      delete modelBasicDataOrigin[key]
    }
  })

  const {id, ...modelBasicData} = modelBasicDataOrigin

  const relationIds = {}
  Object.keys(relationIdOrigin).forEach(key => {
    if (key.match(/.+Id/)) {
      const relationalTableId = prismaDataObject[key]

      relationIds[key] = relationalTableId
    }
  })

  return {
    id,
    modelBasicData,
    relationIds,
  }
}
