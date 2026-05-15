<!-- refreshed: 2026-05-15 -->
# Architecture

**Analysis Date:** 2026-05-15

## System Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (PWA Shell)                        │
│   index.html  →  <nav id="nav">  +  <main id="app">             │
│   js/app.js (ES module, loaded as <script type="module">)        │
└────────┬───────────────┬───────────────────────┬────────────────┘
         │               │                       │
         ▼               ▼                       ▼
┌────────────────┐ ┌────────────────┐  ┌──────────────────────────┐
│  Presentation  │ │ Visualisation  │  │  i18n                    │
│  js/app.js     │ │  js/charts.js  │  │  js/i18n.js              │
│  (router +     │ │  (SVG spider,  │  │  (EN + DE translations,  │
│   view funcs)  │ │   bar, align)  │  │   language detection)    │
└────────┬───────┘ └───────┬────────┘  └──────────────────────────┘
         │                 │
         ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data Layer                                   │
│   js/storage.js  (Store object — localStorage wrapper)          │
│   js/data.js     (CATEGORIES, DEFAULT_SCALE, SPIDER_AXES —      │
│                   static read-only questionnaire schema)         │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Crypto Layer                                  │
│   js/crypto.js  (AES-GCM 256, PBKDF2 — share/import only)       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│           window.localStorage  (key: "relationshape.v1")         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   PWA Shell (offline)                            │
│   sw.js  (cache-first service worker, cache: "rshape-v9")       │
│   manifest.json  (standalone display, SVG icons)                │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Router | Hash-based routing; clears `#app`, dispatches to view functions | `js/app.js:853` |
| View functions | Build and mount DOM for each route | `js/app.js:987–3495` |
| `h()` helper | Hyperscript-style DOM builder (tag, attrs, children) | `js/app.js:17` |
| `Store` | Read/write all persistent state via localStorage | `js/storage.js:57` |
| `CATEGORIES` | Static questionnaire schema (items, i18n, color, icon) | `js/data.js:20` |
| `DEFAULT_SCALE` | Default 7-step answer scale (No → Need) | `js/data.js:8` |
| `SPIDER_AXES` | 12-category subset used for the overview radar chart | `js/data.js:851` |
| `encryptResult` | Serialize + AES-GCM encrypt a result payload to ASCII armor | `js/crypto.js:55` |
| `decryptResult` | Parse + decrypt an armored bundle back to a payload object | `js/crypto.js:72` |
| `renderSpider` | SVG spider/radar chart for category overview | `js/charts.js:303` |
| `renderItemSpider` | SVG spider chart for a single category's items | `js/charts.js:333` |
| `renderCategoryBars` | SVG bar-diff chart comparing two datasets per category | `js/charts.js:373` |
| `renderAlignment` | SVG alignment heat strip across all categories | `js/charts.js:424` |
| `t()` | Look up a translation key in active language | `js/i18n.js` |
| Global nav | Persistent `<nav id="nav">` with profile/import/compare links | `js/app.js:942` |
| Service worker | Cache-first offline shell; caches all JS/CSS/icons on install | `sw.js` |

## Pattern Overview

**Overall:** Client-side SPA, hash-router, hyperscript DOM builder

**Key Characteristics:**
- No framework, no virtual DOM. The `h()` function at `js/app.js:17` creates real DOM nodes imperatively. Each route handler clears `$app.innerHTML = ""` and appends freshly built nodes.
- Hash-based routing (`#/route/segments`). The `route()` function at `js/app.js:853` is triggered by `hashchange` and on `DOMContentLoaded`. All navigation goes through `navigate(hash)` at `js/app.js:36`.
- All state persists in a single `localStorage` key (`"relationshape.v1"`). There is no network calls anywhere in the app; no backend.
- Multi-profile model: one device can host maps for multiple independent personas (profiles). Each profile owns its own set of results. Imports (received encrypted bundles) are stored separately in an `imports` array and are never mixed with own results.

