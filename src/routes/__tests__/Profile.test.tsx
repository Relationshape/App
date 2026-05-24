// @vitest-environment jsdom
// src/routes/__tests__/Profile.test.tsx
// PROFILE-01..04, PROFILE-06 (via age-gate bypass seed)
// Tests for Welcome, Home (redirect), ProfileEdit, ProfileDetail routes.

import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'

// Profile IDs for pre-seeded data
const PROFILE_A = 'profile-alpha'
const PROFILE_B = 'profile-beta'
const RESULT_A = 'result-one'
const RESULT_B = 'result-two'
const IMPORT_REG = 'import-regular'
const IMPORT_TPL = 'import-template'

/** Write store in flat format — persist.ts reads from root (D-06, no state wrapper) */
function makeStore(data: {
  profiles?: object[]
  results?: object[]
  imports?: object[]
  settings?: object
} = {}) {
  return JSON.stringify({
    profiles: data.profiles ?? [],
    results: data.results ?? [],
    imports: data.imports ?? [],
    settings: {
      theme: 'auto',
      ageConfirmed: true,
      wizardSeen: true,
      ...(data.settings ?? {}),
    },
    scale: [],
  })
}

function profile(id: string, name: string) {
  return { id, name, pronouns: '', color: '#7c3aed', emoji: '🌷', notes: '', createdAt: 1000 }
}

function result(id: string, profileId: string, subject: string) {
  return { id, profileId, subject, answers: {}, createdAt: 1000, updatedAt: 1000 }
}

function imp(id: string, name: string, exportMode?: string, withAnswers?: boolean) {
  const answers: Record<string, unknown> = withAnswers
    ? { cat1: { item1: { scale: 'yes' } } }
    : {}
  const obj: Record<string, unknown> = { id, name, subject: 'Test', answers, importedAt: 1000 }
  if (exportMode) obj.exportMode = exportMode
  return obj
}

async function mountAtHash(hash: string, storeJson: string) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  mem.setItem('relationshape.v1', storeJson)
  vi.stubGlobal('localStorage', mem)
  window.location.hash = hash
  const appMod = await import('@/App')
  const AppRoot = appMod.default
  await act(async () => {
    render(<AppRoot />)
  })
  return mem
}

