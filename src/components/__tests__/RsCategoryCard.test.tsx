// @vitest-environment jsdom
// src/components/__tests__/RsCategoryCard.test.tsx
// Phase-04 D-05 + D-06 — hide/dim rule + visual contract for RsCategoryCard.

import { render, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import type { ChartDataset } from '@/components/charts/types'
import type { Result } from '@/lib/storage/types'

// Mock getLang so we can flip locale per test.
let mockLang: 'en' | 'de' = 'en'
vi.mock('@/lib/i18n/i18n', () => ({
  getLang: () => mockLang,
  t: (key: string) => key,
}))

// Imported AFTER the mock is declared.
import { RsCategoryCard } from '@/components/RsCategoryCard'

import type { CATEGORIES } from '@/lib/data/data'
type CategoryDef = (typeof CATEGORIES)[number]

const CAT = {
  id: 'connection',
  title: 'Connection',
  blurb: 'How we connect.',
  de: 'Verbindung',
  deBlurb: 'Wie wir uns verbinden.',
  color: '#7c3aed',
  icon: '🔗',
  items: [] as readonly { readonly id: string; readonly title: string; readonly de: string }[],
  deItems: [] as readonly string[],
} as unknown as CategoryDef

const MOCK_RESULT: Result = {
  id: 'r1',
  profileId: 'p1',
  subject: 'Bob',
  answers: {},
  createdAt: 1,
  updatedAt: 1,
}

function ds(answers: ChartDataset['answers']): ChartDataset {
  return {
    id: 'r1',
    name: 'Bob',
    emoji: '🌷',
    color: '#7c3aed',
    answers,
    scale: [],
  } as ChartDataset
}

describe('RsCategoryCard (Phase 04 D-05 + D-06)', () => {
  beforeEach(() => { mockLang = 'en' })
  afterEach(() => cleanup())

  it('D-05: hides entirely when filledCount === 0 AND editableResult is null', () => {
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({})]}
        editableResult={null}
        onClick={() => {}}
        testId="card"
      />,
    )
    expect(container.querySelector('button.cat-card')).toBeNull()
    expect(container.querySelector('[data-testid="card"]')).toBeNull()
  })

  it('D-05: renders with is-empty when filledCount === 0 AND editableResult is set', () => {
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({})]}
        editableResult={MOCK_RESULT}
        onClick={() => {}}
        testId="card"
      />,
    )
    const btn = container.querySelector('[data-testid="card"]')!
    expect(btn).not.toBeNull()
    expect(btn.className).toContain('cat-card')
    expect(btn.className).toContain('cat-card-btn')
    expect(btn.className).toContain('is-empty')
  })

  it('D-05: renders without is-empty when filledCount > 0', () => {
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({ connection: { item1: { scale: 'green' } } } as unknown as ChartDataset['answers'])]}
        editableResult={MOCK_RESULT}
        onClick={() => {}}
        testId="card"
      />,
    )
    const btn = container.querySelector('[data-testid="card"]')!
    expect(btn).not.toBeNull()
    expect(btn.className).toContain('cat-card-btn')
    expect(btn.className).not.toContain('is-empty')
  })

  it('counts __custom entries toward filledCount', () => {
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({ connection: { __custom: { c1: { scale: 'red' }, c2: { scale: 'green' } } } } as unknown as ChartDataset['answers'])]}
        editableResult={null}
        onClick={() => {}}
        testId="card"
      />,
    )
    // 2 custom answers → filledCount === 2 → rendered (no is-empty)
    const btn = container.querySelector('[data-testid="card"]')!
    expect(btn).not.toBeNull()
    expect(btn.className).not.toContain('is-empty')
  })

  it('does NOT count __hidden entries', () => {
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({ connection: { __hidden: ['x'] } } as unknown as ChartDataset['answers'])]}
        editableResult={null}
        onClick={() => {}}
        testId="card"
      />,
    )
    // __hidden only → filledCount 0 → no editableResult → hidden
    expect(container.querySelector('[data-testid="card"]')).toBeNull()
  })

  it('D-06: sets --c CSS variable from cat.color', () => {
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({ connection: { x: { scale: 'green' } } } as unknown as ChartDataset['answers'])]}
        editableResult={MOCK_RESULT}
        onClick={() => {}}
        testId="card"
      />,
    )
    const btn = container.querySelector('[data-testid="card"]') as HTMLButtonElement
    expect(btn.style.getPropertyValue('--c').trim()).toBe('#7c3aed')
  })

  it('calls onClick once on click', () => {
    const onClick = vi.fn()
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({ connection: { x: { scale: 'green' } } } as unknown as ChartDataset['answers'])]}
        editableResult={MOCK_RESULT}
        onClick={onClick}
        testId="card"
      />,
    )
    fireEvent.click(container.querySelector('[data-testid="card"]')!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('D-06: renders cat.de / cat.deBlurb when getLang() === "de"', () => {
    mockLang = 'de'
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({ connection: { x: { scale: 'green' } } } as unknown as ChartDataset['answers'])]}
        editableResult={MOCK_RESULT}
        onClick={() => {}}
        testId="card"
      />,
    )
    const h3 = container.querySelector('[data-testid="card"] h3')!
    const p = container.querySelector('[data-testid="card"] p.muted.small')!
    expect(h3.textContent).toBe('Verbindung')
    expect(p.textContent).toBe('Wie wir uns verbinden.')
  })

  it('D-06: falls back to cat.title when getLang() === "de" but cat.de is undefined', () => {
    mockLang = 'de'
    const catWithoutDe = { ...CAT, de: undefined, deBlurb: undefined } as unknown as CategoryDef
    const { container } = render(
      <RsCategoryCard
        cat={catWithoutDe}
        datasets={[ds({ connection: { x: { scale: 'green' } } } as unknown as ChartDataset['answers'])]}
        editableResult={MOCK_RESULT}
        onClick={() => {}}
        testId="card"
      />,
    )
    expect(container.querySelector('[data-testid="card"] h3')!.textContent).toBe('Connection')
    expect(container.querySelector('[data-testid="card"] p.muted.small')!.textContent).toBe('How we connect.')
  })

  it('D-06 Fabi-mode: renders RsSummaryCells when fabiMode is true', () => {
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({ connection: { x: { scale: 'green' } } } as unknown as ChartDataset['answers'])]}
        editableResult={MOCK_RESULT}
        fabiMode={true}
        onClick={() => {}}
        testId="card"
      />,
    )
    const summary = container.querySelector('[data-testid="card"] [data-testid="cat-card-summary"]')
    expect(summary).not.toBeNull()
  })

  it('D-06 Fabi-mode: omits RsSummaryCells when fabiMode is false', () => {
    const { container } = render(
      <RsCategoryCard
        cat={CAT}
        datasets={[ds({ connection: { x: { scale: 'green' } } } as unknown as ChartDataset['answers'])]}
        editableResult={MOCK_RESULT}
        fabiMode={false}
        onClick={() => {}}
        testId="card"
      />,
    )
    expect(container.querySelector('[data-testid="cat-card-summary"]')).toBeNull()
  })
})
