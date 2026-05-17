// @vitest-environment jsdom
// src/components/__tests__/RsCompareTile.test.tsx
// Phase-04 D-03 — primitive behavior tests for RsCompareTile.

import { render, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { RsCompareTile } from '@/components/RsCompareTile'

describe('RsCompareTile (Phase 04 D-03)', () => {
  afterEach(() => cleanup())

  it('renders emoji, title, and sub when all props provided', () => {
    const { container } = render(
      <RsCompareTile
        color="#7c3aed"
        emoji="🌷"
        title="Alice → Bob"
        sub="Updated May 17, 2026"
        onClick={() => {}}
        testId="tile-1"
      />,
    )
    const btn = container.querySelector('[data-testid="tile-1"]')!
    expect(btn).not.toBeNull()
    expect(btn.querySelector('.li-avatar')!.textContent).toBe('🌷')
    expect(btn.querySelector('h3')!.textContent).toBe('Alice → Bob')
    expect(btn.querySelector('p.muted.small')!.textContent).toBe('Updated May 17, 2026')
  })

  it('omits the sub <p> when sub is undefined (Import… tile case)', () => {
    const { container } = render(
      <RsCompareTile
        color="#7c3aed"
        emoji="📥"
        title="Import…"
        onClick={() => {}}
        testId="tile-import"
      />,
    )
    const btn = container.querySelector('[data-testid="tile-import"]')!
    expect(btn.querySelector('p.muted.small')).toBeNull()
  })

  it('merges className prop (e.g. compare-tile-import) onto the button', () => {
    const { container } = render(
      <RsCompareTile
        color="#7c3aed"
        emoji="📥"
        title="Import…"
        onClick={() => {}}
        className="compare-tile-import"
        testId="tile-import"
      />,
    )
    const btn = container.querySelector('[data-testid="tile-import"]')!
    expect(btn.className).toContain('compare-tile')
    expect(btn.className).toContain('compare-tile-import')
  })

  it('sets the --c CSS variable from color prop', () => {
    const { container } = render(
      <RsCompareTile
        color="#7c3aed"
        emoji="🌷"
        title="x"
        onClick={() => {}}
        testId="tile-c"
      />,
    )
    const btn = container.querySelector('[data-testid="tile-c"]') as HTMLButtonElement
    expect(btn.style.getPropertyValue('--c').trim()).toBe('#7c3aed')
  })

  it('calls onClick exactly once on click', () => {
    const onClick = vi.fn()
    const { container } = render(
      <RsCompareTile
        color="#7c3aed"
        emoji="🌷"
        title="x"
        onClick={onClick}
        testId="tile-click"
      />,
    )
    fireEvent.click(container.querySelector('[data-testid="tile-click"]')!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('forwards aria-label to the button', () => {
    const { container } = render(
      <RsCompareTile
        color="#7c3aed"
        emoji="🌷"
        title="x"
        onClick={() => {}}
        ariaLabel="Open compare"
        testId="tile-aria"
      />,
    )
    const btn = container.querySelector('[data-testid="tile-aria"]')!
    expect(btn.getAttribute('aria-label')).toBe('Open compare')
  })
})
