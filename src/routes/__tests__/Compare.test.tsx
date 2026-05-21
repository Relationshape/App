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

function makeStoreWithAnswers(
  resultsList: Array<{ id: string; enabledCategories?: string[]; answers?: object }>,
) {
  return JSON.stringify({
    profiles: [
      { id: P1, name: 'Alice', pronouns: '', color: '#7c3aed', emoji: '🌷', notes: '', createdAt: 1 },
    ],
    results: resultsList.map((r) => ({
      id: r.id,
      profileId: P1,
      subject: r.id,
      answers: r.answers ?? {},
      enabledCategories: r.enabledCategories,
      createdAt: 1,
      updatedAt: 1,
    })),
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
    }, { timeout: 10000 })

    expect(document.querySelector(`[data-testid="compare-chip-${R1}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="compare-chip-${R2}"]`)).not.toBeNull()
  }, 30000)

  it('passing 5 IDs slices to 4 and shows the truncation toast', async () => {
    await mountAtHash(`#/compare?ids=${R1},${R2},${R3},${R4},${R5}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-page"]')).not.toBeNull()
    }, { timeout: 10000 })

    // 260516-ex7 layout: every option renders as a toggle chip; only the first 4 of
    // the URL ids end up selected (aria-pressed=true). R5 chip exists but is unselected.
    const chip1 = document.querySelector(`[data-testid="compare-chip-${R1}"]`)
    const chip4 = document.querySelector(`[data-testid="compare-chip-${R4}"]`)
    const chip5 = document.querySelector(`[data-testid="compare-chip-${R5}"]`)
    expect(chip1?.getAttribute('aria-pressed')).toBe('true')
    expect(chip4?.getAttribute('aria-pressed')).toBe('true')
    expect(chip5?.getAttribute('aria-pressed')).toBe('false')

    // Toast for truncation — Sonner renders in body
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing first 4 of 5 comparisons')
    }, { timeout: 3000 })
  }, 30000)

  it('toggling a chip rewrites ?ids= in the URL (de-selects in place)', async () => {
    await mountAtHash(`#/compare?ids=${R1},${R2}`)
    await waitFor(() => {
      const chip = document.querySelector(`[data-testid="compare-chip-${R1}"]`)
      expect(chip?.getAttribute('aria-pressed')).toBe('true')
    }, { timeout: 10000 })

    // 260516-ex7 layout: toggling does not remove the chip — every option is
    // always rendered; clicking flips aria-pressed and the URL `ids=` list.
    fireEvent.click(document.querySelector(`[data-testid="compare-chip-${R1}"]`)!)

    await waitFor(() => {
      const chip1 = document.querySelector(`[data-testid="compare-chip-${R1}"]`)
      const chip2 = document.querySelector(`[data-testid="compare-chip-${R2}"]`)
      expect(chip1?.getAttribute('aria-pressed')).toBe('false')
      expect(chip2?.getAttribute('aria-pressed')).toBe('true')
      expect(window.location.hash).toContain(`ids=${R2}`)
      expect(window.location.hash).not.toContain(R1)
    })
  }, 30000)

  it('passing imp:<id> resolves an Import dataset from the import pool', async () => {
    await mountAtHash(`#/compare?ids=imp:${IMP1}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-page"]')).not.toBeNull()
    }, { timeout: 10000 })

    // The chip for imp:<id> should be rendered
    const chip = document.querySelector(`[data-testid="compare-chip-imp:${IMP1}"]`)
    expect(chip).not.toBeNull()
    // The chip label should include the import's subject or name
    expect(chip?.textContent).toContain('Their Map')
  }, 30000)

  it('D-04: cat-details section renders on compare/details when own results are selected', async () => {
    const store = makeStoreWithAnswers([
      { id: R1, answers: { connection: { item1: { scale: 'green' } } } },
      { id: R2, answers: { connection: { item2: { scale: 'red' } } } },
    ])
    await mountAtHash(`#/compare/details?ids=${R1},${R2}`, store)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-details-cat-grid"]')).not.toBeNull()
    }, { timeout: 10000 })
    // Add-categories button is not present
    expect(document.querySelector('[data-testid="compare-add-cats"]')).toBeNull()
  }, 30000)

  it('D-04: on compare/details, all cats with answers in every dataset render (fabiMode always on)', async () => {
    // fabiMode is always true → all cats that have answers in ALL datasets are shown.
    const store = makeStoreWithAnswers([
      {
        id: R1,
        answers: {
          connection: { item1: { scale: 'green' } },
          'time-together': { item2: { scale: 'green' } },
        },
      },
      {
        id: R2,
        answers: {
          connection: { item1: { scale: 'red' } },
          'time-together': { item2: { scale: 'red' } },
        },
      },
    ])
    await mountAtHash(`#/compare/details?ids=${R1},${R2}`, store)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-details-page"]')).not.toBeNull()
    }, { timeout: 10000 })
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-details-cat-connection"]')).not.toBeNull()
      expect(document.querySelector('[data-testid="compare-details-cat-time-together"]')).not.toBeNull()
    }, { timeout: 5000 })
  }, 30000)

  it('D-04: on compare/details, only cats with answers in ALL datasets render', async () => {
    // hasItemValues with `every` filters: creative only in R1, so it must NOT render.
    const store = makeStoreWithAnswers([
      {
        id: R1,
        answers: {
          connection: { item1: { scale: 'green' } },
          'creative': { item3: { scale: 'green' } },
        },
      },
      {
        id: R2,
        answers: {
          connection: { item1: { scale: 'red' } },
        },
      },
    ])
    await mountAtHash(`#/compare/details?ids=${R1},${R2}`, store)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-details-page"]')).not.toBeNull()
    }, { timeout: 10000 })
    // connection is in both → visible; creative is only in R1 → filtered out.
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-details-cat-connection"]')).not.toBeNull()
      expect(document.querySelector('[data-testid="compare-details-cat-creative"]')).toBeNull()
    }, { timeout: 5000 })
  }, 30000)

  it('D-04: compare/details shows filter hint text and overview button', async () => {
    const store = makeStoreWithAnswers([
      { id: R1, answers: { connection: { item1: { scale: 'green' } } } },
      { id: R2, answers: { connection: { item1: { scale: 'red' } } } },
    ])
    await mountAtHash(`#/compare/details?ids=${R1},${R2}`, store)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="compare-details-cat-grid"]')).not.toBeNull()
    }, { timeout: 10000 })
    // Filter hint is shown
    expect(document.querySelector('[data-testid="compare-details-cat-grid"] .small')).not.toBeNull()
    // Overview button is present
    expect(document.querySelector('[data-testid="compare-details-overview-btn"]')).not.toBeNull()
  }, 30000)
})
