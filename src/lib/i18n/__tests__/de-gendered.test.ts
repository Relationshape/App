// src/lib/i18n/__tests__/de-gendered.test.ts
// QUEST-08. DE gendered-translation regression spec.
// Asserts that the German translation map preserves gendered forms from v1.0.

import { describe, it, expect } from 'vitest'
import { DE } from '../de'

describe('DE gendered translations (QUEST-08)', () => {
  it('DE map contains gendered forms (*innen suffix) in at least one key', () => {
    const allValues = Object.values(DE).join(' ')
    // Must contain at least one *innen or *in gendered form
    expect(allValues).toMatch(/innen/)
  })

  it('specific known gendered keys are preserved from v1.0', () => {
    // howto_step2_desc: "Sam, meine beste Freund*in" (gendered friend form)
    expect(DE.howto_step2_desc).toContain('Freund*in')

    // about_ai_text: "Urheber*innen" + "Erfahrungswelten" (both gendered)
    expect(DE.about_ai_text).toContain('Urheber*innen')

    // confirm_delete_profile: "rückgängig" (non-gendered but precise v1.0 value)
    expect(DE.confirm_delete_profile).toContain('rückgängig')
  })
})
