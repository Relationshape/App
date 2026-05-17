// RESULT-02, D-04, D-05. Declarative SVG spider. Port of public/legacy/js/charts.js:303-322 + 137-300.

import { CATEGORIES, DEFAULT_SCALE } from '@/lib/data/data'
import { categoryAverage, labelFontSize, pickCategoryAxes, polarToCartesian, wrapLabel } from '@/lib/charts/math'
import type { ChartDataset } from './types'

interface Props {
  datasets: readonly ChartDataset[]
  size?: number  // default 640
  axes?: readonly string[]  // override; otherwise pickCategoryAxes
  activeAxis?: string | null
  onAxisEnter?: (axis: string) => void
  onAxisLeave?: () => void
  onAxisTap?: (axis: string) => void
  onChartTap?: () => void  // open enlarged modal
}

export function Spider({
  datasets,
  size = 640,
  axes: axesOverride,
  activeAxis,
  onAxisEnter,
  onAxisLeave,
  onAxisTap,
  onChartTap,
}: Props) {
  const truncatedDatasets = datasets.slice(0, 4)  // D-35
  // pickCategoryAxes needs a defaultScale; use first dataset's scale or DEFAULT_SCALE
  const defaultScale = truncatedDatasets[0]?.scale ?? DEFAULT_SCALE
  const candidates = axesOverride ?? pickCategoryAxes(truncatedDatasets, defaultScale)
  const axes = candidates.map((id) => {
    const c = CATEGORIES.find((x) => x.id === id)
    return { key: id, title: c?.title ?? id, icon: c?.icon ?? '•' }
  })
  const fs = labelFontSize(axes.length)
  const lineHeight = fs * 1.2
  // maxChars chosen so most category names fit in 1-2 lines with room for the 3rd
  const maxCharsPerLine = Math.max(10, Math.round(200 / fs))
  // Extra padding when labels can wrap to 2-3 lines
  const pad = Math.max(110, Math.min(165, Math.ceil(fs * 5.0)))
  const r = size / 2 - pad
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="rs-chart-wrap" data-testid="spider-chart">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Spider chart"
        onClick={onChartTap}
      >
        {/* Rings */}
        {[1, 2, 3, 4, 5].map((g) => {
          const rr = (r * g) / 5
          const pts = axes.map((_, i) => polarToCartesian(i, axes.length, rr, cx, cy))
          return (
            <polygon
              key={`ring-${g}`}
              className="rs-grid-ring"
              points={pts.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.08 * g}
            />
          )
        })}
        {/* Spokes */}
        {axes.map((_, i) => {
          const [x, y] = polarToCartesian(i, axes.length, r, cx, cy)
          return <line key={`spoke-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.2} />
        })}
        {/* Datasets — text labels via React text node ⇒ XSS-safe by construction (D-05) */}
        {truncatedDatasets.map((ds, di) => {
          const pts = axes.map((ax, i) => {
            const avg = categoryAverage(ds.answers, ax.key, ds.scale)
            const norm = avg ? Math.max(0, Math.min(1, avg.norm)) : 0
            return polarToCartesian(i, axes.length, r * norm, cx, cy)
          })
          return (
            <polygon
              key={`ds-${ds.id ?? di}`}
              data-testid={`dataset-poly-${di}`}
              points={pts.map((p) => p.join(',')).join(' ')}
              fill={ds.color}
              fillOpacity={0.25}
              stroke={ds.color}
              strokeWidth={2}
            />
          )
        })}
        {/* Axis labels with per-handler event binding */}
        {axes.map((ax, i) => {
          const [lx, ly] = polarToCartesian(i, axes.length, r + fs * 1.8, cx, cy)
          const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'
          const isActive = activeAxis === ax.key
          const lines = wrapLabel(ax.title, maxCharsPerLine).slice(0, 3)
          const yOffset = ((lines.length - 1) * lineHeight) / 2
          return (
            <g
              key={`axis-${ax.key}`}
              data-axis={ax.key}
              data-state={isActive ? 'active' : 'inactive'}
              onPointerEnter={() => onAxisEnter?.(ax.key)}
              onPointerLeave={() => onAxisLeave?.()}
              onClick={(e) => { e.stopPropagation(); onAxisTap?.(ax.key) }}
            >
              <text
                x={lx}
                y={ly - yOffset}
                textAnchor={anchor}
                fontSize={fs}
                fill="currentColor"
                className={isActive ? 'is-active font-medium' : ''}
              >
                {lines.map((line, li) => (
                  <tspan key={li} x={lx} dy={li === 0 ? 0 : lineHeight}>{line}</tspan>
                ))}
              </text>
              <text x={lx} y={ly - yOffset - fs * 1.0} textAnchor={anchor} fontSize={fs * 0.7} fill="currentColor" fillOpacity={0.7} aria-hidden="true">
                {ax.icon}
              </text>
            </g>
          )
        })}
        {/* Dataset legend at top */}
        {truncatedDatasets.length > 0 && (
          <g data-testid="spider-legend">
            {truncatedDatasets.map((ds, di) => (
              <g key={`legend-${di}`} transform={`translate(${10}, ${10 + di * 18})`}>
                <rect width={12} height={12} fill={ds.color} />
                <text x={18} y={10} fontSize={12} fill="currentColor">
                  {ds.name}{/* React text node — XSS-safe */}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}
