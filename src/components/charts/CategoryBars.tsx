// RESULT-03, D-04. Per-category bar diff. Port of public/legacy/js/charts.js:373-422.
// Redesigned compare layout: each item shows a sub-row per dataset with the
// profile name next to the bar so answers to the same question are clearly
// stacked and attributed.

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
          <div className="rs-bar-item" key={displayItem}>
            <div className="rs-bar-item-label" title={displayItem}>
              {displayItem}
            </div>
            <div className="rs-bar-item-rows">
              {truncated.map((ds, di) => {
                const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
                const step = cell ? closestScaleEntry(
                  ds.scale.find((s) => s.key === cell.scale)?.value ?? 0,
                  ds.scale,
                ) : null
                if (!step) return null
                const max = scaleMaxValue(ds.scale)
                const pct = max > 0 ? (step.value / max) * 100 : 0
                return (
                  <div
                    key={di}
                    className="rs-bar-ds-row"
                    data-testid={`bar-row-${di}-${displayItem}`}
                  >
                    <span
                      className="rs-bar-ds-name"
                      style={{ color: ds.color }}
                    >
                      {ds.name}
                    </span>
                    <div className="rs-bar-track">
                      <div
                        className="rs-bar-fill"
                        style={{ width: `${pct}%`, background: ds.color }}
                        data-testid={`bar-cell-${di}-${displayItem}`}
                      />
                    </div>
                    <span className="rs-bar-label-text">
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
