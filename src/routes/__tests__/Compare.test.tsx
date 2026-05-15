// @vitest-environment jsdom
// src/routes/__tests__/Compare.test.tsx
// SHARE-05: Compare route — URL-driven datasets, ≤4 enforcement, import pool

import { render, fireEvent, act, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'

const P1 = 'profile-1'
const R1 = 'result-1'
const R2 = 'result-2'
const R3 = 'result-3'
const R4 = 'result-4'
const R5 = 'result-5'
const IMP1 = 'import-abc'

function makeStore(extra: object = {}) {
  return JSON.stringify({
    profiles: [
      { id: P1, name: 'Alice', pronouns: '', color: '#7c3aed', emoji: '🌷', notes: '', createdAt: 1 },
    ],
    results: [
      { id: R1, profileId: P1, subject: 'Bob', answers: {}, createdAt: 1, updatedAt: 1 },
      { id: R2, profileId: P1, subject: 'Carol', answers: {}, createdAt: 1, updatedAt: 1 },
      { id: R3, profileId: P1, subject: 'Dave', answers: {}, createdAt: 1, updatedAt: 1 },
      { id: R4, profileId: P1, subject: 'Eve', answers: {}, createdAt: 1, updatedAt: 1 },
      { id: R5, profileId: P1, subject: 'Frank', answers: {}, createdAt: 1, updatedAt: 1 },
    ],
    imports: [
      {
        id: IMP1,
        name: 'Imported Person',
        subject: 'Their Map',
        answers: {},
        scale: [],
        importedAt: 1,
      },
    ],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
    scale: [],
    ...extra,
  })
}

async function mountAtHash(hash: string, storeJson?: string) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  mem.setItem('relationshape.v1', storeJson ?? makeStore())
  vi.stubGlobal('localStorage', mem)
  window.location.hash = hash
  const appMod = await import('@/App')
  await act(async () => {
    render(<appMod.default />)
  })
}

describe('Compare route (SHARE-05, D-25, D-35)', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('renders chips for IDs in ?ids=', async () => {
    await mountAtHash(`#/compare?ids=${R1},${R2}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-page"]')).not.toBeNull()
    })

    expect(document.querySelector(`[data-testid="compare-chip-${R1}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="compare-chip-${R2}"]`)).not.toBeNull()
  })

  it('passing 5 IDs slices to 4 and shows the truncation toast', async () => {
    await mountAtHash(`#/compare?ids=${R1},${R2},${R3},${R4},${R5}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-page"]')).not.toBeNull()
    })

    // Only 4 chips should appear
    expect(document.querySelector(`[data-testid="compare-chip-${R1}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="compare-chip-${R4}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="compare-chip-${R5}"]`)).toBeNull()

    // Toast for truncation — Sonner renders in body
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing first 4 of 5 comparisons')
    }, { timeout: 3000 })
  })

  it('removing a chip rewrites ?ids= in the URL', async () => {
    await mountAtHash(`#/compare?ids=${R1},${R2}`)
    await waitFor(() => {
      expect(document.querySelector(`[data-testid="compare-chip-${R1}"]`)).not.toBeNull()
    })

    fireEvent.click(document.querySelector(`[data-testid="compare-chip-${R1}"]`)!)

    await waitFor(() => {
      expect(document.querySelector(`[data-testid="compare-chip-${R1}"]`)).toBeNull()
      expect(document.querySelector(`[data-testid="compare-chip-${R2}"]`)).not.toBeNull()
    })
  })

  it('passing imp:<id> resolves an Import dataset from the import pool', async () => {
    await mountAtHash(`#/compare?ids=imp:${IMP1}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-page"]')).not.toBeNull()
    })

    // The chip for imp:<id> should be rendered
    const chip = document.querySelector(`[data-testid="compare-chip-imp:${IMP1}"]`)
    expect(chip).not.toBeNull()
    // The chip label should include the import's subject or name
    expect(chip?.textContent).toContain('Their Map')
  })
})
