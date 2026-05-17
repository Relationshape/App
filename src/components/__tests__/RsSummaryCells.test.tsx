// @vitest-environment jsdom
// src/components/__tests__/RsSummaryCells.test.tsx
// Phase-04 D-06 — RsSummaryCells closest-scale + null-cell rendering.

import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { RsSummaryCells } from '@/components/RsSummaryCells'
import type { ChartDataset } from '@/components/charts/types'
import type { MutableScaleStep } from '@/lib/data/types'

const SCALE: readonly MutableScaleStep[] = [
  { key: 'no',    label: 'no',    short: 'no',   value: 0, color: '#ef4444', description: '' },
  { key: 'open',  label: 'open',  short: 'open', value: 3, color: '#f59e0b', description: '' },
  { key: 'need',  label: 'need',  short: 'yes',  value: 6, color: '#22c55e', description: '' },
]

function ds(id: string, answers: ChartDataset['answers']): ChartDataset {
  return {
    id,
    name: id,
    emoji: '🌷',
    color: '#7c3aed',
    scale: SCALE,
    answers,
  } as ChartDataset
}

describe('RsSummaryCells (Phase 04 D-06)', () => {
  afterEach(() => cleanup())

  it('renders one cell per dataset', () => {
    const { container } = render(
      <RsSummaryCells
        datasets={[
          ds('a', { connection: { __custom: { c1: { scale: 'open' } } } } as unknown as ChartDataset["answers"]),
          ds('b', { connection: { __custom: { c1: { scale: 'need' } } } } as unknown as ChartDataset["answers"]),
        ]}
        catId="connection"
      />,
    )
    const cells = container.querySelectorAll('[data-testid^="cat-summary-cell"]')
    expect(cells.length).toBe(2)
  })

  it('renders muted "—" cell when categoryAverage returns null', () => {
    const { container } = render(
      <RsSummaryCells
        datasets={[ds('a', {} as unknown as ChartDataset["answers"])]}
        catId="connection"
      />,
    )
    const muted = container.querySelector('[data-testid="cat-summary-cell-muted"]')
    expect(muted).not.toBeNull()
    expect(muted!.textContent).toBe('—')
  })

  it('applies background, color, and borderColor inline styles for non-null cells', () => {
    const { container } = render(
      <RsSummaryCells
        datasets={[ds('a', { connection: { __custom: { c1: { scale: 'need' } } } } as unknown as ChartDataset["answers"])]}
        catId="connection"
      />,
    )
    const cell = container.querySelector('[data-testid="cat-summary-cell"]') as HTMLElement
    expect(cell).not.toBeNull()
    expect(cell.style.background).not.toBe('')
    expect(cell.style.color).not.toBe('')
    expect(cell.style.borderColor).not.toBe('')
  })
})
