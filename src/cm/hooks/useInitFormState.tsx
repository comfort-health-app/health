'use client '
import {useRouter} from 'next/navigation'
import {useState, useEffect} from 'react'

/**
 *prismaのデータが更新された時にも、ステートを最新に保つ
 * @param {any} initialState stateの初期値
 * @param { string | array } dataSourceStrOrArray prismaから得られるデータ本体
 * @return {object}
 */
export default function useInitFormState(initialState: any, dataSourceStrOrArray?: any, single?: boolean) {
  const [formData, setformData] = useState<any>(initialState)

  const router = useRouter()

  /**ネストした先で更新し、router refreshした際に、ステートもちゃんと更新する */
  useEffect(() => {
    if (single && dataSourceStrOrArray) {
      setformData(dataSourceStrOrArray)
      return
    }

    if (dataSourceStrOrArray) {
      const dataSource = [...dataSourceStrOrArray]
      if (formData && dataSource) {
        let latestFormData: any
        if (typeof dataSource === 'string') {
          latestFormData = dataSource
        } else if (typeof dataSource === 'object') {
          latestFormData = dataSource?.find(v => v?.id == formData?.id)
        }

        if (latestFormData) {
          setformData(latestFormData)
        }
      }
    }
  }, [dataSourceStrOrArray, router])

  return {formData, setformData}
}
