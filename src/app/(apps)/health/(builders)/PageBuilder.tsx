'use client'

import {Fields} from '@cm/class/Fields/Fields'
import {ColBuilder} from './ColBuilder'
import {DetailPagePropType} from '@cm/types/types'
import ChildCreator from '@cm/components/DataLogic/RTs/ChildCreator/ChildCreator'
import MyForm from '@cm/components/DataLogic/TFs/MyForm/MyForm'
import {R_Stack} from '@cm/components/styles/common-components/common-components'
import MyAccordion from '@cm/components/utils/Accordions/MyAccordion'
import GlobalIdSelector from '@cm/components/GlobalIdSelector/GlobalIdSelector'

export class PageBuilder {
  static masterKeyClient = {
    form: (props: DetailPagePropType) => {
      return (
        <R_Stack className={`max-w-xl items-stretch`}>
          <div className={`w-full`}>
            <MyAccordion {...{label: `基本情報`, defaultOpen: true, closable: true}}>
              <MyForm {...{...props}} />
            </MyAccordion>
          </div>

          <div className={`w-full`}>
            <MyAccordion {...{label: `ユーザー`, defaultOpen: true, closable: true}}>
              <ChildCreator
                {...{
                  ParentData: props.formData ?? {},
                  models: {
                    parent: props.dataModelName,
                    children: `user`,
                  },
                  columns: ColBuilder.user(props),
                  useGlobalProps: props.useGlobalProps,
                }}
              />
            </MyAccordion>
          </div>
        </R_Stack>
      )
    },
  }

  static getGlobalIdSelector = ({useGlobalProps}) => {
    return () => {
      const {accessScopes} = useGlobalProps
      const scopes = accessScopes()
      const {admin} = scopes

      if (!admin) {
        return <></>
      }

      const columns = Fields.transposeColumns([
        {
          label: '',
          id: 'g_userId',
          forSelect: {
            config: {},
          },
          form: {},
        },
      ])

      return <GlobalIdSelector {...{useGlobalProps, columns}} />
    }
  }
}
