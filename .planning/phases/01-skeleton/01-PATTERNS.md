# Phase 1: Skeleton - Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 49 new/modified files
**Analogs found:** 28 / 49 (21 are net-new toolchain config / tests / assets with no v1.0 analog)

> All v1.0 line references below correspond to source files in the repo root **before** the D-22 move (`js/`, `css/`, `sw.js`, `index.html`, `manifest.json`, `icons/`). After the move, these same files live under `public/legacy/` with identical content — paths in the "Closest Analog" column are pre-move repo-root paths for clarity.

## File Classification

### Toolchain Config (Group 1) — Net-new, no v1.0 analog

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` | config | static | `manifest.json` (only existing JSON config) | none (different domain) |
| `vite.config.ts` | config | build-graph | — | net-new |
| `tsconfig.json` | config | static | — | net-new |
| `tsconfig.app.json` | config | static | — | net-new |
| `tsconfig.node.json` | config | static | — | net-new |
| `tailwind.config.ts` (shim) | config | static | — | net-new |
| `postcss.config.js` (likely omitted — `@tailwindcss/vite` covers it) | config | static | — | net-new |
| `eslint.config.js` (flat) | config | static | — | net-new |
| `.prettierrc` | config | static | — | net-new |
| `vitest.config.ts` | config | build-graph | — | net-new |
| `components.json` (shadcn) | config | static | — | net-new (CLI-generated) |
| `index.html` (new Vite root entry) | template | static | `index.html` (v1.0) | structural-only |

### Pure-Logic TS Ports (Group 2) — v1.0 analogs exist

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/storage/store.ts` | service (Zustand store) | CRUD (in-memory + persist) | `js/storage.js:57-300` (Store object) | exact (1:1 method port) |
| `src/lib/storage/persist.ts` | middleware | request-response (state→localStorage) | `js/storage.js:15-31` (load/save) | role-match |
| `src/lib/storage/migrateScale.ts` | utility | transform | `js/storage.js:50-55` (migrateScale) | exact |
| `src/lib/crypto/crypto.ts` | service | transform (encrypt/decrypt) | `js/crypto.js:1-136` (entire file) | exact (byte-for-byte) |
| `src/lib/data/data.ts` | data-module | static const exports | `js/data.js:1-870` (entire file) | exact (content-frozen) |
| `src/lib/data/types.ts` | type-defs | static | derived from `js/data.js` `as const` arrays | net-new (derivation) |
| `src/lib/i18n/en.ts` | data-module | static const exports | `js/i18n.js:5-396` (TRANSLATIONS.en) | exact (key-for-key) |
| `src/lib/i18n/de.ts` | data-module | static const exports | `js/i18n.js:397-785` (TRANSLATIONS.de) | exact (key-for-key) |
| `src/lib/i18n/i18n.ts` | service | transform (lookup + interpolate) | `js/i18n.js:798-846` (t, setLang, detectLanguage, getLocalizedDefaultScale) | exact |

### App Shell + Routes (Group 3) — Net-new React layer

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/main.tsx` | entry | event-driven (mount) | `index.html:24` (`<script type="module">` load) | structural (different paradigm) |
| `src/App.tsx` | component | request-response | `js/app.js:836-839` (bootstrap fn) | role-match |
| `src/router.tsx` | router | event-driven (hashchange) | `js/app.js:853-940` (route() switch) | role-match (different API) |
| `src/routes/Placeholder.tsx` | component (route) | static render | `js/app.js:987` (`viewHome` shell) | role-match |
| `src/routes/DesignSystem.tsx` | component (route) | static render | — | net-new (D-27) |

### Design System + Styling (Group 4) — v1.0 has CSS analogs

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/styles/theme.css` | stylesheet | static (CSS tokens) | `css/style.css:1-92` (`:root` blocks) | exact (token-for-token) |
| `src/styles/fonts.css` | stylesheet | static | `index.html:15-17` (Google Fonts `<link>`) | structural (different sourcing) |
| `src/styles/animations.css` | stylesheet | static (keyframes) | `css/additions.css:828, 833, 873, 903, 933, 964, 1367, 1398` (8 keyframes) | exact |
| `src/styles/reduced-motion.css` (or merged into animations.css) | stylesheet | static | — | net-new (v1.0 has no guard) |
| `src/styles/globals.css` | stylesheet | static | `css/style.css` (reset + base) | partial |
| `src/components/ui/button.tsx` | component | request-response | — | net-new (shadcn CLI-generated) |
| `src/components/ThemeToggle.tsx` | component | event-driven | `js/app.js:3620-3630` (theme toggle row inside `viewSettings`) | role-match (different framework) |
| `src/components/LangToggle.tsx` | component | event-driven | `js/app.js` (lang select in `viewSettings`) | role-match |
| `src/hooks/useTheme.ts` | hook | request-response (state→DOM) | `js/app.js:47-57` (applyTheme function) | exact (semantic) |
| `src/hooks/useLang.ts` | hook | request-response | `js/i18n.js:813-825` (getLang, setLang) | exact (semantic) |
| `src/lib/utils.ts` | utility | transform | — | net-new (shadcn `cn()` helper) |

### PWA + Service Worker (Group 5) — Replacement, not port

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `vite-plugin-pwa` block inside `vite.config.ts` | config | build-graph | `sw.js:1-42` (hand-rolled cache-first SW) | role-match (different impl) |
| `public/icons/favicon.svg` | asset | static | `icons/favicon.svg` | exact (file copy) |
| `public/icons/icon-192.svg` | asset | static | `icons/icon-192.svg` | exact (file copy) |
| `public/icons/icon-512.svg` | asset | static | `icons/icon-512.svg` | exact (file copy) |
| `public/manifest.webmanifest` (auto-generated) | config | static | `manifest.json` | role-match (vite-plugin-pwa emits) |

### Tests + Fixtures (Group 6) — Net-new (zero-test baseline)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/fixtures/v1-bundle.rshape.txt` | fixture | static | — | net-new (manually captured) |
| `tests/fixtures/v1-bundle.fixture.ts` | fixture | static | — | net-new |
| `tests/fixtures/v1-localstorage.fixture.ts` | fixture | static | — | net-new |
| `tests/fixtures/README.md` | docs | static | — | net-new |
| `src/lib/crypto/__tests__/crypto.test.ts` | test | transform | `js/crypto.js` (target under test) | role-match (test for analog) |
| `src/lib/storage/__tests__/storage.test.ts` | test | CRUD | `js/storage.js` (target under test) | role-match |
| `src/lib/storage/__tests__/migrateScale.test.ts` | test | transform | `js/storage.js:50-55` (target under test) | role-match |
| `src/lib/i18n/__tests__/i18n.test.ts` | test | transform | `js/i18n.js` (target under test) | role-match |
| `src/styles/__tests__/theme-tokens.test.ts` | test | transform | `css/style.css:1-92` (parity target) | role-match |
| `src/__tests__/App.smoke.test.tsx` | test | render | `src/App.tsx` (target under test) | role-match |
| `tests/setup.ts` | test-config | static | — | net-new |

