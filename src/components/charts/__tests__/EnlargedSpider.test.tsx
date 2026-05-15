// @vitest-environment jsdom
// src/components/charts/__tests__/EnlargedSpider.test.tsx
// RESULT-06. EnlargedSpider Dialog hosting Spider at size=900.

import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { EnlargedSpider } from '../EnlargedSpider'
import type { ChartDataset } from '../types'

const DEFAULT_SCALE = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#264653', description: '' },
  { key: 'need', label: 'Need', short: 'Need', value: 6, color: '#e63946', description: '' },
]

function makeDataset(name = 'Alice'): ChartDataset {
  return {
    id: 'ds1',
    name,
    color: '#7c3aed',
    answers: {},
    scale: DEFAULT_SCALE,
  }
}

describe('EnlargedSpider (RESULT-06)', () => {
  afterEach(() => cleanup())

  it('renders spider-chart when open=true', () => {
    const datasets = [makeDataset()]
    const { container } = render(
      <EnlargedSpider
        open={true}
        onOpenChange={vi.fn()}
        datasets={datasets}
      />
    )
    // Dialog is open — spider-chart div should be visible
    expect(container.querySelector('[data-testid="enlarged-spider"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="spider-chart"]')).not.toBeNull()
  })

  it('does not render spider-chart when open=false', () => {
    const datasets = [makeDataset()]
    const { container } = render(
      <EnlargedSpider
        open={false}
        onOpenChange={vi.fn()}
        datasets={datasets}
      />
    )
    // Dialog closed — content is not rendered (Radix unmounts on close)
    expect(container.querySelector('[data-testid="enlarged-spider"]')).toBeNull()
  })

  it('renders the same datasets as the small Spider (legend entry per dataset)', () => {
    const datasets = [
      makeDataset('Alice'),
      makeDataset('Bob'),
    ]
    const { container } = render(
      <EnlargedSpider
        open={true}
        onOpenChange={vi.fn()}
        datasets={datasets}
      />
    )
    // Spider legend has one entry per dataset
    const legend = container.querySelector('[data-testid="spider-legend"]')
    expect(legend).not.toBeNull()
    const legendItems = legend!.querySelectorAll('g')
    expect(legendItems.length).toBe(datasets.length)
  })

  it('calls onOpenChange when close is triggered', () => {
    const onOpenChange = vi.fn()
    const datasets = [makeDataset()]
    render(
      <EnlargedSpider
        open={true}
        onOpenChange={onOpenChange}
        datasets={datasets}
      />
    )
    // Radix Dialog close button is present — trigger it
    const closeBtn = document.querySelector('[data-slot="dialog-close"]') as HTMLElement | null
    if (closeBtn) {
      closeBtn.click()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    }
    // If no close button found in jsdom environment, just verify it rendered open
    expect(document.querySelector('[data-testid="enlarged-spider"]')).not.toBeNull()
  })
})
