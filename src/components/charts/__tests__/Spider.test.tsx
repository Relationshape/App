// @vitest-environment jsdom
// src/components/charts/__tests__/Spider.test.tsx
// RESULT-02, RESULT-07. Spider chart declarative SVG tests.

import { render, cleanup, fireEvent } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { Spider } from '../Spider'
import type { ChartDataset } from '../types'

const DEFAULT_SCALE = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#264653', description: '' },
  { key: 'maybe', label: 'Maybe', short: 'Maybe', value: 2, color: '#43aa8b', description: '' },
  { key: 'need', label: 'Need', short: 'Need', value: 6, color: '#e63946', description: '' },
]

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

describe('Spider (RESULT-02)', () => {
  afterEach(() => cleanup())

  it('renders one polygon per dataset (≤ 4)', () => {
    const datasets: ChartDataset[] = [
      makeDataset({ id: 'a', name: 'Alice', color: '#7c3aed' }),
      makeDataset({ id: 'b', name: 'Bob', color: '#e63946' }),
    ]
    const { container } = render(<Spider datasets={datasets} />)
    // dataset polygons
    const polys = container.querySelectorAll('[data-testid^="dataset-poly-"]')
    expect(polys.length).toBe(2)
    // svg has role="img"
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBeTruthy()
  })

  it('axis click fires onAxisTap with the axis key', () => {
    const onAxisTap = vi.fn()
    const datasets: ChartDataset[] = [makeDataset()]
    const { container } = render(
      <Spider
        datasets={datasets}
        axes={['connection', 'intimacy']}
        onAxisTap={onAxisTap}
      />
    )
    const axisGroups = container.querySelectorAll('[data-axis]')
    expect(axisGroups.length).toBeGreaterThan(0)
    const [firstGroup] = axisGroups
    fireEvent.click(firstGroup!)
    expect(onAxisTap).toHaveBeenCalledWith(firstGroup!.getAttribute('data-axis'))
  })

  it('slices datasets to 4 (D-35)', () => {
    const datasets: ChartDataset[] = Array.from({ length: 6 }, (_, i) =>
      makeDataset({ id: `ds${i}`, name: `Person ${i}`, color: '#7c3aed' })
    )
    const { container } = render(<Spider datasets={datasets} />)
    const polys = container.querySelectorAll('[data-testid^="dataset-poly-"]')
    expect(polys.length).toBeLessThanOrEqual(4)
  })

  it('RESULT-07: malicious profile name renders inert text — no <script substring in the SVG outerHTML', () => {
    const malicious = '<script>alert(1)</script>'
    const datasets: ChartDataset[] = [
      { id: 'a', name: malicious, color: '#7c3aed', answers: {}, scale: DEFAULT_SCALE },
    ]
    const { container } = render(<Spider datasets={datasets} />)
    const svg = container.querySelector('svg')!
    expect(svg.outerHTML).not.toContain('<script')
    expect(svg.outerHTML).not.toContain('onerror')
    // React escapes < to &lt; in text nodes
    expect(svg.outerHTML).toContain('&lt;script&gt;')
  })

  it('RESULT-07: img onerror payload renders inert — < is encoded, no HTML injection', () => {
    // The payload has < which React encodes to &lt; in text nodes.
    // "onerror=alert" still appears in text content (inert) but NOT as an HTML attribute.
    // We verify that <img is encoded (structural XSS safety), not merely string-absent.
    const xssImg = '"><img onerror=alert(1) src=x>'
    const datasets: ChartDataset[] = [
      { id: 'b', name: xssImg, color: '#e63946', answers: {}, scale: DEFAULT_SCALE },
    ]
    const { container } = render(<Spider datasets={datasets} />)
    const svg = container.querySelector('svg')!
    // < is encoded → no literal <img tag injected
    expect(svg.outerHTML).not.toContain('<img ')
    // The encoded form is present (React text-node escaping)
    expect(svg.outerHTML).toContain('&lt;img')
  })
})
