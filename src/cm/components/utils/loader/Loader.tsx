'use client'
import {Absolute, C_Stack} from 'src/cm/components/styles/common-components/common-components'
import {Z_INDEX} from 'src/cm/lib/constants/constants'

import LoadingBar from 'react-top-loading-bar'
import {useRef} from 'react'

export default function Loader(props: any) {
  const ref = useRef<any>(null)

  return (
    <>
      <div
        className={`fixed inset-0 h-full w-full bg-white/50`}
        style={{
          zIndex: Z_INDEX.loader,
        }}
      >
        <LoadingBar ref={ref} height={4} />
        <Absolute>
          <C_Stack className={` items-center`}>
            {/* <Blocks
              visible={true}
              height="80"
              width="80"
              ariaLabel="blocks-loading"
              wrapperStyle={{}}
              wrapperClass="blocks-wrapper"
            /> */}
            {props.children}
          </C_Stack>
        </Absolute>
      </div>
    </>
  )
}