## Layers

**PWA Shell:**
- Purpose: HTML entry point, service worker registration, CSS loading
- Location: `index.html`, `sw.js`, `manifest.json`
- Contains: Shell HTML (`<nav id="nav">`, `<main id="app">`), offline cache, PWA metadata
- Depends on: Browser SW API
- Used by: Browser; loads `js/app.js` as ES module

**Presentation Layer:**
- Purpose: Routing, view rendering, UI interactions
- Location: `js/app.js` (3496 lines)
- Contains: `route()`, all `viewX()` functions, `h()` helper, `navigate()`, global nav, dialogs, theme, onboarding wizard, age gate
- Depends on: `js/storage.js`, `js/data.js`, `js/crypto.js`, `js/charts.js`, `js/i18n.js`
- Used by: Browser via `<script type="module">`

**Visualisation Layer:**
- Purpose: SVG chart generation (spider, bars, alignment)
- Location: `js/charts.js` (478 lines)
- Contains: `renderSpider`, `renderItemSpider`, `renderCategoryBars`, `renderAlignment`, `categoryAverage`, `bindSpiderInteractivity`
- Depends on: `js/data.js`, `js/storage.js`, `js/i18n.js`
- Used by: `js/app.js` (injected via `el.innerHTML = renderSpider(...)`)

**i18n Layer:**
- Purpose: EN/DE translation lookup and language management
- Location: `js/i18n.js` (778 lines)
- Contains: `TRANSLATIONS` object (en + de keys), `t()`, `getLang()`, `setLang()`, `availableLangs()`, `getLocalizedDefaultScale()`, `DEFAULT_SCALE_DE`
- Depends on: Nothing
- Used by: `js/app.js`, `js/charts.js`, `js/storage.js`

**Data Layer:**
- Purpose: Static questionnaire schema + persistent storage
- Location: `js/data.js` (870 lines), `js/storage.js` (305 lines)
- Contains (`data.js`): `CATEGORIES` array, `DEFAULT_SCALE`, `SPIDER_AXES`, `CATEGORY_GROUPS`, `FILE_FORMAT`
- Contains (`storage.js`): `Store` object with methods for profiles, results, imports, scale, settings, backup/restore
- Depends on: `js/i18n.js` (storage.js for localized default scale)
- Used by: `js/app.js`, `js/charts.js`

**Crypto Layer:**
- Purpose: End-to-end encryption for sharing results between users
- Location: `js/crypto.js` (136 lines)
- Contains: `encryptResult(payload, passphrase)`, `decryptResult(armored, passphrase)`, `parseArmor()`
- Depends on: Browser `crypto.subtle` (WebCrypto API) — no third-party libraries
- Used by: `js/app.js` (only in `viewShare` and `viewImport`)

**Styles:**
- Purpose: All visual design
- Location: `css/style.css` (base — design tokens, layout, components), `css/additions.css` (wizard modal, later additions/overrides)
- Loaded by: `index.html` (both files, in order)

## Data Flow

### Primary: User Fills Out Questionnaire

1. User selects a profile and creates/opens a result → `viewCategoryOverview` (`js/app.js:1230`)
2. User navigates to questionnaire → `viewQuestionnaire(profileId, resultId)` (`js/app.js:1698`) dispatches to `viewQuestionnaireList` or `viewQuestionnaireSingle`
3. Each answer interaction calls `Store.saveResult(result)` (`js/storage.js:94`) inline — no batching, written immediately on every change
4. `Store.saveResult` calls `load()` → merges → `localStorage.setItem("relationshape.v1", JSON.stringify(data))`
5. Results are displayed in `viewResult(resultId)` (`js/app.js:2366`) which reads `Store.getResult(rid)` and passes a `dataset` object to chart renderers

### Share Flow (Export)

