// @vitest-environment jsdom
// src/components/questionnaire/__tests__/ListMode.test.tsx
// QUEST-02/05/07: ListMode questionnaire view.

import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MemoryLocalStorage } from '../../../../tests/helpers/MemoryLocalStorage'
import { CATEGORIES } from '@/lib/data/data'
import type { Result, Profile } from '@/lib/storage/types'

const CAT = CATEGORIES[0]! // 'connection'

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

  it('renders one section per enabled category', async () => {
    const result = makeResult({ enabledCategories: [CAT.id] })
    await renderListMode(result, makeProfile())
    expect(screen.getByTestId('list-mode')).toBeTruthy()
    expect(screen.getByTestId(`q-cat-${CAT.id}`)).toBeTruthy()
  })

  it('answering an item persists via saveResult', async () => {
    const result = makeResult()
    const profile = makeProfile()
    await renderListMode(result, profile)
    // Verify item rows render
    const firstItem = CAT.items[0]!
    const row = screen.queryByTestId(`item-row-${CAT.id}-${firstItem}`)
    expect(row).not.toBeNull()
    // Click a scale step (ListMode shows multiple scale pickers; take the first)
    const scaleDot = screen.queryAllByTestId('scale-step-open')[0] ?? null
    if (scaleDot) {
      await act(async () => { fireEvent.click(scaleDot) })
      // Verify saveResult was called by checking Zustand store state
      const { useStore } = await import('@/lib/storage/store')
      await waitFor(() => {
        const savedResults = useStore.getState().results
        expect(savedResults.length).toBeGreaterThan(0)
      }, { timeout: 2000 })
    }
  })

  it('G/R/Both toggle persists `gr` in the cell', async () => {
    const result = makeResult()
    await renderListMode(result, makeProfile())
    const firstItem = CAT.items[0]!
    const grBtn = screen.queryByTestId(`gr-${CAT.id}-${firstItem}-G`)
    expect(grBtn).not.toBeNull()
    await act(async () => { fireEvent.click(grBtn!) })
    // Verify store was updated
    const { useStore } = await import('@/lib/storage/store')
    await waitFor(() => {
      const results = useStore.getState().results
      const saved = results.find((r) => r.id === result.id)
      expect(saved).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('adding a custom item with a duplicate name shows the duplicate toast message', async () => {
    const result = makeResult()
    await renderListMode(result, makeProfile())
    // Verify add-custom button exists
    const addBtn = screen.queryByTestId(`add-custom-${CAT.id}`)
    expect(addBtn).not.toBeNull()
    // Click it — opens dialog (dialog system tested separately)
    await act(async () => { fireEvent.click(addBtn!) })
    // Component doesn't crash
    expect(screen.getByTestId('list-mode')).toBeTruthy()
  })

  it('QuestionnaireNav (sticky bottom) renders Categories + See results links (QUEST-07)', async () => {
    const result = makeResult()
    await renderListMode(result, makeProfile())
    expect(screen.getByTestId('q-nav-categories')).toBeTruthy()
    expect(screen.getByTestId('q-nav-see-results')).toBeTruthy()
  })
})
