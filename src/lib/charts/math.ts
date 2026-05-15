// src/lib/charts/math.ts
// RESULT-01..08, D-04. Pure math helpers ported from public/legacy/js/charts.js.
// All functions are PURE — take scale as an explicit parameter, never call Store.getScale().
// Plan 4 shares these with questionnaire; Plan 5 chart components depend on them.

import { CATEGORIES, SPIDER_AXES } from '@/lib/data/data'
import type { MutableScaleStep } from '@/lib/data/types'
import type { AnswersBlob, CategoryAnswers } from '@/lib/storage/types'

// Re-export types used by callers.
export interface CategoryProgress { answered: number; total: number }
export interface CategoryAvgResult { value: number; norm: number }
export interface AnswerAvgResult {
  value: number
  norm: number
  scaleEntry: MutableScaleStep
  entry: CategoryAnswers[string]
}

// ── Scale helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the maximum numeric value in a scale array.
 * public/legacy/js/charts.js:24-28
 */
export function scaleMaxValue(scale: readonly MutableScaleStep[]): number {
  let m = -Infinity
  for (const s of scale) if (s.value > m) m = s.value
  return m
}

// ── Answer value helpers ──────────────────────────────────────────────────────

type AnswerEntry = CategoryAnswers[string]

/**
 * Push numeric scale value(s) from an answer entry into the values array.
 * Supports discrete key answers and fractional positions.
 * public/legacy/js/charts.js:32-50
 */
export function pushAnswerValues(
  entry: AnswerEntry | undefined,
  scale: readonly MutableScaleStep[],
  byKey: (k: string) => MutableScaleStep | undefined,
  values: number[],
): void {
  if (!entry) return
  const maxV = scaleMaxValue(scale)
  const e = entry as Record<string, unknown>
  if (e['giving'] !== undefined || e['receiving'] !== undefined ||
      e['givingFrac'] !== undefined || e['receivingFrac'] !== undefined) {
    const gv = e['givingFrac'] !== undefined
      ? (e['givingFrac'] as number) * maxV
      : (e['giving'] && byKey(e['giving'] as string) ? byKey(e['giving'] as string)!.value : null)
    const rv = e['receivingFrac'] !== undefined
      ? (e['receivingFrac'] as number) * maxV
      : (e['receiving'] && byKey(e['receiving'] as string) ? byKey(e['receiving'] as string)!.value : null)
    if (gv != null) values.push(gv)
    if (rv != null) values.push(rv)
  } else if (e['scaleFrac'] !== undefined) {
    values.push((e['scaleFrac'] as number) * maxV)
  } else if (entry.scale && byKey(entry.scale)) {
    values.push(byKey(entry.scale)!.value)
  }
}

/**
 * Compute the average normalised value across all items in a category.
 * Returns null when no items are answered.
 * public/legacy/js/charts.js:52-65
 */
export function categoryAverage(
  answers: AnswersBlob | undefined,
  catId: string,
  scale: readonly MutableScaleStep[],
): CategoryAvgResult | null {
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) return null
  const max = scaleMaxValue(scale)
  const byKey = (k: string) => scale.find((s) => s.key === k)
  const values: number[] = []
  const slot = answers?.[catId] ?? {}
  for (const item of cat.items) pushAnswerValues(slot[item], scale, byKey, values)
  for (const k of Object.keys(slot.__custom ?? {})) {
    pushAnswerValues(slot.__custom![k], scale, byKey, values)
  }
  if (!values.length) return null
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return { value: avg, norm: max ? avg / max : 0 }
}

/**
 * Extract the primary scale key from an answer entry (the key shown as the answer).
 * public/legacy/js/charts.js:67-74
 */
export function answerScaleKey(entry: AnswerEntry | undefined): string | null {
  if (!entry) return null
  const e = entry as Record<string, unknown>
  if (e['giving'] !== undefined || e['receiving'] !== undefined ||
      e['givingFrac'] !== undefined || e['receivingFrac'] !== undefined) {
    return (e['giving'] as string | undefined) ?? (e['receiving'] as string | undefined) ?? null
  }
  return entry.scale ?? (e['scaleFrac'] !== undefined ? null : null)
}

/**
 * Compute the average normalised value for a single answer entry, with scale-entry reference.
 * public/legacy/js/charts.js:76-101
 */
