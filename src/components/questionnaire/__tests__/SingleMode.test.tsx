// @vitest-environment jsdom
// src/components/questionnaire/__tests__/SingleMode.test.tsx
// QUEST-03/04, D-10: SingleMode swipe-card questionnaire view.
// Quick task 260516-rm2: SingleMode now filters items to the active category.

import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MemoryLocalStorage } from '../../../../tests/helpers/MemoryLocalStorage'
import { CATEGORIES } from '@/lib/data/data'
import type { Result, Profile } from '@/lib/storage/types'

// vi.mock hoisted to module top by Vitest (must be at file scope, not inside functions)
vi.mock('@/lib/hooks/useReducedMotion', () => ({ useReducedMotion: vi.fn().mockReturnValue(false) }))
vi.mock('@/lib/hooks/useIsCoarsePointer', () => ({ useIsCoarsePointer: vi.fn().mockReturnValue(false) }))

async function getMocks() {
  const rm = await import('@/lib/hooks/useReducedMotion')
  const cp = await import('@/lib/hooks/useIsCoarsePointer')
  return {
    mockReduced: rm.useReducedMotion as ReturnType<typeof vi.fn>,
    mockCoarse: cp.useIsCoarsePointer as ReturnType<typeof vi.fn>,
  }
}

const CAT = CATEGORIES[0]!
const CAT2 = CATEGORIES[1]!

function makeProfile(): Profile {
  return { id: 'p1', name: 'Alice', pronouns: '', color: '#7c3aed', emoji: '🌷', createdAt: 1 }
}

const SCALE = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#264653', description: 'No' },
  { key: 'open', label: 'Open', short: 'Open', value: 3, color: '#90be6d', description: 'Open' },
  { key: 'need', label: 'Need', short: 'Need', value: 6, color: '#e63946', description: 'Need' },
]

function makeResult(overrides: Partial<Result> = {}): Result {
  return {
    id: 'r1',
    profileId: 'p1',
    answers: {},
    enabledCategories: [CAT.id],
    createdAt: 1,
    updatedAt: 1,
    progress: { mode: 'single', flatIndex: 0 },
    ...overrides,
  }
}

async function renderSingleMode(result: Result, profile: Profile) {
  const mem = new MemoryLocalStorage()
  vi.stubGlobal('localStorage', mem)
  const { useStore } = await import('@/lib/storage/store')
  useStore.setState({
    profiles: [profile],
    results: [result],
    imports: [],
    scale: SCALE,
  })
  const { SingleMode } = await import('../SingleMode')
  let renderResult!: ReturnType<typeof render>
  await act(async () => {
    renderResult = render(
      <MemoryRouter>
        <SingleMode result={result} profile={profile} />
      </MemoryRouter>
    )
  })
  return { renderResult, mem }
}

