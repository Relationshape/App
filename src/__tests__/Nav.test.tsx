// @vitest-environment jsdom
// src/__tests__/Nav.test.tsx
// SHELL-03: Nav renders profile picker + nav links + lang toggle on every leaf route.
// (Theme toggle was moved out of the nav into Settings — only the lang segmented control stays here.)
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../tests/helpers/MemoryLocalStorage'
import { t } from '@/lib/i18n/i18n'

/** Seed ageConfirmed + wizardSeen so AgeGate/WizardHost don't block Nav tests. */
function makeSeededMemory() {
  const mem = new MemoryLocalStorage()
  mem.setItem(
    'relationshape.v1',
    JSON.stringify({
      state: {
        profiles: [],
        results: [],
        imports: [],
        settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
        scale: [],
        lastSaveError: null,
      },
      version: 1,
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

  it('renders profile picker + 4 nav links + lang toggle', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', makeSeededMemory())
    const appMod = await import('@/App')
    const AppRoot = appMod.default

    await act(async () => {
      render(<AppRoot />)
    })

    expect(document.querySelector('[data-testid="profile-picker"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="nav-link-import"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="nav-link-compare"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="nav-link-settings"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="nav-link-about"]')).not.toBeNull()
    // Theme toggle now lives only in Settings — assert it's NOT in the nav.
    expect(document.querySelector('[data-testid="theme-toggle-auto"]')).toBeNull()
    expect(document.querySelector('[data-testid="lang-toggle"]')).not.toBeNull()
  })

  it('shows empty-state copy when no profiles exist', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', makeSeededMemory())
    const appMod = await import('@/App')
    const AppRoot = appMod.default

    await act(async () => {
      render(<AppRoot />)
    })

    // Open the Popover trigger to reveal the menu content
    const trigger = document.querySelector('[data-testid="profile-picker"]')
    expect(trigger).not.toBeNull()
    await act(async () => {
      fireEvent.click(trigger!)
    })
    // The no_profiles_yet text is in the PopoverContent - check it's in the DOM
    const noProfiles = screen.queryAllByText(t('no_profiles_yet'))
    expect(noProfiles.length).toBeGreaterThan(0)
  })

  it('renders create-new link in ProfilePicker', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', makeSeededMemory())
    const appMod = await import('@/App')
    const AppRoot = appMod.default

    await act(async () => {
      render(<AppRoot />)
    })

    // Open the Popover trigger to reveal menu content
    const trigger = document.querySelector('[data-testid="profile-picker"]')
    expect(trigger).not.toBeNull()
    await act(async () => {
      fireEvent.click(trigger!)
    })
    expect(document.querySelector('[data-testid="profile-picker-create"]')).not.toBeNull()
  })
})
