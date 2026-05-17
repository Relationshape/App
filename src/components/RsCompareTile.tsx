// Quick-task / Phase-04 D-03. Single tile in the "Compare with someone" grid.
// Visual + semantic port of public/legacy/js/app.js:3218-3228 (`tile()` helper).
// Consumed by src/components/CompareWithSomeone.tsx.
//
// CSS already present in src/styles/legacy-components.css:
//   .compare-tile          (lines 758-782)  — colored --c left bar
//   .compare-tile-body     (lines 758-782)  — h3 + p layout
//   .compare-tile-arrow    (lines 758-782)  — trailing arrow
//   .compare-tile-import   (lines 1583-1587) — purple Import… modifier
// No new CSS is added here.

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export interface RsCompareTileProps {
  color: string
  emoji: string
  title: string
  sub?: string
  onClick: () => void
  className?: string
  testId?: string
  ariaLabel?: string
}

export function RsCompareTile({
  color,
  emoji,
  title,
  sub,
  onClick,
  className,
  testId,
  ariaLabel,
}: RsCompareTileProps) {
  const style = { ['--c' as 'color']: color } as CSSProperties
  return (
    <button
      type="button"
      className={cn('compare-tile', className)}
      style={style}
      onClick={onClick}
      data-testid={testId}
      aria-label={ariaLabel}
    >
      <div className="li-avatar">{emoji}</div>
      <div className="compare-tile-body">
        <h3>{title}</h3>
        {sub ? <p className="muted small">{sub}</p> : null}
      </div>
      <span className="compare-tile-arrow" aria-hidden>
        →
      </span>
    </button>
  )
}
