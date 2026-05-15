// @vitest-environment jsdom
// src/__tests__/Nav.test.tsx
// SHELL-03: Nav renders profile picker + nav links + theme/lang toggles on every leaf route.
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../tests/helpers/MemoryLocalStorage'
import { t } from '@/lib/i18n/i18n'

describe('<Nav /> (SHELL-03)', () => {
  beforeEach(() => {
    window.location.hash = '#/'
    vi.restoreAllMocks()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    cleanup()
  })

  it('renders profile picker + 4 nav links + theme + lang toggles', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
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
    expect(document.querySelector('[data-testid="theme-toggle-auto"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="lang-toggle"]')).not.toBeNull()
  })

  it('shows empty-state copy when no profiles exist', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
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
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
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
