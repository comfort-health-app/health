import {badgeVariantStr} from '@cm/shadcn/lib/variant-types'

export type codeItemCore = {
  label: string
  color?: badgeVariantStr
  colorCode?: string
  approved?: boolean
  onCreate?: boolean
  active?: boolean
}
export type codeItem = {code: string} & codeItemCore
export type codeObjectArgs = {[key: string]: codeItemCore}

export class Code {
  codeObject: {[key: string]: codeItem}

  constructor(master: codeObjectArgs) {
    this.codeObject = Object.keys(master).reduce((acc, key) => {
      acc[key] = {...master[key], code: key}
      return acc
    }, {})
  }

  get array() {
    return Object.values(this.codeObject)
  }
  get toOptionList() {
    return Object.values(this.codeObject).map(item => ({
      value: item.code,
      label: item.label,
    }))
  }

  findByProperty(property: keyof codeItem, value: string | boolean) {
    const noPropertyDefined = this.array.every(item => {
      return item[property] === undefined
    })

    if (noPropertyDefined) {
      throw new Error(`${value} は見つかりませんでした`)
    }

    const hit = this.array.find(item => item[property] === value)

    return hit
  }

  findByLabel(label: string) {
    return this.findByProperty('label', label)
  }

  findByCode(code: string) {
    return this.findByProperty('code', code)
  }
}
