// src/lib/charts/items.ts
// Pure helpers shared by ListMode, SingleMode, and CategoryBars (Plan 5).
// v1.0 analogs: app.js:2134 flatItemsForResult; charts.js:380 enabled-items rule (Pitfall 5).

import { CATEGORIES } from '@/lib/data/data'
import type { Result, AnswersBlob, CustomCategoryDef, CustomItemDef } from '@/lib/storage/types'

interface DatasetWithItemDefs {
  customItemDefs?: Record<string, Record<string, CustomItemDef>>
  customCategories?: CustomCategoryDef[]
}

/**
 * Build a seed AnswersBlob for a newly-created map that was based on a template.
 * Reads from customItemDefs first; falls back to customCategories[x].items so that
 * custom-category items are seeded even when customItemDefs is missing/empty.
 */
export function seedAnswersFromTemplate(
  customItemDefs: Record<string, Record<string, CustomItemDef>> | undefined | null,
  customCategories: CustomCategoryDef[] | undefined | null,
): AnswersBlob {
  const answers: AnswersBlob = {}

  for (const [catId, defs] of Object.entries(customItemDefs ?? {})) {
    const names = Object.keys(defs)
    if (names.length === 0) continue
    const slot = answers[catId] ?? {}
    slot.__custom = { ...(slot.__custom ?? {}), ...Object.fromEntries(names.map((n) => [n, { scale: '' }])) }
    answers[catId] = slot
  }

  for (const cat of customCategories ?? []) {
    if (!cat.items?.length) continue
    const existing = answers[cat.id]?.__custom
    if (existing && Object.keys(existing).length > 0) continue
    const slot = answers[cat.id] ?? {}
    slot.__custom = Object.fromEntries(cat.items.map((item) => [item.name, { scale: '' }]))
    answers[cat.id] = slot
  }

  return answers
}

/** Returns true when the category natively supports Giving/Receiving dual-scale answers. */
export function isGrCat(catId: string): boolean {
  const cat = CATEGORIES.find((c) => c.id === catId)
  return Boolean((cat as { gr?: boolean } | undefined)?.gr)
}

/**
 * Returns true when the category should render two separate spiders (giving + receiving).
 * True for built-in GR categories and for any category containing a double-scale custom item.
 */
export function categoryNeedsGrSpiders(datasets: readonly DatasetWithItemDefs[], catId: string): boolean {
  if (isGrCat(catId)) return true
  for (const ds of datasets) {
    const itemDefs = ds.customItemDefs?.[catId]
    if (itemDefs) {
      for (const def of Object.values(itemDefs)) {
        if (def.format === 'double-scale') return true
      }
    }
    const customCat = ds.customCategories?.find((c) => c.id === catId)
    if (customCat?.items) {
      for (const item of customCat.items) {
        if (item.format === 'double-scale') return true
      }
    }
  }
  return false
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
    for (const item of custom) flat.push({ catId, item, isCustom: true })
    for (const item of base) flat.push({ catId, item, isCustom: false })
  }
  return flat
}
