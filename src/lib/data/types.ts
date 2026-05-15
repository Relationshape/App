// src/lib/data/types.ts
// Type derivations from the as const exports in data.ts.
// CORE-05 — content frozen, types derived at compile time (D-13/D-21).

import type { CATEGORIES, DEFAULT_SCALE, SPIDER_AXES } from './data'

export type CategoryId = (typeof CATEGORIES)[number]['id']
export type ScaleStep = (typeof DEFAULT_SCALE)[number]
export type SpiderAxisId = (typeof SPIDER_AXES)[number]
export type Lang = 'en' | 'de'

// Mutable scale step shape (for migration / user-edited scales) — same field set as DEFAULT_SCALE entries.
// The frozen `as const` variant types ScaleStep narrowly to the literal values; MutableScaleStep is the
// broader shape used by per-map / per-result scales the user has customised.
export interface MutableScaleStep {
  key: string
  label: string
  short: string
  value: number
  color: string
  description: string
}