### Legacy Passthrough (Group 7) — Pure file moves

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `public/legacy/index.html` | template | static | `index.html` (move) | identity |
| `public/legacy/js/app.js` | script | event-driven | `js/app.js` (move) | identity |
| `public/legacy/js/storage.js` | script | CRUD | `js/storage.js` (move) | identity |
| `public/legacy/js/crypto.js` | script | transform | `js/crypto.js` (move) | identity |
| `public/legacy/js/data.js` | script | static | `js/data.js` (move) | identity |
| `public/legacy/js/i18n.js` | script | transform | `js/i18n.js` (move) | identity |
| `public/legacy/js/charts.js` | script | transform | `js/charts.js` (move) | identity |
| `public/legacy/css/style.css` | stylesheet | static | `css/style.css` (move) | identity |
| `public/legacy/css/additions.css` | stylesheet | static | `css/additions.css` (move) | identity |
| `public/legacy/sw.js` | script | request-response (SW thread) | `sw.js` (move) | identity |
| `public/legacy/manifest.json` | config | static | `manifest.json` (move) | identity |
| `public/legacy/icons/*` | asset | static | `icons/*` (move) | identity |

---

## Pattern Assignments

### Group 2: Pure-Logic TS Ports

---

### `src/lib/crypto/crypto.ts` (service, transform)

**Analog:** `js/crypto.js` (entire 136-line file — byte-for-byte port)

**Module-level constants pattern** (`js/crypto.js:13-18`):
```js
const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERS = 250_000;
const VERSION = "v1";
const HEADER = "-----BEGIN RELATIONSHAPE BUNDLE-----";
const FOOTER = "-----END RELATIONSHAPE BUNDLE-----";
```
**Adaptation:** Keep these EXACTLY. Add no new constants. Do not change literal strings — `HEADER`/`FOOTER`/`VERSION` are part of the locked v1 bundle format (PWA-04, PWA-05). Mark as `const` (already correct shape).

**Key derivation pattern** (`js/crypto.js:20-32`):
```js
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
```
**Adaptation:** Add types: `async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey>`. No runtime change.

**Encrypt pattern** (`js/crypto.js:55-70`):
```js
export async function encryptResult(payload, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));   // 16-byte salt — LOCKED
  const iv   = crypto.getRandomValues(new Uint8Array(12));   // 12-byte IV — LOCKED
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
```
**Adaptation:** Add `export interface Envelope { kdf: { n: 'PBKDF2'; h: 'SHA-256'; i: number; s: string }; cipher: { n: 'AES-GCM'; iv: string }; data: string }`. Function signature: `(payload: unknown, passphrase: string): Promise<string>`. Envelope field names (`n`, `h`, `i`, `s`, `iv`, `data`) are LOCKED — do not rename to be more descriptive.

**Decrypt error pattern** (`js/crypto.js:72-85`):
```js
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
```
**Adaptation:** Return type `Promise<unknown>`. The error message string is LOCKED — UI in Phase 2 will match against it for toast translation key lookup.

**Armor parsing pattern** (`js/crypto.js:87-122`): port `parseArmor` verbatim — handles three input shapes (PEM-armored, bare base64, raw JSON). Strict TS: input arg `armored: string`, returns the partial-envelope shape. Use the same fallback chain — do NOT split this into separate functions.

**Envelope-shape validation pattern** (`js/crypto.js:124-136`):
```js
function parseEnvelopeJson(json) {
  let env;
  try { env = JSON.parse(json); }
  catch { throw new Error("Bundle JSON is malformed."); }
  const kdf = env.kdf || {};
  const salt = kdf.s || kdf.salt;    // accept both compact and verbose
  const cipher = env.cipher || {};
  const iv = cipher.iv;
  const data = env.data;
  if (!salt || !iv || !data) throw new Error("Bundle is missing fields.");
  return { kdf: { s: salt }, cipher: { iv }, data };
}
```
**Adaptation:** Keep the `kdf.s || kdf.salt` fallback — v1.0 bundles in the wild may use either compact or verbose names. Strict TS: use `unknown` for `env`, narrow with property checks.

---

### `src/lib/storage/store.ts` (service, CRUD)

**Analog:** `js/storage.js` (entire file, 305 lines)

**Storage key constant** (`js/storage.js:7`):
```js
const KEY = "relationshape.v1";
```
**Adaptation:** This key is LOCKED by PROJECT.md — every existing v1.0 user has data at this key. Do NOT change to `relationshape.v2`. Move the constant to `src/lib/storage/persist.ts` (the only file that touches `localStorage` directly).

**uid fallback pattern** (`js/storage.js:9-13`):
```js
function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
```
**Adaptation:** Port verbatim. TypeScript signature `function uid(): string`. Keep the fallback (Pitfall 7: pre-Safari 15.4 lacks `crypto.randomUUID`).

**Defaults pattern** (`js/storage.js:33-43`):
```js
function defaults() {
  return {
    profiles: [], results: [], imports: [],
    settings: { theme: "auto" },
    scale: cloneScale(DEFAULT_SCALE),
  };
}
function cloneScale(s) {
  return s.map(x => ({ ...x }));
}
```
**Adaptation:** Use this as the Zustand store's `initialState` shape. Add `lastSaveError: null` (CORE-02, D-07) — that field is NOT persisted to localStorage (excluded from the `PersistedShape` slice in `persist.ts`).

**Store method shape — getter pattern** (`js/storage.js:59-60`):
```js
getProfiles() { return load().profiles; },
getProfile(id) { return load().profiles.find(p => p.id === id) || null; },
```
**Adaptation:** Zustand replaces every `load().X` with direct state access. As selectors: `useStore(s => s.profiles)`, `useStore(s => s.profiles.find(p => p.id === id) ?? null)`. CORE-03: no `JSON.parse` per read — state IS the cache (D-05). For non-React consumers, expose `store.getState()` directly.

**Store method shape — mutator pattern** (`js/storage.js:61-74`):
```js
createProfile({ name, pronouns, color, emoji }) {
  const data = load();
  const profile = {
    id: uid(),
    name: name || "Unnamed",
    pronouns: pronouns || "",
    color: color || randomColor(),
    emoji: emoji || randomEmoji(),
    createdAt: Date.now(),
  };
  data.profiles.push(profile);
  save(data);
  return profile;
},
```
**Adaptation:** Convert each method to a Zustand action. Use `set` from Zustand. Persistence middleware wraps `set` to write `localStorage` automatically (D-06). Return value preserved for callers. Use immutable updates: `set(state => ({ profiles: [...state.profiles, profile] }))` — not in-place `push`.

