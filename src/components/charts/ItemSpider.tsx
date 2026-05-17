// RESULT-04, D-04. Per-category item-level spider. Port of public/legacy/js/charts.js:333-371.
//
// Hover target: the colored dot at each answer's intersection with the axis (not the axis tip).
// Font size scales linearly with `size` — fullscreen (800px) renders ~67% larger than modal (480px).

import { useState } from 'react'
import { polarToCartesian, scaleMaxValue, wrapLabel } from '@/lib/charts/math'
import { enabledItemsForCat } from '@/lib/charts/items'
import { CATEGORIES } from '@/lib/data/data'
import type { ChartDataset } from './types'

interface Props {
  datasets: readonly ChartDataset[]
  catId: string
  size?: number
}

// Scales linearly with chart size. Capped at 16px to keep labels within the SVG viewBox.
// size=480 (modal):      7 items → 11px,  3 items → 16px (capped)
// size=800 (fullscreen): 7 items → 15px,  3 items → 16px (capped)
function itemLabelFontSize(itemCount: number, size: number): number {
  return Math.round(Math.max(10, Math.min(16, (100 * size / 480) / itemCount)))
}

export function ItemSpider({ datasets, catId, size = 480 }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) return null

  const truncated = datasets.slice(0, 4)
  const itemSet = new Set<string>()
  for (const ds of truncated) {
    const { base, custom } = enabledItemsForCat(ds.answers, catId)
    base.forEach((item) => itemSet.add(item))
    custom.forEach((item) => itemSet.add(`✶ ${item}`))
  }
  const items = Array.from(itemSet)
  if (items.length < 3) return null

  const fs = itemLabelFontSize(items.length, size)
  const pad = Math.max(100, Math.ceil(fs * 8.5))
  const r = size / 2 - pad
  const cx = size / 2
  const cy = size / 2
  const lineHeight = fs * 1.15
  const maxCharsPerLine = Math.round(9 * Math.sqrt(size / 480))

  // Pre-compute per-dataset per-axis values so we don't repeat lookups
  const dataPoints = truncated.map((ds) => {
    const max = scaleMaxValue(ds.scale)
    return items.map((displayItem) => {
      const isCustom = displayItem.startsWith('✶ ')
      const key = isCustom ? displayItem.slice(2) : displayItem
      const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
      const step = cell ? ds.scale.find((s) => s.key === cell.scale) : undefined
      const v = step ? step.value : 0
      const norm = max > 0 && v > 0 ? v / max : 0
      return { step, norm, v }
    })
  })

  // Build tooltip data when an axis is hovered
  const tooltipData = hoveredIdx !== null ? {
    label: items[hoveredIdx] ?? '',
    rows: truncated
      .map((ds, di) => {
        const pt = dataPoints[di]?.[hoveredIdx]
        return pt?.step && pt.v > 0
          ? { name: ds.name, color: ds.color, stepLabel: pt.step.label }
          : null
      })
      .filter((x): x is { name: string; color: string; stepLabel: string } => x !== null),
  } : null

  return (
    <div className="rs-chart-wrap rs-item-spider" data-testid={`item-spider-${catId}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${cat.title} items`}
        style={{ width: '100%', height: 'auto', maxWidth: size }}
      >
        {/* Grid rings */}
        {[1, 2, 3].map((g) => {
          const rr = (r * g) / 3
          const pts = items.map((_, i) => polarToCartesian(i, items.length, rr, cx, cy))
          return (
            <polygon
              key={`ring-${g}`}
              points={pts.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.08 * g}
            />
          )
        })}

        {/* Spokes */}
        {items.map((_, i) => {
          const [x, y] = polarToCartesian(i, items.length, r, cx, cy)
          return <line key={`spoke-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.2} />
        })}

        {/* Dataset polygons */}
        {truncated.map((ds, di) => {
          const pts = items.map((_, i) => {
            const norm = dataPoints[di]?.[i]?.norm ?? 0
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

        {/* Answer-intersection dots — these are the hover targets */}
        {truncated.map((ds, di) =>
          items.map((_, i) => {
            const pt = dataPoints[di]?.[i]
            if (!pt?.step || pt.v === 0) return null
            const [px, py] = polarToCartesian(i, items.length, r * pt.norm, cx, cy)
            const active = hoveredIdx === i
            return (
              <circle
                key={`dot-${di}-${i}`}
                cx={px}
                cy={py}
                r={active ? Math.max(6, fs * 0.52) : Math.max(4, fs * 0.36)}
                fill={ds.color}
                stroke="var(--bg, #07091a)"
                strokeWidth={active ? 2 : 1.5}
                onPointerEnter={() => setHoveredIdx(i)}
                onPointerLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              />
            )
          })
        )}

        {/* Axis labels — bold when their axis is hovered */}
        {items.map((displayItem, i) => {
          const [lx, ly] = polarToCartesian(i, items.length, r + fs * 1.7, cx, cy)
          const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'
          const lines = wrapLabel(displayItem, maxCharsPerLine)
          const yOffset = ((lines.length - 1) * lineHeight) / 2
          const isHovered = hoveredIdx === i
          return (
            <text
              key={`label-${i}`}
              x={lx}
              y={ly - yOffset}
              textAnchor={anchor}
              fontSize={isHovered ? Math.round(fs * 1.15) : fs}
              fontWeight={isHovered ? 700 : undefined}
            >
              {lines.map((line, li) => (
                <tspan key={li} x={lx} dy={li === 0 ? 0 : lineHeight}>
                  {line}
                </tspan>
              ))}
            </text>
          )
        })}

        {/* Tooltip shown in chart centre when a data-point dot is hovered */}
        {tooltipData && (() => {
          const tFs = Math.round(Math.max(12, Math.min(22, size / 26)))
          const tSmFs = Math.round(tFs * 0.82)
          const titleLines = wrapLabel(tooltipData.label, Math.round(24 * Math.sqrt(size / 480)))
          const rowH = tFs * 1.55
          const totalRows = titleLines.length
            + (tooltipData.rows.length > 0 ? 0.4 : 0)  // small gap
            + tooltipData.rows.length
          const boxW = Math.min(size * 0.62, size - 40)
          const boxH = totalRows * rowH + 20
          const boxX = cx - boxW / 2
          const boxY = cy - boxH / 2

          return (
            <g pointerEvents="none">
              <rect
                x={boxX}
                y={boxY}
                width={boxW}
                height={boxH}
                rx={8}
                fill="var(--surface, #111528)"
                fillOpacity={0.95}
                stroke="currentColor"
                strokeOpacity={0.15}
              />
              {/* Item name */}
              {titleLines.map((line, li) => (
                <text
                  key={`tl-${li}`}
                  x={cx}
                  y={boxY + 10 + tFs * (li + 0.88)}
                  textAnchor="middle"
                  fontSize={tFs}
                  fontWeight={700}
                >
                  {line}
                </text>
              ))}
              {/* Per-dataset answer rows */}
              {tooltipData.rows.map((row, ri) => {
                const rowY = boxY + 12
                  + tFs * (titleLines.length + 0.4 + ri) * 1.55
                return (
                  <g key={`tr-${ri}`}>
                    <circle
                      cx={boxX + 14}
                      cy={rowY - tSmFs * 0.28}
                      r={tSmFs * 0.33}
                      fill={row.color}
                    />
                    <text
                      x={boxX + 26}
                      y={rowY}
                      fontSize={tSmFs}
                      fontWeight={600}
                      fill={row.color}
                    >
                      {row.name}
                    </text>
                    <text
                      x={boxX + boxW - 10}
                      y={rowY}
                      fontSize={tSmFs}
                      textAnchor="end"
                    >
                      {row.stepLabel}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
