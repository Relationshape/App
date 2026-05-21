// @vitest-environment jsdom
// src/__tests__/Nav.test.tsx
// SHELL-03: Nav renders profile link + nav links + lang dropdown on every leaf route.
// (Theme toggle was moved out of the nav into Settings. The nav uses the compact
//  RsLangDropdown; Settings uses the segmented LangToggle.)
import { render, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../tests/helpers/MemoryLocalStorage'

/** Seed ageConfirmed + wizardSeen so AgeGate/WizardHost don't block Nav tests. */
function makeSeededMemory() {
  const mem = new MemoryLocalStorage()
  mem.setItem(
    'relationshape.v1',
    JSON.stringify({
      profiles: [],
      results: [],
      imports: [],
      settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
      scale: [],
    }),
  )
  return mem
}

describe('<Nav /> (SHELL-03)', () => {
  beforeEach(() => {
    window.location.hash = '#/'
    vi.restoreAllMocks()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    cleanup()
  })

  it('renders profile link + 4 nav links + lang dropdown', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', makeSeededMemory())
    const appMod = await import('@/App')
    const AppRoot = appMod.default

    await act(async () => {
      render(<AppRoot />)
    })

    expect(document.querySelector('[data-testid="nav-link-profile"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="nav-link-import"]')).toBeNull()
    expect(document.querySelector('[data-testid="nav-link-compare"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="nav-link-settings"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="nav-link-about"]')).not.toBeNull()
    // No caret / popover dropdown anymore
    expect(document.querySelector('[data-testid="profile-picker-caret"]')).toBeNull()
    // Theme toggle now lives only in Settings — assert it's NOT in the nav.
    expect(document.querySelector('[data-testid="theme-toggle-auto"]')).toBeNull()
    expect(document.querySelector('[data-testid="lang-dropdown"]')).not.toBeNull()
  })
})
