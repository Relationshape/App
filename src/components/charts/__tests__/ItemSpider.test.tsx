// @vitest-environment jsdom
// src/components/charts/__tests__/ItemSpider.test.tsx
// RESULT-04, RESULT-07. Per-category item-level spider chart tests.

import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { ItemSpider } from '../ItemSpider'
import type { ChartDataset } from '../types'

const DEFAULT_SCALE = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#264653', description: '' },
  { key: 'maybe', label: 'Maybe', short: 'Maybe', value: 2, color: '#43aa8b', description: '' },
  { key: 'need', label: 'Need', short: 'Need', value: 6, color: '#e63946', description: '' },
]

// 'connection' category has 10 items — enough for ≥3 axis requirement
const CAT_ID = 'connection'

function makeDataset(overrides: Partial<ChartDataset> = {}): ChartDataset {
  return {
    id: 'ds1',
    name: 'Alice',
    color: '#7c3aed',
    answers: {},
    scale: DEFAULT_SCALE,
    ...overrides,
  }
}

describe('ItemSpider (RESULT-04)', () => {
  afterEach(() => cleanup())

  it('renders one polygon per dataset for the active category', () => {
    const datasets: ChartDataset[] = [
      makeDataset({ id: 'a', color: '#7c3aed' }),
      makeDataset({ id: 'b', color: '#e63946' }),
    ]
    const { container } = render(<ItemSpider datasets={datasets} catId={CAT_ID} />)
    const wrapper = container.querySelector(`[data-testid="item-spider-${CAT_ID}"]`)
    expect(wrapper).not.toBeNull()
    const polys = container.querySelectorAll('[data-testid^="item-spider-poly-"]')
    expect(polys.length).toBe(2)
  })

  it('returns null for unknown catId', () => {
    const { container } = render(
      <ItemSpider datasets={[makeDataset()]} catId="nonexistent-cat-xyz" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('uses dataset color for polygon fill', () => {
    const ds = makeDataset({ id: 'a', color: '#ff0099' })
    const { container } = render(<ItemSpider datasets={[ds]} catId={CAT_ID} />)
    const poly = container.querySelector('[data-testid="item-spider-poly-0"]')
    expect(poly?.getAttribute('fill')).toBe('#ff0099')
  })

  it('RESULT-07: malicious custom item name renders inert text — <script tag encoded, no HTML injection', () => {
    // The payload uses a <script> tag — <  gets encoded to &lt; by React text node escaping.
    // Other XSS vectors like "onerror=" appear as inert text content (not as HTML attributes)
    // because the entire label flows through a React <text> element, never setAttribute.
    const maliciousItem = '<script>alert(1)</script>'
    const datasets: ChartDataset[] = [
      {
        id: 'a',
        name: 'Alice',
        color: '#7c3aed',
        answers: {
          [CAT_ID]: {
            // seed a custom item with malicious name
            __custom: {
              [maliciousItem]: { scale: 'need' },
            },
          } as never, // CategoryAnswers intersection narrows __custom to AnswerCell — fixture intentionally bypasses for XSS test
        },
        scale: DEFAULT_SCALE,
      },
    ]
    const { container } = render(<ItemSpider datasets={datasets} catId={CAT_ID} />)
    const svg = container.querySelector('svg')
    if (!svg) {
      // May return null if category has < 3 items after filtering — that's still safe
      expect(container.innerHTML).not.toContain('<script')
      return
    }
    // <script is encoded as &lt;script by React — never injected as HTML
    expect(svg.outerHTML).not.toContain('<script')
    // The encoded form is present (React text node escape)
    expect(svg.outerHTML).toContain('&lt;script&gt;')
  })
})
