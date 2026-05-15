// @vitest-environment node
// src/lib/data/__tests__/emoji.test.ts
// Tests for EMOJI_BANK (plan 02-03-01)

import { describe, it, expect } from 'vitest'
import { EMOJI_BANK, isLikelyEmoji } from '../emoji'

describe('EMOJI_BANK', () => {
  it('matches v1.0 entry count (>= 70)', () => {
    expect(EMOJI_BANK.length).toBeGreaterThanOrEqual(70)
  })

  it('contains no duplicate entries', () => {
    const unique = new Set(EMOJI_BANK)
    expect(unique.size).toBe(EMOJI_BANK.length)
  })
})

describe('isLikelyEmoji', () => {
  it('accepts single emoji characters: 🌷, 💖, 🦋', () => {
    expect(isLikelyEmoji('🌷')).toBe(true)
    expect(isLikelyEmoji('💖')).toBe(true)
    expect(isLikelyEmoji('🦋')).toBe(true)
  })

  it('rejects plain ASCII text', () => {
    expect(isLikelyEmoji('abc')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isLikelyEmoji('')).toBe(false)
  })

  it('rejects strings longer than 12 characters', () => {
    expect(isLikelyEmoji('🌷🌷🌷🌷🌷🌷🌷🌷🌷🌷🌷🌷🌷')).toBe(false)
  })
})
