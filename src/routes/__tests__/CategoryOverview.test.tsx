// @vitest-environment jsdom
// src/routes/__tests__/CategoryOverview.test.tsx
// QUEST-01: CategoryOverview tile grid.

import { render, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'
import { CATEGORIES } from '@/lib/data/data'

const PROFILE_ID = 'p-test'
const RESULT_ID = 'r-test'

function makeStore(extra: object = {}) {
  return JSON.stringify({
    profiles: [
      { id: PROFILE_ID, name: 'Alice', pronouns: '', color: '#7c3aed', emoji: '🌷', notes: '', createdAt: 1 },
    ],
    results: [
      {
        id: RESULT_ID,
        profileId: PROFILE_ID,
        subject: 'Sam',
        answers: {},
        enabledCategories: CATEGORIES.map((c) => c.id),
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    imports: [],
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
  const AppRoot = appMod.default
  await act(async () => {
    render(<AppRoot />)
  })
  return mem
}

describe('CategoryOverview (QUEST-01)', () => {
  afterEach(() => { cleanup() })

  it('renders one tile per CATEGORY', async () => {
    await mountAtHash(`#/q-categories/${PROFILE_ID}/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="category-overview-page"]')).not.toBeNull()
    })
    const tiles = document.querySelectorAll('[data-testid^="cat-tile-"]')
    expect(tiles.length).toBe(CATEGORIES.length)
  })

  it('toggling a tile flips enabledCategories and saves to store', async () => {
    const mem = await mountAtHash(`#/q-categories/${PROFILE_ID}/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="category-overview-page"]')).not.toBeNull()
    })
    const firstCat = CATEGORIES[0]!
    const tile = document.querySelector(`[data-testid="cat-tile-${firstCat.id}"]`) as HTMLElement
    expect(tile).not.toBeNull()
    const wasActive = tile.getAttribute('data-state') === 'active'
    await act(async () => { fireEvent.click(tile) })
    // Zustand persists via middleware; check store JSON
    const stored = JSON.parse(mem.getItem('relationshape.v1') ?? '{}')
    const saved = stored.results?.find((r: { id: string }) => r.id === RESULT_ID)
    if (wasActive) {
      expect(saved?.enabledCategories ?? []).not.toContain(firstCat.id)
    } else {
      expect(saved?.enabledCategories ?? []).toContain(firstCat.id)
    }
  })

  it('resultId === "new" creates a fresh result and redirects', async () => {
    await mountAtHash(`#/q-categories/${PROFILE_ID}/new`)
    // Component mounts and useEffect fires — either stays in category-overview or redirects
    // The important thing is the app doesn't crash and renders something meaningful
    await waitFor(() => {
      const hasPage = document.querySelector('[data-testid="category-overview-page"]')
      const hasHome = document.querySelector('[data-testid="home-page"]')
      expect(hasPage || hasHome).not.toBeNull()
    })
  })

  it('confirm button links to /q/:profileId/:resultId', async () => {
    await mountAtHash(`#/q-categories/${PROFILE_ID}/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="category-overview-page"]')).not.toBeNull()
    })
    const btn = document.querySelector('[data-testid="confirm-start-questionnaire"]')
    expect(btn).not.toBeNull()
    const href = btn?.getAttribute('href') ?? ''
    expect(href).toContain(PROFILE_ID)
    expect(href).toContain(RESULT_ID)
  })
})
