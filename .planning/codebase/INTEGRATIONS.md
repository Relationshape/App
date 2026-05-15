# External Integrations

**Analysis Date:** 2026-05-15

## Core Design Principle

**This app has intentionally zero backend integrations.** Privacy is a first-class feature: no network requests are made after the initial page load. No analytics, no accounts, no telemetry, no error tracking. This is stated explicitly in `js/app.js:2` ("No network calls") and the `README.md` ("The app never makes a network request after the first load").

## APIs & External Services

**None (by design).**

There are no calls to third-party APIs. There is no SDK initialization. There is no API key management.

## Data Storage

**Databases:**
- None — no remote database of any kind
- All data is stored in the browser's `localStorage` under key `relationshape.v1`
- Client: hand-written wrapper in `js/storage.js`; the `Store` object exposes all CRUD operations

**File Storage:**
- Local filesystem only — users can download encrypted bundles as `.rshape.txt` files via the browser's native download mechanism (`js/app.js`)

**Caching:**
- Service Worker Cache API — `sw.js` caches all app shell assets under cache name `rshape-v9`
- Strategy: cache-first; on miss, fetch from network and cache if same origin; fallback to `./index.html` on network failure
- Cached assets: `index.html`, `manifest.json`, both CSS files, all JS modules, all SVG icons

## Authentication & Identity

**Auth Provider:** None

There are no user accounts, no login, no sessions, no tokens. Identity exists only as locally-created profiles stored in `localStorage`. Profiles have a name, pronouns, color, and emoji — all user-defined, none server-validated.

## External Resources Loaded at Runtime

**Google Fonts CDN:**
- URL: `https://fonts.googleapis.com` (stylesheet) + `https://fonts.gstatic.com` (font files)
- Loaded via `<link rel="preconnect">` and `<link href="...googleapis.com/css2?...">` in `index.html:15-17`
- Fonts: `DM Sans` (variable: opsz 9–40, weight 300–700, italic) + `Playfair Display` (variable: weight 400–900, italic)
- `display=swap` — text renders immediately in system fallback fonts until web fonts load
- Fallback stack in CSS: `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` (`css/style.css:29`)
- **Note:** This is the ONLY external network request made by the app, and only on first load. Once the Service Worker is active, font requests are not intercepted (the SW only caches same-origin assets).
- **Privacy note:** Loading Google Fonts shares the user's IP address with Google. This is the single known data exposure point.

## Encrypted Bundle Exchange ("Integration")

The only data exchange mechanism is human-mediated, out-of-band bundle sharing:

**Outgoing (Export):**
1. User initiates export in the app
2. App calls `encryptResult(payload, passphrase)` in `js/crypto.js:55`
3. Produces a PEM-style ASCII-armored text block (`-----BEGIN RELATIONSHAPE BUNDLE-----`)
4. User copies text to clipboard (`navigator.clipboard.writeText`) or downloads as `.rshape.txt`
5. User shares the bundle via any external channel (messaging app, email, etc.) — the app is not involved

**Incoming (Import):**
1. User receives a bundle text from their counterpart (via external channel)
2. User pastes into the app's import text area
3. App calls `decryptResult(armored, passphrase)` in `js/crypto.js:72`
4. Decrypted result is stored in `localStorage` via `Store.saveImport()`

**Encryption spec:**
- Cipher: AES-GCM, 256-bit key
- KDF: PBKDF2, SHA-256, 250 000 iterations, 16-byte random salt
- IV: 12-byte random nonce
- Implementation: native WebCrypto API (`crypto.subtle`) — no crypto library
- Bundle format: base64-encoded JSON envelope, wrapped in PEM-style header/footer
- Versioned: `v1` marker inside bundle; parser is forward-compatible

## Monitoring & Observability

**Error Tracking:** None
**Analytics:** None
**Performance Monitoring:** None
**Logging:** None (beyond browser console during development)

No `Sentry`, `Datadog`, `GA`, `GTM`, `Plausible`, `Fathom`, or any equivalent is present.

## CI/CD & Deployment

**Hosting:** Not specified — any static file host works (no server-side requirements)
**CI Pipeline:** Not detected — no `.github/workflows/`, no `netlify.toml`, no CI config files
**Build Step:** None required

## Webhooks & Callbacks

**Incoming:** None
**Outgoing:** None

## Environment Configuration

**Required env vars:** None — the app has no configuration surface at the server level

**Secrets:** None — no API keys, no tokens, no credentials anywhere in the codebase

## External Links (Non-Integration)

The About page links to the original Relationshapes questionnaire repository on GitHub (`https://github.com/Relationshape/Relationshape-Pre-release-1`) as a static `<a>` element — this is not a data integration.

---

*Integration audit: 2026-05-15*
