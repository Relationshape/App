# Technology Stack

**Analysis Date:** 2026-05-15

## Languages

**Primary:**
- JavaScript (ES2020+) - All application logic; ES modules with `import`/`export`, no transpilation
- HTML5 - Single entry point `index.html`; semantic markup, custom data attributes for theming
- CSS3 - `css/style.css` (1538 lines) + `css/additions.css` (1580 lines); extensive CSS custom properties

**Secondary:**
- SVG (inline) - All icons and charts generated programmatically as inline SVG strings in `js/app.js` and `js/charts.js`

## Runtime

**Environment:**
- Browser — no Node.js, no Deno, no server process of any kind
- Minimum browser requirements: WebCrypto API (`crypto.subtle`), ES modules, Service Worker, `localStorage`

**Package Manager:**
- None — no `package.json`, no `node_modules`, no lockfile
- Zero npm dependencies; all code is hand-written or native browser API

## Frameworks

**Core:**
- None — plain ES modules; `js/app.js` implements its own micro-framework (hash-based router, DOM helpers `h()`, event delegation)

**UI Rendering:**
- No framework — `h(tag, attrs, ...children)` helper in `js/app.js:17` builds DOM nodes imperatively; views are functions that return DOM trees

**Charts:**
- No library — custom SVG generation in `js/charts.js`; renders spider/radar charts, bar diffs, and alignment heat strips as SVG strings

**Testing:**
- None detected — no test framework, no test files

**Build/Dev:**
- No build step — source files are served as-is
- Any static-file server works (e.g. `python3 -m http.server 8080`)
- No bundler, no transpiler, no minifier

## Key Dependencies

**Critical:**
- WebCrypto API (`crypto.subtle`) — AES-GCM 256 encryption + PBKDF2 key derivation in `js/crypto.js`
- Service Worker API — offline caching via `sw.js`; cache name `rshape-v9`
- `localStorage` — sole persistence layer; all data stored under key `relationshape.v1` in `js/storage.js:7`
- `crypto.randomUUID()` — UUID generation in `js/storage.js:10`; falls back to `Math.random()` + timestamp

**Infrastructure:**
- Google Fonts CDN — `DM Sans` (variable, 300–700 weight, optical sizing 9–40) and `Playfair Display` (variable, 400–900, italic variants); loaded via `<link>` in `index.html:17`

## Browser API Usage

| API | Used In | Purpose |
|-----|---------|---------|
| `crypto.subtle` | `js/crypto.js` | AES-GCM encrypt/decrypt; PBKDF2 key derivation (250 000 iterations, SHA-256) |
| `crypto.randomUUID` | `js/storage.js:10` | Unique IDs for profiles, results, imports |
| `localStorage` | `js/storage.js` | All persistent app data |
| Service Worker | `sw.js` + `index.html:26` | Cache-first offline shell; fallback to `index.html` on miss |
| `navigator.clipboard` | `js/app.js:2904` | Copy encrypted bundle text to clipboard |
| `matchMedia` | `js/app.js:51,838,2059` | Dark/light theme detection; pointer coarse detection for mobile |
| `TextEncoder`/`TextDecoder` | `js/crypto.js:13-14` | Binary↔string conversion for crypto operations |
| Cache API | `sw.js` | Stores shell assets; strategy is cache-first with network fallback |

## Configuration

**Environment:**
- No environment variables — no `.env` files
- No server-side configuration at all

**Theme:**
- User preference stored in `localStorage` under `settings.theme` (`"auto"` / `"dark"` / `"light"`)
- `auto` mode follows `prefers-color-scheme` via `matchMedia`

**Language:**
- User language stored in `localStorage` under `settings.lang`
- Auto-detected from `navigator.language` on first visit (`js/i18n.js`)
- Supported: English (`en`), German (`de`)

**PWA:**
- `manifest.json` — `display: standalone`, portrait orientation, SVG icons at 192×192 and 512×512
- `sw.js` — install/activate/fetch lifecycle; cache name versioned as `rshape-v9`

**Build:**
- None — no `tsconfig.json`, no `webpack.config.*`, no `vite.config.*`, no `.babelrc`

## Platform Requirements

**Development:**
- Any static HTTP server (required because ES modules cannot load via `file://`)
- No package installation, no compilation step

**Production:**
- Any static file host (GitHub Pages, Netlify, Cloudflare Pages, nginx, Apache, S3, etc.)
- No server-side language support required
- HTTPS strongly recommended (required for Service Worker and WebCrypto in all browsers)

## i18n

**Implementation:** `js/i18n.js` — self-contained translation map; no external i18n library
**Languages:** English (`en`, default), German (`de`)
**Detection:** `navigator.language` prefix match; overridable via Settings UI or nav picker
**Storage:** Selected language persisted in `localStorage` via `Store.setLang()` / `Store.getLang()`

## Source File Summary

| File | Lines | Role |
|------|-------|------|
| `js/app.js` | 3496 | Router, all view rendering, DOM helpers, theme, SVG icon library |
| `js/charts.js` | — | SVG chart generators (spider, bars, alignment) |
| `js/storage.js` | 306 | localStorage CRUD wrapper (`Store` object) |
| `js/crypto.js` | 137 | WebCrypto encrypt/decrypt, PEM-style armor format |
| `js/data.js` | 870 | Questionnaire categories, scale definitions, spider axes |
| `js/i18n.js` | — | Translation strings (EN + DE), language detection |
| `css/style.css` | 1538 | Design tokens, layout, components (dark default, light override) |
| `css/additions.css` | 1580 | Extended component styles |
| `index.html` | 33 | Entry point, font links, service worker registration |
| `sw.js` | 43 | Service worker: install, activate, fetch with cache-first strategy |
| `manifest.json` | 16 | PWA manifest |

---

*Stack analysis: 2026-05-15*
