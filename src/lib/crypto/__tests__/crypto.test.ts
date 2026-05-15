// src/lib/crypto/__tests__/crypto.test.ts
// CORE-04: byte-for-byte parity with public/legacy/js/crypto.js
// Vitest env: node (default per D-25, Node 24 has crypto.subtle natively)
import { describe, it, expect } from 'vitest'
import { encryptResult, decryptResult } from '../crypto'
import { ARMORED, PASSPHRASE, EXPECTED_PAYLOAD } from '../../../../tests/fixtures/v1-bundle.fixture'

describe('crypto round-trip (CORE-04)', () => {
  it('decrypts the v1.0 fixture bundle to the expected payload', async () => {
    const payload = await decryptResult(ARMORED, PASSPHRASE)
    expect(payload).toEqual(EXPECTED_PAYLOAD)
  })

  it('re-encrypts an arbitrary payload and decrypts back to parity', async () => {
    const armored = await encryptResult(EXPECTED_PAYLOAD, 'fresh-passphrase-X')
    const restored = await decryptResult(armored, 'fresh-passphrase-X')
    expect(restored).toEqual(EXPECTED_PAYLOAD)
  })

  it('produces an envelope with the locked byte-shape (PBKDF2 250 000, 16-byte salt, 12-byte IV)', async () => {
    const armored = await encryptResult({ hello: 'world' }, 'x')
    // First line after header must be the version 'v1'
    const lines = armored.split('\n')
    expect(lines[0]).toBe('-----BEGIN RELATIONSHAPE BUNDLE-----')
    expect(lines[1]).toBe('v1')

    // Decode the inner envelope JSON for byte-shape assertions
    const bodyB64 = lines
      .slice(2, lines.length - 2)
      .filter(Boolean)
      .join('')
    const envelopeJson = Buffer.from(bodyB64, 'base64').toString('utf-8')
    const envelope = JSON.parse(envelopeJson) as {
      kdf: { n: string; h: string; i: number; s: string }
      cipher: { n: string; iv: string }
      data: string
    }
    expect(envelope.kdf.n).toBe('PBKDF2')
    expect(envelope.kdf.h).toBe('SHA-256')
    expect(envelope.kdf.i).toBe(250_000)
    expect(Buffer.from(envelope.kdf.s, 'base64').length).toBe(16)
    expect(envelope.cipher.n).toBe('AES-GCM')
    expect(Buffer.from(envelope.cipher.iv, 'base64').length).toBe(12)
    expect(typeof envelope.data).toBe('string')
    expect(envelope.data.length).toBeGreaterThan(0)
  })

  it('throws with the locked error message on wrong passphrase', async () => {
    const armored = await encryptResult({ hello: 'world' }, 'correct-pass')
    await expect(decryptResult(armored, 'wrong-pass')).rejects.toThrow(
      'Wrong passphrase or corrupted bundle.',
    )
  })

  it('accepts both kdf.s and kdf.salt field names (parseEnvelopeJson backward compat)', async () => {
    // Encrypt with the current (compact) field set
    const armored = await encryptResult({ hello: 'world' }, 'x')
    const lines = armored.split('\n')
    const bodyB64 = lines
      .slice(2, lines.length - 2)
      .filter(Boolean)
      .join('')
    const envelope = JSON.parse(Buffer.from(bodyB64, 'base64').toString('utf-8')) as {
      kdf: { n: string; h: string; i: number; s: string }
      cipher: { n: string; iv: string }
      data: string
    }

    // Rebuild with the legacy verbose `kdf.salt` field name (some v1.0 era bundles use this)
    const verboseEnvelope = {
      kdf: { n: envelope.kdf.n, h: envelope.kdf.h, i: envelope.kdf.i, salt: envelope.kdf.s },
      cipher: envelope.cipher,
      data: envelope.data,
    }
    const verboseBody = Buffer.from(JSON.stringify(verboseEnvelope)).toString('base64')
    const verboseArmored =
      '-----BEGIN RELATIONSHAPE BUNDLE-----\n' +
      'v1\n' +
      verboseBody +
      '\n-----END RELATIONSHAPE BUNDLE-----\n'

    const restored = await decryptResult(verboseArmored, 'x')
    expect(restored).toEqual({ hello: 'world' })
  })
})
