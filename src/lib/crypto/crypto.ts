// src/lib/crypto/crypto.ts
// Port of public/legacy/js/crypto.js to TypeScript — byte-for-byte runtime parity.
// CORE-04. Constants, field names, KDF params, salt/IV sizes, error messages all LOCKED.
// Source: public/legacy/js/crypto.js (136 lines, ported 1:1).
//
// Format: PEM-style ASCII armor wrapping a base64-encoded UTF-8 JSON envelope.
//
//   -----BEGIN RELATIONSHAPE BUNDLE-----
//   v1
//   AbCdEf… (base64, 64 chars per line)
//   -----END RELATIONSHAPE BUNDLE-----
//
// The encoder strips/normalises whitespace on decode so paste-mangled bundles
// still round-trip correctly. AES-GCM 256 with a key derived via PBKDF2.

const enc = new TextEncoder()
const dec = new TextDecoder()
const PBKDF2_ITERS = 250_000
const VERSION = 'v1'
const HEADER = '-----BEGIN RELATIONSHAPE BUNDLE-----'
const FOOTER = '-----END RELATIONSHAPE BUNDLE-----'

export interface Envelope {
  kdf: { n: 'PBKDF2'; h: 'SHA-256'; i: number; s: string }
  cipher: { n: 'AES-GCM'; iv: string }
  data: string
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function bytesToB64(bytes: Uint8Array<ArrayBufferLike>): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  if (typeof Buffer !== 'undefined') {
    // Copy into a fresh ArrayBuffer-backed Uint8Array so the type is
    // Uint8Array<ArrayBuffer> (required by WebCrypto subtle.* in TS 5.7+).
    const buf = Buffer.from(b64, 'base64')
    const out = new Uint8Array(new ArrayBuffer(buf.byteLength))
    out.set(buf)
    return out
  }
  const bin = atob(b64)
  const bytes = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function strToB64(s: string): string {
  return bytesToB64(enc.encode(s))
}

function b64ToStr(b64: string): string {
  return dec.decode(b64ToBytes(b64))
}

function wrapLines(s: string, n = 64): string {
  const matches = s.match(new RegExp(`.{1,${n}}`, 'g'))
  if (!matches) return s
  return matches.join('\n')
}

export async function encryptResult(payload: unknown, passphrase: string): Promise<string> {
  // Explicit ArrayBuffer-backed buffers so the resulting Uint8Array<ArrayBuffer>
  // satisfies the BufferSource constraint that WebCrypto requires (TS 5.7+ no
  // longer accepts the wider Uint8Array<ArrayBufferLike> default).
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)))
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))
  const key = await deriveKey(passphrase, salt)
  const plaintext = enc.encode(JSON.stringify(payload))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext),
  )
  const envelope: Envelope = {
    kdf: { n: 'PBKDF2', h: 'SHA-256', i: PBKDF2_ITERS, s: bytesToB64(salt) },
    cipher: { n: 'AES-GCM', iv: bytesToB64(iv) },
    data: bytesToB64(ciphertext),
  }
  const body = wrapLines(strToB64(JSON.stringify(envelope)))
  return `${HEADER}\n${VERSION}\n${body}\n${FOOTER}\n`
}

export async function decryptResult(armored: string, passphrase: string): Promise<unknown> {
  const env = parseArmor(armored)
  const salt = b64ToBytes(env.kdf.s)
  const iv = b64ToBytes(env.cipher.iv)
  const ct = b64ToBytes(env.data)
  const key = await deriveKey(passphrase, salt)
  let pt: ArrayBuffer
  try {
    pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  } catch {
    throw new Error('Wrong passphrase or corrupted bundle.')
  }
  return JSON.parse(dec.decode(pt))
}

function parseArmor(armored: string): { kdf: { s: string }; cipher: { iv: string }; data: string } {
  if (!armored) throw new Error('Empty input.')
  const text = String(armored).trim()

  // Try PEM-style first.
  const start = text.indexOf(HEADER)
  const end = text.indexOf(FOOTER)
  if (start !== -1 && end !== -1 && end > start) {
    const inner = text.slice(start + HEADER.length, end).trim()
    const lines = inner
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (!lines.length) throw new Error('Bundle is empty.')
    if (lines[0] !== VERSION) {
      // unknown version still attempted — versions are forward-compat
    } else {
      lines.shift()
    }
    const b64 = lines.join('').replace(/\s+/g, '')
    let json: string
    try {
      json = b64ToStr(b64)
    } catch {
      throw new Error('Bundle is not valid base64.')
    }
    return parseEnvelopeJson(json)
  }

  // Fall back: maybe the user pasted a bare envelope JSON (legacy).
  const stripped = text.replace(/\s+/g, '')
  // Bare base64 (no headers)?
  if (/^[A-Za-z0-9+/=]+$/.test(stripped)) {
    try {
      return parseEnvelopeJson(b64ToStr(stripped))
    } catch {
      /* fall through to raw JSON */
    }
  }
  // Raw JSON?
  try {
    return parseEnvelopeJson(text)
  } catch {
    /* fall through to final throw */
  }

  throw new Error('This does not look like a Relationshapes bundle.')
}

function parseEnvelopeJson(
  json: string,
): { kdf: { s: string }; cipher: { iv: string }; data: string } {
  let env: unknown
  try {
    env = JSON.parse(json)
  } catch {
    throw new Error('Bundle JSON is malformed.')
  }
  if (typeof env !== 'object' || env === null) throw new Error('Bundle JSON is malformed.')
  const obj = env as Record<string, unknown>
  // accept both new compact and old verbose key names
  const kdfRaw = (obj.kdf as Record<string, unknown> | undefined) ?? {}
  const cipherRaw = (obj.cipher as Record<string, unknown> | undefined) ?? {}
  const salt = (kdfRaw.s as string | undefined) ?? (kdfRaw.salt as string | undefined)
  const iv = cipherRaw.iv as string | undefined
  const data = obj.data as string | undefined
  if (!salt || !iv || !data) throw new Error('Bundle is missing fields.')
  return { kdf: { s: salt }, cipher: { iv }, data }
}
