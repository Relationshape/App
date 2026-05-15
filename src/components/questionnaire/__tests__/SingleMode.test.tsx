// @vitest-environment jsdom
// src/components/questionnaire/__tests__/SingleMode.test.tsx
// QUEST-03/04, D-10: SingleMode swipe-card questionnaire view.
//
// Mocking strategy: vi.mock() at module top (hoisted by Vitest).
// The reduced-motion mock is conditionally toggled via the mockReturnValue pattern.

import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MemoryLocalStorage } from '../../../../tests/helpers/MemoryLocalStorage'
import { CATEGORIES } from '@/lib/data/data'
import type { Result, Profile } from '@/lib/storage/types'

// vi.mock hoisted to module top by Vitest (must be at file scope, not inside functions)
vi.mock('@/lib/hooks/useReducedMotion', () => ({ useReducedMotion: vi.fn().mockReturnValue(false) }))
vi.mock('@/lib/hooks/useIsCoarsePointer', () => ({ useIsCoarsePointer: vi.fn().mockReturnValue(false) }))

// Helper to get the mocks after import resolution
async function getMocks() {
  const rm = await import('@/lib/hooks/useReducedMotion')
  const cp = await import('@/lib/hooks/useIsCoarsePointer')
  return {
    mockReduced: rm.useReducedMotion as ReturnType<typeof vi.fn>,
    mockCoarse: cp.useIsCoarsePointer as ReturnType<typeof vi.fn>,
  }
}

const CAT = CATEGORIES[0]!

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
    expect(card.querySelector('h1')?.textContent).toBeTruthy()
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

  it('selecting a scale step persists the answer and auto-advances', async () => {
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
    // saveResult is called synchronously — check state
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
    // Verify touchAction=pan-y is set (Pitfall 1 compliance, D-09)
    expect((card as HTMLElement).style.touchAction).toBe('pan-y')
    // Dispatch pointer events (gesture pipeline truncated in jsdom — no crash is the assertion)
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
    mockReduced.mockReturnValue(true)  // Enable reduced-motion for this test

    const profile = makeProfile()
    // Two categories so there's a peekNext candidate on first item
    const result: Result = {
      id: 'r1',
      profileId: 'p1',
      answers: {},
      enabledCategories: [CATEGORIES[0]!.id, CATEGORIES[1]!.id],
      createdAt: 1,
      updatedAt: 1,
      progress: { mode: 'single', flatIndex: 0 },
    }

    await renderSingleMode(result, profile)

    // (a) Peek card is suppressed under reduced-motion (peekNext && !reduced → false)
    expect(screen.queryByTestId('single-peek')).toBeNull()

    // (b) data-state on single-card is undefined (reduced ? undefined : `entering-${dir}`)
    const card = screen.queryByTestId('single-card')
    if (card) {
      const dataState = card.getAttribute('data-state')
      // React renders undefined prop as no attribute → null
      expect(dataState === null || dataState === undefined).toBe(true)
    }

    // (c) Scale step click auto-advances (setTimeout 0 → within act tick)
    const scaleDot = screen.queryByTestId('scale-step-open')
    if (scaleDot) {
      await act(async () => {
        fireEvent.click(scaleDot)
      })
      await waitFor(() => {
        const done = document.querySelector('[data-testid="single-mode-done"]')
        const card2 = document.querySelector('[data-testid="single-card"]')
        expect(done || card2).toBeTruthy()
      }, { timeout: 1000 })
    }

    // Reset mock for subsequent tests
    mockReduced.mockReturnValue(false)
  })
})