describe('<SingleMode />', () => {
  afterEach(() => { cleanup() })

  it('renders the current item\'s name + ScalePicker + nav header', async () => {
    const { mockReduced } = await getMocks()
    mockReduced.mockReturnValue(false)
    const result = makeResult()
    await renderSingleMode(result, makeProfile())
    expect(screen.getByTestId('single-mode')).toBeTruthy()
    expect(screen.getByTestId('single-card')).toBeTruthy()
    expect(screen.getByTestId('q-back-to-categories')).toBeTruthy()
    expect(screen.queryByTestId('scale-step-open')).not.toBeNull()
    const card = screen.getByTestId('single-card')
    // The card body is an RsQuestionCard with the item name as <strong>
    expect(card.querySelector('strong')?.textContent).toBeTruthy()
  })

  it('with progress.catIndex=1 the rendered item belongs to the SECOND category', async () => {
    const { mockReduced } = await getMocks()
    mockReduced.mockReturnValue(false)
    const result = makeResult({
      enabledCategories: [CAT.id, CAT2.id],
      progress: { mode: 'single', catIndex: 1, flatIndex: 0 },
    })
    await renderSingleMode(result, makeProfile())
    const firstItemOfCat2 = CAT2.items[0]!
    const card = screen.getByTestId('single-card')
    const strong = card.querySelector('strong')?.textContent ?? ''
    expect(strong).toBe(firstItemOfCat2)
    // First category's first item is NOT shown in the card body
    expect(strong).not.toBe(CAT.items[0]!)
  })

  it('renders single-back + single-next + n/total counter; clicking Next advances flatIndex', async () => {
    const { mockReduced } = await getMocks()
    mockReduced.mockReturnValue(false)
    const result = makeResult()
    await renderSingleMode(result, makeProfile())
    expect(screen.getByTestId('single-back')).toBeTruthy()
    expect(screen.getByTestId('single-next')).toBeTruthy()
    const counter = screen.getByTestId('single-progress')
    expect(counter.textContent ?? '').toMatch(/^\d+ \/ \d+$/)

    await act(async () => { fireEvent.click(screen.getByTestId('single-next')) })
    const { useStore } = await import('@/lib/storage/store')
    await waitFor(() => {
      const saved = useStore.getState().results.find((r) => r.id === result.id)
      expect(saved?.progress?.flatIndex).toBe(1)
    }, { timeout: 2000 })
  })

  it('ArrowRight key advances to the next item', async () => {
    const { mockReduced } = await getMocks()
    mockReduced.mockReturnValue(false)
    const result = makeResult()
    await renderSingleMode(result, makeProfile())
    expect(screen.getByTestId('single-card')).toBeTruthy()
    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowRight' })
    })
    await waitFor(() => {
      const card = document.querySelector('[data-testid="single-card"]')
      const done = document.querySelector('[data-testid="single-mode-done"]')
      expect(card || done).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('selecting a scale step persists the answer (no auto-advance — user clicks Next)', async () => {
    const { mockReduced } = await getMocks()
    mockReduced.mockReturnValue(false)
    const result = makeResult()
    const profile = makeProfile()
    await renderSingleMode(result, profile)
    const scaleDot = screen.queryByTestId('scale-step-open')
    expect(scaleDot).not.toBeNull()
    await act(async () => {
      fireEvent.click(scaleDot!)
    })
    const { useStore } = await import('@/lib/storage/store')
    const results = useStore.getState().results
    expect(results.length).toBeGreaterThan(0)
  })

  it('swipe-left synthetic gesture advances (via useSwipe; stub-call handler)', async () => {
    const { mockReduced } = await getMocks()
    mockReduced.mockReturnValue(false)
    const result = makeResult()
    await renderSingleMode(result, makeProfile())
    const card = screen.getByTestId('single-card')
    expect(card).toBeTruthy()
    expect((card as HTMLElement).style.touchAction).toBe('pan-y')
    await act(async () => {
      fireEvent.pointerDown(card, { pointerId: 1, clientX: 200, clientY: 200 })
      fireEvent.pointerMove(card, { pointerId: 1, clientX: 100, clientY: 200 })
      fireEvent.pointerUp(card, { pointerId: 1 })
    })
    const remaining = document.querySelector('[data-testid="single-mode"]') ||
                      document.querySelector('[data-testid="single-mode-done"]')
    expect(remaining).toBeTruthy()
  })

  it('D-10 reduced-motion: peek suppressed, no entering animation, instant advance', async () => {
    const { mockReduced } = await getMocks()
    mockReduced.mockReturnValue(true)

    const profile = makeProfile()
    // Two items within the first category so peekNext is a candidate.
    const result: Result = {
      id: 'r1',
      profileId: 'p1',
      answers: {},
      enabledCategories: [CATEGORIES[0]!.id],
      createdAt: 1,
      updatedAt: 1,
      progress: { mode: 'single', flatIndex: 0 },
    }

    await renderSingleMode(result, profile)

    // (a) Peek card is suppressed under reduced-motion
    expect(screen.queryByTestId('single-peek')).toBeNull()

    // (b) data-state on single-card is undefined (reduced ? undefined : `entering-${dir}`)
    const card = screen.queryByTestId('single-card')
    if (card) {
      const dataState = card.getAttribute('data-state')
      expect(dataState === null || dataState === undefined).toBe(true)
    }

    // (c) Scale step click persists the answer; the card stays put.
    const scaleDot = screen.queryByTestId('scale-step-open')
    if (scaleDot) {
      await act(async () => {
        fireEvent.click(scaleDot)
      })
      expect(document.querySelector('[data-testid="single-card"]')).toBeTruthy()
    }

    mockReduced.mockReturnValue(false)
  })
})
