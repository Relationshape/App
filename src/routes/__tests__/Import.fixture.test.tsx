// @vitest-environment jsdom
// src/routes/__tests__/Import.fixture.test.tsx
// SHARE-04: v1.0 bundle fixture regression
// Decrypts tests/fixtures/v1-bundle.rshape.txt with the known passphrase
// and asserts the resulting Import matches the expected payload shape.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'
import { PASSPHRASE, EXPECTED_PAYLOAD } from '../../../tests/fixtures/v1-bundle.fixture'

function makeEmptyStore() {
  return JSON.stringify({
    profiles: [],
    results: [],
    imports: [],
    settings: { theme: 'auto', ageConfirmed: true, wizardSeen: true },
    scale: [],
  })
}

describe('SHARE-04: v1.0 bundle fixture regression', () => {
  let mem: MemoryLocalStorage

  beforeEach(() => {
    vi.resetModules()
    mem = new MemoryLocalStorage()
    mem.setItem('relationshape.v1', makeEmptyStore())
    vi.stubGlobal('localStorage', mem)
    window.location.hash = '#/import'
  })

  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('decrypts tests/fixtures/v1-bundle.rshape.txt with the fixture passphrase', async () => {
    const armor = await readFile(
      path.resolve(__dirname, '../../../tests/fixtures/v1-bundle.rshape.txt'),
      'utf-8',
    )
    expect(armor).toContain('-----BEGIN RELATIONSHAPE BUNDLE-----')

    const appMod = await import('@/App')
    await act(async () => {
      render(<appMod.default />)
    })

    // Fill textarea + passphrase
    const textarea = document.querySelector('[data-testid="import-textarea"]') as HTMLTextAreaElement | null
    expect(textarea).not.toBeNull()
    fireEvent.change(textarea!, { target: { value: armor } })

    const passInput = document.querySelector('[data-testid="import-passphrase"]') as HTMLInputElement | null
    expect(passInput).not.toBeNull()
    fireEvent.change(passInput!, { target: { value: PASSPHRASE } })

    await act(async () => {
      fireEvent.submit(document.querySelector('[data-testid="import-form"]')!)
    })

    // Verify the import was saved
    await vi.waitFor(() => {
      const stored = mem.getItem('relationshape.v1')
      if (!stored) throw new Error('store empty')
      const parsed = JSON.parse(stored) as { imports?: unknown[] }
      if (!parsed.imports || parsed.imports.length < 1) throw new Error('no imports yet')
    }, { timeout: 15000 })

    const stored = JSON.parse(mem.getItem('relationshape.v1')!) as { imports: Array<Record<string, unknown>> }
    expect(stored.imports.length).toBe(1)
  })

  it('resulting Import object deep-equals the v1.0 EXPECTED_PAYLOAD shape (ignoring id + importedAt)', async () => {
    const armor = await readFile(
      path.resolve(__dirname, '../../../tests/fixtures/v1-bundle.rshape.txt'),
      'utf-8',
    )

    const appMod = await import('@/App')
    await act(async () => {
      render(<appMod.default />)
    })

    fireEvent.change(
      document.querySelector('[data-testid="import-textarea"]')!,
      { target: { value: armor } }
    )
    fireEvent.change(
      document.querySelector('[data-testid="import-passphrase"]')!,
      { target: { value: PASSPHRASE } }
    )

    await act(async () => {
      fireEvent.submit(document.querySelector('[data-testid="import-form"]')!)
    })

    await vi.waitFor(() => {
      const stored = mem.getItem('relationshape.v1')
      if (!stored) throw new Error('store empty')
      const parsed = JSON.parse(stored) as { imports?: unknown[] }
      if (!parsed.imports || parsed.imports.length < 1) throw new Error('no imports yet')
    }, { timeout: 15000 })

    const stored = JSON.parse(mem.getItem('relationshape.v1')!) as { imports: Array<Record<string, unknown>> }
    const imp = stored.imports[0]!
    const { id: _id, importedAt: _importedAt, ...rest } = imp

    // Core payload fields must match EXPECTED_PAYLOAD
    expect(rest).toMatchObject({
      name: EXPECTED_PAYLOAD.name,
      pronouns: EXPECTED_PAYLOAD.pronouns,
      emoji: EXPECTED_PAYLOAD.emoji,
      color: EXPECTED_PAYLOAD.color,
      subject: EXPECTED_PAYLOAD.subject,
      subjectEmoji: EXPECTED_PAYLOAD.subjectEmoji,
      subjectColor: EXPECTED_PAYLOAD.subjectColor,
      version: EXPECTED_PAYLOAD.version,
    })

    // Answers should round-trip
    expect(rest.answers).toEqual(EXPECTED_PAYLOAD.answers)

    // Scale should round-trip
    expect(rest.scale).toEqual(EXPECTED_PAYLOAD.scale)
  })
})
