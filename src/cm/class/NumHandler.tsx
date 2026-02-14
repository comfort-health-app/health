import {DH__convertDataType} from '@cm/class/DataHandler/type-converter'

export class NumHandler {
  // 数値を3桁ごとの小数点表記のStringに変換する
  static toLocaleStr = value => {
    if (value) {
      value = String(value).toLocaleString()
      return value
    } else {
      return value
    }
  }

  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  static toPrice(value) {
    if (value) {
      value = DH__convertDataType(value, 'price').toLocaleString()
      return value
    } else {
      return value
    }
  }

  static round = (value?: number, decimalPoint = 1, mode: 'ceil' | 'floor' | 'round' = 'round') => {
    if (!value) {
      return 0
    }
    const multiplier = 10 ** decimalPoint
    switch (mode) {
      case 'ceil':
        return Math.ceil(value * multiplier) / multiplier
      case 'floor':
        return Math.floor(value * multiplier) / multiplier
      case 'round':
      default:
        return Math.round(value * multiplier) / multiplier
    }
  }
  static WithUnit = (value: number, unit?: string, decimalPoint = 0) =>
    value && NumHandler.toPrice(NumHandler.round(value, decimalPoint)) + (unit ?? '')
}
