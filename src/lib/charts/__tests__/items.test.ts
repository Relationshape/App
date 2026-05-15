// src/lib/charts/__tests__/items.test.ts
// Tests for pure item helpers in src/lib/charts/items.ts.

import { describe, it, expect } from 'vitest'
import { enabledItemsForCat, flatItemsForResult } from '../items'
import type { Result } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'

const SCALE: readonly MutableScaleStep[] = [
  { key: 'open', label: 'Open', short: 'Open', value: 3, color: '#888', description: '' },
]

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
    const answers = {
      connection: {
        'Shared activities / interests': { scale: 'open' },
        __hidden: { Playfulness: true as const, Companionship: true as const },
        __custom: {
          'My item': { scale: 'open' },
        },
      },
    }
    const result = enabledItemsForCat(answers, 'connection')
    expect(result.base).not.toContain('Playfulness')
    expect(result.base).not.toContain('Companionship')
    expect(result.base).toContain('Shared activities / interests')
    expect(result.custom).toContain('My item')
  })
})

describe('flatItemsForResult', () => {
  it('iterates enabledCategories in order, concatenating base then custom per category', () => {
    const result = makeResult({
      enabledCategories: ['connection', 'creative'],
      answers: {
        connection: {
          __custom: { 'extra connection item': { scale: 'open' } },
        },
        creative: {},
      },
    })
    const flat = flatItemsForResult(result)
    // First items should come from connection (base first, then custom)
    const connectionItems = flat.filter((f) => f.catId === 'connection')
    const creativeItems = flat.filter((f) => f.catId === 'creative')
    expect(connectionItems.length).toBeGreaterThan(0)
    expect(creativeItems.length).toBeGreaterThan(0)
    // Custom item at end of connection block
    const customIdx = flat.findIndex((f) => f.item === 'extra connection item')
    const lastConnectionBaseIdx = flat
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.catId === 'connection' && !f.isCustom)
      .at(-1)?.i ?? -1
    expect(customIdx).toBeGreaterThan(lastConnectionBaseIdx)
    // All creative items come after all connection items
    const firstCreative = flat.findIndex((f) => f.catId === 'creative')
    const lastConnection = flat.map((f, i) => ({ f, i })).filter(({ f }) => f.catId === 'connection').at(-1)?.i ?? -1
    expect(firstCreative).toBeGreaterThan(lastConnection)
  })
})
