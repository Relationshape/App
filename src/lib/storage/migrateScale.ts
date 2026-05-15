// src/lib/storage/migrateScale.ts
// Port of public/legacy/js/storage.js lines 45-55 (recalcScaleValues + migrateScale).
// CORE-07: scale migration semantics preserved end-to-end.
// Pitfall 8: function MUST NOT mutate its input array.

import type { MutableScaleStep } from '@/lib/data/types'

function cloneScale(scale: readonly MutableScaleStep[]): MutableScaleStep[] {
  return scale.map((step) => ({ ...step }))
}

export function recalcScaleValues(steps: MutableScaleStep[]): MutableScaleStep[] {
  steps.forEach((step, i) => {
    step.value = i
  })
  return steps
}

/**
 * Migrate a stored scale array.
 * - If shorter than 2 entries → return as-is (no migration meaningful).
 * - If old-format (value DESCENDING from first to last) → reverse + recalc.
 * - Otherwise → return a value-recalculated CLONE (so caller can re-save the canonical shape).
 *
 * Input is never mutated.
 */
export function migrateScale(scale: readonly MutableScaleStep[]): MutableScaleStep[] {
  if (!Array.isArray(scale) || scale.length < 2) {
    // Return a defensive copy even on guard-return so callers cannot accidentally mutate the original
    return Array.isArray(scale) ? cloneScale(scale) : []
  }
  const first = scale[0]
  const last = scale[scale.length - 1]
  if (!first || !last) return cloneScale(scale)

  const looksOld = first.value > last.value
  const oriented = looksOld ? [...scale].reverse() : [...scale]
  return recalcScaleValues(cloneScale(oriented))
}
