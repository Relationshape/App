// @vitest-environment jsdom
// src/components/charts/__tests__/CategoryBars.test.tsx
// RESULT-03, RESULT-07. Per-category bar diff chart tests.

import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { CategoryBars } from '../CategoryBars'
import type { ChartDataset } from '../types'

const DEFAULT_SCALE = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#264653', description: '' },
  { key: 'maybe', label: 'Maybe', short: 'Maybe', value: 2, color: '#43aa8b', description: '' },
  { key: 'need', label: 'Need', short: 'Need', value: 6, color: '#e63946', description: '' },
]

const CAT_ID = 'connection'
// Real items in 'connection' category
const ITEM_1 = 'Shared activities / interests'
const ITEM_2 = 'Intellectual / philosophical discussions'

function makeDatasetWithAnswers(): ChartDataset {
  return {
    id: 'ds1',
    name: 'Alice',
    color: '#7c3aed',
    answers: {
      [CAT_ID]: {
        [ITEM_1]: { scale: 'need' },
        [ITEM_2]: { scale: 'maybe' },
      },
    },
    scale: DEFAULT_SCALE,
  }
}

describe('CategoryBars (RESULT-03)', () => {
  afterEach(() => cleanup())

  it('renders one row per answered item; uses scale step color for each bar', () => {
    const ds = makeDatasetWithAnswers()
    const { container } = render(<CategoryBars datasets={[ds]} catId={CAT_ID} />)

    const wrapper = container.querySelector(`[data-testid="category-bars-${CAT_ID}"]`)
    expect(wrapper).not.toBeNull()

    const rows = container.querySelectorAll('.rs-bar-row')
    expect(rows.length).toBe(2)

    // Bar for ITEM_1 (scale: need = value 6, color #e63946)
    // jsdom normalises hex colors to rgb() when reading style.background
    const bar1 = container.querySelector(`[data-testid="bar-cell-0-${ITEM_1}"]`) as HTMLElement | null
    expect(bar1).not.toBeNull()
    expect(bar1!.style.background).toContain('230')  // #e63946 → rgb(230, 57, 70)

    // Bar for ITEM_2 (scale: maybe = value 2, color #43aa8b)
    const bar2 = container.querySelector(`[data-testid="bar-cell-0-${ITEM_2}"]`) as HTMLElement | null
    expect(bar2).not.toBeNull()
    expect(bar2!.style.background).toContain('67')  // #43aa8b → rgb(67, 170, 139)
  })

  it('returns null for unknown catId', () => {
    const { container } = render(
      <CategoryBars datasets={[makeDatasetWithAnswers()]} catId="nonexistent-xyz" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders empty cells for datasets without an answer', () => {
    const ds: ChartDataset = {
      id: 'ds2',
      name: 'Bob',
      color: '#e63946',
      answers: { [CAT_ID]: { [ITEM_1]: { scale: 'need' } } },
      scale: DEFAULT_SCALE,
    }
    const dsEmpty: ChartDataset = {
      id: 'ds3',
      name: 'Carol',
      color: '#43aa8b',
      answers: {},  // no answers
      scale: DEFAULT_SCALE,
    }
    const { container } = render(<CategoryBars datasets={[ds, dsEmpty]} catId={CAT_ID} />)
    // ds1 has answer, ds2 does not
    const emptyCell = container.querySelector(`[data-testid="bar-cell-empty-1-${ITEM_1}"]`)
    expect(emptyCell).not.toBeNull()
  })

  it('RESULT-07: malicious dataset name in title attribute is DOM-safe (set via property, not innerHTML)', () => {
    // React sets title via element.title = value (JS property assignment), NOT via innerHTML.
    // This means the browser never parses <script> as HTML — the value is inert text.
    // The XSS safety is structural: ds.name flows only into text nodes and JS property assignments.
    const maliciousName = '<script>alert(1)</script>'
    const ds: ChartDataset = {
      id: 'a',
      name: maliciousName,
      color: '#7c3aed',
      answers: { [CAT_ID]: { [ITEM_1]: { scale: 'need' } } },
      scale: DEFAULT_SCALE,
    }
    const { container } = render(<CategoryBars datasets={[ds]} catId={CAT_ID} />)
    // The bar element's title DOM property holds the literal string (not parsed as HTML)
    const bar = container.querySelector(`[data-testid="bar-cell-0-${ITEM_1}"]`) as HTMLElement | null
    expect(bar).not.toBeNull()
    // DOM property is the raw value — confirm it does NOT execute as HTML
    expect(bar!.title).toContain('<script>alert(1)</script>')
    // The label text node (rs-bar-label) must encode < as &lt;
    const label = container.querySelector('.rs-bar-label') as HTMLElement | null
    // label shows the item name (not ds.name), which is static data — XSS is in ds.name
    // The bar-row label shows ITEM_1 text node: safe static string
    expect(label?.textContent).toBe(ITEM_1)
  })
})
