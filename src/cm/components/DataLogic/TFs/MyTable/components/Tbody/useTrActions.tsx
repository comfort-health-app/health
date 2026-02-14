import {FileHandler} from 'src/cm/class/FileHandler'
import {SquarePen, Trash2} from 'lucide-react'

import {cl} from 'src/cm/lib/methods/common'
import {HREF} from 'src/cm/lib/methods/urls'
import {useGlobalPropType} from '@cm/hooks/globalHooks/useGlobalOrigin'
import {T_LINK} from '@cm/components/styles/common-components/links'
import {useCallback} from 'react'
import {toastByResult} from '@cm/lib/ui/notifications'
import {generalDoStandardPrisma} from '@cm/lib/server-actions/common-server-actions/doStandardPrisma/doStandardPrisma'

export const TrActionIconClassName = `onHover`

const useTrActions = props => {
  const {
    setformData,
    useGlobalProps,
    editType = {
      type: `modal`,
    },
    myTable,
    dataModelName,
    columns,
    setrecords,
    deleteRecord,
  } = props

  if (editType?.type === 'page') {
    const {pathnameBuilder} = editType ?? {}
    if (!pathnameBuilder) {
      throw new Error('pathnameBuilder is required')
    }
  }

  const {toggleLoad, query, pathname, rootPath, addQuery} = useGlobalProps as useGlobalPropType

  const handleTrashItem = async ({record, columns}) => {
    let deleteConfirmed = false

    if (props?.myTable?.delete?.requiredUserConfirmation === false) {
      if (confirm(`削除しますか？`)) {
        deleteConfirmed = true
      }
    } else {
      if (confirm(`削除しますか？`)) {
        if (prompt(`本当に削除する場合、「削除」と入力してください。`) === `削除`) {
          deleteConfirmed = true
        }
      }
    }

    if (deleteConfirmed) {
      // toggleLoad(async () => {
      const deleteImageUrls = columns
        .flat()
        .filter(col => col?.type === 'file')
        .map(col => {
          const {id} = col
          const backetKey = col?.form?.file?.backetKey

          return {id, backetKey, deleteImageUrl: record[col.id]}
        })

      await Promise.all(
        deleteImageUrls.map(async obj => {
          const {id, deleteImageUrl, backetKey} = obj
          await FileHandler.sendFileToS3({
            file: null,
            formDataObj: {
              bucketKey: `${backetKey}/${id}`,
              deleteImageUrl,
            },
          })
        })
      )

      const res = await generalDoStandardPrisma(dataModelName, 'delete', {where: {id: record?.id}})
      toastByResult(res)
      if (res.success) {
        deleteRecord({record})
      }
      // })
    } else {
      alert('キャンセルしました')
    }
  }

  let ActionButtonObject = {}
  ActionButtonObject = {...ActionButtonObject, ...myTable.AdditionalActionButtonObject}
  if (myTable?.update !== false && editType?.type) {
    ActionButtonObject['edit'] = ({record}) => {
      const {pathnameBuilder} = editType ?? {}
      const redirectPath = pathnameBuilder?.({rootPath, record, pathname})
      const className = cl('text-primary-main', TrActionIconClassName, `w-6`)
      if (editType.type === `modal`) {
        const handleOnClickRow = async ({record}) => {
          if (editType?.type === 'page') {
            return
          } else if (editType?.type === 'pageOnSame') {
            return
          } else if (editType?.type === 'modal') {
            setformData(record)
            return ''
          }
        }
        return (
          <div
            {...{
              className,
              onClick: () => handleOnClickRow({record}),
            }}
          >
            <SquarePen className={`w-6`} />
          </div>
        )
      } else {
        const href = editType?.type === 'page' ? redirectPath : HREF(`${pathname}/${record.id}`, {}, query)

        return (
          <T_LINK {...{className, href}}>
            <SquarePen className={`w-6`} />
          </T_LINK>
        )
      }
    }
  }

  if (myTable?.delete !== false) {
    ActionButtonObject['delete'] = ({record}) => (
      <div
        onClick={async e => {
          if (myTable?.beforeHandleDelete?.({record, columns}) !== false) {
            await handleTrashItem?.({record, columns})
          }
        }}
        className={cl('text-error-main  opacity-60', TrActionIconClassName, `w-5 `)}
      >
        <Trash2 />
      </div>
    )
  }

  const RowActionButtonComponent = useCallback(
    ({record, myTable}) => {
      if (Object?.keys(ActionButtonObject)?.length === 0) return null

      return (
        <>
          {Object?.keys(ActionButtonObject)?.map(key => {
            return <div key={key}>{ActionButtonObject[key]({record})}</div>
          })}
        </>
      )
    },
    [ActionButtonObject]
  )

  return {
    RowActionButtonComponent,
  }
}

export default useTrActions
