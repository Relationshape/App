// @vitest-environment node
// src/lib/i18n/__tests__/richText.test.ts
// Asserts every key in RICH_TEXT_KEYS resolves to a non-empty value in both EN and DE.

import { describe, it, expect } from 'vitest'
import { RICH_TEXT_KEYS } from '../richText'
import { t, setLang } from '../i18n'

describe('RICH_TEXT_KEYS (D-12)', () => {
  it('every RICH_TEXT_KEY resolves to a non-empty string in EN', () => {
    setLang('en')
    for (const key of RICH_TEXT_KEYS) {
      const value = t(key)
      expect(value, `EN key "${key}" should be non-empty`).toBeTruthy()
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('every RICH_TEXT_KEY resolves to a non-empty string in DE', () => {
    setLang('de')
    for (const key of RICH_TEXT_KEYS) {
      const value = t(key)
      expect(value, `DE key "${key}" should be non-empty`).toBeTruthy()
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
