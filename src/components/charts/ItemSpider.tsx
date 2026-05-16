// RESULT-04, D-04. Per-category item-level spider. Port of public/legacy/js/charts.js:333-371.

import { polarToCartesian, labelFontSize, scaleMaxValue } from '@/lib/charts/math'
import { enabledItemsForCat } from '@/lib/charts/items'
import { CATEGORIES } from '@/lib/data/data'
import type { ChartDataset } from './types'

interface Props {
  datasets: readonly ChartDataset[]
  catId: string
  size?: number
}

export function ItemSpider({ datasets, catId, size = 480 }: Props) {
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) return null
  const truncated = datasets.slice(0, 4)
  // Union of all items (base + custom) across datasets
  const itemSet = new Set<string>()
  for (const ds of truncated) {
    const { base, custom } = enabledItemsForCat(ds.answers, catId)
    base.forEach((i) => itemSet.add(i))
    custom.forEach((i) => itemSet.add(`✶ ${i}`))
  }
  const items = Array.from(itemSet)
  if (items.length < 3) return null  // need ≥3 axes to form a polygon
  const fs = labelFontSize(items.length)
  const pad = Math.max(80, Math.ceil(fs * 4))
  const r = size / 2 - pad
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="rs-chart-wrap rs-item-spider" data-testid={`item-spider-${catId}`}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${cat.title} items`}>
        {[1, 2, 3].map((g) => {
          const rr = (r * g) / 3
          const pts = items.map((_, i) => polarToCartesian(i, items.length, rr, cx, cy))
          return <polygon key={`ring-${g}`} points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="currentColor" strokeOpacity={0.08 * g} />
        })}
        {items.map((_, i) => {
          const [x, y] = polarToCartesian(i, items.length, r, cx, cy)
          return <line key={`spoke-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.2} />
        })}
        {truncated.map((ds, di) => {
          const max = scaleMaxValue(ds.scale)
          const pts = items.map((displayItem, i) => {
            const isCustom = displayItem.startsWith('✶ ')
            const key = isCustom ? displayItem.slice(2) : displayItem
            const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
            const scaleStep = cell && ds.scale.find((s) => s.key === cell.scale)
            const v = scaleStep ? scaleStep.value : 0
            const norm = max ? v / max : 0
            return polarToCartesian(i, items.length, r * norm, cx, cy)
          })
          return (
            <polygon
              key={`ds-${ds.id ?? di}`}
              data-testid={`item-spider-poly-${di}`}
              points={pts.map((p) => p.join(',')).join(' ')}
              fill={ds.color}
              fillOpacity={0.25}
              stroke={ds.color}
              strokeWidth={2}
            />
          )
        })}
        {items.map((displayItem, i) => {
          const [lx, ly] = polarToCartesian(i, items.length, r + fs * 1.6, cx, cy)
          const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'
          return (
            <text key={`label-${i}`} x={lx} y={ly} textAnchor={anchor} fontSize={fs}>
              {displayItem}{/* React text node — XSS-safe */}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
