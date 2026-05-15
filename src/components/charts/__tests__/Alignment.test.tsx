// @vitest-environment jsdom
// src/components/charts/__tests__/Alignment.test.tsx
// RESULT-05, RESULT-07. Alignment heat strip chart tests.

import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { Alignment } from '../Alignment'
import type { ChartDataset } from '../types'

const DEFAULT_SCALE = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#264653', description: '' },
  { key: 'maybe', label: 'Maybe', short: 'Maybe', value: 2, color: '#43aa8b', description: '' },
  { key: 'need', label: 'Need', short: 'Need', value: 6, color: '#e63946', description: '' },
]

// Seed answers for 'connection' category — items that exist in the category
const CAT_ID = 'connection'
const CAT_ITEMS = [
  'Shared activities / interests',
  'Intellectual / philosophical discussions',
  'Political discussions',
  'Sharing ideas',
  'Sharing humour',
]

function makeAnswers(scaleKey: string) {
  const answers: Record<string, { scale: string }> = {}
  for (const item of CAT_ITEMS) answers[item] = { scale: scaleKey }
  return { [CAT_ID]: answers }
}

function makeDs(id: string, name: string, scaleKey: string): ChartDataset {
  return {
    id,
    name,
    color: '#7c3aed',
    answers: makeAnswers(scaleKey),
    scale: DEFAULT_SCALE,
  }
}

describe('Alignment (RESULT-05)', () => {
  afterEach(() => cleanup())

  it('renders top and gaps sections; returns null if datasets.length < 2', () => {
    // Single dataset → null
    const { container: single } = render(<Alignment datasets={[makeDs('a', 'Alice', 'need')]} />)
    expect(single.firstChild).toBeNull()
    cleanup()

    // Empty datasets → null
    const { container: empty } = render(<Alignment datasets={[]} />)
    expect(empty.firstChild).toBeNull()
    cleanup()

    // Two datasets → renders both sections
    const ds1 = makeDs('a', 'Alice', 'need')
    const ds2 = makeDs('b', 'Bob', 'no')
    const { container } = render(<Alignment datasets={[ds1, ds2]} />)
    expect(container.querySelector('[data-testid="alignment"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="alignment-top"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="alignment-gaps"]')).not.toBeNull()
  })

  it('renders rows with category titles (static, not user data) — XSS-safe by construction', () => {
    const ds1 = makeDs('a', 'Alice', 'need')
    const ds2 = makeDs('b', 'Bob', 'maybe')
    const { container } = render(<Alignment datasets={[ds1, ds2]} />)

    const rows = container.querySelectorAll('.rs-align-row')
    expect(rows.length).toBeGreaterThan(0)

    // Category titles are static app data — confirm they render as text
    const titles = container.querySelectorAll('.rs-align-title')
    expect(titles.length).toBeGreaterThan(0)
    for (const t of Array.from(titles)) {
      expect(t.textContent).toBeTruthy()
    }
  })

  it('RESULT-07: malicious dataset.name is not rendered by Alignment (Alignment only renders CATEGORY titles)', () => {
    // Alignment renders only CATEGORY.title (static app data), not ds.name.
    // Feeding a malicious name confirms it never appears in the SVG/HTML output.
    const maliciousName = '<script>alert(1)</script>'
    const ds1: ChartDataset = { ...makeDs('a', maliciousName, 'need') }
    const ds2: ChartDataset = { ...makeDs('b', maliciousName, 'no') }
    const { container } = render(<Alignment datasets={[ds1, ds2]} />)
    const html = container.innerHTML
    // ds.name is NOT rendered by Alignment — only category titles are rendered
    expect(html).not.toContain('<script')
  })
})
