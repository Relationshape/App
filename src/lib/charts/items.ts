// src/lib/charts/items.ts
// Pure helpers shared by ListMode, SingleMode, and CategoryBars (Plan 5).
// v1.0 analogs: app.js:2134 flatItemsForResult; charts.js:380 enabled-items rule (Pitfall 5).

import { CATEGORIES } from '@/lib/data/data'
import type { Result, AnswersBlob } from '@/lib/storage/types'

/** Returns true when the category natively supports Giving/Receiving dual-scale answers. */
export function isGrCat(catId: string): boolean {
  const cat = CATEGORIES.find((c) => c.id === catId)
  return Boolean((cat as { gr?: boolean } | undefined)?.gr)
}

export interface FlatItem { catId: string; item: string; isCustom: boolean }

/**
 * Return the base (non-hidden) items and custom item names for a category.
 * Filters out items listed in slot.__hidden.
 */
export function enabledItemsForCat(
  answers: AnswersBlob | undefined,
  catId: string,
): { base: string[]; custom: string[] } {
  const slot = answers?.[catId] ?? {}
  const hidden = slot.__hidden ?? {}
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) {
    // Custom category — all items are stored as custom items; reverse so newest appears first
    return { base: [], custom: Object.keys(slot.__custom ?? {}).reverse() }
  }
  return {
    base: cat.items.filter((it) => !hidden[it]),
    custom: Object.keys(slot.__custom ?? {}).reverse(),
  }
}

/**
 * Flatten all enabled categories into an ordered list of {catId, item, isCustom} tuples.
 * Used by SingleMode to build the flat card sequence and by CategoryBars.
 * Analog: public/legacy/js/app.js:2134 flatItemsForResult
 */
export function flatItemsForResult(result: Result): FlatItem[] {
  const enabled = result.enabledCategories ?? CATEGORIES.map((c) => c.id)
  const flat: FlatItem[] = []
  for (const catId of enabled) {
    const { base, custom } = enabledItemsForCat(result.answers, catId)
    for (const item of base) flat.push({ catId, item, isCustom: false })
    for (const item of custom) flat.push({ catId, item, isCustom: true })
  }
  return flat
}
