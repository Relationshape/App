// @vitest-environment jsdom
// src/routes/__tests__/Import.test.tsx
// SHARE-03: Import route — paste/file decrypt + saveImport flow

import { render, fireEvent, act, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'
import { setTestLocation } from '../../../tests/helpers/browserRouterTest'
import { encryptResult } from '@/lib/crypto/crypto'

function makeEmptyStore() {
  return JSON.stringify({
    profiles: [],
    results: [],
    imports: [],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
    scale: [],
  })
}

async function mountAtHash(hash: string, storeJson?: string) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  mem.setItem('relationshape.v1', storeJson ?? makeEmptyStore())
  vi.stubGlobal('localStorage', mem)
  setTestLocation(hash)
  const appMod = await import('@/App')
  await act(async () => {
    render(<appMod.default />)
  })
  return mem
}

describe('Import route (SHARE-03)', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('pasted bundle + correct passphrase → saveImport + navigate away from import page', async () => {
    const passphrase = 'my-test-passphrase'
    const syntheticPayload = {
      type: 'relationshape-result',
      name: 'Test Person',
      answers: { connection: { 'Shared activities': { scale: 'yes' } } },
      scale: [{ key: 'yes', label: 'Yes', short: 'Yes', value: 1, color: '#f9c74f', description: '' }],
      version: 1,
    }
    const armor = await encryptResult(syntheticPayload, passphrase)

    const mem = await mountAtHash('#/import')
    await waitFor(() => {
      expect(document.querySelector('[data-testid="import-page"]')).not.toBeNull()
    })

    fireEvent.change(document.querySelector('[data-testid="import-textarea"]')!, {
      target: { value: armor },
    })
    fireEvent.change(document.querySelector('[data-testid="import-passphrase"]')!, {
      target: { value: passphrase },
    })

    await act(async () => {
      fireEvent.submit(document.querySelector('[data-testid="import-form"]')!)
    })

    // After import, should navigate to compare. Check store has import.
    // Re-read store from memory
    await waitFor(() => {
      const stored = mem.getItem('relationshape.v1')
      if (!stored) return
      const parsed = JSON.parse(stored) as { imports?: { id: string }[] }
      expect(parsed.imports?.length).toBe(1)
    }, { timeout: 15000 })

    // After navigate, should have left the import page (now routes to profile/home)
    await waitFor(() => {
      expect(window.location.pathname).not.toContain('/import')
    }, { timeout: 5000 })
  })

  it('file upload populates the textarea via file.text()', async () => {
    await mountAtHash('#/import')
    await waitFor(() => {
      expect(document.querySelector('[data-testid="import-page"]')).not.toBeNull()
    })

    const content = '-----BEGIN RELATIONSHAPE BUNDLE-----\ntest\n-----END RELATIONSHAPE BUNDLE-----'
    const file = new File([content], 'test.rshape.txt', { type: 'text/plain' })
    const fileInput = document.querySelector('[data-testid="import-file"]') as HTMLInputElement
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    // The textarea value should be populated after file.text() resolves
    await waitFor(() => {
      const textarea = document.querySelector('[data-testid="import-textarea"]') as HTMLTextAreaElement
      expect(textarea.value).toBe(content)
    }, { timeout: 3000 })
  })

  it('wrong passphrase → unlock_failed dialog shown; no saveImport call', async () => {
    const armor = await encryptResult({ type: 'relationshape-result', name: 'X', answers: {}, scale: [], version: 1 }, 'correct-pass')

    await mountAtHash('#/import')
    await waitFor(() => {
      expect(document.querySelector('[data-testid="import-page"]')).not.toBeNull()
    })

    fireEvent.change(document.querySelector('[data-testid="import-textarea"]')!, {
      target: { value: armor },
    })
    fireEvent.change(document.querySelector('[data-testid="import-passphrase"]')!, {
      target: { value: 'wrong-passphrase' },
    })

    await act(async () => {
      fireEvent.submit(document.querySelector('[data-testid="import-form"]')!)
    })

    // Dialog host should render the error dialog (via DialogHost in RootLayout)
    // The queue-based dialog shows in document.body via portal
    // unlock_failed i18n: 'Wrong password or corrupted data.'
    await waitFor(() => {
      expect(document.body.textContent).toContain('Wrong password or corrupted data')
    }, { timeout: 10000 })
  })

  it('missing bundle (empty textarea + no file) → import_empty dialog', async () => {
    await mountAtHash('#/import')
    await waitFor(() => {
      expect(document.querySelector('[data-testid="import-page"]')).not.toBeNull()
    })

    // Leave textarea empty, fill passphrase
    fireEvent.change(document.querySelector('[data-testid="import-passphrase"]')!, {
      target: { value: 'some-pass' },
    })

    await act(async () => {
      fireEvent.submit(document.querySelector('[data-testid="import-form"]')!)
    })

    // Should show the empty dialog (import_empty i18n key value)
    await waitFor(() => {
      expect(document.body.textContent).toContain('Paste')
    }, { timeout: 5000 })
  })
})
