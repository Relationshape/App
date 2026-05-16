// RsTile — single source of truth for the "tile with colored left bar"
// visual idiom. Three places previously rendered this idiom by hand:
//   • CategoryOverview cat-overview-tile (questionnaire cat-on/off)
//   • MapSettings cat-toggle              (per-map cat-on/off)
//   • ScaleEditor scale-row               (data-editing row of inputs)
//
// Two modes:
//
//   1. Toggle (default) — renders as <button type="button"> with
//      aria-pressed driving the visible active/inactive state (full
//      opacity vs .55 dim, plus colored vs neutral border on the
//      three non-left sides). Layout: icon | (title + trailing) /
//      children below. Required props: `active`, `onClick`.
//
//   2. Plain — renders as <div>. No toggle behaviour. The consumer
//      passes a layout className (e.g. `.scale-row`) and provides its
//      own children. RsTile only supplies the visual frame + colored
//      left bar. Activated via `plain` prop.
//
// In both modes the per-row "category color" comes from the `color`
// prop and surfaces as the CSS variable --c on the root element.

import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RsTileBaseProps {
  color: string
  className?: string
  testId?: string
  children?: ReactNode
}

interface RsTileToggleProps extends RsTileBaseProps {
  plain?: false
  active: boolean
  onClick: () => void
  icon?: ReactNode
  title?: ReactNode
  trailing?: ReactNode
  ariaLabel?: string
}

interface RsTilePlainProps extends RsTileBaseProps {
  plain: true
  /** Plain mode has no toggle state; these are intentionally absent. */
  active?: never
  onClick?: never
  icon?: never
  title?: never
  trailing?: never
  ariaLabel?: never
}

export type RsTileProps = RsTileToggleProps | RsTilePlainProps

export function RsTile(props: RsTileProps) {
  const { color, className, testId, children } = props
  const style = { ['--c' as 'color']: color } as CSSProperties

  if (props.plain === true) {
    return (
      <div
        data-testid={testId}
        style={style}
        className={cn('rs-tile', className)}
      >
        {children}
      </div>
    )
  }

  const { active, onClick, icon, title, trailing, ariaLabel } = props
  const hasHead = title != null || trailing != null
  return (
    <button
      type="button"
      aria-pressed={active}
      data-state={active ? 'active' : 'inactive'}
      aria-label={ariaLabel}
      onClick={onClick}
      data-testid={testId}
      style={style}
      className={cn('rs-tile', className)}
    >
      {icon != null ? (
        <span className="rs-tile-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <div className="rs-tile-body">
        {hasHead ? (
          <div className="rs-tile-head">
            {title != null ? <span className="rs-tile-title">{title}</span> : null}
            {trailing != null ? <span className="rs-tile-trailing">{trailing}</span> : null}
          </div>
        ) : null}
        {children}
      </div>
    </button>
  )
}
