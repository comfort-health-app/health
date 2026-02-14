import {obj__initializeProperty} from '@cm/class/ObjHandler/transformers'
import {prismaSchemaString} from '@cm/lib/methods/scheme-json-export'

export const getSchema = () => {
  const schemaAsStr = prismaSchemaString
  const schemaAsObj = {}
  let modelName = ''
  schemaAsStr.split('\n').forEach(line => {
    if (line.includes('model') && line.includes('{')) {
      modelName = line.split(' ').filter(val => val)[1]
    }
    if (line.includes('}') || line.includes('{') || !line) {
      return
    }

    obj__initializeProperty(schemaAsObj, modelName, [])
    schemaAsObj[modelName].push(line)
  })

  return schemaAsObj
}

export const getRelationalModels = ({schemaAsObj, parentName}) => {
  parentName = parentName[0].toUpperCase() + parentName.slice(1)

  const attributes = schemaAsObj[parentName]

  type attrribute = {
    name: string
    type: string | null
    relationalType: string | null
  }
  const singleAttributeObj: {[key: string]: attrribute} = {}
  const hasManyAttributeObj: {[key: string]: attrribute} = {}
  const hasOneAttributeObj: {[key: string]: attrribute} = {}
  attributes?.forEach(line => {
    const foo = line.split(' ').filter(val => val)

    const [name, type] = foo

    // 大文字があれば

    if (String(name?.[0])?.match(/[A-Z]/)) {
      if (type.includes('[]')) {
        hasManyAttributeObj[name] = {name, type: null, relationalType: 'hasMany'}
      } else {
        hasOneAttributeObj[name] = {name, type: null, relationalType: 'hasOne'}
      }
    } else {
      singleAttributeObj[name] = {name, type, relationalType: null}
    }
  })

  return {singleAttributeObj, hasManyAttributeObj, hasOneAttributeObj}
}
