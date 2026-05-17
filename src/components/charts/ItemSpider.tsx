// RESULT-04, D-04. Per-category item-level spider. Port of public/legacy/js/charts.js:333-371.
//
// Quick task 260516-ex7: tightened the label font formula so the chart is readable
// inside the CategoryModal (legacy `labelFontSize` returns 18-34px, which renders
// ~31px for 7 items — way too big for a 520px modal chart). Long labels now wrap
// onto multiple lines via `<tspan>` so titles like "Gemeinsamen Kommunikationsstil
// finden" don't overflow the SVG bounds.

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

// Tighter font scale than `labelFontSize`: 11-18px (vs. 18-34px).
// 7 axes -> ~18px; 9 axes -> ~14px; 14 axes -> ~11px.
function itemLabelFontSize(itemCount: number): number {
  return Math.round(Math.max(11, Math.min(18, 130 / itemCount)))
}

export function ItemSpider({ datasets, catId, size = 480 }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
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
  const fs = itemLabelFontSize(items.length)
  // Multi-line labels need a touch more vertical room than single-line — bump
  // the padding multiplier from 4 to 5.
  const pad = Math.max(90, Math.ceil(fs * 5))
  const r = size / 2 - pad
  const cx = size / 2
  const cy = size / 2
  const lineHeight = fs * 1.1
  // 16 chars/line is a reasonable default at 11-18px and 480-520px chart widths.
  const maxCharsPerLine = 16

  return (
    <div className="rs-chart-wrap rs-item-spider" data-testid={`item-spider-${catId}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${cat.title} items`}
        style={{ width: '100%', height: 'auto', maxWidth: size }}
      >
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
          const [nx, ny] = polarToCartesian(i, items.length, r, cx, cy)
          const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'
          const lines = wrapLabel(displayItem, maxCharsPerLine)
          const yOffset = ((lines.length - 1) * lineHeight) / 2
          const isHovered = hoveredIdx === i
          return (
            <g
              key={`label-${i}`}
              onPointerEnter={() => setHoveredIdx(i)}
              onPointerLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'default' }}
            >
              {/* Invisible hit circle at axis tip */}
              <circle cx={nx} cy={ny} r={Math.max(14, fs * 1.2)} fill="transparent" />
              <text
                x={lx}
                y={ly - yOffset}
                textAnchor={anchor}
                fontSize={isHovered ? fs * 1.4 : fs}
                fontWeight={isHovered ? 700 : undefined}
                fill={isHovered ? 'currentColor' : undefined}
                style={{ transition: 'font-size .15s ease' }}
              >
                {lines.map((line, li) => (
                  <tspan key={li} x={lx} dy={li === 0 ? 0 : lineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
        {/* Centered tooltip when a node is hovered */}
        {hoveredIdx !== null && (() => {
          const label = items[hoveredIdx] ?? ''
          const tooltipFs = Math.round(Math.max(14, Math.min(22, size / 20)))
          const tooltipLines = wrapLabel(label, 20)
          const boxW = size * 0.55
          const boxH = tooltipLines.length * tooltipFs * 1.4 + 12
          return (
            <g pointerEvents="none">
              <rect
                x={cx - boxW / 2}
                y={cy - boxH / 2}
                width={boxW}
                height={boxH}
                rx={6}
                fill="var(--surface-1, #fff)"
                fillOpacity={0.92}
                stroke="currentColor"
                strokeOpacity={0.12}
              />
              {tooltipLines.map((line, li) => (
                <text
                  key={li}
                  x={cx}
                  y={cy - boxH / 2 + 8 + tooltipFs * (li + 0.85)}
                  textAnchor="middle"
                  fontSize={tooltipFs}
                  fontWeight={600}
                >
                  {line}
                </text>
              ))}
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
