// src/lib/charts/__tests__/items.test.ts
// Tests for pure item helpers in src/lib/charts/items.ts.

import { describe, it, expect } from 'vitest'
import { enabledItemsForCat, flatItemsForResult } from '../items'
import type { Result, AnswersBlob } from '@/lib/storage/types'

function makeResult(overrides: Partial<Result> = {}): Result {
  return {
    id: 'r1',
    profileId: 'p1',
    answers: {},
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('enabledItemsForCat', () => {
  it('filters hidden items + lists custom names', () => {
    const answers: AnswersBlob = {
      connection: { 'Shared activities / interests': { scale: 'open' } } as unknown as AnswersBlob[string],
    }
    ;(answers['connection'] as unknown as Record<string, unknown>).__hidden = { Playfulness: true, Companionship: true }
    ;(answers['connection'] as unknown as Record<string, unknown>).__custom = { 'My item': { scale: 'open' } }
    const result = enabledItemsForCat(answers, 'connection')
    expect(result.base).not.toContain('Playfulness')
    expect(result.base).not.toContain('Companionship')
    expect(result.base).toContain('Shared activities / interests')
    expect(result.custom).toContain('My item')
  })
})

describe('flatItemsForResult', () => {
  it('iterates enabledCategories in order, concatenating custom then base per category', () => {
    const answers: AnswersBlob = {
      connection: {} as unknown as AnswersBlob[string],
      creative: {} as unknown as AnswersBlob[string],
    }
    ;(answers['connection'] as unknown as Record<string, unknown>).__custom = { 'extra connection item': { scale: 'open' } }
    const result = makeResult({
      enabledCategories: ['connection', 'creative'],
      answers,
    })
    const flat = flatItemsForResult(result)
    // First items should come from connection (custom first, then base)
    const connectionItems = flat.filter((f) => f.catId === 'connection')
    const creativeItems = flat.filter((f) => f.catId === 'creative')
    expect(connectionItems.length).toBeGreaterThan(0)
    expect(creativeItems.length).toBeGreaterThan(0)
    // Custom item appears before base items in the connection block
    const customIdx = flat.findIndex((f) => f.item === 'extra connection item')
    const firstConnectionBaseIdx = flat
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.catId === 'connection' && !f.isCustom)
      .at(0)?.i ?? -1
    expect(customIdx).toBeLessThan(firstConnectionBaseIdx)
    // All creative items come after all connection items
    const firstCreative = flat.findIndex((f) => f.catId === 'creative')
    const lastConnection = flat.map((f, i) => ({ f, i })).filter(({ f }) => f.catId === 'connection').at(-1)?.i ?? -1
    expect(firstCreative).toBeGreaterThan(lastConnection)
  })
})
