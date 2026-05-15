// src/lib/data/__tests__/data.test.ts
// CORE-05: shape sanity for the ported data module.
import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  DEFAULT_SCALE,
  SPIDER_AXES,
  CATEGORY_GROUPS,
  FILE_FORMAT,
} from '../data'

describe('data.ts shape sanity (CORE-05)', () => {
  it('DEFAULT_SCALE has 7 steps from "no" (value 0) to "need" (value 6)', () => {
    expect(DEFAULT_SCALE).toHaveLength(7)
    expect(DEFAULT_SCALE[0]?.key).toBe('no')
    expect(DEFAULT_SCALE[0]?.value).toBe(0)
    expect(DEFAULT_SCALE[6]?.key).toBe('need')
    expect(DEFAULT_SCALE[6]?.value).toBe(6)
  })

  it('every DEFAULT_SCALE step has all six required fields', () => {
    for (const step of DEFAULT_SCALE) {
      expect(step.key).toBeTypeOf('string')
      expect(step.label).toBeTypeOf('string')
      expect(step.short).toBeTypeOf('string')
      expect(step.value).toBeTypeOf('number')
      expect(step.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(step.description).toBeTypeOf('string')
    }
  })

  it('CATEGORIES is a non-empty array with unique ids', () => {
    expect(CATEGORIES.length).toBeGreaterThan(0)
    const ids = CATEGORIES.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('every CATEGORIES entry has id, title, de, icon, color, items, deItems fields', () => {
    for (const cat of CATEGORIES) {
      expect(cat.id).toBeTypeOf('string')
      expect(cat.title).toBeTypeOf('string')
      expect(cat.de).toBeTypeOf('string')
      expect(cat.icon).toBeTypeOf('string')
      expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(Array.isArray(cat.items)).toBe(true)
      expect(Array.isArray(cat.deItems)).toBe(true)
      expect(cat.items.length).toBe(cat.deItems.length)
    }
  })

  it('SPIDER_AXES references only valid CategoryIds', () => {
    const ids = new Set<string>(CATEGORIES.map((c) => c.id))
    for (const axis of SPIDER_AXES) {
      expect(ids.has(axis)).toBe(true)
    }
  })

  it('CATEGORY_GROUPS reference only valid CategoryIds', () => {
    const ids = new Set<string>(CATEGORIES.map((c) => c.id))
    for (const group of CATEGORY_GROUPS) {
      expect(group.id).toBeTypeOf('string')
      expect(group.en).toBeTypeOf('string')
      expect(group.de).toBeTypeOf('string')
      for (const entry of group.categories) {
        expect(ids.has(entry.id)).toBe(true)
        expect(entry.defaultOn).toBeTypeOf('boolean')
      }
    }
  })

  it('FILE_FORMAT is the locked v1 envelope shape', () => {
    expect(FILE_FORMAT.magic).toBe('RSHAPE1')
    expect(FILE_FORMAT.version).toBe(1)
  })
})