describe('Profile lifecycle (PROFILE-01..04)', () => {
  afterEach(() => {
    cleanup()
  })

  it('Home redirects to ProfileDetail when a profile exists (PROFILE-01)', async () => {
    await mountAtHash('#/', makeStore({
      profiles: [profile(PROFILE_A, 'Alice')],
    }))
    // Home redirects to the first profile's detail page
    expect(document.querySelector('[data-testid="profile-detail-page"]')).not.toBeNull()
    // Profile name appears in the header
    const nameEl = document.querySelector('[data-testid="profile-name"]')
    expect(nameEl?.textContent).toBe('Alice')
    // No "new profile" card (Home grid is gone)
    expect(document.querySelector('[data-testid="home-new-profile"]')).toBeNull()
  })

  it('Home redirects to Welcome when no profiles exist (PROFILE-01)', async () => {
    await mountAtHash('#/', makeStore())
    // No profile → redirect to Welcome
    expect(document.querySelector('[data-testid="welcome-page"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="profile-detail-page"]')).toBeNull()
  })

  it('ProfileDetail filters template imports from the imports list (PROFILE-01)', async () => {
    await mountAtHash(`#/profile/${PROFILE_A}`, makeStore({
      profiles: [profile(PROFILE_A, 'Alice')],
      imports: [
        imp(IMPORT_REG, 'Regular Import', undefined, true),
        imp(IMPORT_TPL, '__template__foo', 'template'),
      ],
    }))
    const importSection = document.querySelector('[data-testid="profile-imports"]')
    // Regular import appears; template import (exportMode=template) does not
    expect(importSection).not.toBeNull()
    expect(document.querySelector(`[data-testid="profile-import-${IMPORT_REG}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="profile-import-${IMPORT_TPL}"]`)).toBeNull()
  })

  it('ProfileEdit /profile/new creates a profile and navigates to /profile/:id (PROFILE-03)', async () => {
    const mem = await mountAtHash('#/profile/new', makeStore())
    const form = document.querySelector('[data-testid="profile-edit-form"]')
    expect(form).not.toBeNull()

    // Fill the name and submit
    const nameInput = document.querySelector('[data-testid="profile-name-input"]') as HTMLInputElement
    expect(nameInput).not.toBeNull()
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Person' } })
    })
    const saveBtn = document.querySelector('[data-testid="profile-save-btn"]') as HTMLButtonElement
    await act(async () => {
      fireEvent.click(saveBtn)
    })

    // After submission, navigation should go to /profile/<newId>
    expect(window.location.hash).toMatch(/^#\/profile\/[a-z0-9-]+$/)

    // Store should have 1 profile
    vi.resetModules()
    vi.stubGlobal('localStorage', mem)
    const { useStore } = await import('@/lib/storage/store')
    expect(useStore.getState().profiles.length).toBe(1)
    expect(useStore.getState().profiles[0]?.name).toBe('New Person')
  })

  it('ProfileEdit /profile/:id/edit updates the existing profile (PROFILE-03)', async () => {
    const mem = await mountAtHash(`#/profile/${PROFILE_A}/edit`, makeStore({
      profiles: [profile(PROFILE_A, 'Alice')],
    }))
    const form = document.querySelector('[data-testid="profile-edit-form"]')
    expect(form).not.toBeNull()

    const nameInput = document.querySelector('[data-testid="profile-name-input"]') as HTMLInputElement
    expect(nameInput).not.toBeNull()
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Alice Updated' } })
    })
    const saveBtn = document.querySelector('[data-testid="profile-save-btn"]') as HTMLButtonElement
    await act(async () => {
      fireEvent.click(saveBtn)
    })

    // Store should reflect the updated name
    vi.resetModules()
    vi.stubGlobal('localStorage', mem)
    const { useStore } = await import('@/lib/storage/store')
    const updated = useStore.getState().profiles.find((p) => p.id === PROFILE_A)
    expect(updated?.name).toBe('Alice Updated')
  })

  it('ProfileDetail renders profile header and results list (PROFILE-04)', async () => {
    await mountAtHash(`#/profile/${PROFILE_A}`, makeStore({
      profiles: [profile(PROFILE_A, 'Alice')],
      results: [
        result(RESULT_A, PROFILE_A, 'Map One'),
        result(RESULT_B, PROFILE_A, 'Map Two'),
      ],
    }))
    expect(document.querySelector('[data-testid="profile-detail-page"]')).not.toBeNull()
    // Profile header
    const nameEl = document.querySelector('[data-testid="profile-name"]')
    expect(nameEl?.textContent).toBe('Alice')
    // Result cards
    expect(document.querySelector(`[data-testid="result-card-${RESULT_A}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="result-card-${RESULT_B}"]`)).not.toBeNull()
  })

  it('ProfileDetail result row exposes Continue/View/Share/Delete buttons (PROFILE-04 parity)', async () => {
    await mountAtHash(`#/profile/${PROFILE_A}`, makeStore({
      profiles: [profile(PROFILE_A, 'Alice')],
      results: [result(RESULT_A, PROFILE_A, 'Map One')],
    }))
    expect(document.querySelector(`[data-testid="result-card-${RESULT_A}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="result-view-${RESULT_A}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="result-copy-${RESULT_A}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="result-share-${RESULT_A}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="result-delete-${RESULT_A}"]`)).not.toBeNull()
  })

  it('ProfileDetail renders templates section when a template import exists (PROFILE-01 parity)', async () => {
    await mountAtHash(`#/profile/${PROFILE_A}`, makeStore({
      profiles: [profile(PROFILE_A, 'Alice')],
      imports: [
        imp(IMPORT_REG, 'Regular Import', undefined, true),
        imp(IMPORT_TPL, '__template__foo', 'template'),
      ],
    }))
    // Templates section is its own block, separate from imports
    expect(document.querySelector('[data-testid="profile-templates"]')).not.toBeNull()
    expect(document.querySelector(`[data-testid="profile-template-${IMPORT_TPL}"]`)).not.toBeNull()
    // Existing imports section co-exists and still excludes the template
    expect(document.querySelector('[data-testid="profile-imports"]')).not.toBeNull()
    expect(document.querySelector(`[data-testid="profile-import-${IMPORT_REG}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-testid="profile-import-${IMPORT_TPL}"]`)).toBeNull()
  })

  it('Welcome CTA opens create-profile modal when no profiles exist (PROFILE-02)', async () => {
    await mountAtHash('#/welcome', makeStore())
    const cta = document.querySelector('[data-testid="welcome-cta"]') as HTMLButtonElement
    expect(cta).not.toBeNull()
    await act(async () => {
      fireEvent.click(cta)
    })
    // With no profiles, CTA opens the inline create-profile modal
    expect(document.querySelector('[data-testid="create-profile-modal"]')).not.toBeNull()
  })

  it('Threat T-02-08: profile name with XSS payload renders as inert text (not script)', async () => {
    const xssName = '<script>alert(1)</script>'
    await mountAtHash(`#/profile/${PROFILE_A}`, makeStore({
      profiles: [profile(PROFILE_A, xssName)],
    }))
    // The script text should appear as text content but NOT as executable script element
    expect(document.querySelector('script[data-testid]')).toBeNull()
    expect(document.body.innerHTML).not.toContain('<script>')
    // ProfileDetail renders the name as plain text (React escapes XSS by default)
    const nameEl = document.querySelector('[data-testid="profile-name"]')
    expect(nameEl).not.toBeNull()
    expect(nameEl!.textContent).toContain('alert(1)')
  })

  it('Home redirects to first profile when two profiles exist (PROFILE-01)', async () => {
    await mountAtHash('#/', makeStore({
      profiles: [profile(PROFILE_A, 'Alice'), profile(PROFILE_B, 'Bob')],
    }))
    // Redirects to the first profile (PROFILE_A)
    expect(document.querySelector('[data-testid="profile-detail-page"]')).not.toBeNull()
    const nameEl = document.querySelector('[data-testid="profile-name"]')
    expect(nameEl?.textContent).toBe('Alice')
  })
})
