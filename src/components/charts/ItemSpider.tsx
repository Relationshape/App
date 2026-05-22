// RESULT-04, D-04. Per-category item-level spider. Port of public/legacy/js/charts.js:333-371.
//
// Changes from v1:
// - Only axes that have at least one answer across any dataset are shown.
// - Answered values are plotted from MIN_FRAC of radius outward, so center = unanswered
//   and a lowest-scale answer shows as a small outward bump (comparison-visible distinction).
// - Axis label text is also a hover/click target for the tooltip.
// - Font size is capped at the 14-item reference — fewer items no longer cause oversized
//   fonts and a tiny polygon.
// - Built-in click-to-zoom dialog (size=800 viewBox, fills screen on all devices).

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { polarToCartesian, scaleMaxValue, wrapLabel } from '@/lib/charts/math'
import { enabledItemsForCat } from '@/lib/charts/items'
import { CATEGORIES } from '@/lib/data/data'
import { getItemLabel, localizeStep } from '@/lib/data/locale'
import { getLang, t } from '@/lib/i18n/i18n'
import type { ChartDataset } from './types'

interface Props {
  datasets: readonly ChartDataset[]
  catId: string
  size?: number
  /** When set, extract values from giving or receiving fields instead of scale. */
  grSide?: 'giving' | 'receiving'
  /** Pass false to disable click-to-zoom (used in the zoom dialog itself to prevent nesting). */
  zoomable?: boolean
}

// Cap at the 14-item reference so fewer items don't produce oversized fonts + tiny polygon.
// Only shrinks below reference for counts > 14 (linear, minimum 9).
// Reference: 14 items at size=800 → fs=19, which at 1:1 rendering is ~19px actual.
function itemLabelFontSize(itemCount: number, size: number): number {
  const ref14 = Math.round(Math.max(10, size * 0.024))
  return Math.round(Math.max(9, Math.min(ref14, ref14 * 14 / Math.max(14, itemCount))))
}

// Minimum normalised radius for answered items. Center (0) means "no answer"; MIN_FRAC
// means "answered with the lowest possible scale value" — visually distinct in comparisons.
const MIN_FRAC = 0.13

