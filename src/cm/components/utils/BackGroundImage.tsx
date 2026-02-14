'use client '

import {cl} from 'src/cm/lib/methods/common'
import Image from 'next/image'
import React from 'react'

const BackGroundImage = React.memo(
  (props: {style?: React.CSSProperties; url: string; className?: string; children?: React.ReactNode}) => {
    const {style, className} = props

    return (
      <>
        <Image
          {...{
            className: '',
            alt: '',
            src: props.url,
            fill: true,
            style: {objectFit: 'cover', objectPosition: `center`},
          }}
        />
      </>
    )
    return (
      <>
        <div {...{style, className: cl(` fixed z-[-1] h-full w-full `, className)}}>
          <div className={`fixed z-[-2] h-screen w-full bg-black/60 `}></div>
          <Image
            {...{
              className: 'z-[-3]',
              alt: '',
              src: props.url,
              fill: true,
              style: {
                objectFit: 'cover',
                objectPosition: `center`,
              },
            }}
          />
        </div>
        <div className={` z-1 h-full w-full`}>{props.children}</div>
      </>
    )
  }
)

export default BackGroundImage
