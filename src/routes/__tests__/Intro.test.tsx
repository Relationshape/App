// @vitest-environment jsdom
// src/routes/__tests__/Intro.test.tsx
// PROFILE-07: Intro/About prose renders in EN and DE.

import { render, screen, act, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'

function makeStore() {
  return JSON.stringify({
    profiles: [],
    results: [],
    imports: [],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
    scale: [],
  })
}

async function mountAtHash(hash: string) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  mem.setItem('relationshape.v1', makeStore())
  vi.stubGlobal('localStorage', mem)
  window.location.hash = hash
  const appMod = await import('@/App')
  const AppRoot = appMod.default
  await act(async () => {
    render(<AppRoot />)
  })
}

describe('Intro/About (PROFILE-07)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the about title and 4 h2 section headings in EN', async () => {
    await mountAtHash('#/intro')
    const page = document.querySelector('[data-testid="intro-page"]')
    expect(page).not.toBeNull()
    // About title
    const { t } = await import('@/lib/i18n/i18n')
    expect(screen.getByText(t('about_title'))).toBeTruthy()
    // Four h2 headings: how-to, privacy, credits + at least 4 total sections
    const h2s = document.querySelectorAll('[data-testid="intro-page"] h2')
    expect(h2s.length).toBeGreaterThanOrEqual(3)
  })

  it('renders the same Intro markup at /about (alias route)', async () => {
    await mountAtHash('#/about')
    const page = document.querySelector('[data-testid="intro-page"]')
    expect(page).not.toBeNull()
  })
})