1. `viewShare(resultId)` (`js/app.js:2875`) assembles a `payload` object from profile + result fields
2. User submits passphrase → `encryptResult(payload, pass)` (`js/crypto.js:55`)
3. Crypto layer: JSON serialise → UTF-8 encode → PBKDF2 derive key (250 000 iterations, SHA-256, 16-byte random salt) → AES-GCM 256 encrypt (12-byte random IV) → JSON envelope → base64 → PEM-style ASCII armor
4. Armored string rendered in `<textarea>` for copy/paste or downloaded as `.rshape.txt` file

### Import Flow (Receive)

1. `viewImport()` (`js/app.js:2952`) accepts pasted text or file upload into `<textarea>`
2. User submits passphrase → `decryptResult(blob, pass)` (`js/crypto.js:72`) reverses the armor/base64/JSON/AES-GCM steps
3. Decrypted payload saved via `Store.saveImport(...)` (`js/storage.js:116`) into the `imports` array — entirely separate from own `results`
4. App navigates to `viewCompare` with the new import pre-selected

### Compare Flow

1. `viewCompare(ids)` (`js/app.js:3033`) accepts mixed IDs — own results (`r.id`) or imported (`imp:id`)
2. Builds `datasets` array; passes to `renderSpider`, `renderAlignment`, `renderCategoryBars` from `js/charts.js`

**State Management:**
- All persistent state lives in a single JSON blob at `localStorage["relationshape.v1"]`
- In-memory state: view functions hold local variables; no module-level mutable state (aside from `$app` and `$nav` DOM refs at `js/app.js:13–14`)
- Each `route()` call is a full re-render of `#app` — no incremental patching

## Key Abstractions

**`h(tag, attrs, ...children)` — DOM builder:**
- Purpose: Minimal hyperscript helper; creates real DOM nodes
- Location: `js/app.js:17`
- Pattern: `attrs` keys starting with `on` become event listeners; `class` sets `className`; `html` sets `innerHTML`; boolean `true` sets the attribute as present. Children are flattened; strings become text nodes.

**`Store` — localStorage facade:**
- Purpose: Single object encapsulating all reads and writes. Callers never touch `localStorage` directly.
- Location: `js/storage.js:57`
- Pattern: Every method calls internal `load()` (parse JSON) → mutate → `save()` (serialize JSON). No caching between calls — each read re-parses from localStorage.

**Result object:**
- Purpose: Central data record for one questionnaire session
- Shape: `{ id, profileId, subject, subjectEmoji, subjectColor, answers: { [categoryId]: { [itemName]: { scale, gr, note }, __custom: {...}, __hidden: {...} } }, enabledCategories, askedItems, scale, progress: { mode, catIndex, flatIndex, focusItem }, version, createdAt, updatedAt }`
- Stored in: `data.results[]` in localStorage

**Import object:**
- Purpose: Received result from another user — deliberately kept separate from own results
- Shape: mirrors the share payload `{ id, name, pronouns, emoji, color, subject, subjectEmoji, subjectColor, answers, scale, enabledCategories, askedItems, version, srcVersion, importedAt }`
- Stored in: `data.imports[]` in localStorage

**Scale object:**
- Purpose: Customisable answer scale; default is 7 steps (No → Need)
- Shape: `{ key, label, short, value, color, description }`
- Scoped: global default in `data.scale[]`; per-map override stored in `result.scale[]`

