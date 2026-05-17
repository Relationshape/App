// @vitest-environment jsdom
// src/routes/__tests__/Result.test.tsx
// Phase 04 D-01/D-02 + RESULT-01..07: Result route — header (no delete), subtitle,
// Compare-with section, cat-grid, deep-link modal, Fabi-mode Spider, XSS safety.

import { render, act, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'

const PROFILE_ID = 'p-result-test'
const RESULT_ID = 'r-result-test'

function makeStore(extra: Partial<{ subject: string; answers: object; fabiMode: boolean }> = {}) {
  return JSON.stringify({
    profiles: [
      {
        id: PROFILE_ID,
        name: 'Alice',
        pronouns: 'she/her',
        color: '#7c3aed',
        emoji: '🌷',
        notes: '',
        createdAt: 1000,
      },
    ],
    results: [
      {
        id: RESULT_ID,
        profileId: PROFILE_ID,
        subject: extra.subject ?? 'Bob',
        answers: extra.answers ?? {},
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
    imports: [],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true, fabiMode: extra.fabiMode ?? false },
    scale: [],
  })
}

async function mountAtHash(hash: string, storeJson?: string) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  mem.setItem('relationshape.v1', storeJson ?? makeStore())
  vi.stubGlobal('localStorage', mem)
  window.location.hash = hash
  const appMod = await import('@/App')
  const AppRoot = appMod.default
  await act(async () => {
    render(<AppRoot />)
  })
  return mem
}

describe('Result route (Phase 04 D-01/D-02 + RESULT-01..07)', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('D-02: renders header with 4 actions and no Delete button', async () => {
    await mountAtHash(`#/result/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-page"]')).not.toBeNull()
    }, { timeout: 10000 })

    expect(document.querySelector('[data-testid="result-title"]')?.textContent).toContain('Bob')
    expect(document.querySelector('[data-testid="result-back"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="result-settings"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="result-edit"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="result-share"]')).not.toBeNull()
    // D-02: Delete button is GONE from header (delete moved out — reachable via ResultCard.tsx).
    expect(document.querySelector('[data-testid="result-delete"]')).toBeNull()
  }, 30000)

  it('D-02: header subtitle shows "{emoji} {name} · N answers · last edited <date>"', async () => {
    await mountAtHash(`#/result/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-subtitle"]')).not.toBeNull()
    }, { timeout: 10000 })
    const subtitle = document.querySelector('[data-testid="result-subtitle"]')!.textContent ?? ''
    expect(subtitle).toContain('Alice')        // profile name
    expect(subtitle).toContain('answers')      // i18n "answers" word
    // Subtitle MUST contain a "·" separator (legacy parity)
    expect(subtitle).toContain('·')
  }, 30000)

  it('D-03: renders the Compare-with-someone section', async () => {
    await mountAtHash(`#/result/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-compare-with-section"]')).not.toBeNull()
    }, { timeout: 10000 })
  }, 30000)

  it('D-01 + D-06: renders cat-grid with RsCategoryCard for at least one filled category', async () => {
    // Locked category id: 'connection' (src/lib/data/data.ts:27)
    const answers = { connection: { item1: { scale: 'green' } } }
    await mountAtHash(`#/result/${RESULT_ID}`, makeStore({ answers }))
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-cat-grid-section"]')).not.toBeNull()
    }, { timeout: 10000 })
    // With one filled answer in `connection`, that card MUST render (filledCount > 0 → no is-empty).
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-cat-card-connection"]')).not.toBeNull()
    }, { timeout: 5000 })
  }, 30000)

  it('D-01: deep-link /result/:id/:catId opens the CategoryModal on mount', async () => {
    // Locked category id: 'connection' (src/lib/data/data.ts:27)
    const answers = { connection: { item1: { scale: 'green' } } }
    await mountAtHash(`#/result/${RESULT_ID}/connection`, makeStore({ answers }))
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-page"]')).not.toBeNull()
    }, { timeout: 10000 })
    // RAF schedules the modal open; wait a tick. CategoryModal uses Radix's role="dialog".
    await waitFor(() => {
      const openDialog = document.querySelector('[role="dialog"][data-state="open"]')
      expect(openDialog).not.toBeNull()
    }, { timeout: 5000 })
  }, 30000)

  it('D-01: Fabi-mode renders the Spider overview section; off-mode hides it', async () => {
    // Off-mode — no Spider overview section.
    await mountAtHash(`#/result/${RESULT_ID}`, makeStore({ fabiMode: false }))
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-page"]')).not.toBeNull()
    }, { timeout: 10000 })
    expect(document.querySelector('[data-testid="result-spider-section"]')).toBeNull()

    // On-mode — Spider overview section present.
    cleanup()
    await mountAtHash(`#/result/${RESULT_ID}`, makeStore({ fabiMode: true }))
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-spider-section"]')).not.toBeNull()
    }, { timeout: 10000 })
  }, 30000)

  it('RESULT-07: malicious result.subject renders as inert text (no <script in document.body.innerHTML)', async () => {
    const maliciousSubject = '<script>alert(1)</script>'
    await mountAtHash(`#/result/${RESULT_ID}`, makeStore({ subject: maliciousSubject }))
    await waitFor(() => {
      expect(document.querySelector('[data-testid="result-page"]')).not.toBeNull()
    }, { timeout: 10000 })
    expect(document.body.innerHTML).not.toContain('<script>alert')
    const title = document.querySelector('[data-testid="result-title"]')
    expect(title?.textContent).toContain('<script>alert(1)</script>')
    expect(document.querySelector('script[src]')).toBeNull()
  }, 30000)
})
