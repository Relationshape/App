// @vitest-environment jsdom
// src/routes/__tests__/CategoryOverview.test.tsx
// QUEST-01 + quick task 260516-qva (picker modal replaces tile-toggle).

import { render, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'
import { CATEGORIES } from '@/lib/data/data'

const PROFILE_ID = 'p-test'
const RESULT_ID = 'r-test'

function makeStore(extra: object = {}, enabledCategories?: string[]) {
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
        enabledCategories: enabledCategories ?? CATEGORIES.map((c) => c.id),
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

describe('CategoryOverview (QUEST-01 + 260516-qva)', () => {
  afterEach(() => { cleanup() })

  it('renders one tile per ENABLED category only', async () => {
    const enabled = [CATEGORIES[0]!.id, CATEGORIES[1]!.id, CATEGORIES[2]!.id]
    await mountAtHash(
      `#/q-categories/${PROFILE_ID}/${RESULT_ID}`,
      makeStore({}, enabled),
    )
    await waitFor(() => {
      expect(document.querySelector('[data-testid="category-overview-page"]')).not.toBeNull()
    })
    const tiles = document.querySelectorAll('[data-testid^="cat-tile-"]')
    expect(tiles.length).toBe(enabled.length)
    // A disabled category must not render a tile
    expect(document.querySelector(`[data-testid="cat-tile-${CATEGORIES[3]!.id}"]`)).toBeNull()
  })

  it('clicking a tile navigates to /q/ and seeds catIndex (no toggle)', async () => {
    const enabled = [CATEGORIES[0]!.id, CATEGORIES[1]!.id]
    const mem = await mountAtHash(
      `#/q-categories/${PROFILE_ID}/${RESULT_ID}`,
      makeStore({}, enabled),
    )
    await waitFor(() => {
      expect(document.querySelector('[data-testid="category-overview-page"]')).not.toBeNull()
    })
    const second = CATEGORIES[1]!
    const tile = document.querySelector(`[data-testid="cat-tile-${second.id}"]`) as HTMLElement
    expect(tile).not.toBeNull()
    await act(async () => { fireEvent.click(tile) })

    // enabledCategories must be unchanged — no toggle on click.
    const stored = JSON.parse(mem.getItem('relationshape.v1') ?? '{}')
    const saved = stored.results?.find((r: { id: string }) => r.id === RESULT_ID)
    expect(saved?.enabledCategories).toEqual(enabled)
    // catIndex should be seeded to the clicked tile's position within enabledCats.
    expect(saved?.progress?.catIndex).toBe(1)
    expect(window.location.hash).toBe(`#/q/${PROFILE_ID}/${RESULT_ID}`)
  })

  it('Add more categories opens the picker and merges newly selected ids', async () => {
    const enabled: string[] = [CATEGORIES[0]!.id, CATEGORIES[1]!.id]
    const mem = await mountAtHash(
      `#/q-categories/${PROFILE_ID}/${RESULT_ID}`,
      makeStore({}, enabled),
    )
    await waitFor(() => {
      expect(document.querySelector('[data-testid="category-overview-page"]')).not.toBeNull()
    })

    const openBtn = document.querySelector('[data-testid="open-cat-picker"]') as HTMLElement
    expect(openBtn).not.toBeNull()
    await act(async () => { fireEvent.click(openBtn) })
    await waitFor(() => {
      expect(document.querySelector('[data-testid="cat-picker"]')).not.toBeNull()
    })

    // Locked rows (already enabled) must have a disabled checkbox.
    const lockedInput = document.querySelector<HTMLInputElement>(
      `[data-testid="cat-picker-item-${CATEGORIES[0]!.id}"] input[type=checkbox]`,
    )
    expect(lockedInput?.disabled).toBe(true)

    // Add a previously-disabled category.
    const toAdd = CATEGORIES.find((c) => !enabled.includes(c.id))!
    const row = document.querySelector(`[data-testid="cat-picker-item-${toAdd.id}"]`) as HTMLElement
    expect(row).not.toBeNull()
    const input = row.querySelector('input[type=checkbox]') as HTMLInputElement
    await act(async () => { fireEvent.click(input) })

    const submit = document.querySelector('[data-testid="cat-picker-submit"]') as HTMLButtonElement
    expect(submit.disabled).toBe(false)
    await act(async () => { fireEvent.click(submit) })

    const stored = JSON.parse(mem.getItem('relationshape.v1') ?? '{}')
    const saved = stored.results?.find((r: { id: string }) => r.id === RESULT_ID)
    expect(saved?.enabledCategories).toContain(toAdd.id)
    expect(saved?.enabledCategories).toContain(CATEGORIES[0]!.id)
    expect(saved?.enabledCategories).toContain(CATEGORIES[1]!.id)
  })

  it('resultId === "new" creates a fresh result and redirects', async () => {
    await mountAtHash(`#/q-categories/${PROFILE_ID}/new`)
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
