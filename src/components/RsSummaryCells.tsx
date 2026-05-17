// Phase-04 D-06. Per-dataset summary cells rendered inside a Fabi-mode cat-card.
// Port of public/legacy/js/app.js:3193-3200 (`summaryCellsHTML`).
//
// CSS already present in src/styles/legacy-components.css:
//   .cat-card-summary  (lines 730-734)
//   .cell / .cell.muted (existing utility classes used by legacy `.cell` spans).

import type { ChartDataset } from '@/components/charts/types'
import { categoryAverage, closestScaleEntry } from '@/lib/charts/math'

export interface RsSummaryCellsProps {
  datasets: readonly ChartDataset[]
  catId: string
}

export function RsSummaryCells({ datasets, catId }: RsSummaryCellsProps) {
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
        const short = step?.short ?? ''
        return (
          <span
            key={`${ds.id}-${i}`}
            className="cell"
            data-testid="cat-summary-cell"
            style={{
              background: `${color}33`,
              color,
              borderColor: `${color}55`,
            }}
          >
            {short}
          </span>
        )
      })}
    </div>
  )
}
