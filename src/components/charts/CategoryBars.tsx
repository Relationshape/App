// RESULT-03, D-04. Per-category bar diff. Port of public/legacy/js/charts.js:373-422.

import { CATEGORIES } from '@/lib/data/data'
import { enabledItemsForCat } from '@/lib/charts/items'
import { scaleMaxValue, closestScaleEntry } from '@/lib/charts/math'
import type { ChartDataset } from './types'

interface Props { datasets: readonly ChartDataset[]; catId: string }

export function CategoryBars({ datasets, catId }: Props) {
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) return null
  const truncated = datasets.slice(0, 4)
  const itemSet = new Set<string>()
  for (const ds of truncated) {
    const { base, custom } = enabledItemsForCat(ds.answers, catId)
    base.forEach((i) => itemSet.add(i))
    custom.forEach((i) => itemSet.add(`✶ ${i}`))
  }
  const items = Array.from(itemSet).filter((item) => {
    const isCustom = item.startsWith('✶ ')
    const key = isCustom ? item.slice(2) : item
    return truncated.some((ds) => {
      const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
      if (!cell) return false
      const step = ds.scale.find((s) => s.key === cell.scale)
      return step != null
    })
  })

  return (
    <div className="rs-bars" data-testid={`category-bars-${catId}`}>
      {items.map((displayItem) => {
        const isCustom = displayItem.startsWith('✶ ')
        const key = isCustom ? displayItem.slice(2) : displayItem
        return (
          <div className="rs-bar-row flex items-center gap-2 py-1" key={displayItem}>
            <div className="rs-bar-label w-40 truncate" title={displayItem}>
              {displayItem}{/* React text node — XSS-safe */}
            </div>
            <div className="rs-bar-cells flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${truncated.length}, 1fr)` }}>
              {truncated.map((ds, di) => {
                const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
                if (!cell) {
                  return <div key={di} className="h-3" data-testid={`bar-cell-empty-${di}-${displayItem}`} />
                }
                const step = closestScaleEntry(
                  ds.scale.find((s) => s.key === cell.scale)?.value ?? 0,
                  ds.scale,
                )
                const max = scaleMaxValue(ds.scale)
                const width = max > 0 && step ? `${(step.value / max) * 100}%` : '0%'
                return (
                  <div
                    key={di}
                    className="h-3 rounded"
                    data-testid={`bar-cell-${di}-${displayItem}`}
                    style={{ background: step?.color, width }}
                    title={`${ds.name}: ${step?.label ?? ''}`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
