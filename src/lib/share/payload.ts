// SHARE-01/03/04. The v1.0 bundle envelope: type:"relationshape-result"; subject; name; pronouns; emoji; color; answers; scale; version.
// Port of public/legacy/js/app.js sendable-payload assembly (search for "relationshape-result" in v1.0 source).

import type { Result, Profile, Import, CustomItemDef, CustomCategoryDef } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'
import { CATEGORIES } from '@/lib/data/data'
import { useStore } from '@/lib/storage/store'

/** v1.0 export modes (legacy app.js openExportModal). */
export type ExportMode = 'unrestricted' | 'restricted' | 'template'

/** v1.0 wire envelope. */
export interface SharePayload {
  type: 'relationshape-result'
  name: string
  pronouns?: string
  emoji?: string
  color?: string
  subject?: string
  subjectEmoji?: string
  subjectColor?: string
  answers: Result['answers']
  scale: MutableScaleStep[]
  enabledCategories?: string[] | null
  // v1.0 wire shape (legacy app.js line 1108-1121): { [catId]: { base: string[], custom: string[] } }
  askedItems?: Record<string, { base: string[]; custom: string[] }> | Record<string, string[]> | null
  version: number
  /** v1.0 parity: timestamp when the share was created (Date.now()) */
  sharedAt?: number
  /** v1.0 export mode marker (D-36 / D-37). */
  exportMode?: ExportMode
  /** v1.0 restricted-mode field: encrypted answers bundle, gated by a second passphrase. */
  lockedAnswers?: string
  customItemDefs?: Record<string, Record<string, CustomItemDef>> | null
  customCategories?: CustomCategoryDef[] | null
}

export function buildSharePayload(result: Result, profile: Profile): SharePayload {
  const scale = result.scale ?? useStore.getState().scale
  const payload: SharePayload = {
    type: 'relationshape-result',
    name: profile.name,
    answers: result.answers,
    scale: scale as MutableScaleStep[],
    enabledCategories: result.enabledCategories ?? null,
    askedItems: result.askedItems ?? null,
    version: result.version ?? 1,
    sharedAt: Date.now(),
  }
  if (profile.pronouns) payload.pronouns = profile.pronouns
  if (profile.emoji) payload.emoji = profile.emoji
  if (profile.color) payload.color = profile.color
  if (result.subject !== undefined) payload.subject = result.subject
  if (result.subjectEmoji !== undefined) payload.subjectEmoji = result.subjectEmoji
  if (result.subjectColor !== undefined) payload.subjectColor = result.subjectColor
  if (result.customItemDefs) payload.customItemDefs = result.customItemDefs
  if (result.customCategories) payload.customCategories = result.customCategories
  return payload
}

/**
 * v1.0 export askedItems builder (legacy app.js lines 1108-1121).
 * For each enabled category, returns { base, custom } so the recipient can
 * answer the same per-category set even when none of the answers are sent.
 */
export function buildExportAskedItems(result: Result): Record<string, { base: string[]; custom: string[] }> {
  const out: Record<string, { base: string[]; custom: string[] }> = {}
  const enabledCats = result.enabledCategories
    ? CATEGORIES.filter((c) => result.enabledCategories!.includes(c.id))
    : CATEGORIES
  for (const cat of enabledCats) {
    const asked = (result.askedItems as Record<string, { base?: string[]; custom?: string[] } | string[]> | undefined)?.[cat.id]
    const customKeys = Object.keys(result.answers?.[cat.id]?.__custom || {})
    const askedBase = Array.isArray(asked) ? asked : asked?.base
    const askedCustom = Array.isArray(asked) ? [] : (asked?.custom ?? [])
    const base = askedBase ? [...askedBase] : cat.items.slice()
    const custom = Array.from(new Set([...askedCustom, ...customKeys]))
    if (base.length || custom.length) out[cat.id] = { base, custom }
  }
  return out
}

/**
 * Build the v1.0 base payload (everything except answers/exportMode/lockedAnswers).
 * Mirrors legacy app.js basePayload assembly inside openExportModal.
 */
export function buildBaseSharePayload(result: Result, profile: Profile): Omit<SharePayload, 'answers' | 'exportMode' | 'lockedAnswers'> {
  const scale = result.scale ?? useStore.getState().scale
  const payload: Omit<SharePayload, 'answers' | 'exportMode' | 'lockedAnswers'> = {
    type: 'relationshape-result',
    name: profile.name,
    scale: scale as MutableScaleStep[],
    enabledCategories: result.enabledCategories ?? null,
    askedItems: (result.askedItems as SharePayload['askedItems']) ?? null,
    version: result.version ?? 1,
    sharedAt: Date.now(),
  }
  if (profile.pronouns) payload.pronouns = profile.pronouns
  if (profile.emoji) payload.emoji = profile.emoji
  if (profile.color) payload.color = profile.color
  if (result.subject !== undefined) payload.subject = result.subject
  if (result.subjectEmoji !== undefined) payload.subjectEmoji = result.subjectEmoji
  if (result.subjectColor !== undefined) payload.subjectColor = result.subjectColor
  if (result.customItemDefs) payload.customItemDefs = result.customItemDefs
  return payload
}

/** Decrypted payload may not satisfy the type — narrow it. */
export function parseImportPayload(decrypted: unknown): SharePayload {
  if (typeof decrypted !== 'object' || decrypted === null) {
    throw new Error('Payload not an object')
  }
  const p = decrypted as Record<string, unknown>
  if (p['type'] !== 'relationshape-result') throw new Error('Wrong payload type')
  if (typeof p['name'] !== 'string') throw new Error('Missing name')
  if (typeof p['answers'] !== 'object' || p['answers'] === null) throw new Error('Missing answers')
  if (!Array.isArray(p['scale'])) throw new Error('Missing scale')
  return p as unknown as SharePayload
}

/** Project a SharePayload into an Import object (v1.0-shape preserved for SHARE-04). */
export function payloadToImport(p: SharePayload, id: string, srcVersion?: number): Import {
  const exportMode: ExportMode = p.exportMode ?? 'unrestricted'
  const imp: Import = {
    id,
    name: p.name,
    answers: exportMode === 'restricted' ? {} : p.answers,
    scale: p.scale,
    version: p.version,
    srcVersion: srcVersion ?? p.version,
    importedAt: Date.now(),
    exportMode,
  }
  if (p.pronouns !== undefined) imp.pronouns = p.pronouns
  if (p.emoji !== undefined) imp.emoji = p.emoji
  if (p.color !== undefined) imp.color = p.color
  if (p.subject !== undefined) imp.subject = p.subject
  if (p.subjectEmoji !== undefined) imp.subjectEmoji = p.subjectEmoji
  if (p.subjectColor !== undefined) imp.subjectColor = p.subjectColor
  if (p.enabledCategories != null) imp.enabledCategories = p.enabledCategories
  if (p.askedItems != null) imp.askedItems = p.askedItems as NonNullable<Import['askedItems']>
  if (p.lockedAnswers != null) imp.lockedAnswers = p.lockedAnswers
  if (p.customItemDefs != null) imp.customItemDefs = p.customItemDefs as NonNullable<Import['customItemDefs']>
  return imp
}
