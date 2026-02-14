import React from 'react'
import {cn} from '../../shadcn/lib/utils'

interface AutoGridContainerProps {
  children: React.ReactNode
  className?: string
  maxCols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export const AutoGridContainer: React.FC<AutoGridContainerProps> = ({children, className, maxCols = {sm: 2, lg: 3, xl: 4}}) => {
  const childrenArray = React.Children.toArray(children)
  const childCount = childrenArray.length

  // 各ブレークポイントでの最大列数を子要素数に応じて調整
  const getAdjustedCols = (maxColsForBreakpoint: number) => {
    return Math.min(childCount, maxColsForBreakpoint)
  }

  // 動的なグリッドクラスを生成
  const generateGridClasses = () => {
    const classes = ['grid']

    // デフォルトは1列
    classes.push('grid-cols-1')

    // smブレークポイント
    if (maxCols.sm && childCount > 1) {
      const adjustedCols = getAdjustedCols(maxCols.sm)
      classes.push(`sm:grid-cols-${adjustedCols}`)
    }

    // mdブレークポイント（指定されている場合）
    if (maxCols.md && childCount > (maxCols.sm || 1)) {
      const adjustedCols = getAdjustedCols(maxCols.md)
      classes.push(`md:grid-cols-${adjustedCols}`)
    }

    // lgブレークポイント
    if (maxCols.lg && childCount > (maxCols.md || maxCols.sm || 1)) {
      const adjustedCols = getAdjustedCols(maxCols.lg)
      classes.push(`lg:grid-cols-${adjustedCols}`)
    }

    // xlブレークポイント
    if (maxCols.xl && childCount > (maxCols.lg || maxCols.md || maxCols.sm || 1)) {
      const adjustedCols = getAdjustedCols(maxCols.xl)
      classes.push(`xl:grid-cols-${adjustedCols}`)
    }

    return classes.join(' ')
  }

  return <div className={cn(generateGridClasses(), className)}>{children}</div>
}

export default AutoGridContainer
