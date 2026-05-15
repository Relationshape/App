// src/lib/i18n/__tests__/i18n.test.ts
// CORE-06: EN+DE key parity, key count, interpolation, localized scale.
//
// Note on key count: the plan acceptance criterion documents "304 keys" based on
// RESEARCH.md's estimate; the actual v1.0 baseline (verified by `node -e ...
// Object.keys(TRANSLATIONS.en).length` against public/legacy/js/i18n.js) is 342.
// CORE-06 requires "EN+DE translation maps preserved key-for-key" — the truth
// is the source file, not the documented estimate.
// Phase 2 plan 02-01 adds 5 shell keys (no_profiles_yet, nav_open_menu,
// nav_close_menu, profile_picker_label, profile_picker_create_new) → 347 total.
// Phase 2 plan 02-02 adds 1 key (age_gate_stop) → 348 total.
// Phase 2 plan 02-03 adds 18 keys (emoji_picker_label, emoji_picker_free_placeholder,
// profile_notes_label, new_map_btn, confirm_delete_profile_title,
// confirm_delete_result_title, confirm_delete_result, welcome_how_title,
// welcome_how_1..4, feat_sharing_title/short/body, feat_multi_title/short/body) → 366 total.

import { describe, it, expect, beforeEach } from 'vitest'
import { EN } from '../en'
import { DE } from '../de'
import { t, setLang, getLang, getLocalizedDefaultScale, DEFAULT_SCALE_DE } from '../i18n'

describe('i18n (CORE-06)', () => {
  beforeEach(() => {
    setLang('en')
  })

  it('EN and DE have identical key sets (D-13 runtime check)', () => {
    const enKeys = Object.keys(EN).sort()
    const deKeys = Object.keys(DE).sort()
    expect(deKeys).toEqual(enKeys)
  })

  it('EN key count matches v1.0 baseline + Phase 2 additions (366 keys)', () => {
    expect(Object.keys(EN).length).toBe(366)
    expect(Object.keys(DE).length).toBe(366)
  })

  it('t() resolves an EN key in EN mode', () => {
    setLang('en')
    expect(t('welcome_title')).toBe('Relationshapes')
    expect(t('nav_about')).toBe('About')
  })

  it('t() resolves a DE key in DE mode and differs from the EN value', () => {
    setLang('de')
    expect(getLang()).toBe('de')
    // nav_about differs between EN ("About") and DE ("Über").
    // (welcome_title is identical "Relationshapes" in both locales — not a useful
    // differentiation probe.)
    const deVal = t('nav_about')
    setLang('en')
    const enVal = t('nav_about')
    expect(deVal).toBe('Über')
    expect(enVal).toBe('About')
    expect(deVal).not.toBe(enVal)
  })

  it('t() supports {var} interpolation', () => {
    setLang('en')
    // seeded_toast in v1.0 uses {name} placeholder.
    const result = t('seeded_toast', { name: 'Alice' })
    expect(result).toContain('Alice')
    expect(result).toBe('Created from Alice — same questions, your own answers.')
  })

  it('t() coerces numeric vars to strings', () => {
    setLang('en')
    // imported_versioned_toast uses {n} placeholder.
    const result = t('imported_versioned_toast', { n: 3 })
    expect(result).toContain('3')
  })

  it('getLocalizedDefaultScale returns DEFAULT_SCALE_DE when lang is de', () => {
    setLang('de')
    const scale = getLocalizedDefaultScale()
    expect(scale).toBe(DEFAULT_SCALE_DE)
    expect(scale.length).toBe(7)
    expect(scale[0]?.label).toBe('Nein')
    expect(scale[6]?.label).toBe('Brauche ich')
  })

  it('getLocalizedDefaultScale returns the supplied English default when lang is en', () => {
    setLang('en')
    const customDefault = [
      { key: 'x', label: 'X', short: 'X', value: 0, color: '#000000', description: '' },
    ]
    const scale = getLocalizedDefaultScale(customDefault)
    expect(scale).toBe(customDefault)
  })

  it('setLang ignores invalid lang strings', () => {
    setLang('en')
    // @ts-expect-error testing runtime invalid input — Lang type is 'en' | 'de'
    setLang('fr')
    expect(getLang()).toBe('en')
  })
})
