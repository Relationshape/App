// End-to-end encryption helpers using WebCrypto.
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

const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERS = 250_000;
const VERSION = "v1";
const HEADER = "-----BEGIN RELATIONSHAPE BUNDLE-----";
const FOOTER = "-----END RELATIONSHAPE BUNDLE-----";

async function deriveKey(passphrase, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bytesToB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
function strToB64(s) {
  return bytesToB64(enc.encode(s));
}
function b64ToStr(b64) {
  return dec.decode(b64ToBytes(b64));
}
function wrapLines(s, n = 64) {
  return s.match(new RegExp(`.{1,${n}}`, "g")).join("\n");
}

export async function encryptResult(payload, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(passphrase, salt);
  const plaintext = enc.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
  );
  const envelope = {
    kdf:    { n: "PBKDF2", h: "SHA-256", i: PBKDF2_ITERS, s: bytesToB64(salt) },
    cipher: { n: "AES-GCM", iv: bytesToB64(iv) },
    data:   bytesToB64(ciphertext),
  };
  const body = wrapLines(strToB64(JSON.stringify(envelope)));
  return `${HEADER}\n${VERSION}\n${body}\n${FOOTER}\n`;
}

export async function decryptResult(armored, passphrase) {
  const env = parseArmor(armored);
  const salt = b64ToBytes(env.kdf.s);
  const iv   = b64ToBytes(env.cipher.iv);
  const ct   = b64ToBytes(env.data);
  const key  = await deriveKey(passphrase, salt);
  let pt;
  try {
    pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  } catch {
    throw new Error("Wrong passphrase or corrupted bundle.");
  }
  return JSON.parse(dec.decode(pt));
}

function parseArmor(armored) {
  if (!armored) throw new Error("Empty input.");
  const text = String(armored).trim();

  // Try PEM-style first.
  const start = text.indexOf(HEADER);
  const end = text.indexOf(FOOTER);
  if (start !== -1 && end !== -1 && end > start) {
    const inner = text.slice(start + HEADER.length, end).trim();
    const lines = inner.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) throw new Error("Bundle is empty.");
    if (lines[0] !== VERSION) {
      // unknown version still attempted — versions are forward-compat
    } else {
      lines.shift();
    }
    const b64 = lines.join("").replace(/\s+/g, "");
    let json;
    try { json = b64ToStr(b64); }
    catch { throw new Error("Bundle is not valid base64."); }
    return parseEnvelopeJson(json);
  }

  // Fall back: maybe the user pasted a bare envelope JSON (legacy).
  const stripped = text.replace(/\s+/g, "");
  // Bare base64 (no headers)?
  if (/^[A-Za-z0-9+/=]+$/.test(stripped)) {
    try { return parseEnvelopeJson(b64ToStr(stripped)); }
    catch {}
  }
  // Raw JSON?
  try { return parseEnvelopeJson(text); }
  catch {}

  throw new Error("This does not look like a Relationshapes bundle.");
}

function parseEnvelopeJson(json) {
  let env;
  try { env = JSON.parse(json); }
  catch { throw new Error("Bundle JSON is malformed."); }
  // accept both new compact and old verbose key names
  const kdf = env.kdf || {};
  const salt = kdf.s || kdf.salt;
  const cipher = env.cipher || {};
  const iv = cipher.iv;
  const data = env.data;
  if (!salt || !iv || !data) throw new Error("Bundle is missing fields.");
  return { kdf: { s: salt }, cipher: { iv }, data };
}
