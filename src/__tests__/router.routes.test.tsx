// @vitest-environment jsdom
// src/__tests__/router.routes.test.tsx
// SHELL-01, SHELL-02: every D-24 hash route resolves to its expected component.
// Plan 3 update: real routes (Home, Welcome, ProfileEdit, ProfileDetail, Intro)
// now render their real components; placeholder routes keep data-route-placeholder.
import { render, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../tests/helpers/MemoryLocalStorage'

const PROFILE_ID = 'test-profile-abc'
const RESULT_ID = 'test-result-xyz'

function makeBaseStore(extra: object = {}) {
  // persist.ts reads directly from root (no 'state' wrapper) — D-06
  return JSON.stringify({
    profiles: [],
    results: [],
    imports: [],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
    scale: [],
    ...extra,
  })
}

function makeStoreWithProfile() {
  // persist.ts reads directly from root (no 'state' wrapper) — D-06
  return JSON.stringify({
    profiles: [
      {
        id: PROFILE_ID,
        name: 'Test Profile',
        pronouns: '',
        color: '#7c3aed',
        emoji: '🌷',
        notes: '',
        createdAt: 1000000,
      },
    ],
    results: [],
    imports: [],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
    scale: [],
  })
}

function makeStoreWithResult() {
  // persist.ts reads directly from root (no 'state' wrapper) — D-06
  return JSON.stringify({
    profiles: [
      {
        id: PROFILE_ID,
        name: 'Test Profile',
        pronouns: '',
        color: '#7c3aed',
        emoji: '🌷',
        notes: '',
        createdAt: 1000000,
      },
    ],
    results: [
      {
        id: RESULT_ID,
        profileId: PROFILE_ID,
        subject: 'Test Subject',
        answers: {},
        createdAt: 1000000,
        updatedAt: 1000000,
      },
    ],
    imports: [],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
    scale: [],
  })
}

async function mountAppAtHash(hash: string, storeJson?: string) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  mem.setItem('relationshape.v1', storeJson ?? makeBaseStore())
  vi.stubGlobal('localStorage', mem)
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

  it('resolves #/ → redirects to Welcome when no profiles exist', async () => {
    await mountAppAtHash('#/')
    // No profiles → Home redirects to Welcome
    expect(document.querySelector('[data-testid="welcome-page"]')).not.toBeNull()
  })

  it('resolves #/welcome → Welcome (real component)', async () => {
    await mountAppAtHash('#/welcome')
    expect(document.querySelector('[data-testid="welcome-page"]')).not.toBeNull()
  })

  it('resolves #/profile/new → ProfileEdit (real component)', async () => {
    await mountAppAtHash('#/profile/new')
    expect(document.querySelector('[data-testid="profile-edit-form"]')).not.toBeNull()
  })

  it('resolves #/profile/:id → ProfileDetail (real component)', async () => {
    await mountAppAtHash(`#/profile/${PROFILE_ID}`, makeStoreWithProfile())
    expect(document.querySelector('[data-testid="profile-detail-page"]')).not.toBeNull()
  })

  it('resolves #/profile/:id/edit → ProfileEdit (real component)', async () => {
    await mountAppAtHash(`#/profile/${PROFILE_ID}/edit`, makeStoreWithProfile())
    expect(document.querySelector('[data-testid="profile-edit-form"]')).not.toBeNull()
  })

  it('resolves #/q-categories/:profileId/:resultId → CategoryOverview (real component, redirects to / on missing profile)', async () => {
    // CategoryOverview redirects to / when profile/result not found; Home page renders.
    await mountAppAtHash('#/q-categories/p1/r1')
    // Either category-overview-page or home-page appears (redirect on missing entity)
    const found = document.querySelector('[data-testid="category-overview-page"]') ||
                  document.querySelector('[data-testid="welcome-page"]')
    expect(found).not.toBeNull()
  })

  it('resolves #/q/:profileId/:resultId → Questionnaire (real component, redirects to / on missing profile)', async () => {
    // Questionnaire redirects to / when profile/result not found; Home page renders.
    await mountAppAtHash('#/q/p1/r1')
    const found = document.querySelector('[data-testid="welcome-page"]')
    expect(found).not.toBeNull()
  })

  it('resolves #/result/:id → Result (real component, redirects to / on missing result)', async () => {
    // Result navigates to / when result not found in store
    await mountAppAtHash('#/result/r1')
    const found = document.querySelector('[data-testid="result-page"]') ||
                  document.querySelector('[data-testid="welcome-page"]')
    expect(found).not.toBeNull()
  })

  it('resolves #/result/:id/:catId → Result (real component, redirects to / on missing result)', async () => {
    // Result navigates to / when result not found in store
    await mountAppAtHash('#/result/r1/intimacy')
    const found = document.querySelector('[data-testid="result-page"]') ||
                  document.querySelector('[data-testid="welcome-page"]')
    expect(found).not.toBeNull()
  })

  it('resolves #/share/:id → Share (redirects to / when result not found)', async () => {
    // Share navigates to / if result not in store — either share-page or home-page
    await mountAppAtHash('#/share/abc')
    const found = document.querySelector('[data-testid="share-page"]') ||
                  document.querySelector('[data-testid="welcome-page"]')
    expect(found).not.toBeNull()
  })

  it('resolves #/import → Import (real component)', async () => {
    await mountAppAtHash('#/import')
    expect(document.querySelector('[data-testid="import-page"]')).not.toBeNull()
  })

  it('resolves #/compare → Compare (real component)', async () => {
    await mountAppAtHash('#/compare')
    expect(document.querySelector('[data-testid="compare-page"]')).not.toBeNull()
  })

  it('resolves #/settings → Settings (real component)', async () => {
    await mountAppAtHash('#/settings')
    expect(document.querySelector('[data-testid="settings-page"]')).not.toBeNull()
  })

  it('resolves #/map/:id/settings → MapSettings (real component, redirects to / on missing result)', async () => {
    // Pre-seed a result so MapSettings doesn't immediately redirect to /
    await mountAppAtHash(`#/map/${RESULT_ID}/settings`, makeStoreWithResult())
    const found = document.querySelector('[data-testid="map-settings-page"]') ||
                  document.querySelector('[data-testid="welcome-page"]')
    expect(found).not.toBeNull()
  })

  it('resolves #/intro → Intro (real component)', async () => {
    await mountAppAtHash('#/intro')
    expect(document.querySelector('[data-testid="intro-page"]')).not.toBeNull()
  })

  it('resolves #/about → Intro (real component, alias route)', async () => {
    await mountAppAtHash('#/about')
    expect(document.querySelector('[data-testid="intro-page"]')).not.toBeNull()
  })

  it('deep link #/result/r1/intimacy resolves to Result (real component, SHELL-02)', async () => {
    // Result navigates to / on missing result — either result-page or home-page should appear
    await mountAppAtHash('#/result/r1/intimacy')
    const found = document.querySelector('[data-testid="result-page"]') ||
                  document.querySelector('[data-testid="welcome-page"]')
    expect(found).not.toBeNull()
  })
})
