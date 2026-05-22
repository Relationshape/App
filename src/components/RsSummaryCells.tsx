// Phase-04 D-06. Per-dataset summary cells rendered inside a Fabi-mode cat-card.
// Port of public/legacy/js/app.js:3193-3200 (`summaryCellsHTML`).
//
// CSS already present in src/styles/legacy-components.css:
//   .cat-card-summary  (lines 730-734)
//   .cell / .cell.muted (existing utility classes used by legacy `.cell` spans).

import type { ChartDataset } from '@/components/charts/types'
import { categoryAverage, closestScaleEntry } from '@/lib/charts/math'
import { localizeStep } from '@/lib/data/locale'
import { getLang } from '@/lib/i18n/i18n'

export interface RsSummaryCellsProps {
  datasets: readonly ChartDataset[]
  catId: string
}

export function RsSummaryCells({ datasets, catId }: RsSummaryCellsProps) {
  const lang = getLang()
  return (
    <div className="cat-card-summary" data-testid="cat-card-summary">
      {datasets.map((ds, i) => {
        const scale = ds.scale ?? []
        const avg = categoryAverage(ds.answers, catId, scale)
        if (avg == null) {
          return (
            <span key={`${ds.id}-${i}`} className="cell muted" data-testid="cat-summary-cell-muted">
              —
            </span>
          )
        }
        const step = closestScaleEntry(avg.value, scale)
        const color = step?.color ?? '#7c3aed'
        const label = step ? localizeStep(step, lang).label : ''
        return (
          <span
            key={`${ds.id}-${i}`}
            className="cell"
            data-testid="cat-summary-cell"
            title={label}
            style={{
              background: `${color}33`,
              color,
              borderColor: `${color}55`,
            }}
          >
            <span className="cat-summary-label">{label}</span>
          </span>
        )
      })}
    </div>
  )
}
