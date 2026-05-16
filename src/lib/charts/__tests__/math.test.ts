// src/lib/charts/__tests__/math.test.ts
// Tests for pure math helpers in src/lib/charts/math.ts.

import { describe, it, expect } from 'vitest'
import {
  scaleMaxValue,
  categoryAverage,
  closestScaleEntry,
  labelFontSize,
  polarToCartesian,
  catProgress,
} from '../math'
import type { MutableScaleStep } from '@/lib/data/types'
import type { AnswersBlob } from '@/lib/storage/types'

// Minimal 3-step scale for testing
const SCALE: readonly MutableScaleStep[] = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#000', description: '' },
  { key: 'open', label: 'Open', short: 'Open', value: 3, color: '#888', description: '' },
  { key: 'need', label: 'Need', short: 'Need', value: 6, color: '#fff', description: '' },
]

describe('scaleMaxValue', () => {
  it('returns the max value across a scale', () => {
    expect(scaleMaxValue(SCALE)).toBe(6)
  })
})

describe('categoryAverage', () => {
  it('returns null for a category with no answers', () => {
    const answers: AnswersBlob = {}
    // 'connection' is a valid category in CATEGORIES
    expect(categoryAverage(answers, 'connection', SCALE)).toBeNull()
  })

  it('returns the average value + normalized 0..1 for a populated category', () => {
    const answers: AnswersBlob = {
      connection: {
        'Shared activities / interests': { scale: 'need' }, // value 6
        'Intellectual / philosophical discussions': { scale: 'open' }, // value 3
      },
    }
    const result = categoryAverage(answers, 'connection', SCALE)
    expect(result).not.toBeNull()
    expect(result!.value).toBeCloseTo(4.5)
    expect(result!.norm).toBeCloseTo(4.5 / 6)
  })
})

describe('closestScaleEntry', () => {
  it('returns the entry whose value is closest to the input', () => {
    expect(closestScaleEntry(2, SCALE)?.key).toBe('open') // 3 is closer than 0 or 6
    expect(closestScaleEntry(0, SCALE)?.key).toBe('no')
    expect(closestScaleEntry(6, SCALE)?.key).toBe('need')
    expect(closestScaleEntry(4.5, SCALE)?.key).toBe('open') // equidistant; first wins
  })
})

describe('labelFontSize', () => {
  it('returns at least 18 and at most 34', () => {
    for (const count of [3, 6, 10, 15, 30, 100]) {
      const fs = labelFontSize(count)
      expect(fs).toBeGreaterThanOrEqual(18)
      expect(fs).toBeLessThanOrEqual(34)
    }
  })
})

describe('polarToCartesian', () => {
  it('computes a point on the unit circle for i=0, n=4 (top vertex)', () => {
    const cx = 0, cy = 0, r = 1
    // i=0, n=4 → angle = -π/2 → [cos(-π/2), sin(-π/2)] = [0, -1]
    const [x, y] = polarToCartesian(0, 4, r, cx, cy)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(-1)
  })
})

describe('catProgress', () => {
  it('counts answered items including custom + excluding hidden', () => {
    const answers: AnswersBlob = {
      connection: {
        'Shared activities / interests': { scale: 'open' },
        'Intellectual / philosophical discussions': { scale: 'no' },
      } as unknown as AnswersBlob[string],
    }
    ;(answers['connection'] as unknown as Record<string, unknown>).__hidden = { Playfulness: true }
    ;(answers['connection'] as unknown as Record<string, unknown>).__custom = {
      'My custom item': { scale: 'need' },
    }
    const result = catProgress(answers, 'connection')
    // connection has 10 items total; 1 hidden (Playfulness) → 9 base + 1 custom = 10 total
    expect(result.total).toBe(10) // 9 base + 1 custom
    expect(result.answered).toBe(3) // 2 base answered + 1 custom answered
  })
})
