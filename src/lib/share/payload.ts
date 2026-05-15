// SHARE-01/03/04. The v1.0 bundle envelope: type:"relationshape-result"; subject; name; pronouns; emoji; color; answers; scale; version.
// Port of public/legacy/js/app.js sendable-payload assembly (search for "relationshape-result" in v1.0 source).

import type { Result, Profile, Import } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'
import { useStore } from '@/lib/storage/store'

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
  askedItems?: Record<string, string[]> | null
  version: number
  /** v1.0 parity: timestamp when the share was created (Date.now()) */
  sharedAt?: number
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
  const imp: Import = {
    id,
    name: p.name,
    answers: p.answers,
    scale: p.scale,
    version: p.version,
    srcVersion: srcVersion ?? p.version,
    importedAt: Date.now(),
  }
  if (p.pronouns !== undefined) imp.pronouns = p.pronouns
  if (p.emoji !== undefined) imp.emoji = p.emoji
  if (p.color !== undefined) imp.color = p.color
  if (p.subject !== undefined) imp.subject = p.subject
  if (p.subjectEmoji !== undefined) imp.subjectEmoji = p.subjectEmoji
  if (p.subjectColor !== undefined) imp.subjectColor = p.subjectColor
  if (p.enabledCategories != null) imp.enabledCategories = p.enabledCategories
  if (p.askedItems != null) imp.askedItems = p.askedItems
  return imp
}
