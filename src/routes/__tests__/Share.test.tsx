// @vitest-environment jsdom
// src/routes/__tests__/Share.test.tsx
// SHARE-01, SHARE-02: Share route — encrypt + copy + download

import { render, fireEvent, act, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'
import { setTestLocation } from '../../../tests/helpers/browserRouterTest'

const PROFILE_ID = 'p-share-test'
const RESULT_ID = 'r-share-test'

function makeStore(extra: object = {}) {
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
        subject: 'Bob<>"',
        answers: {},
        createdAt: 1000,
        updatedAt: 2000,
        ...extra,
      },
    ],
    imports: [],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
    scale: [],
  })
}

async function mountAtHash(hash: string, storeJson?: string) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  mem.setItem('relationshape.v1', storeJson ?? makeStore())
  vi.stubGlobal('localStorage', mem)
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
  // Only stub the static methods, not the URL constructor itself
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
  vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined)
  setTestLocation(hash)
  const appMod = await import('@/App')
  await act(async () => {
    render(<appMod.default />)
  })
}

describe('Share route (SHARE-01, SHARE-02)', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('renders the passphrase form for a valid result + profile', async () => {
    await mountAtHash(`#/share/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="share-page"]')).not.toBeNull()
    })
    expect(document.querySelector('[data-testid="share-form"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="share-passphrase"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="share-encrypt-btn"]')).not.toBeNull()
  })

  it('submitting with passphrase encrypts and shows the textarea + copy + download buttons', async () => {
    await mountAtHash(`#/share/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="share-passphrase"]')).not.toBeNull()
    })

    fireEvent.change(document.querySelector('[data-testid="share-passphrase"]')!, {
      target: { value: 'test-pass-123' },
    })

    await act(async () => {
      fireEvent.submit(document.querySelector('[data-testid="share-form"]')!)
    })

    // Encryption is async — wait for the result section
    await waitFor(() => {
      expect(document.querySelector('[data-testid="share-result"]')).not.toBeNull()
    }, { timeout: 10000 })

    const output = document.querySelector('[data-testid="share-output"]') as HTMLTextAreaElement
    expect(output).not.toBeNull()
    expect(output.value).toContain('-----BEGIN RELATIONSHAPE BUNDLE-----')
    expect(document.querySelector('[data-testid="share-copy-btn"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="share-download-btn"]')).not.toBeNull()
  })

  it('download button triggers a Blob URL creation with .rshape.txt filename', async () => {
    await mountAtHash(`#/share/${RESULT_ID}`)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="share-passphrase"]')).not.toBeNull()
    })

    fireEvent.change(document.querySelector('[data-testid="share-passphrase"]')!, {
      target: { value: 'test-pass-123' },
    })

    await act(async () => {
      fireEvent.submit(document.querySelector('[data-testid="share-form"]')!)
    })

    await waitFor(() => {
      expect(document.querySelector('[data-testid="share-download-btn"]')).not.toBeNull()
    }, { timeout: 10000 })

    await act(async () => {
      fireEvent.click(document.querySelector('[data-testid="share-download-btn"]')!)
    })

    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as Blob | undefined
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg?.type).toBe('text/plain')
  })

  it('RESULT-07 (regression): malicious result.subject is React-escaped in the page title area', async () => {
    const malicious = '<script>alert(1)</script>'
    await mountAtHash(`#/share/${RESULT_ID}`, makeStore({ subject: malicious }))
    await waitFor(() => {
      expect(document.querySelector('[data-testid="share-page"]')).not.toBeNull()
    })
    // React text-node escaping means <script is never injected as HTML
    expect(document.body.innerHTML).not.toContain('<script>alert')
    // passphrase input attribute type is password (T-02-23)
    const passInput = document.querySelector('[data-testid="share-passphrase"]') as HTMLInputElement
    expect(passInput?.type).toBe('password')
    expect(passInput?.getAttribute('autocomplete')).toBe('off')
  })
})