export function ItemSpider({ datasets, catId, size = 480, grSide, zoomable = true }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [clickedIdx, setClickedIdx] = useState<number | null>(null)
  const [enlarged, setEnlarged] = useState(false)
  // clickedIdx takes precedence — persists tooltip after touch/tap
  const activeIdx = clickedIdx ?? hoveredIdx
  const lang = getLang()
  const cat = CATEGORIES.find((c) => c.id === catId)
  const truncated = datasets.slice(0, 4)
  const catTitle = cat?.title
    ?? truncated[0]?.customCategories?.find((c) => c.id === catId)?.title
    ?? catId

  // Build union of all items across datasets
  const itemSet = new Set<string>()
  for (const ds of truncated) {
    const { base, custom } = enabledItemsForCat(ds.answers, catId)
    custom.forEach((item) => {
      const def = ds.customItemDefs?.[catId]?.[item]
      if (!def || def.format === 'scale') itemSet.add(`✶ ${item}`)
    })
    base.forEach((item) => itemSet.add(item))
  }
  const allItems = Array.from(itemSet)

  // Pre-compute per-dataset per-axis values (all items, before filtering)
  const allDataPoints = truncated.map((ds) => {
    const max = scaleMaxValue(ds.scale)
    return allItems.map((displayItem) => {
      const isCustom = displayItem.startsWith('✶ ')
      const key = isCustom ? displayItem.slice(2) : displayItem
      const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
      if (!cell) return { step: undefined as typeof ds.scale[0] | undefined, norm: 0, v: 0, answered: false }

      let scaleKey: string | undefined
      let fracVal: number | undefined

      if (grSide) {
        if (grSide === 'giving') {
          scaleKey = cell.giving ?? (cell.gr === 'G' || cell.gr === 'Both' ? cell.scale : undefined)
          fracVal = cell.givingFrac ?? (cell.gr === 'G' || cell.gr === 'Both' ? cell.scaleFrac : undefined)
        } else {
          scaleKey = cell.receiving ?? (cell.gr === 'R' || cell.gr === 'Both' ? cell.scale : undefined)
          fracVal = cell.receivingFrac ?? (cell.gr === 'R' || cell.gr === 'Both' ? cell.scaleFrac : undefined)
        }
        if (!scaleKey && fracVal == null) return { step: undefined as typeof ds.scale[0] | undefined, norm: 0, v: 0, answered: false }
      } else {
        // Normal (non-GR) mode — treat 'open' without scaleFrac as unanswered sentinel
        if (!cell.scale || (isCustom && cell.scale === 'open' && cell.scaleFrac == null)) {
          return { step: undefined as typeof ds.scale[0] | undefined, norm: 0, v: 0, answered: false }
        }
        scaleKey = cell.scale
        fracVal = cell.scaleFrac
      }

      const step = scaleKey ? ds.scale.find((s) => s.key === scaleKey) : undefined
      const v = step ? step.value : (fracVal !== undefined ? fracVal * max : 0)
      const norm = max > 0 ? v / max : 0
      return { step, norm, v, answered: true }
    })
  })

  // Filter to axes that have at least one answer across any dataset (req 1 & 2)
  const answeredIndices = allItems
    .map((_, i) => i)
    .filter((i) => allDataPoints.some((ds) => ds[i]?.answered))

  const items = answeredIndices.map((i) => allItems[i]!)
  const dataPoints = allDataPoints.map((ds) => answeredIndices.map((i) => ds[i]!))

  if (allItems.length === 0) return null
  if (items.length < 3) {
    return (
      <div className="rs-chart-wrap rs-item-spider" data-testid={`item-spider-${catId}`}>
        <p className="muted small text-center" data-testid={`item-spider-min-data-${catId}`}>
          {t('spider_min_data_hint')}
        </p>
      </div>
    )
  }

  const fs = itemLabelFontSize(items.length, size)
  const pad = Math.max(size * 0.25, Math.ceil(fs * 10.5))
  const r = Math.max(size * 0.12, size / 2 - pad)
  const cx = size / 2
  const cy = size / 2
  const lineHeight = fs * 1.15
  const maxCharsPerLine = Math.round(9 * Math.sqrt(size / 480))

  // Build tooltip data when an axis is hovered/clicked
  const tooltipData = activeIdx !== null ? {
    label: (() => {
      const raw = items[activeIdx] ?? ''
      const isCustom = raw.startsWith('✶ ')
      return isCustom ? raw.slice(2) : getItemLabel(catId, raw, lang)
    })(),
    rows: truncated
      .map((ds, di) => {
        const pt = dataPoints[di]?.[activeIdx]
        return pt?.step && pt.answered
          ? { name: ds.name, color: ds.color, stepLabel: localizeStep(pt.step, lang).label }
          : null
      })
      .filter((x): x is { name: string; color: string; stepLabel: string } => x !== null),
  } : null

  function renderSpider(isZoomed: boolean) {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${catTitle} items`}
        style={{ width: '100%', height: 'auto', maxWidth: isZoomed ? undefined : size }}
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

        {/* Dataset polygons — unanswered axes go to center (0), answered axes offset by MIN_FRAC */}
        {truncated.map((ds, di) => {
          const pts = items.map((_, i) => {
            const pt = dataPoints[di]?.[i]
            const plotNorm = pt?.answered ? (MIN_FRAC + pt.norm * (1 - MIN_FRAC)) : 0
            return polarToCartesian(i, items.length, r * plotNorm, cx, cy)
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

        {/* Answer-intersection dots */}
        {truncated.map((ds, di) =>
          items.map((_, i) => {
            const pt = dataPoints[di]?.[i]
            if (!pt?.answered) return null
            const plotNorm = MIN_FRAC + pt.norm * (1 - MIN_FRAC)
            const [px, py] = polarToCartesian(i, items.length, r * plotNorm, cx, cy)
            const active = activeIdx === i
            return (
              <circle
                key={`dot-${di}-${i}`}
                cx={px}
                cy={py}
                r={active ? Math.max(6, fs * 0.52) : Math.max(4, fs * 0.36)}
                fill={ds.color}
                stroke="var(--bg, #f2eeff)"
                strokeWidth={active ? 2 : 1.5}
                onPointerEnter={() => setHoveredIdx(i)}
                onPointerLeave={() => setHoveredIdx(null)}
                onClick={(e) => { e.stopPropagation(); setClickedIdx(clickedIdx === i ? null : i) }}
                style={{ cursor: 'pointer' }}
              />
            )
          })
        )}

        {/* Axis labels — hover/click targets in addition to the dots */}
        {items.map((displayItem, i) => {
          const [lx, ly] = polarToCartesian(i, items.length, r + fs * 1.7, cx, cy)
          const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'
          const isCustom = displayItem.startsWith('✶ ')
          const localizedItem = isCustom ? displayItem.slice(2) : getItemLabel(catId, displayItem, lang)
          const lines = wrapLabel(localizedItem, maxCharsPerLine).slice(0, 3)
          const yOffset = ((lines.length - 1) * lineHeight) / 2
          const isHovered = activeIdx === i
          return (
            <text
              key={`label-${i}`}
              x={lx}
              y={ly - yOffset}
              textAnchor={anchor}
              fontSize={isHovered ? Math.round(fs * 1.15) : fs}
              fontWeight={isHovered ? 700 : undefined}
              fill="currentColor"
              onPointerEnter={() => setHoveredIdx(i)}
              onPointerLeave={() => setHoveredIdx(null)}
              onClick={(e) => { e.stopPropagation(); setClickedIdx(clickedIdx === i ? null : i) }}
              style={{ cursor: 'pointer' }}
            >
              {lines.map((line, li) => (
                <tspan key={li} x={lx} dy={li === 0 ? 0 : lineHeight}>
                  {line}
                </tspan>
              ))}
            </text>
          )
        })}

        {/* Tooltip shown in chart centre when an axis is active */}
        {tooltipData && (() => {
          const tFs = Math.round(Math.max(17, Math.min(31, size / 13 * 0.7)))
          const tSmFs = Math.round(tFs * 0.88)
          const titleLines = wrapLabel(tooltipData.label, Math.round(26 * Math.sqrt(size / 480)))
          const titleLineH = tFs * 1.45
          const subLineH = tSmFs * 1.38
          const rowBlockH = subLineH * 2.1
          const gapH = tooltipData.rows.length > 0 ? subLineH * 0.55 : 0
          const boxW = Math.min(size * 0.62, size - 40)
          const boxH = titleLines.length * titleLineH + gapH + tooltipData.rows.length * rowBlockH + 20
          const boxX = cx - boxW / 2
          const boxY = cy - boxH / 2
          return (
            <g pointerEvents="none">
              <rect
                x={boxX} y={boxY} width={boxW} height={boxH} rx={8}
                fill="var(--surface, #111528)" fillOpacity={0.95}
                stroke="currentColor" strokeOpacity={0.15}
              />
              {titleLines.map((line, li) => (
                <text
                  key={`tl-${li}`}
                  x={cx} y={boxY + 10 + tFs * 0.88 + li * titleLineH}
                  textAnchor="middle" fontSize={tFs} fontWeight={700} fill="currentColor"
                >
                  {line}
                </text>
              ))}
              {tooltipData.rows.map((row, ri) => {
                const nameY = boxY + 12 + titleLines.length * titleLineH + gapH + ri * rowBlockH + tSmFs * 0.88
                const valY = nameY + subLineH
                return (
                  <g key={`tr-${ri}`}>
                    <circle cx={boxX + 14} cy={nameY - tSmFs * 0.28} r={tSmFs * 0.35} fill={row.color} />
                    <text x={boxX + 28} y={nameY} fontSize={tSmFs} fontWeight={600} fill={row.color}>
                      {row.name}
                    </text>
                    <text x={boxX + 28} y={valY} fontSize={tSmFs} fill="currentColor" fillOpacity={0.85}>
                      {row.stepLabel}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })()}
      </svg>
    )
  }

  return (
    <>
      <div
        className="rs-chart-wrap rs-item-spider"
        data-testid={`item-spider-${catId}`}
        onClick={() => {
          if (clickedIdx !== null) {
            setClickedIdx(null)
          } else if (zoomable) {
            setEnlarged(true)
          }
        }}
        style={{ cursor: zoomable ? 'zoom-in' : undefined }}
      >
        {renderSpider(false)}
      </div>
      {zoomable && (
        <p className="muted small text-center mt-1" style={{ opacity: 0.65 }} data-testid={`item-spider-hint-${catId}`}>
          {t('spider_hover_hint')} · {t('spider_click_to_enlarge')}
        </p>
      )}

      {zoomable && (
        <Dialog open={enlarged} onOpenChange={setEnlarged}>
          <DialogContent
            className="w-[min(96vw,92vh)] max-w-none p-3 flex items-center justify-center overflow-auto"
            data-testid={`item-spider-zoom-${catId}`}
          >
            <DialogTitle className="sr-only">{catTitle}</DialogTitle>
            <div className="w-full" onClick={(e) => e.stopPropagation()}>
              <ItemSpider
                datasets={datasets}
                catId={catId}
                size={800}
                {...(grSide !== undefined ? { grSide } : {})}
                zoomable={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
