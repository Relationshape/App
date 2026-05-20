// Builds a static, self-contained SVG string for a per-category spider chart.
// Reuses the exact same math utilities as ItemSpider.tsx so any future changes
// to polarToCartesian / scaleMaxValue / wrapLabel / enabledItemsForCat automatically
// flow into the PDF output without manual updates.

import { polarToCartesian, scaleMaxValue, wrapLabel } from '@/lib/charts/math'
import { enabledItemsForCat } from '@/lib/charts/items'
import { getItemLabel } from '@/lib/data/locale'
import type { ChartDataset } from '@/components/charts/types'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Mirror of ItemSpider.itemLabelFontSize — same formula, same scaling behaviour.
function itemLabelFontSize(itemCount: number, size: number): number {
  const cap = Math.round(size * 0.045)
  return Math.round(Math.max(10, Math.min(cap, (160 * size / 480) / itemCount)))
}

export interface SpiderSvgResult {
  svg: string
  /** Number of items with at least one answered data-point (mirrors ItemSpider guard). */
  answeredItemCount: number
}

/**
 * Returns an SVG string for the per-category spider chart suitable for embedding
 * in a PDF (white background, no interactive state, no CSS variables).
 * Returns null when the category has no items or fewer than 2 answered items
 * (mirrors ItemSpider's early-return guard).
 * grSide: when set, extract giving or receiving values instead of scale (for GR categories).
 */
export function buildSpiderSvg(
  datasets: readonly ChartDataset[],
  catId: string,
  size: number,
  lang: string,
  grSide?: 'giving' | 'receiving',
): SpiderSvgResult | null {
  const truncated = datasets.slice(0, 4)

  // Collect items — identical logic to ItemSpider
  const itemSet = new Set<string>()
  for (const ds of truncated) {
    const { base, custom } = enabledItemsForCat(ds.answers, catId)
    custom.forEach((item) => {
      const def = ds.customItemDefs?.[catId]?.[item]
      if (!def || def.format === 'scale') itemSet.add(`✶ ${item}`)
    })
    base.forEach((item) => itemSet.add(item))
  }
  const items = Array.from(itemSet)
  if (items.length === 0) return null

  const fs = itemLabelFontSize(items.length, size)
  const pad = Math.max(120, Math.ceil(fs * 10.5))
  const r = size / 2 - pad
  const cx = size / 2
  const cy = size / 2
  const lineHeight = fs * 1.15
  const maxCharsPerLine = Math.round(9 * Math.sqrt(size / 480))

  // Compute data points — mirrors ItemSpider grSide logic
  const dataPoints = truncated.map((ds) => {
    const max = scaleMaxValue(ds.scale)
    return items.map((displayItem) => {
      const isCustom = displayItem.startsWith('✶ ')
      const key = isCustom ? displayItem.slice(2) : displayItem
      const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
      if (!cell) return { norm: 0, v: 0, step: undefined as typeof ds.scale[0] | undefined }

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
      } else {
        if (!cell.scale || (isCustom && cell.scale === 'open' && cell.scaleFrac == null)) return { norm: 0, v: 0, step: undefined as typeof ds.scale[0] | undefined }
        scaleKey = cell.scale
        fracVal = cell.scaleFrac
      }

      const step = scaleKey ? ds.scale.find((s) => s.key === scaleKey) : undefined
      const v = step ? step.value : (fracVal !== undefined ? fracVal * max : 0)
      const norm = max > 0 && v > 0 ? v / max : 0
      return { norm, v, step }
    })
  })

  const answeredItemCount = items.filter((_, i) =>
    dataPoints.some((ds) => (ds[i]?.v ?? 0) > 0),
  ).length
  if (answeredItemCount < 2) return { svg: '', answeredItemCount }

  const parts: string[] = []

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `width="${size}" height="${size}" ` +
    `style="color:#222;font-family:system-ui,-apple-system,Helvetica,sans-serif">`,
  )
  parts.push(`<rect width="${size}" height="${size}" fill="white"/>`)

  // Grid rings
  for (const g of [1, 2, 3]) {
    const rr = (r * g) / 3
    const pts = items.map((_, i) => polarToCartesian(i, items.length, rr, cx, cy).join(',')).join(' ')
    parts.push(`<polygon points="${pts}" fill="none" stroke="#222" stroke-opacity="${(0.08 * g).toFixed(2)}"/>`)
  }

  // Spokes
  for (let i = 0; i < items.length; i++) {
    const [x, y] = polarToCartesian(i, items.length, r, cx, cy)
    parts.push(`<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#222" stroke-opacity="0.2"/>`)
  }

  // Dataset polygons
  for (let di = 0; di < truncated.length; di++) {
    const ds = truncated[di]!
    const pts = items.map((_, i) => {
      const norm = dataPoints[di]?.[i]?.norm ?? 0
      return polarToCartesian(i, items.length, r * norm, cx, cy).map((v) => v.toFixed(1)).join(',')
    }).join(' ')
    parts.push(`<polygon points="${pts}" fill="${ds.color}" fill-opacity="0.25" stroke="${ds.color}" stroke-width="2"/>`)
  }

  // Answer dots
  for (let di = 0; di < truncated.length; di++) {
    const ds = truncated[di]!
    for (let i = 0; i < items.length; i++) {
      const pt = dataPoints[di]?.[i]
      if (!pt || pt.v === 0) continue
      const [px, py] = polarToCartesian(i, items.length, r * pt.norm, cx, cy)
      const dotR = Math.max(4, fs * 0.36)
      parts.push(
        `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${dotR.toFixed(1)}" ` +
        `fill="${ds.color}" stroke="white" stroke-width="1.5"/>`,
      )
    }
  }

  // Axis labels
  for (let i = 0; i < items.length; i++) {
    const displayItem = items[i]!
    const [lx, ly] = polarToCartesian(i, items.length, r + fs * 1.7, cx, cy)
    const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'
    const isCustom = displayItem.startsWith('✶ ')
    const rawLabel = isCustom ? displayItem.slice(2) : getItemLabel(catId, displayItem, lang)
    const lines = wrapLabel(rawLabel, maxCharsPerLine).slice(0, 3)
    const yOffset = ((lines.length - 1) * lineHeight) / 2

    parts.push(`<text x="${lx.toFixed(1)}" y="${(ly - yOffset).toFixed(1)}" text-anchor="${anchor}" font-size="${fs}" fill="#222">`)
    lines.forEach((line, li) => {
      parts.push(`<tspan x="${lx.toFixed(1)}" dy="${(li === 0 ? 0 : lineHeight).toFixed(1)}">${escapeXml(line)}</tspan>`)
    })
    parts.push('</text>')
  }

  parts.push('</svg>')
  return { svg: parts.join(''), answeredItemCount }
}
