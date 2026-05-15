// @vitest-environment jsdom
// src/__tests__/router.routes.test.tsx
// SHELL-01, SHELL-02: every D-24 hash route resolves to its labelled placeholder.
import { render, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../tests/helpers/MemoryLocalStorage'

async function mountAppAtHash(hash: string) {
  vi.resetModules()
  vi.stubGlobal('localStorage', new MemoryLocalStorage())
  window.location.hash = hash
  const appMod = await import('@/App')
  const AppRoot = appMod.default
  await act(async () => {
    render(<AppRoot />)
  })
}

describe('Router routes (SHELL-01, SHELL-02)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('resolves #/ → Home placeholder', async () => {
    await mountAppAtHash('#/')
    expect(document.querySelector('[data-route-placeholder="Home"]')).not.toBeNull()
  })

  it('resolves #/welcome → Welcome placeholder', async () => {
    await mountAppAtHash('#/welcome')
    expect(document.querySelector('[data-route-placeholder="Welcome"]')).not.toBeNull()
  })

  it('resolves #/profile/new → ProfileEdit placeholder', async () => {
    await mountAppAtHash('#/profile/new')
    expect(document.querySelector('[data-route-placeholder="ProfileEdit"]')).not.toBeNull()
  })

  it('resolves #/profile/:id → ProfileDetail placeholder', async () => {
    await mountAppAtHash('#/profile/abc')
    expect(document.querySelector('[data-route-placeholder="ProfileDetail"]')).not.toBeNull()
  })

  it('resolves #/profile/:id/edit → ProfileEdit placeholder', async () => {
    await mountAppAtHash('#/profile/abc/edit')
    expect(document.querySelector('[data-route-placeholder="ProfileEdit"]')).not.toBeNull()
  })

  it('resolves #/q-categories/:profileId/:resultId → CategoryOverview placeholder', async () => {
    await mountAppAtHash('#/q-categories/p1/r1')
    expect(document.querySelector('[data-route-placeholder="CategoryOverview"]')).not.toBeNull()
  })

  it('resolves #/q/:profileId/:resultId → Questionnaire placeholder', async () => {
    await mountAppAtHash('#/q/p1/r1')
    expect(document.querySelector('[data-route-placeholder="Questionnaire"]')).not.toBeNull()
  })

  it('resolves #/result/:id → Result placeholder', async () => {
    await mountAppAtHash('#/result/r1')
    expect(document.querySelector('[data-route-placeholder="Result"]')).not.toBeNull()
  })

  it('resolves #/result/:id/:catId → Result placeholder (deep link)', async () => {
    await mountAppAtHash('#/result/r1/intimacy')
    expect(document.querySelector('[data-route-placeholder="Result"]')).not.toBeNull()
  })

  it('resolves #/share/:id → Share placeholder', async () => {
    await mountAppAtHash('#/share/abc')
    expect(document.querySelector('[data-route-placeholder="Share"]')).not.toBeNull()
  })

  it('resolves #/import → Import placeholder', async () => {
    await mountAppAtHash('#/import')
    expect(document.querySelector('[data-route-placeholder="Import"]')).not.toBeNull()
  })

  it('resolves #/compare → Compare placeholder', async () => {
    await mountAppAtHash('#/compare')
    expect(document.querySelector('[data-route-placeholder="Compare"]')).not.toBeNull()
  })

  it('resolves #/settings → Settings placeholder', async () => {
    await mountAppAtHash('#/settings')
    expect(document.querySelector('[data-route-placeholder="Settings"]')).not.toBeNull()
  })

  it('resolves #/map/:id/settings → MapSettings placeholder', async () => {
    await mountAppAtHash('#/map/m1/settings')
    expect(document.querySelector('[data-route-placeholder="MapSettings"]')).not.toBeNull()
  })

  it('resolves #/intro → Intro placeholder', async () => {
    await mountAppAtHash('#/intro')
    expect(document.querySelector('[data-route-placeholder="Intro"]')).not.toBeNull()
  })

  it('resolves #/about → Intro placeholder (alias route)', async () => {
    await mountAppAtHash('#/about')
    expect(document.querySelector('[data-route-placeholder="Intro"]')).not.toBeNull()
  })

  it('deep link #/result/r1/intimacy resolves to Result placeholder (SHELL-02)', async () => {
    await mountAppAtHash('#/result/r1/intimacy')
    expect(document.querySelector('[data-route-placeholder="Result"]')).not.toBeNull()
    // Verify the URL has the correct segments (smoke check that params would be available)
    expect(window.location.hash).toBe('#/result/r1/intimacy')
  })
})
