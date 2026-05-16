// Unit tests for src/lib/share/payload.ts

import { describe, it, expect } from 'vitest'
import { buildSharePayload, parseImportPayload, payloadToImport } from '../payload'
import type { Result, Profile } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'

const SCALE: MutableScaleStep[] = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#264653', description: 'Nope' },
  { key: 'yes', label: 'Yes', short: 'Yes', value: 1, color: '#f9c74f', description: 'Yep' },
]

const PROFILE: Profile = {
  id: 'p1',
  name: 'Alice',
  pronouns: 'she/her',
  color: '#7c3aed',
  emoji: '🌷',
  createdAt: 1000,
}

const RESULT: Result = {
  id: 'r1',
  profileId: 'p1',
  subject: 'Bob',
  subjectEmoji: '🍀',
  subjectColor: '#ec4899',
  answers: { connection: { 'Shared activities': { scale: 'yes' } } },
  scale: SCALE,
  enabledCategories: ['connection'],
  version: 1,
  createdAt: 1000,
  updatedAt: 2000,
}

describe('buildSharePayload', () => {
  it("sets type='relationshape-result' and includes profile + result fields", () => {
    const payload = buildSharePayload(RESULT, PROFILE)
    expect(payload.type).toBe('relationshape-result')
    expect(payload.name).toBe('Alice')
    expect(payload.pronouns).toBe('she/her')
    expect(payload.emoji).toBe('🌷')
    expect(payload.color).toBe('#7c3aed')
    expect(payload.subject).toBe('Bob')
    expect(payload.subjectEmoji).toBe('🍀')
    expect(payload.subjectColor).toBe('#ec4899')
    expect(payload.answers).toBe(RESULT.answers)
    expect(payload.scale).toEqual(SCALE)
    expect(payload.version).toBe(1)
  })

  it('sets sharedAt to a recent timestamp for v1.0 parity', () => {
    const before = Date.now()
    const payload = buildSharePayload(RESULT, PROFILE)
    const after = Date.now()
    expect(payload.sharedAt).toBeGreaterThanOrEqual(before)
    expect(payload.sharedAt).toBeLessThanOrEqual(after)
  })

  it('maps enabledCategories and askedItems from result', () => {
    const payload = buildSharePayload(RESULT, PROFILE)
    expect(payload.enabledCategories).toEqual(['connection'])
    expect(payload.askedItems).toBeNull()
  })
})

describe('parseImportPayload', () => {
  it('throws on missing name / wrong type / missing answers', () => {
    expect(() => parseImportPayload(null)).toThrow('Payload not an object')
    expect(() => parseImportPayload({ type: 'other', name: 'x', answers: {}, scale: [] })).toThrow('Wrong payload type')
    expect(() => parseImportPayload({ type: 'relationshape-result', answers: {}, scale: [] })).toThrow('Missing name')
    expect(() => parseImportPayload({ type: 'relationshape-result', name: 'x', scale: [] })).toThrow('Missing answers')
    expect(() => parseImportPayload({ type: 'relationshape-result', name: 'x', answers: {} })).toThrow('Missing scale')
  })

  it('returns the payload when all required fields are present', () => {
    const raw = {
      type: 'relationshape-result' as const,
      name: 'Alice',
      answers: {},
      scale: SCALE,
      version: 1,
    }
    const result = parseImportPayload(raw)
    expect(result.type).toBe('relationshape-result')
    expect(result.name).toBe('Alice')
    expect(result.scale).toEqual(SCALE)
  })
})

describe('payloadToImport', () => {
  it('carries answers/scale/version/srcVersion through unchanged', () => {
    const raw = {
      type: 'relationshape-result' as const,
      name: 'Bob',
      answers: RESULT.answers,
      scale: SCALE,
      version: 2,
    }
    const parsed = parseImportPayload(raw)
    const imp = payloadToImport(parsed, 'imp-uuid-123', 1)
    expect(imp.id).toBe('imp-uuid-123')
    expect(imp.name).toBe('Bob')
    expect(imp.answers).toBe(RESULT.answers)
    expect(imp.scale).toEqual(SCALE)
    expect(imp.version).toBe(2)
    expect(imp.srcVersion).toBe(1)
    expect(imp.importedAt).toBeGreaterThan(0)
  })

  it('uses payload.version as srcVersion when srcVersion is not provided', () => {
    const raw = {
      type: 'relationshape-result' as const,
      name: 'Carol',
      answers: {},
      scale: SCALE,
      version: 3,
    }
    const parsed = parseImportPayload(raw)
    const imp = payloadToImport(parsed, 'imp-456')
    expect(imp.srcVersion).toBe(3)
  })
})
