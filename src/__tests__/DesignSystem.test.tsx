// @vitest-environment jsdom
// src/__tests__/DesignSystem.test.tsx
// DESIGN-05: theme toggle applies data-theme to <html> reactively.
// DESIGN-06: /design-system route renders 5 sections.
// In-page reduced-motion preview: body[data-prm='reduce'] toggles on click round-trip.
//
// The Zustand store is module-level (D-04, D-05); each test wants a fresh store, so we
// vi.resetModules() + dynamic import the modules under test.
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

class MemoryLocalStorage {
  private store = new Map<string, string>()
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v))
  }
  removeItem(k: string): void {
    this.store.delete(k)
  }
  clear(): void {
    this.store.clear()
  }
  get length(): number {
    return this.store.size
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null
  }
}

async function renderFreshDesignSystem() {
  vi.resetModules()
  vi.stubGlobal('localStorage', new MemoryLocalStorage())
  const mod = await import('@/routes/DesignSystem')
  return render(<mod.DesignSystem />)
}

describe('<DesignSystem /> route (DESIGN-05, DESIGN-06)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.body.removeAttribute('data-prm')
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  // Manual cleanup — vitest.config.ts sets globals: false, so @testing-library/react
  // does not auto-register an afterEach() cleanup hook. Without this, mounted trees
  // from prior tests leak into the next describe block and getByTestId returns multiple
  // matches.
  afterEach(() => {
    cleanup()
  })

  it('renders the 5 D-27 sections (header, palette, typography, animations, surfaces)', async () => {
    await renderFreshDesignSystem()
    expect(document.querySelector('[data-section="header"]')).not.toBeNull()
    expect(document.querySelector('[data-section="palette"]')).not.toBeNull()
    expect(document.querySelector('[data-section="typography"]')).not.toBeNull()
    expect(document.querySelector('[data-section="animations"]')).not.toBeNull()
    expect(document.querySelector('[data-section="surfaces"]')).not.toBeNull()
  })

  it('renders all 8 keyframe samples in the animation gallery (DESIGN-03 wiring)', async () => {
    await renderFreshDesignSystem()
    const expected = [
      'heroBlobPulse',
      'holoOrbDrift',
      'holoBtnSpin',
      'holoIconSpin',
      'holoUnderlineSlide',
      'iridShift',
      'bgPulse',
      'silkShift',
    ]
    for (const name of expected) {
      expect(document.querySelector(`[data-keyframe="${name}"]`)).not.toBeNull()
    }
  })

  it('theme toggle reactively updates html data-theme (DESIGN-05)', async () => {
    // DESIGN-05 specifically requires the DOM attribute side-effect (data-theme on <html>).
    // The useTheme() hook lives in App.tsx so we mount the full App and navigate to
    // /design-system via window.location.hash BEFORE mount so createHashRouter lands there.
    window.location.hash = '#/design-system'
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const appMod = await import('@/App')
    const AppRoot = appMod.default
    await act(async () => {
      render(<AppRoot />)
    })

    // Nav + DesignSystem both render ThemeToggle; click the first occurrence.
    const darkBtns = await screen.findAllByTestId('theme-toggle-dark')
    await act(async () => {
      fireEvent.click(darkBtns[0])
    })
    expect(document.documentElement.dataset.theme).toBe('dark')

    const lightBtns = await screen.findAllByTestId('theme-toggle-light')
    await act(async () => {
      fireEvent.click(lightBtns[0])
    })
    expect(document.documentElement.dataset.theme).toBe('light')

    const autoBtns = await screen.findAllByTestId('theme-toggle-auto')
    await act(async () => {
      fireEvent.click(autoBtns[0])
    })
    expect(document.documentElement.dataset.theme).toBe('auto')
  })

  it('reduced-motion preview toggle adds data-prm="reduce" to body and removes it on second click', async () => {
    await renderFreshDesignSystem()
    const toggle = screen.getByTestId('prm-preview-toggle')
    fireEvent.click(toggle)
    expect(document.body.getAttribute('data-prm')).toBe('reduce')
    fireEvent.click(toggle)
    expect(document.body.getAttribute('data-prm')).toBeNull()
  })
})
