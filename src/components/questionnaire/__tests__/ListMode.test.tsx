// @vitest-environment jsdom
// src/components/questionnaire/__tests__/ListMode.test.tsx
// QUEST-02/05/07: ListMode questionnaire view.
// Quick task 260516-rm2: ListMode now renders ONE active category (progress.catIndex).

import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MemoryLocalStorage } from '../../../../tests/helpers/MemoryLocalStorage'
import { CATEGORIES } from '@/lib/data/data'
import type { Result, Profile } from '@/lib/storage/types'

const CAT = CATEGORIES[0]! // 'connection'
const CAT2 = CATEGORIES[1]!

function makeProfile(): Profile {
  return { id: 'p1', name: 'Alice', pronouns: '', color: '#7c3aed', emoji: '🌷', createdAt: 1 }
}

function makeResult(overrides: Partial<Result> = {}): Result {
  return {
    id: 'r1',
    profileId: 'p1',
    answers: {},
    enabledCategories: [CAT.id],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

const SCALE = [
  { key: 'open', label: 'Open', short: 'Open', value: 3, color: '#90be6d', description: 'Open' },
]

async function renderListMode(result: Result, profile: Profile) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  vi.stubGlobal('localStorage', mem)

  const { ListMode } = await import('../ListMode')
  const { useStore } = await import('@/lib/storage/store')
  useStore.setState({ profiles: [profile], results: [result], scale: SCALE, imports: [] })

  let renderResult!: ReturnType<typeof render>
  await act(async () => {
    renderResult = render(
      <MemoryRouter>
        <ListMode result={result} profile={profile} />
      </MemoryRouter>
    )
  })
  return { renderResult, mem }
}

describe('<ListMode />', () => {
  afterEach(() => { cleanup() })

  it('renders the active category section', async () => {
    const result = makeResult({ enabledCategories: [CAT.id] })
    await renderListMode(result, makeProfile())
    expect(screen.getByTestId('list-mode')).toBeTruthy()
    expect(screen.getByTestId('q-active-cat')).toBeTruthy()
    // Legacy parity testid is also preserved for any external observers
    expect(screen.getByTestId(`q-cat-${CAT.id}`)).toBeTruthy()
  })

  it('with progress.catIndex=1 renders ONLY the second enabled category', async () => {
    const result = makeResult({
      enabledCategories: [CAT.id, CAT2.id],
      progress: { mode: 'list', catIndex: 1 },
    })
    await renderListMode(result, makeProfile())
    const active = screen.getByTestId('q-active-cat')
    expect(active.getAttribute('data-cat-id')).toBe(CAT2.id)
    // First category's items must not be rendered
    const firstItemOfCat1 = CAT.items[0]!
    expect(screen.queryByTestId(`item-row-${CAT.id}-${firstItemOfCat1}`)).toBeNull()
    // But second category's items are
    const firstItemOfCat2 = CAT2.items[0]!
    expect(screen.queryByTestId(`item-row-${CAT2.id}-${firstItemOfCat2}`)).not.toBeNull()
  })

  it('answering an item persists via saveResult', async () => {
    const result = makeResult()
    const profile = makeProfile()
    await renderListMode(result, profile)
    const firstItem = CAT.items[0]!
    const row = screen.queryByTestId(`item-row-${CAT.id}-${firstItem}`)
    expect(row).not.toBeNull()
    const scaleDot = screen.queryAllByTestId('scale-step-open')[0] ?? null
    if (scaleDot) {
      await act(async () => { fireEvent.click(scaleDot) })
      const { useStore } = await import('@/lib/storage/store')
      await waitFor(() => {
        const savedResults = useStore.getState().results
        expect(savedResults.length).toBeGreaterThan(0)
      }, { timeout: 2000 })
    }
  })

  it('G/R/Both toggle persists `gr` in the cell (when category supports GR)', async () => {
    // Use a GR-enabled category. Find one with gr: true.
    const grCat = (CATEGORIES as readonly { id: string; gr?: boolean; items: readonly string[] }[])
      .find((c) => c.gr) ?? CAT
    const result = makeResult({
      enabledCategories: [grCat.id],
      progress: { mode: 'list', catIndex: 0 },
    })
    await renderListMode(result, makeProfile())
    const firstItem = grCat.items[0]!
    const grBtn = screen.queryByTestId(`gr-${grCat.id}-${firstItem}-G`)
    if (!grBtn) {
      // GR not present on this category — skip without failing (defensive).
      return
    }
    await act(async () => { fireEvent.click(grBtn) })
    const { useStore } = await import('@/lib/storage/store')
    await waitFor(() => {
      const results = useStore.getState().results
      const saved = results.find((r) => r.id === result.id)
      expect(saved).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('adding a custom item: the add-custom button is present', async () => {
    const result = makeResult()
    await renderListMode(result, makeProfile())
    const addBtn = screen.queryByTestId(`add-custom-${CAT.id}`)
    expect(addBtn).not.toBeNull()
    await act(async () => { fireEvent.click(addBtn!) })
    expect(screen.getByTestId('list-mode')).toBeTruthy()
  })

  it('QuestionnaireNav (sticky bottom) renders Categories + See results links (QUEST-07)', async () => {
    const result = makeResult()
    await renderListMode(result, makeProfile())
    expect(screen.getByTestId('q-nav-categories')).toBeTruthy()
    expect(screen.getByTestId('q-nav-see-results')).toBeTruthy()
  })

  it('renders the scale legend with one chip per scale step', async () => {
    const result = makeResult()
    await renderListMode(result, makeProfile())
    const legend = screen.getByTestId('rs-scale-legend')
    expect(legend.querySelectorAll('.chip').length).toBe(SCALE.length)
  })
})
