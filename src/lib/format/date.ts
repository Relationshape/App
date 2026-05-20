// Tiny formatting helpers for result rows.
// Ported from public/legacy/js/app.js:35 (fmtDate) and 1611-1620 (countAnswers).
// No deps — plain functions over the Result domain shape (see src/lib/storage/types.ts).

import type { Result, AnswerCell } from '@/lib/storage/types'

/** Formats a millisecond timestamp as a localized "Mon DD, YYYY" string. */
export const fmtDate = (ts: number | undefined): string =>
  ts == null
    ? ''
    : new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

/**
 * Counts answered questions across all categories of a Result.
 *
 * Mirrors legacy public/legacy/js/app.js:1611-1620 — an answer counts as "answered"
 * iff its AnswerCell has a non-empty `scale`. Custom items live under `__custom`;
 * legacy counted them as answered if present (we filter for cells with `scale` set,
 * which matches our stricter typing without changing observed behavior). Hidden
 * sets under `__hidden` are skipped.
 */
export function countAnswers(r: Result): number {
  let n = 0
  for (const c of Object.values(r.answers ?? {})) {
    if (!c || typeof c !== 'object') continue
    for (const k of Object.keys(c)) {
      if (k === '__hidden') continue
      if (k === '__custom') {
        const custom = c.__custom ?? {}
        for (const v of Object.values(custom)) {
          const cell = v as AnswerCell
          if (cell && cell.scale && (cell.scale !== 'open' || cell.scaleFrac != null)) n++
        }
        continue
      }
      const val = (c as Record<string, AnswerCell | undefined>)[k]
      if (val?.scale || val?.giving || val?.receiving) n++
    }
  }
  return n
}