**Migration trigger pattern** (`js/storage.js:139-159`, `getScale` method) — references `migrateScale` and inline auto-replace-with-localized-default logic. Port the conditional structure (English default detection vs DE default detection vs custom) into a `getScale` selector that returns the migrated array AND triggers a side-effect set when a migration changes the persisted shape.

---

### `src/lib/storage/persist.ts` (middleware, request-response)

**Analog:** `js/storage.js:15-31` (load + save fns) + the RESEARCH.md `relationshapePersist` template

**Load pattern with try/catch** (`js/storage.js:15-27`):
```js
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw);
    if (!data.profiles) data.profiles = [];
    if (!data.results)  data.results  = [];
    if (!data.imports)  data.imports  = [];
    return data;
  } catch {
    return defaults();
  }
}
```
**Adaptation:** This becomes the middleware's `hydrate()` step. Mirror the silent-fallback-to-defaults behaviour (CORE-08: byte-compatible round-trip; corrupt data should not crash the store). Add `scale` migration: `Array.isArray(data.scale) ? migrateScale(data.scale) : DEFAULT_SCALE`.

**Save pattern (NO try/catch in v1.0 — the bug we're fixing per CORE-02)** (`js/storage.js:29-31`):
```js
function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));    // CORE-02: throws on quota
}
```
**Adaptation:** v2.0 wraps in try/catch (D-07): on `QuotaExceededError` set `lastSaveError: { kind: 'QUOTA_EXCEEDED', message, at }`, on success clear `lastSaveError`. Critical: the in-memory state stays valid even when persistence fails (D-05 + D-07).

**Persisted-shape slicing** (per D-06): only `profiles | results | imports | settings | scale` are written. `lastSaveError` is in-memory only (NOT persisted to localStorage).

---

### `src/lib/storage/migrateScale.ts` (utility, transform)

**Analog:** `js/storage.js:50-55`

**Migration pattern** (`js/storage.js:45-55`):
```js
function recalcScaleValues(steps) {
  steps.forEach((s, i) => { s.value = i; });
  return steps;
}

function migrateScale(scale) {
  if (!Array.isArray(scale) || scale.length < 2) return scale;
  const looksOld = scale[0].value > scale[scale.length - 1].value;
  if (looksOld) scale = [...scale].reverse();
  return recalcScaleValues(cloneScale(scale));
}
```
**Adaptation:** TS signature `function migrateScale(scale: readonly ScaleStep[]): ScaleStep[]`. Internally clone (Pitfall 8 — don't mutate input). Test coverage required (CORE-05, CORE-07):
- (a) reversed old-format scale gets re-reversed and re-valued
- (b) un-modified English default replaced with localized default
- (c) un-modified DE default replaced with localized default

---

### `src/lib/data/data.ts` (data-module, static const exports)

**Analog:** `js/data.js` (870 lines, content-frozen — CORE-05)

**Default scale export pattern** (`js/data.js:8-16`):
```js
export const DEFAULT_SCALE = [
  { key: "no",         label: "No",            short: "No",         value: 0, color: "#264653", description: "I do not want / agree to this." },
  { key: "not-really", label: "Not really",    short: "Not really", value: 1, color: "#577590", description: "I lean against this." },
  { key: "maybe",      label: "Maybe / future",short: "Maybe",      value: 2, color: "#43aa8b", description: "Hopefully or maybe in the future." },
  // ... 4 more steps
];
```
**Adaptation:** Add `as const` to enable type derivation. Object shape (`key`, `label`, `short`, `value`, `color`, `description`) frozen — no field additions, no renames.

**Category export pattern** (`js/data.js:20-50`):
```js
export const CATEGORIES = [
  {
    id: "connection", title: "General connection", de: "Allgemeine Verbindung",
    icon: "🌱", color: "#7c3aed",
    blurb: "How you connect, communicate and share humour day-to-day.",
    deBlurb: "Wie ihr euch verbindet, kommuniziert und Humor teilt.",
    items: [...],
    deItems: [...],
  },
  // ... 30 more
];
```
**Adaptation:** Add `as const`. Derive `CategoryId = typeof CATEGORIES[number]["id"]` for downstream usage. Content is content-frozen — do not change a single string.

**Spider axes pattern** (`js/data.js:851-864`):
```js
export const SPIDER_AXES = [
  "emotional-intimacy",
  "physical-intimacy",
  // ...
];
```
**Adaptation:** `as const`. Type as `readonly CategoryId[]`.

**File format constant** (`js/data.js:867-870`):
```js
export const FILE_FORMAT = {
  magic: "RSHAPE1",
  version: 1,
};
```
**Adaptation:** Port verbatim. Mark `as const`.

---

### `src/lib/data/types.ts` (type-defs, static)

**Analog:** Derived from `as const` arrays in `data.ts` — no separate v1.0 source

**Type derivation pattern** (RESEARCH.md, "Pattern 5"):
```ts
export type CategoryId = typeof CATEGORIES[number]["id"];
export type ScaleStep = (typeof DEFAULT_SCALE)[number];
export type Lang = 'en' | 'de';
```
**Adaptation:** Define `Profile`, `Result`, `Import`, `Settings`, `ScaleStep`, `PersistedShape`, `AppState`, `LastSaveError`. Derive ID unions from the static `as const` arrays (CORE-05 + D-15 strict mode benefits).

---

### `src/lib/i18n/en.ts` (data-module, static const exports)

**Analog:** `js/i18n.js:5-396` (`TRANSLATIONS.en` block, ~304 keys per RESEARCH.md)

**Key-value pattern** (`js/i18n.js:6-50`):
```js
en: {
  // Nav
  nav_profiles: "👤 Profiles",
  nav_import: "📥 Import/Export",
  nav_compare: "📊 Results/Compare",
  nav_settings: "⚙️ Settings",
  nav_about: "About",
  nav_home: "Home",

  // Home / Welcome
  welcome_title: "Relationshapes",
  welcome_sub: "A private space to map your relationships.\nYour needs. Your agreements. Your shape.",
  // ... ~300 more
},
```
**Adaptation:** Export as `as const`:
```ts
export const EN = {
  nav_profiles: '👤 Profiles',
  // ...
} as const;
export type TranslationKey = keyof typeof EN;
```
Mirror the section comment headers (`// Nav`, `// Home / Welcome`) so future diffs vs v1.0 stay readable. Preserve `\n` escapes verbatim. **D-13 requirement:** EN is the source of truth for key set; DE must mirror it exactly.

---

### `src/lib/i18n/de.ts` (data-module, static const exports)

**Analog:** `js/i18n.js:397-785` (`TRANSLATIONS.de` block)

**Adaptation pattern** (`js/i18n.js:743-746` examples):
```js
seeded_toast: "Aus {name} erstellt – gleiche Fragen, deine eigenen Antworten.",
pick_import_title: "Import auswählen",
your_version_title: "Deine Version dieser Karte",
your_version_label: "Wie möchtest du deine Karte für {name}s \"{subject}\" nennen?",
```
**Adaptation:** Constrain to `Record<TranslationKey, string>`:
```ts
import type { TranslationKey } from './en';
export const DE: Record<TranslationKey, string> = {
  nav_profiles: '👤 Profile',
  // ...
};
```
TS compile error if any key from EN is missing here (D-13 type-safety win over v1.0).

---

### `src/lib/i18n/i18n.ts` (service, transform)

**Analog:** `js/i18n.js:798-846`

**Detection pattern** (`js/i18n.js:798-811`):
```js
function detectLanguage() {
  const stored = (() => {
    try {
      const d = JSON.parse(localStorage.getItem("relationshape.v1") || "{}");
      return d.settings?.lang;
    } catch { return null; }
  })();
  if (stored && TRANSLATIONS[stored]) return stored;
  const browser = (navigator.language || navigator.userLanguage || "en").split("-")[0].toLowerCase();
  return TRANSLATIONS[browser] ? browser : "en";
}

let _lang = detectLanguage();
```
**Adaptation:** Port the detection chain (D-14): localStorage settings.lang → `navigator.language` prefix → default `'en'`. Module-level `let _lang: Lang` mirrors v1.0; React reactivity happens via the Zustand `settings.lang` slice (the `useLang` hook reads from Zustand, and `setLang()` here is called by a store action). Do not depend on `navigator.userLanguage` (IE-only, removable).

**Lookup pattern** (`js/i18n.js:827-834`):
```js
export function t(key, vars = {}) {
  const dict = TRANSLATIONS[_lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}
```
**Adaptation:** TS signature `t(key: TranslationKey, vars?: Record<string, string | number>): string`. D-13's typed key union means the `?? key` fallback is dead-code at compile time for any direct call site, but keep it for runtime safety (dynamic key lookups). Coerce `String(v)` for the interpolation (vars may be numbers, e.g., `t('imported_versioned_toast', { n: version })`).

**Localized scale pattern** (`js/i18n.js:843-846`):
```js
export function getLocalizedDefaultScale(englishDefault) {
  if (_lang === "de") return DEFAULT_SCALE_DE;
  return englishDefault;
}
```
**Adaptation:** Same shape. Type signature `function getLocalizedDefaultScale(englishDefault: ScaleStep[]): ScaleStep[]`. `DEFAULT_SCALE_DE` is exported from `i18n.ts` (matching v1.0 `js/i18n.js:788-796`), NOT from `data.ts` (English-only there). This is intentional — `data.ts` stays English-source-of-truth; localization lives in `i18n/`.

---

### Group 3: App Shell + Routes

---

### `src/main.tsx` (entry, event-driven mount)

**Analog:** `index.html:24-31` + `js/app.js:836-841` (DOMContentLoaded bootstrap)

**v1.0 bootstrap pattern** (`js/app.js:836-841`):
```js
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => applyTheme());
  bindGlobalNav();
  route();
  // ...
});
```
**Adaptation:** Replaced with `ReactDOM.createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router} /></StrictMode>)`. Theme application moves into `useTheme()` hook (D-19). Side-effect imports for self-hosted fonts (D-20):
```ts
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/playfair-display';
import './styles/globals.css';
```

---

### `src/router.tsx` (router, event-driven hashchange)

**Analog:** `js/app.js:36-43` (navigate) + `js/app.js:853-940` (route dispatcher)

**v1.0 hash-routing pattern** (`js/app.js:36-43`):
```js
function navigate(hash) {
  const target = "#" + (hash.startsWith("/") ? "/" + hash.replace(/^\/+/, "") : hash.replace(/^#/, ""));
  if (location.hash === target || location.hash === hash) {
    route();
  } else {
    location.hash = hash;
  }
}
```
**v1.0 dispatch pattern** (`js/app.js:861-884`, paraphrased):
```js
function route() {
  const hash = location.hash.replace(/^#/, "");
  const segs = hash.split("/").filter(Boolean);
  switch (segs[0]) {
    case undefined:        viewHome(); break;
    case "welcome":        viewWelcome(); break;
    case "profile":        viewProfile(segs[1]); break;
    // ... 12 more cases
  }
}
```
**Adaptation (D-01, D-02, D-03):**
```ts
import { createHashRouter } from 'react-router-dom';
export const router = createHashRouter([
  { path: '/',              element: <Placeholder /> },
  { path: '/design-system', element: <DesignSystem /> },
]);
```
**Important:** Use `createHashRouter` not `createBrowserRouter` — v1.0 hash deep-links (`#/profile/abc`) must resolve verbatim with no server-side fallback (D-02). Phase 1 wires only `/` and `/design-system` (D-03); full route table is Phase 2.

---

### `src/App.tsx` (component, request-response)

**Analog:** None directly — v1.0 has no `<App>` wrapper

**Adaptation:** Minimal shell that mounts `<RouterProvider />` and applies the `useTheme()` side-effect. Phase 1 keeps it tiny:
```tsx
import { useTheme } from './hooks/useTheme';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export default function App() {
  useTheme();
  return <RouterProvider router={router} />;
}
```

---

### `src/routes/Placeholder.tsx` (component, static render)

**Analog:** `js/app.js:987-1013` (`viewHome` shell pattern, just for the "skeleton alive" signal)

**v1.0 view pattern (paraphrased from `viewHome`):**
```js
function viewHome() {
  $app.innerHTML = "";
  const root = h("div", { class: "page" },
    h("h1", { class: "page-head-h1" }, t("welcome_title")),
    h("p", {}, t("welcome_sub")),
    // ...
  );
  $app.append(root);
}
```
**Adaptation:** JSX render of a minimal "Skeleton alive" page. Just enough to confirm the build is wired (FOUND-07). Uses `t('welcome_title')` to exercise the i18n module end-to-end. No real navigation links yet (D-03).

---

### `src/routes/DesignSystem.tsx` (component, static render)

**Analog:** None — net-new per D-27, D-28

**Adaptation:** Single-page scroll, five sections (D-27): header (theme + lang toggles), colour palette grid, typography scale, animation gallery (all 8 keyframes shown live), surface samples. The "reduced-motion preview" toggle (from `<specifics>`) adds a `data-prm="reduce"` attribute on `<body>` and a paired CSS rule `body[data-prm="reduce"] *` mirroring the `@media` block — lets reviewers eyeball reduced-motion without changing OS settings. shadcn `Button` is the only primitive (D-28).

---

### Group 4: Design System + Styling

---

### `src/styles/theme.css` (stylesheet, static CSS tokens)

**Analog:** `css/style.css:1-92` (`:root` block + light theme overrides)

**v1.0 dark-default token pattern** (`css/style.css:6-48`):
```css
:root,
:root[data-theme="dark"],
:root[data-theme="auto"] {
  /* Core palette */
  --bg:        #07091a;
  --bg-2:      #0c1028;
  --surface:   #111528;
  --surface-2: #171d38;
  --surface-3: #1d2344;
  --text:      #ede8ff;
  --muted:     #8880b8;
  --line:      rgba(130, 100, 220, 0.22);
  /* Brand — violet + magenta */
  --primary:        #b96eff;
  --primary-strong: #cf8fff;
  --accent:         #ff4da6;
  /* ... (42 tokens total — see file) */
}
```

**v1.0 light override pattern** (`css/style.css:53-92`):
```css
@media (prefers-color-scheme: light) {
  :root[data-theme="auto"], :root:not([data-theme]) {
    --bg:        #f2eeff;
    /* ... full light palette ... */
  }
}
:root[data-theme="light"] {
  --bg:        #f2eeff;
  /* ... same light palette ... */
}
```

**Adaptation (D-18, D-19):**
```css
/* src/styles/theme.css */
@import "tailwindcss";

@theme {
  /* Prefixed names so Tailwind utility generation works (Pitfall 1) */
  --color-bg:         #07091a;
  --color-bg-2:       #0c1028;
  --color-surface:    #111528;
  /* ... (every v1.0 :root token, renamed with Tailwind v4 prefix) */
  --color-primary:        #b96eff;
  --color-accent:         #ff4da6;

  --font-sans:    "DM Sans Variable", -apple-system, BlinkMacSystemFont, ...;
  --font-heading: "Playfair Display Variable", Georgia, "Times New Roman", serif;

  --shadow:    0 24px 64px -12px rgba(0,0,0,.85), 0 4px 16px rgba(0,0,0,.5);
  --shadow-glow: 0 0 22px rgba(185, 110, 255, 0.3), ...;

  --radius:    18px;
  --radius-lg: 28px;
}

/* Light theme override — applied via [data-theme="light"] selector on <html> */
:root[data-theme="light"] {
  --color-bg:        #f2eeff;
  /* ... same light palette as v1.0 ... */
}

/* auto = follow OS */
@media (prefers-color-scheme: light) {
  :root[data-theme="auto"],
  :root:not([data-theme]) {
    --color-bg:        #f2eeff;
    /* ... */
  }
}
```

**Token name remapping (Pitfall 1):**
- `--bg` → `--color-bg`
- `--surface*` → `--color-surface*`
- `--primary` / `--accent` / `--text` / `--muted` / `--line` / `--green` / `--red` → `--color-*`
- `--glass` / `--glass-border` → `--color-glass*` (Tailwind utilities auto-generate)
- `--glass-blur` → kept unprefixed (filter, not a color)
- `--glow` / `--glow-sm` → `--shadow-glow` / `--shadow-glow-sm` (Tailwind shadow utilities)
- `--font-sans` / `--font-heading` → keep as-is (Tailwind font utilities)
- `--shadow` / `--shadow-sm` → keep as-is
- `--radius` / `--radius-lg` → keep as-is

Values are byte-identical to v1.0; only variable names change. Token-parity test (`src/styles/__tests__/theme-tokens.test.ts`) enforces this.

---

### `src/styles/fonts.css` (stylesheet, static)

**Analog:** `index.html:15-17` (Google Fonts `<link>` to be removed)

**v1.0 anti-pattern (being replaced):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">
```

**Adaptation (D-20):** Replace with side-effect imports of Fontsource variable packages in `main.tsx`:
```ts
// src/main.tsx
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/playfair-display';
```
Fontsource auto-injects `@font-face` declarations with `font-display: swap` (matches D-20). The WOFF2 files are bundled into the Vite build under `assets/`. **Post-build verification:** grep `dist/` for `fonts.googleapis.com` and `fonts.gstatic.com` — must return zero hits.

If `src/styles/fonts.css` is created as a file: it would contain optional fallback `@font-face` declarations only if Fontsource axes don't match exactly (RESEARCH.md A2 fallback). Default plan: don't create the file; import directly in `main.tsx`.

---

### `src/styles/animations.css` (stylesheet, static keyframes)

**Analog:** `css/additions.css` — eight `@keyframes` blocks

**Eight keyframe sources:**

1. **heroBlobPulse** (`css/additions.css:828-832`):
```css
@keyframes heroBlobPulse {
  0%, 100% { transform: translateX(-50%) scale(1.00); opacity: 0.90; }
  35%       { transform: translateX(-50%) scale(1.06); opacity: 1.00; }
  70%       { transform: translateX(-50%) scale(0.97); opacity: 0.85; }
}
```

2. **holoOrbDrift** (`css/additions.css:833-839`):
```css
@keyframes holoOrbDrift {
  0%   { transform: translateX(-50%) scale(1.00) rotate(0deg);   opacity: 0.65; }
  28%  { transform: translateX(-50%) scale(1.10) rotate(8deg);   opacity: 0.85; }
  55%  { transform: translateX(-50%) scale(0.95) rotate(-5deg);  opacity: 0.70; }
  80%  { transform: translateX(-50%) scale(1.05) rotate(3deg);   opacity: 0.80; }
  100% { transform: translateX(-50%) scale(1.00) rotate(0deg);   opacity: 0.65; }
}
```

3. **holoBtnSpin** (`css/additions.css:873-876`):
```css
@keyframes holoBtnSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

4. **holoIconSpin** (`css/additions.css:903-906`): same as `holoBtnSpin` body.

5. **holoUnderlineSlide** (`css/additions.css:933-936`):
```css
@keyframes holoUnderlineSlide {
  from { background-position: 0% center; }
  to   { background-position: 300% center; }
}
```

6. **iridShift** (`css/additions.css:964-968`):
```css
@keyframes iridShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

7. **bgPulse** (`css/additions.css:1367` — needs reading at the same offset)

8. **silkShift** (`css/additions.css:1398` — needs reading at the same offset)

**Adaptation (D-08):** Port all eight verbatim into `src/styles/animations.css`. Do NOT convert to Tailwind utilities — they are multi-property, reused, and would be utility-soup (D-08 rationale). Keep keyframe names identical so any future port of v1.0 view code finds the same selectors.

**Reduced-motion guard appended at bottom of same file** (D-10, Pitfall 6):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  /* Per-keyframe overrides — explicit "animation: none" */
  .hero-blob, .hero-blob-holo,
  .btn-primary::after,
  .hero-feat-icon::before,
  .section-head h2::after,
  .page-head h1::after,
  .scale-btn.is-active::after {
    animation: none !important;
  }
}
```
WCAG 2.1 SC 2.3.3 compliant. v1.0 has NO reduced-motion guard (CONCERNS.md gap).

---

### `src/components/ui/button.tsx` (component, request-response)

**Analog:** None — generated by `npx shadcn@latest add button`

**Adaptation:** Do not hand-author. Run the CLI command (D-26, D-28). The CLI emits a React 19 ref-as-prop component using `class-variance-authority` and `clsx` (via `cn()` in `@/lib/utils`). Verification: `npm run typecheck && npm run build` succeeds (FOUND-03).

---

### `src/components/ThemeToggle.tsx` (component, event-driven)

**Analog:** `js/app.js:47-57` (`applyTheme`) + theme-toggle UI inside `viewSettings` (`js/app.js:3618-3630`)

**v1.0 theme apply pattern** (`js/app.js:47-57`):
```js
function applyTheme(t) {
  const theme = t || Store.getTheme() || "auto";
  document.documentElement.setAttribute("data-theme", theme);
  Store.setTheme(theme);
  const dark = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = dark ? "#0f0c1a" : "#f7f5ff";
  document.head.append(meta);
}
```

**v1.0 toggle UI pattern** (`js/app.js:3618-3630`, paraphrased):
```js
const themeRow = h("div", { class: "theme-row" }, ...
  ["auto", "light", "dark"].map(opt => h("button", {
    class: `btn ${theme === opt ? "btn-primary" : "btn-ghost"}`,
    onClick: () => { applyTheme(opt.v); route(); },
  }, opt.label))
);
```

**Adaptation:** Three-way toggle (`auto` / `light` / `dark`) using shadcn `Button` (D-28). State source-of-truth: Zustand `settings.theme`. The `useTheme()` hook reacts to changes (D-19, applies `data-theme` attribute). Component is purely presentational: reads `settings.theme` selector, calls `setTheme(value)` action.

---

### `src/components/LangToggle.tsx` (component, event-driven)

**Analog:** Language picker inside `viewSettings` (`js/app.js`) + `js/i18n.js:836-841` (availableLangs)

**v1.0 lang picker** uses a `<select>` populated from `availableLangs()`. Adaptation: same shape — `<select>` is fine for Phase 1 (D-27, D-28 — only `Button` is a shadcn primitive). Phase 2 may replace with shadcn `Select`. On change, dispatch a Zustand action that updates `settings.lang` and calls `i18n.setLang(value)` to update the module-level `_lang`.

---

### `src/hooks/useTheme.ts` (hook, request-response state→DOM)

**Analog:** `js/app.js:47-57` (applyTheme) + `js/app.js:837-838` (matchMedia change listener)

**v1.0 prefers-color-scheme listener** (`js/app.js:838`):
```js
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => applyTheme());
```

**Adaptation (D-19):**
```ts
import { useEffect } from 'react';
import { useStore } from '@/lib/storage/store';

export function useTheme(): void {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // optional: update <meta name="theme-color"> if Phase 1 needs it
  }, [theme]);
  useEffect(() => {
    if (theme !== 'auto') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      // re-trigger the effect by re-asserting the same theme — DOM doesn't change but the meta color does
      document.documentElement.setAttribute('data-theme', 'auto');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);
}
```

---

### `src/hooks/useLang.ts` (hook, request-response)

**Analog:** `js/i18n.js:813-825`

**v1.0 setLang pattern** (writes to localStorage directly):
```js
export function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  _lang = lang;
  try {
    const raw = localStorage.getItem("relationshape.v1");
    const d = raw ? JSON.parse(raw) : {};
    d.settings = d.settings || {};
    d.settings.lang = lang;
    localStorage.setItem("relationshape.v1", JSON.stringify(d));
  } catch {}
}
```

**Adaptation (D-14):** `useLang` reads `settings.lang` from Zustand and exposes a `setLang(lang)` callback that dispatches the store action. Persistence to localStorage flows through the custom `relationshapePersist` middleware (D-06) — `useLang` itself never touches `localStorage`. The `i18n` module's `_lang` is kept in sync by calling `i18n.setLang()` inside the same store action.

---

### `src/lib/utils.ts` (utility, transform)

**Analog:** None — shadcn-CLI-generated standard `cn()` helper

**Adaptation:** Standard shadcn pattern (auto-generated by `init`):
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
No v1.0 analog because v1.0 uses kebab-case CSS classes manually concatenated with template strings (e.g., `class: \`btn ${theme === opt ? "btn-primary" : "btn-ghost"}\``). `cn()` is the React/Tailwind equivalent.

---

### Group 5: PWA + Service Worker

---

### `vite-plugin-pwa` block inside `vite.config.ts` (config, build-graph)

**Analog:** `sw.js:1-42` (hand-rolled cache-first SW)

**v1.0 SW pattern**:
```js
const CACHE = "rshape-v9";
const ASSETS = [
  "./", "./index.html", "./manifest.json",
  "./css/style.css", "./css/additions.css",
  "./js/app.js", "./js/data.js", "./js/storage.js",
  "./js/crypto.js", "./js/charts.js", "./js/i18n.js",
  "./icons/favicon.svg", "./icons/icon-192.svg", "./icons/icon-512.svg",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { ... });
self.addEventListener("fetch", e => { ... cache-first ... });
```

**Adaptation (D-23):** Replace with vite-plugin-pwa's Workbox config (see RESEARCH.md "Verified Vite + Tailwind v4 + vite-plugin-pwa config" block):
```ts
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  devOptions: { enabled: false },     // D-23: no SW in dev
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,woff2}'],
    globIgnores: ['legacy/**', '**/legacy/sw.js'],   // D-23 + Pitfall 2
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/legacy/],         // never SPA-fallback into legacy
    clientsClaim: true,                               // Pitfall 3
    skipWaiting: true,
  },
  manifest: {
    name: 'Relationshape',
    short_name: 'Relationshape',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#0f0c1a',
    background_color: '#07091a',
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
  },
}),
```
The manifest content mirrors v1.0 `manifest.json` (`background_color`, `theme_color`, `display`, `orientation`, icon paths) but is now emitted as `manifest.webmanifest` at the new app's root scope (`/`). Legacy `manifest.json` stays at `/legacy/manifest.json`.

---

### Group 6: Tests + Fixtures

---

### `src/lib/crypto/__tests__/crypto.test.ts` (test, transform)

**Analog:** Target under test = `src/lib/crypto/crypto.ts` ← `js/crypto.js`. No v1.0 test analog (zero-test baseline per TESTING.md).

**Template:** RESEARCH.md "Verified crypto fixture round-trip" block. Three assertions:
1. Decrypt v1.0 fixture → deep-equal `EXPECTED_PAYLOAD`
2. Re-encrypt → decrypt → parity
3. Envelope byte-shape: `kdf.i === 250000`, `kdf.h === 'SHA-256'`, `salt.length === 16`, `iv.length === 12`, `magic === 'RSHAPE'`, `v === 'v1'`

**Vitest env:** `node` (default per D-25 — Node 24 has `crypto.subtle` natively).

---

### `src/lib/storage/__tests__/storage.test.ts` (test, CRUD)

**Analog:** Target under test = `src/lib/storage/store.ts` + `persist.ts`. CORE-02, CORE-03, CORE-07, CORE-08.

**Adaptation:** Tests must cover:
- Load: hydrate from a valid v1.0 localStorage blob → state matches expected shape (CORE-08, via `tests/fixtures/v1-localstorage.fixture.ts`)
- Save: action mutates state → `localStorage.setItem` called with byte-compatible JSON
- Quota: mock `localStorage.setItem` to throw `DOMException` with `name: 'QuotaExceededError'` → in-memory state intact, `lastSaveError.kind === 'QUOTA_EXCEEDED'` (CORE-02, D-07)
- No `JSON.parse` per read: state IS the cache (CORE-03 — assert via spy on `JSON.parse`)

**Vitest env:** `node` with stubbed `localStorage` (Vitest's `vi.stubGlobal('localStorage', ...)`).

---

### `src/lib/storage/__tests__/migrateScale.test.ts` (test, transform)

**Analog:** Target under test = `src/lib/storage/migrateScale.ts` ← `js/storage.js:50-55`. CORE-05, CORE-07.

**Adaptation:** Tests cover (per Pitfall 8):
- (a) reversed old-format scale (value descending) gets re-reversed and re-valued (0..n)
- (b) un-modified English `DEFAULT_SCALE` passes through unchanged
- (c) un-modified DE `DEFAULT_SCALE_DE` passes through unchanged
- (d) input is NOT mutated (readonly check)
- (e) too-short input (< 2 elements) returned as-is

---

### `src/lib/i18n/__tests__/i18n.test.ts` (test, transform)

**Analog:** Target = `src/lib/i18n/i18n.ts`. RESEARCH.md "Verified i18n key parity" block.

**Adaptation:** Three assertions:
1. EN and DE have identical key sets (compile-time enforced by D-13, but runtime-verified for confidence)
2. Key count = 304 (v1.0 baseline per RESEARCH.md)
3. `{var}` interpolation works
4. `getLocalizedDefaultScale` returns DE scale when `_lang === 'de'`

---

### `src/styles/__tests__/theme-tokens.test.ts` (test, transform)

**Analog:** RESEARCH.md "Verified theme-token parity check" block. Reads both `css/style.css` (or `public/legacy/css/style.css` after move) and `src/styles/theme.css`, asserts every v1.0 `:root` token has a corresponding `@theme` entry with the same hex value (modulo the prefix remapping table from Pitfall 1).

**Adaptation:** Token map table from the theme.css section above. Test fails if any v1.0 token's value drifts from the v2.0 `@theme` entry.

---

### `src/__tests__/App.smoke.test.tsx` (test, render)

**Analog:** Target = `src/App.tsx`. RESEARCH.md "Verified Vitest config" block.

**Adaptation:**
```tsx
// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '@/App';

describe('<App />', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
```
Per-file `// @vitest-environment jsdom` directive (Pitfall 4 — no `environmentMatchGlobs`). FOUND-06 acceptance.

---

### `tests/fixtures/v1-bundle.fixture.ts` (fixture, static)

**Analog:** None — fixture is captured manually from v1.0 (D-24)

**Adaptation:** Per CONTEXT.md `<specifics>`:
```ts
// Captured from /legacy/ on 2026-05-XX. Procedure in fixtures/README.md.
// Profile: "Test Subject", emoji "🌱", color "#7c83ff".
// One result with enabledCategories across 3 categories, 2 custom items, 1 __hidden.
export const ARMORED = `-----BEGIN RELATIONSHAPE BUNDLE-----
v1
[base64-encoded envelope from /legacy/ Share output, copy-pasted verbatim]
-----END RELATIONSHAPE BUNDLE-----
`;
export const PASSPHRASE = 'test-passphrase-fixture-only';
export const EXPECTED_PAYLOAD = {
  id: '...',
  name: 'Test Subject',
  emoji: '🌱',
  color: '#7c83ff',
  // ... full payload shape
};
```

---

### `tests/fixtures/v1-localstorage.fixture.ts` (fixture, static)

**Analog:** None — captured manually

**Adaptation:** Sample `localStorage["relationshape.v1"]` blob in the v1.0 shape:
```ts
export const V1_LOCALSTORAGE_BLOB = JSON.stringify({
  profiles: [/* 1 profile */],
  results:  [/* 1 result */],
  imports:  [],
  settings: { theme: 'auto', lang: 'en' },
  scale:    [/* DEFAULT_SCALE */],
});
```
Used by `storage.test.ts` to test CORE-08 (hydrate from v1.0 blob → matches expected in-memory state).

---

### `tests/fixtures/README.md` (docs, static)

**Analog:** None — net-new

**Adaptation:** Document the regeneration procedure (D-24, CONTEXT.md `<code_context>` integration point):
1. Open `/legacy/` in a browser
2. Create profile "Test Subject" with emoji 🌱 and color #7c83ff
3. Create one result with 3+ enabled categories, 2 custom items, 1 `__hidden` item
4. Use Share with passphrase from `v1-bundle.fixture.ts`
5. Copy armored output into `v1-bundle.rshape.txt`
6. Update `EXPECTED_PAYLOAD` to match the seeded data exactly

---

### Group 7: Legacy Passthrough

**Universal pattern:** Move (not copy) every file from the repo root into `public/legacy/` preserving relative paths. The single exception is icon SVGs which are **copied** (not just moved) into `public/icons/` so vite-plugin-pwa's manifest can reference them at root scope (CONTEXT.md `<code_context>` integration point).

| From | To |
|------|-----|
| `index.html` | `public/legacy/index.html` |
| `manifest.json` | `public/legacy/manifest.json` |
| `sw.js` | `public/legacy/sw.js` |
| `js/*` | `public/legacy/js/*` |
| `css/*` | `public/legacy/css/*` |
| `icons/*` | `public/legacy/icons/*` |
| `icons/icon-192.svg` | also copied to `public/icons/icon-192.svg` |
| `icons/icon-512.svg` | also copied to `public/icons/icon-512.svg` |
| `icons/favicon.svg` | also copied to `public/icons/favicon.svg` |

**No content changes** to legacy files. The legacy SW registration line in legacy `index.html` (`navigator.serviceWorker.register("./sw.js")`) resolves to `/legacy/sw.js` with implicit scope `/legacy/` — verified by D-22 and Pitfall 3.

---

## Shared Patterns

### Translation key naming (i18n)

**Source:** `js/i18n.js:6-396`
**Apply to:** all files that use user-facing strings

**Convention:** `snake_case`, namespaced by section (`nav_`, `btn_`, `profile_`, `q_`, `wizard_`, `share_`, `import_`, `settings_`, `welcome_`, `feat_`, `howto_`).

```js
nav_profiles: "👤 Profiles",
btn_create:   "Create",
welcome_title: "Relationshapes",
```

**v2.0 enforcement:** Every translation key is type-checked via `TranslationKey = keyof typeof EN` (D-13). `t('not_a_key')` is a compile error.

---

### `data-theme` attribute on `<html>`

**Source:** `js/app.js:47-50`
**Apply to:** `useTheme` hook + `theme.css` selectors

```js
document.documentElement.setAttribute("data-theme", theme);
```
v1.0 + v2.0 both apply `data-theme="auto" | "light" | "dark"` to `<html>`. Token overrides scope by attribute selector (`:root[data-theme="light"]`). Auto mode reads `prefers-color-scheme` via the same selector trick (`:root[data-theme="auto"]` inside a `@media (prefers-color-scheme: light)` block).

---

### Hash-based navigation

**Source:** `js/app.js:36-43` (navigate) and the URL convention table in `STRUCTURE.md` ("Routes (hash segments)")

**Apply to:** `router.tsx` (`createHashRouter`)

**Locked URL shapes** (D-02 — must continue resolving in v2.0):
- `#/`, `#/welcome`
- `#/profile/:id`, `#/profile/:id/edit`, `#/profile/new`
- `#/q/:profileId/:resultId`, `#/q-categories/:profileId/:resultId`
- `#/result/:id`, `#/result/:id/:catId`
- `#/share/:id`
- `#/import`, `#/compare`, `#/settings`
- `#/map/:id/settings`, `#/intro`, `#/about`
- `#/design-system` (NEW in Phase 1)

Phase 1 wires only `/` and `/design-system` (D-03). Full table is Phase 2.

---

### Storage key `relationshape.v1` — LOCKED byte-shape

**Source:** `js/storage.js:7`
**Apply to:** `persist.ts` (the only file that touches `localStorage`)

```js
const KEY = "relationshape.v1";
```
**Blob shape (locked):**
```ts
{
  profiles: Profile[],
  results:  Result[],
  imports:  Import[],
  settings: { theme: 'auto'|'light'|'dark', lang?: 'en'|'de', fabiMode?: boolean, wizardSeen?: boolean },
  scale:    ScaleStep[],
}
```
v2.0 MUST NOT add/rename top-level keys here. The new in-memory `lastSaveError` field stays in-memory only.

---

### Crypto envelope shape — LOCKED bytes

**Source:** `js/crypto.js:55-70`
**Apply to:** `crypto.ts`

```js
{
  kdf:    { n: "PBKDF2", h: "SHA-256", i: 250_000, s: <b64-salt-16-bytes> },
  cipher: { n: "AES-GCM", iv: <b64-iv-12-bytes> },
  data:   <b64-ciphertext>,
}
```
Field names (`n`, `h`, `i`, `s`, `iv`, `data`), iteration count (250 000), salt length (16), IV length (12), and PEM armor (`-----BEGIN RELATIONSHAPE BUNDLE-----` … `-----END RELATIONSHAPE BUNDLE-----` + `v1` first line) are LOCKED. PWA-04 / PWA-05 require v2.0 ↔ v1.0 round-trip.

---

### Error handling (silent fallback to defaults)

**Source:** `js/storage.js:15-27` (load wraps JSON.parse in try/catch → returns defaults)
**Apply to:** `persist.ts` hydrate step

```js
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw);
    // ... shape guard ...
    return data;
  } catch {
    return defaults();
  }
}
```
**v2.0 adaptation:** Same silent-fallback semantic for hydrate. But for SAVE, replace v1.0's no-try/catch bug with the typed `lastSaveError` (CORE-02, D-07).

---

### v1.0 `as const` content-frozen exports

**Source:** `js/data.js` (CATEGORIES, DEFAULT_SCALE, SPIDER_AXES, CATEGORY_GROUPS, FILE_FORMAT)
**Apply to:** `data.ts`, `i18n/en.ts`, `i18n/de.ts`

All five data exports keep their v1.0 values **verbatim** (CORE-05 — content-frozen). `as const` enables type derivation:
```ts
export const CATEGORIES = [...] as const;
export type CategoryId = typeof CATEGORIES[number]['id'];
```

---

## No Analog Found

Files with no close match in v1.0 (planner should treat as net-new and rely on RESEARCH.md templates rather than v1.0 ports):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `package.json` | config | static | v1.0 has no `package.json` (no-build, zero-dep) |
| `vite.config.ts` | config | build-graph | v1.0 has no bundler |
| `tsconfig.json` + variants | config | static | v1.0 is plain JS, no TS |
| `tailwind.config.ts` (shim) | config | static | v1.0 uses hand-rolled CSS |
| `vitest.config.ts` | config | build-graph | v1.0 has zero tests (TESTING.md) |
| `eslint.config.js` | config | static | v1.0 has no linter |
| `.prettierrc` | config | static | v1.0 has no formatter |
| `components.json` | config | static | shadcn CLI-generated only |
| `src/lib/utils.ts` (`cn()`) | utility | transform | v1.0 uses string concatenation for class names |
| `src/routes/DesignSystem.tsx` | component | static render | Net-new reference route per D-27 |
| `src/components/ui/button.tsx` | component | request-response | shadcn CLI-generated only |
| `src/styles/reduced-motion.css` | stylesheet | static | v1.0 has no reduced-motion guard (CONCERNS.md gap) |
| `src/__tests__/*` | test | various | v1.0 zero-test baseline (TESTING.md) |
| `tests/fixtures/*` | fixture | static | Captured manually for Phase 1 (D-24) |
| `tests/setup.ts` | test-config | static | net-new |

---

## Metadata

**Analog search scope:**
- `js/storage.js` (305 lines, full read)
- `js/crypto.js` (136 lines, full read)
- `js/data.js` (sampled — lines 1-80, 840-870, line counts)
- `js/i18n.js` (sampled — lines 1-80, 700-846; structure verified via grep)
- `js/app.js` (sampled — lines 1-100; targeted grep for `applyTheme`, `data-theme`)
- `css/style.css` (lines 1-120, `:root` block)
- `css/additions.css` (sampled — lines 825-985 covering 6 of 8 keyframes; remaining 2 at known lines 1367, 1398)
- `index.html` (full read)
- `manifest.json` (full read)
- `sw.js` (full read)
- `.planning/codebase/STRUCTURE.md`, `CONVENTIONS.md`, `ARCHITECTURE.md` (full reads)
- `.planning/phases/01-skeleton/01-CONTEXT.md` (full read)
- `.planning/phases/01-skeleton/01-RESEARCH.md` (lines 1-1199 in three reads)

**Files scanned:** 14 source/config files + 3 codebase docs + 2 phase docs = 19

**Pattern extraction date:** 2026-05-15
