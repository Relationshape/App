// Phase-04 D-05 + D-06. Shared cat-card primitive consumed by:
//   • src/routes/Result.tsx        — own-map result detail (Wave 3)
//   • src/routes/Compare.tsx       — compare overlay (Wave 2)
//
// Port of public/legacy/js/app.js:2838-2876 (`categoryCards` per-card body).
// Replaces the ad-hoc <RsTile>-based usage previously at Compare.tsx:173-189.
//
// CSS already present in src/styles/legacy-components.css:
//   .cat-card / .cat-card-btn / .cat-card-head / .cat-card-icon /
//   .cat-card-titles / .cat-card-toggle  (lines 685-742)
//   .cat-card.is-empty { opacity: .58 }   (line 710)
//   .cat-card-summary                     (lines 730-734) — Fabi-mode (deferred)
// No new CSS is added here.

import type { CSSProperties } from 'react'
import type { ChartDataset } from '@/components/charts/types'
import type { Result } from '@/lib/storage/types'
import type { CATEGORIES } from '@/lib/data/data'
import { getLang } from '@/lib/i18n/i18n'

type CategoryDef = (typeof CATEGORIES)[number]

export interface RsCategoryCardProps {
  cat: CategoryDef
  datasets: readonly ChartDataset[]
  /** When null/undefined AND filledCount === 0, the card is hidden entirely. */
  editableResult?: Result | null
  /** Reserved for Fabi-mode summary cells (deferred per CONTEXT.md D-06). */
  fabiMode?: boolean
  onClick: () => void
  testId?: string
}

/**
 * Counts answered entries in the given category across all datasets.
 * Ports public/legacy/js/app.js:2845-2853 verbatim:
 *   - `__custom`     → count keys in the nested object
 *   - `__hidden`     → skip (not an answer)
 *   - any other key  → count when the cell has a truthy `.scale`
 */
function computeFilledCount(
  datasets: readonly ChartDataset[],
  catId: string,
): number {
  return datasets.reduce((acc, ds) => {
    const slot = ds.answers?.[catId]
    if (!slot || typeof slot !== 'object') return acc
    let n = 0
    for (const [k, v] of Object.entries(slot)) {
      if (k === '__hidden') continue
      if (k === '__custom') {
        n += Object.keys((v as Record<string, unknown>) ?? {}).length
        continue
      }
      if ((v as { scale?: unknown })?.scale) n++
    }
    return acc + n
  }, 0)
}

export function RsCategoryCard({
  cat,
  datasets,
  editableResult,
  fabiMode: _fabiMode, // TODO(fabiMode): summary cells — deferred per D-06
  onClick,
  testId,
}: RsCategoryCardProps) {
  const filledCount = computeFilledCount(datasets, cat.id)

  // Hide entirely when there are no answers AND no editable result owns this map.
  if (filledCount === 0 && !editableResult) return null

  const isEmpty = filledCount === 0
  const className = `cat-card cat-card-btn${isEmpty ? ' is-empty' : ''}`

  const lang = getLang()
  const title = lang === 'de' && cat.de ? cat.de : cat.title
  const blurb = lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb

  const style = { ['--c' as 'color']: cat.color } as CSSProperties

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      data-testid={testId}
      aria-label={title}
    >
      <div className="cat-card-head">
        <div className="cat-card-icon">{cat.icon}</div>
        <div className="cat-card-titles">
          <h3>{title}</h3>
          <p className="muted small">{blurb}</p>
        </div>
        {/* TODO(fabiMode): port summaryCellsHTML from public/legacy/js/app.js — deferred per CONTEXT.md D-06. */}
        <span className="cat-card-toggle" aria-hidden>
          →
        </span>
      </div>
    </button>
  )
}
