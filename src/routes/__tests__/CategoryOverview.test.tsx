// @vitest-environment jsdom
// src/routes/__tests__/CategoryOverview.test.tsx
// QUEST-01 + quick task 260516-qva (picker modal replaces tile-toggle).

import { render, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'
import { setTestLocation } from '../../../tests/helpers/browserRouterTest'
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
  setTestLocation(hash)
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
    expect(window.location.pathname).toBe(`/q/${PROFILE_ID}/${RESULT_ID}`)
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

    // Locked rows (already enabled) must show the lock indicator, not a check button.
    const lockedRow = document.querySelector(
      `[data-testid="cat-picker-item-${CATEGORIES[0]!.id}"]`,
    )
    expect(lockedRow).not.toBeNull()
    expect(lockedRow!.querySelector('.cat-picker-lock')).not.toBeNull()
    expect(lockedRow!.querySelector('.cat-picker-check')).toBeNull()

    // Add a previously-disabled category by clicking its check button.
    const toAdd = CATEGORIES.find((c) => !enabled.includes(c.id))!
    const row = document.querySelector(`[data-testid="cat-picker-item-${toAdd.id}"]`) as HTMLElement
    expect(row).not.toBeNull()
    const checkBtn = row.querySelector('.cat-picker-check') as HTMLElement
    await act(async () => { fireEvent.click(checkBtn) })

    const submit = document.querySelector('[data-testid="cat-picker-submit"]') as HTMLButtonElement
    expect(submit.disabled).toBe(false)
    await act(async () => { fireEvent.click(submit) })

    const stored = JSON.parse(mem.getItem('relationshape.v1') ?? '{}')
    const saved = stored.results?.find((r: { id: string }) => r.id === RESULT_ID)
    expect(saved?.enabledCategories).toContain(toAdd.id)
    expect(saved?.enabledCategories).toContain(CATEGORIES[0]!.id)
    expect(saved?.enabledCategories).toContain(CATEGORIES[1]!.id)
  })

  it('resultId === "new" shows the NewMapWizard', async () => {
    await mountAtHash(`#/q-categories/${PROFILE_ID}/new`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="new-map-wizard"]')).not.toBeNull()
    })
  })

  it('confirm button opens pre-share prompt when map has no answers', async () => {
    await mountAtHash(`#/q-categories/${PROFILE_ID}/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="category-overview-page"]')).not.toBeNull()
    })
    const btn = document.querySelector('[data-testid="confirm-start-questionnaire"]') as HTMLButtonElement
    expect(btn).not.toBeNull()
    await act(async () => { fireEvent.click(btn) })
    // Empty map → pre-share prompt should appear
    expect(document.querySelector('[data-testid="pre-share-prompt"]')).not.toBeNull()
  })

  it('confirm button skips pre-share prompt and navigates when map already has answers', async () => {
    const storeWithAnswers = JSON.stringify({
      profiles: [
        { id: PROFILE_ID, name: 'Alice', pronouns: '', color: '#7c3aed', emoji: '🌷', notes: '', createdAt: 1 },
      ],
      results: [
        {
          id: RESULT_ID,
          profileId: PROFILE_ID,
          subject: 'Sam',
          answers: { cat1: { item1: { scale: 'yes' } } },
          enabledCategories: CATEGORIES.map((c) => c.id),
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      imports: [],
      settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
      scale: [],
    })
    await mountAtHash(`#/q-categories/${PROFILE_ID}/${RESULT_ID}`, storeWithAnswers)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="category-overview-page"]')).not.toBeNull()
    })
    const btn = document.querySelector('[data-testid="confirm-start-questionnaire"]') as HTMLButtonElement
    expect(btn).not.toBeNull()
    await act(async () => { fireEvent.click(btn) })
    // Has answers → navigate directly, no pre-share prompt
    expect(document.querySelector('[data-testid="pre-share-prompt"]')).toBeNull()
    expect(window.location.pathname).toBe(`/q/${PROFILE_ID}/${RESULT_ID}`)
  })
})
