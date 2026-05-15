// src/lib/storage/__tests__/migrateScale.test.ts
// CORE-05 + CORE-07: scale migration parity per Pitfall 8.
import { describe, it, expect } from 'vitest'
import { migrateScale, recalcScaleValues } from '../migrateScale'
import { DEFAULT_SCALE } from '@/lib/data/data'
import { DEFAULT_SCALE_DE } from '@/lib/i18n/i18n'
import type { MutableScaleStep } from '@/lib/data/types'

describe('migrateScale (CORE-05, CORE-07, Pitfall 8)', () => {
  it('returns a recalculated clone of the EN DEFAULT_SCALE without changing values', () => {
    const input = DEFAULT_SCALE.map((s) => ({ ...s })) as MutableScaleStep[]
    const out = migrateScale(input)
    expect(out).toHaveLength(input.length)
    out.forEach((step, i) => {
      expect(step.value).toBe(i)
      expect(step.key).toBe(input[i]?.key)
    })
  })

  it('returns a recalculated clone of the DE DEFAULT_SCALE_DE without changing values', () => {
    const input = DEFAULT_SCALE_DE.map((s) => ({ ...s })) as MutableScaleStep[]
    const out = migrateScale(input)
    expect(out).toHaveLength(input.length)
    out.forEach((step, i) => {
      expect(step.value).toBe(i)
    })
  })

  it('reverses an old-format scale (descending values) and recalculates 0..n', () => {
    const oldFormat: MutableScaleStep[] = [
      { key: 'need',       label: 'Need',       short: 'Need',  value: 6, color: '#f3722c', description: '' },
      { key: 'want',       label: 'Want',       short: 'Want',  value: 5, color: '#f8961e', description: '' },
      { key: 'yes',        label: 'Yes',        short: 'Yes',   value: 4, color: '#f9c74f', description: '' },
      { key: 'sometimes',  label: 'Sometimes',  short: 'Sometimes', value: 3, color: '#90be6d', description: '' },
      { key: 'maybe',      label: 'Maybe',      short: 'Maybe', value: 2, color: '#43aa8b', description: '' },
      { key: 'not-really', label: 'Not really', short: 'Not really', value: 1, color: '#577590', description: '' },
      { key: 'no',         label: 'No',         short: 'No',    value: 0, color: '#264653', description: '' },
    ]
    const out = migrateScale(oldFormat)
    expect(out[0]?.key).toBe('no')
    expect(out[0]?.value).toBe(0)
    expect(out[6]?.key).toBe('need')
    expect(out[6]?.value).toBe(6)
  })

  it('does NOT mutate the input array', () => {
    const input: MutableScaleStep[] = [
      { key: 'a', label: 'A', short: 'A', value: 5, color: '#000000', description: '' },
      { key: 'b', label: 'B', short: 'B', value: 6, color: '#000000', description: '' },
    ]
    const inputSnapshot = JSON.parse(JSON.stringify(input))
    migrateScale(input)
    expect(input).toEqual(inputSnapshot)
  })

  it('returns input as-is when length < 2', () => {
    expect(migrateScale([])).toEqual([])
    const single: MutableScaleStep[] = [
      { key: 'x', label: 'X', short: 'X', value: 0, color: '#000000', description: '' },
    ]
    const out = migrateScale(single)
    expect(out).toHaveLength(1)
    expect(out[0]?.key).toBe('x')
  })

  it('recalcScaleValues assigns sequential 0..n in place', () => {
    const steps: MutableScaleStep[] = [
      { key: 'a', label: 'A', short: 'A', value: 99, color: '#000000', description: '' },
      { key: 'b', label: 'B', short: 'B', value: 88, color: '#000000', description: '' },
      { key: 'c', label: 'C', short: 'C', value: 77, color: '#000000', description: '' },
    ]
    recalcScaleValues(steps)
    expect(steps[0]?.value).toBe(0)
    expect(steps[1]?.value).toBe(1)
    expect(steps[2]?.value).toBe(2)
  })
})