**`navigate(hash)`:**
- Purpose: Single entry point for all in-app navigation; handles same-hash re-render
- Location: `js/app.js:36`
- Pattern: Sets `location.hash`; if hash unchanged, calls `route()` directly (since `hashchange` won't fire)

## Entry Points

**App bootstrap (`DOMContentLoaded`):**
- Location: `js/app.js:836`
- Sequence: `applyTheme()` → `bindGlobalNav()` → `route()` → `checkAgeGate()` → optionally `navigate("/welcome")` or `showWizardIfFirstVisit()`

**Route dispatcher:**
- Location: `js/app.js:853`
- Triggers: `hashchange` event or direct `route()` call
- Responsibilities: Parse hash segments, clear `$app`, call matching `viewX()` function, update nav active states, call `bindSpiderInteractivity`, scroll to top

**Service worker install:**
- Location: `sw.js:20`
- Triggers: First load / SW update
- Responsibilities: Pre-cache all assets listed in `ASSETS` array; activate immediately; serve all GET requests cache-first with network fallback

## Architectural Constraints

- **No network calls:** The app makes zero fetch/XHR calls to any backend. All data is local. The only external requests are the Google Fonts preconnect in `index.html` (CDN, fonts only) and the service worker network fallback for uncached assets.
- **Single localStorage key:** Everything is stored under `"relationshape.v1"`. The entire blob is read and rewritten on every `Store` call — no granular key access.
- **No module bundler / build step:** Source files are served as-is. `js/app.js` is loaded as `type="module"` and imports other `js/*.js` files directly. No transpilation, no minification.
- **Global state:** `$app` and `$nav` are module-level DOM references (`js/app.js:13–14`). Theme state lives in `localStorage` and `document.documentElement[data-theme]`.
- **Circular imports:** None detected. Dependency direction is: `app.js` → all others; `charts.js` → `data.js`, `storage.js`, `i18n.js`; `storage.js` → `data.js`, `i18n.js`; no cycles.
- **Threading:** Single-threaded (browser main thread). The service worker runs in a separate thread but only handles fetch interception; no shared state with the app thread.

## Anti-Patterns

### Re-parsing localStorage on every Store call

**What happens:** Every `Store` method calls `load()` which does `JSON.parse(localStorage.getItem(KEY))`, even for read-only operations like `getProfile(id)`.
**Why it's wrong:** Causes redundant deserialization on every questionnaire answer change (which itself calls `saveResult` → `load()` + `save()`). For large stored blobs this accumulates.
**Do this instead:** Cache the parsed object in a module-level variable, invalidate on `save()`. See `js/storage.js:14–31`.

### Direct innerHTML injection for SVG charts

**What happens:** Chart renderers in `js/charts.js` return SVG/HTML strings, which `js/app.js` injects via `el.innerHTML = renderSpider(...)` or the `html` attr of `h()`.
**Why it's wrong:** Bypasses the `h()` DOM-builder pattern; SVG strings are treated as trusted HTML. Any user-controlled data reaching a chart label could be an XSS vector (currently mitigated by `esc()` in most paths but not all).
**Do this instead:** Return DOM nodes from chart functions, or ensure all dynamic values pass through `esc()` before insertion. See `js/app.js:2395–2397` and `js/charts.js:303`.

## Error Handling

**Strategy:** Inline `try/catch` at async boundaries; `dlgAlert()` for user-visible errors.

**Patterns:**
- `Store.load()` wraps JSON.parse in try/catch; returns `defaults()` on any parse failure (`js/storage.js:15–27`)
- Crypto errors surface as thrown `Error` objects caught by `viewImport`'s submit handler, shown via `dlgAlert(err.message)` (`js/app.js:3003`)
- Navigation guards: most `viewX()` functions check that required data exists and call `navigate("/")` immediately if not (`js/app.js:1174`, `1233`, `1701`, etc.)
- No global error boundary — unhandled rejections are silent

## Cross-Cutting Concerns

**Theme:** Managed by `applyTheme()` (`js/app.js:47`); reads from `Store.getTheme()`; writes `data-theme` attribute to `<html>`; auto-responds to `prefers-color-scheme` media query change.
**Language:** `getLang()`/`setLang()` in `js/i18n.js`; auto-detected from `navigator.language`; persisted via `Store.setLang()` → localStorage.
**Validation:** Inline in form `onSubmit` handlers (passphrase length check, mismatch check in `viewShare` at `js/app.js:2929–2930`).
**Onboarding:** Age gate (`js/app.js:800–825`) and first-visit wizard (`js/app.js:827–831`) gate the initial view sequence.

---

*Architecture analysis: 2026-05-15*
