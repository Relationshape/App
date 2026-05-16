// RsTile — single source of truth for the "tile with colored left bar" toggle
// pattern. Three places previously rendered the same idiom by hand:
//   • CategoryOverview cat-overview-tile (questionnaire cat-on/off)
//   • MapSettings cat-toggle              (per-map cat-on/off)
//   • (ScaleEditor .scale-row is the same *visual* but is a data-editing row,
//     not a toggle — it keeps the plain .scale-row class and the shared
//     left-bar CSS rule in legacy-components.css.)
//
// The component renders a <button type="button"> with `aria-pressed` driving
// a visible active/inactive state (full opacity vs .55 dim, plus colored vs
// neutral border). The per-row "category color" is provided by the consumer
// via the `color` prop and surfaces as the CSS variable --c.
//
// Layout slots:
//   icon       — left, single visual element (emoji, lucide icon)
//   title      — primary label (header row, alongside `trailing`)
//   trailing   — small right-side adornment in the header row (✓ / count)
//   children   — extras below the header row (e.g. progress bar)

import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface RsTileProps {
  color: string
  active: boolean
  onClick: () => void
  icon?: ReactNode
  title?: ReactNode
  trailing?: ReactNode
  children?: ReactNode
  className?: string
  ariaLabel?: string
  testId?: string
}

export function RsTile({
  color,
  active,
  onClick,
  icon,
  title,
  trailing,
  children,
  className,
  ariaLabel,
  testId,
}: RsTileProps) {
  const hasHead = title != null || trailing != null
  return (
    <button
      type="button"
      aria-pressed={active}
      data-state={active ? 'active' : 'inactive'}
      aria-label={ariaLabel}
      onClick={onClick}
      data-testid={testId}
      style={{ ['--c' as 'color']: color } as CSSProperties}
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
