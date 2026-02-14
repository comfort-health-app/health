'use client'

import {defaultRegister} from '@cm/class/builders/ColBuilderVariables'
import {Fields} from '@cm/class/Fields/Fields'
import {columnGetterType} from '@cm/types/types'
export class ColBuilder {
  static medicine = (props: columnGetterType) => {
    return new Fields([
      {id: 'name', label: '名称', form: {...defaultRegister}},
      {id: 'requireUnit', label: '単位入力', type: `boolean`, form: {}},
      {id: 'active', label: '有効', type: `boolean`, form: {}},
    ]).transposeColumns()
  }

  static healthRecord = (props: columnGetterType) => {
    return new Fields([
      {id: 'recordDate', label: '記録日', type: 'date', form: {...defaultRegister}},
      {id: 'recordTime', label: '時刻', type: 'time', form: {...defaultRegister}},
      {id: 'category', label: 'カテゴリ', form: {...defaultRegister}},

      {id: 'bloodSugarValue', label: '血糖値', type: 'number', form: {}},
      {id: 'medicineId', label: '薬', type: 'select', form: {}},
      {id: 'medicineUnit', label: '薬の単位', type: 'number', form: {}},

      {id: 'walkingShortDistance', label: '短距離歩行', type: 'number', form: {}},
      {id: 'walkingMediumDistance', label: '中距離歩行', type: 'number', form: {}},
      {id: 'walkingLongDistance', label: '長距離歩行', type: 'number', form: {}},
      {id: 'walkingExercise', label: '運動', type: 'number', form: {}},

      {id: 'memo', label: 'メモ', type: 'textarea', form: {}},
    ]).transposeColumns()
  }

  static user = (props: columnGetterType) => {
    return new Fields([
      {id: 'name', label: '名称', form: {...defaultRegister}},
      {id: 'email', label: 'Email', form: {...defaultRegister}},
      {id: 'password', label: 'パスワード', type: `password`, form: {...defaultRegister}},
    ]).transposeColumns()
  }
}