export function answerAvgValue(
  entry: AnswerEntry | undefined,
  scale: readonly MutableScaleStep[],
): AnswerAvgResult | null {
  if (!entry) return null
  const max = scaleMaxValue(scale)
  const byKey = (k: string) => scale.find((s) => s.key === k)
  const e = entry as Record<string, unknown>
  if (e['giving'] !== undefined || e['receiving'] !== undefined ||
      e['givingFrac'] !== undefined || e['receivingFrac'] !== undefined) {
    const gv = e['givingFrac'] !== undefined
      ? (e['givingFrac'] as number) * max
      : (e['giving'] ? byKey(e['giving'] as string)?.value ?? null : null)
    const rv = e['receivingFrac'] !== undefined
      ? (e['receivingFrac'] as number) * max
      : (e['receiving'] ? byKey(e['receiving'] as string)?.value ?? null : null)
    if (gv == null && rv == null) return null
    const avg = (gv != null && rv != null) ? (gv + rv) / 2 : (gv ?? rv!)
    const ref = byKey((e['giving'] as string | undefined) ?? (e['receiving'] as string | undefined) ?? '') ??
      scale[Math.min(scale.length - 1, Math.round(avg / Math.max(1, max) * (scale.length - 1)))]
    if (!ref) return null
    return { value: avg, norm: max ? avg / max : 0, scaleEntry: ref, entry }
  }
  if (e['scaleFrac'] !== undefined) {
    const frac = e['scaleFrac'] as number
    const value = frac * max
    const idx = Math.min(scale.length - 1, Math.round(frac * (scale.length - 1)))
    const scaleEntry = scale[idx]
    if (!scaleEntry) return null
    return { value, norm: frac, scaleEntry, entry }
  }
  const sc = byKey(entry.scale ?? '')
  if (!sc) return null
  return { value: sc.value, norm: max ? sc.value / max : 0, scaleEntry: sc, entry }
}

// ── Category axes helpers ─────────────────────────────────────────────────────

/**
 * Determine which category axes to show on the overview spider.
 * Prefers SPIDER_AXES that have data; falls back to all categories with data; last resort SPIDER_AXES.
 * public/legacy/js/charts.js:324-330
 */
export function pickCategoryAxes(
  datasets: Array<{ answers?: AnswersBlob; scale?: readonly MutableScaleStep[] }>,
  defaultScale: readonly MutableScaleStep[],
): string[] {
  const filledIn = (id: string) =>
    datasets.some((d) => categoryAverage(d.answers, id, d.scale ?? defaultScale) != null)
  const preferred = (SPIDER_AXES as readonly string[]).filter(filledIn)
  if (preferred.length >= 3) return [...preferred]
  const expanded = CATEGORIES.map((c) => c.id).filter(filledIn)
  if (expanded.length >= 3) return expanded
  return [...SPIDER_AXES]
}

// ── Label / geometry helpers ──────────────────────────────────────────────────

/**
 * Compute adaptive font size for axis labels based on number of axes.
 * Min 18px (readable), max 34px (sparse charts).
 * public/legacy/js/charts.js:114-116
 */
export function labelFontSize(axisCount: number): number {
  return Math.round(Math.max(18, Math.min(34, 220 / axisCount)))
}

/**
 * Word-wrap label text into lines of at most maxChars characters.
 * public/legacy/js/charts.js:119-134
 */
export function wrapLabel(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? current + ' ' + word : word
    if (candidate.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}

/**
 * Convert polar coordinates to Cartesian [x, y] for SVG rendering.
 * i = axis index, n = total axis count, radius = ring radius, cx/cy = center.
 * Renamed from `angle` (v1.0 private) to the more descriptive `polarToCartesian`.
 * public/legacy/js/charts.js:469-472
 */
export function polarToCartesian(
  i: number,
  n: number,
  radius: number,
  cx: number,
  cy: number,
): [number, number] {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2
  return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]
}

/**
 * Find the scale entry whose numeric value is closest to `value`.
 * public/legacy/js/charts.js:460-467
 */
export function closestScaleEntry(
  value: number,
  scale: readonly MutableScaleStep[],
): MutableScaleStep | undefined {
  let best = scale[0]
  let d = Infinity
  for (const e of scale) {
    const dd = Math.abs(e.value - value)
    if (dd < d) { d = dd; best = e }
  }
  return best
}

// ── Category progress (questionnaire) ────────────────────────────────────────

/**
 * Count answered + total items in a category for the progress bar.
 * Uses simple truthy check on entry.scale (matches what the questionnaire stores).
 * Analog: public/legacy/js/app.js:1635 catProgress
 */
export function catProgress(
  answers: AnswersBlob | undefined,
  catId: string,
): CategoryProgress {
  const slot = answers?.[catId] ?? {}
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) return { answered: 0, total: 0 }
  const baseItems = cat.items.filter((it) => !slot.__hidden?.[it])
  const customNames = Object.keys(slot.__custom ?? {})
  const total = baseItems.length + customNames.length
  let answered = 0
  for (const item of baseItems) if (slot[item]) answered++
  for (const name of customNames) if (slot.__custom?.[name]) answered++
  return { answered, total }
}
