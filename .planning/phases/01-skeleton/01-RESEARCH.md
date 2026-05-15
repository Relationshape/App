# Phase 1: Skeleton - Research

**Researched:** 2026-05-15
**Domain:** Vite + React 19 + TypeScript scaffolding, Tailwind v4 design tokens, Zustand state, WebCrypto byte-for-byte port, self-hosted variable fonts, reduced-motion-guarded animations, multi-SW coexistence
**Confidence:** HIGH (all 28 user decisions in CONTEXT.md verified against current upstream docs and npm registry; two minor corrections noted re: Node version and Vitest API)

## Summary

Phase 1 is a foundational, deeply pre-decided phase: CONTEXT.md locks 28 decisions (D-01..D-28) that pin the toolchain, port targets, design-system reproduction strategy, and legacy coexistence approach. The researcher's job is therefore not "explore options" — the user (via CONTEXT.md) and the planner (via REQUIREMENTS.md) have already eliminated that surface. The job is to **(a) verify the locked stack is healthy in May 2026**, **(b) flag any decision that conflicts with the current state of an ecosystem package**, and **(c) hand the planner the exact API surface, file shape, and pitfall list needed to write a watertight plan.**

Two corrections to CONTEXT.md surface in this research:
- **Node 24** is the host environment, not Node 22 (D-25 mentions "Node 22+"). Native `crypto.subtle` works identically; no plan change required, just a tighter `engines` field. [VERIFIED: `node --version` on host = v24.2.0]
- **Vitest 4.x deprecates `environmentMatchGlobs` and removes it entirely in v4** — the latest is 4.1.6 [VERIFIED: npm view vitest version → 4.1.6]. D-25's "per-glob in `vitest.config.ts`" wording must be implemented via the new `projects` configuration, not the removed `environmentMatchGlobs` option. The simpler `// @vitest-environment` per-file directive remains supported and is recommended for ≤ 2 jsdom test files.

Everything else in CONTEXT.md is sound and matches current upstream guidance: Tailwind v4 CSS-first `@theme` directive, shadcn v4.7 with `init -t vite` flow, vite-plugin-pwa 1.3 with Workbox `globIgnores: ['legacy/**']`, Zustand 5 (~1 KB), React Router v7 (~14 KB) with `createHashRouter`, Fontsource variable WOFF2 for both fonts (italic + opsz axes confirmed for DM Sans, italic axis confirmed for Playfair).

**Primary recommendation:** Execute Phase 1 as a strictly waved sequence — scaffolding (Wave 0) → pure module ports + design tokens + animations in parallel (Wave 1) → DesignSystem route + smoke test + verification (Wave 2). Add a one-time `pnpm dlx shadcn@latest init -t vite` (or `npx`) seed step that does most of the scaffolding for us, then patch tsconfig strictness, ESLint flat config, and vite-plugin-pwa on top.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Router / URL**
- **D-01:** React Router v7 is the routing library
- **D-02:** Hash routing preserved (`#/profile/abc` etc); `createHashRouter` + `<RouterProvider />`
- **D-03:** Phase 1 wires only `/` (placeholder) and `/design-system`

**State**
- **D-04:** Zustand is the state primitive; ports the v1.0 `Store` API
- **D-05:** In-memory cache lives inside Zustand store state — no separate cache layer
- **D-06:** Do NOT use `zustand/middleware/persist`; write a custom `relationshapePersist` middleware that writes to `localStorage["relationshape.v1"]` byte-compatibly
- **D-07:** Quota overflow does NOT throw — sets `lastSaveError: { kind, message, at } | null` on store state for the UI to subscribe to

**Animations / motion**
- **D-08:** Eight `@keyframes` reproduced as global CSS (`src/styles/animations.css`), not Tailwind utilities
- **D-09:** Component transitions use Tailwind `motion-safe:` / `motion-reduce:` variants
- **D-10:** Under `prefers-reduced-motion: reduce`, all 8 keyframes disabled entirely (WCAG 2.1 SC 2.3.3)
- **D-11:** `<DesignSystem />` renders every animation inline for eyeballing

**i18n**
- **D-12:** Custom TS port of `t()`, not `react-i18next`. ~50 lines of TS, EN+DE typed `const` objects
- **D-13:** Derived `TranslationKey = keyof typeof EN`; DE constrained to `Record<TranslationKey, string>`
- **D-14:** Language detection: `navigator.language` prefix match, overridable, persisted in Zustand settings slice

**TS / lint**
- **D-15:** Full strict TS mode incl. `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`
- **D-16:** ESLint flat config (`eslint.config.js`): `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`; Prettier with single quotes, no semi
- **D-17:** `package.json` scripts: `dev`, `build`, `preview`, `test`, `test:ui`, `typecheck`, `lint`, `format`

**Tailwind / theme**
- **D-18:** CSS-first `@theme` block in `src/styles/theme.css` is the source of truth; `tailwind.config.ts` is a thin shim for content paths
- **D-19:** Dark default; `[data-theme="light"]` / `[data-theme="dark"]` override; three-way toggle (auto/light/dark); auto follows `prefers-color-scheme`

**Fonts**
- **D-20:** Variable WOFF2 for DM Sans (opsz 9-40, italic) and Playfair Display (400-900, italic). Files in `public/fonts/`. `font-display: swap`. Zero Google Fonts references in build output

**Structure / build**
- **D-21:** New TS source under `src/`; path alias `@/*` → `src/*`; fixtures under `tests/fixtures/`; fonts in `public/fonts/`
- **D-22:** Legacy coexistence at `/legacy/`. Move v1.0's `index.html`, `js/`, `css/`, `sw.js`, `manifest.json`, `icons/` into `public/legacy/`. Legacy SW scope = `/legacy/`; new SW scope = `/`. Shared `localStorage["relationshape.v1"]`
- **D-23:** vite-plugin-pwa: `registerType: 'autoUpdate'`, Workbox precache, nav fallback to `/index.html`, `devOptions.enabled = false`, `globIgnores: ['legacy/**']`

**Crypto fixture**
- **D-24:** v1.0 fixture captured once manually into `tests/fixtures/v1-bundle.rshape.txt` + `v1-bundle.fixture.ts` exporting `{ ARMORED, PASSPHRASE, EXPECTED_PAYLOAD }`. Test asserts decrypt → equal, re-encrypt → decrypt → parity, and envelope-shape bytes
- **D-25:** Vitest env = `node` for crypto/storage/i18n/data; `jsdom` for `<App />` smoke only. Per-file `// @vitest-environment` directive **or** per-glob via Vitest config

**shadcn / DesignSystem**
- **D-26:** `npx shadcn@latest init` — TS yes, style `new-york`, base `slate` (placeholder, theme.css overrides), CSS vars yes, RSC no, `tailwind.config.ts` at root, components `@/components`, utils `@/lib/utils`, ui `@/components/ui`. No components added in Phase 1
- **D-27:** `/design-system` single-page scroll with 5 sections (theme + lang toggle in header; colour grid; type scale; animation gallery; surface samples)
- **D-28:** No new shadcn primitives needed for the page itself — only the `Button` added to satisfy the FOUND-03 acceptance criterion that "adding a Button via npx shadcn@latest add succeeds"

### Claude's Discretion

Per CONTEXT.md: "User's strategic picks (D-01, D-04, D-08–D-10, D-12) anchor the architecture. The remaining decisions (D-02, D-03, D-05–D-07, D-11, D-13–D-28) are implementation details Claude resolved using prior context, codebase patterns, and the v1.0 baseline. Downstream researcher/planner should treat these as the working defaults but may revisit any item that conflicts with an evidence-backed concern surfaced during research."

This research revisits:
- **D-25 wording** (per-glob in vitest.config.ts) — must use `projects`, not the removed `environmentMatchGlobs`
- **D-25 Node version comment** ("Node 22+") — actual host is Node 24; bump `engines.node` to `>=22 <25` to allow both
- All other decisions confirmed valid against current upstream documentation as of May 2026

### Deferred Ideas (OUT OF SCOPE)

Verbatim from CONTEXT.md `<deferred>`:
- **Bundle-size CI enforcement** (QUAL-03 in REQUIREMENTS.md v2.1+) — set up size-limit or equivalent. Defer to milestone v2.1; Phase 1 only needs a one-time manual check that we're under budget
- **Broader Vitest coverage** (QUAL-01) — Phase 1 adds the minimum required smoke + crypto round-trip + scale-migration tests. Storage edge cases, armor-parse variants, and i18n parity-check tests are v2.1
- **Playwright E2E** (QUAL-02) — out of scope for v2.0 entirely
- **Animation simplify-instead-of-disable mode** — user picked "disable entirely" for reduced-motion (D-10). Revisit only if accessibility feedback later prefers subtle motion to none
- **Legacy retirement** — `public/legacy/` directory removal is Phase 3 work (PWA-07). Phase 1 only adds it; do not remove until cutover

## Phase Requirements

| ID | Description (short) | Research Support |
|----|---------------------|------------------|
| FOUND-01 | Vite + React 19 + TS scaffolded coexisting with legacy | Standard stack table; D-22 layout; `pnpm dlx shadcn@latest init -t vite` seed |
| FOUND-02 | Tailwind v4 with PostCSS/Vite plugin + `tailwind.config.ts` | `@tailwindcss/vite` plugin (not PostCSS) per shadcn v4 flow; D-18 CSS-first `@theme` |
| FOUND-03 | shadcn/ui initialised via CLI; sample Button add succeeds | shadcn v4.7.0 CLI `init -t vite` flow verified; D-26 flags |
| FOUND-04 | vite-plugin-pwa auto-update + Workbox precache + offline fallback | vite-plugin-pwa 1.3.0; D-23 config block; Workbox `globIgnores` syntax |
| FOUND-05 | ESLint + Prettier + typecheck + build/test scripts | D-15 tsconfig flags; D-16 ESLint flat config; D-17 scripts list |
| FOUND-06 | Vitest + Testing Library smoke test passes | Vitest 4.1.6 + @testing-library/react 16.3.2; per-file `// @vitest-environment jsdom`; jsdom 29.1.1 |
| FOUND-07 | `npm run dev` serves React placeholder at `/` + legacy at `/legacy/` | D-22 public/legacy strategy; Vite's `publicDir` semantics — passthrough, no module-graph processing |
| CORE-01 | `Store` ported to TS module with explicit types | `js/storage.js` (305 lines) → Zustand store; type shapes derived from current runtime use |
| CORE-02 | `Store.save()` catches `QuotaExceededError`, returns typed result | D-07 `lastSaveError` shape; custom persistence middleware (D-06) |
| CORE-03 | In-memory cache eliminates per-call `JSON.parse` | D-05 cache lives in Zustand state itself |
| CORE-04 | encrypt/decrypt port byte-for-byte; fixture round-trip in Vitest | `js/crypto.js` (136 lines) — PBKDF2 250k, AES-GCM 256, 16-byte salt, 12-byte IV, PEM armor; D-24 fixture |
| CORE-05 | data.js content ported as typed const | `js/data.js` (870 lines, ~30 categories) — `as const` arrays for type derivation |
| CORE-06 | t() and language detection ported (custom, not react-i18next per D-12) | `js/i18n.js` 304 EN + 304 DE keys verified equal; D-12 typed map approach |
| CORE-07 | migrateScale, custom-items, __hidden semantics preserved | `js/storage.js:50-55` `migrateScale`; tested with fixture in Vitest |
| CORE-08 | Loading v1.0 `localStorage["relationshape.v1"]` yields same in-memory state | Custom Zustand persistence middleware (D-06); fixture test |
| DESIGN-01 | `:root` tokens modelled as Tailwind theme via `@theme`; light/dark via `data-theme` | 42 unique CSS variables in style.css verified; D-18 + D-19 |
| DESIGN-02 | DM Sans + Playfair Display self-hosted; zero Google Fonts refs in build | Fontsource variable WOFF2 packages (or direct font files); post-build grep check |
| DESIGN-03 | 8 keyframes reproduced (heroBlobPulse, holoOrbDrift, holoBtnSpin, holoIconSpin, holoUnderlineSlide, iridShift, bgPulse, silkShift) | Verified at `css/additions.css` lines 828, 833, 873, 903, 933, 964, 1367, 1398 |
| DESIGN-04 | All non-essential animations guarded by `prefers-reduced-motion: reduce` | D-10 global rule + per-keyframe overrides |
| DESIGN-05 | Theme toggle (auto/light/dark) applies `data-theme` to `<html>`, persists via Store | D-19 + D-05 (Zustand settings slice writes to localStorage via custom middleware) |
| DESIGN-06 | `<DesignSystem />` route renders colour/typography/animation scale | D-27 five-section single-page scroll |

## Project Constraints (from CLAUDE.md)

CLAUDE.md is absent at the project root. Inherited globals:
- **Language: English** for both GSD output and commit messages (from `~/.claude/CLAUDE.md`)
- **No pushing without explicit user request + confirmation** (from `~/.claude/projects/.../memory/MEMORY.md`) — keep all work local

These do not block plan content but constrain execution discipline.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hash routing + URL state | Browser / Client | — | SPA; no server. `createHashRouter` runs entirely in-browser |
| Persistent state (`relationshape.v1` blob) | Browser / Client (localStorage) | — | Privacy guarantee: no backend exists |
| In-memory state (Zustand) | Browser / Client | — | Component-level reactivity; no SSR |
| WebCrypto encrypt/decrypt | Browser / Client | — | Browser `crypto.subtle`; same API in Node test env |
| i18n lookup / `t()` | Browser / Client | — | Static maps imported at build; no fetch |
| Theme application (`data-theme` on `<html>`) | Browser / Client | — | DOM mutation only; no SSR step |
| Static assets (fonts, icons) | CDN / Static | — | Served from `public/`; cached by SW |
| Service worker (precache + offline) | Browser / Client (SW thread) | CDN / Static | SW intercepts fetches; precache manifest built at build time |
| Legacy app coexistence | CDN / Static | — | `public/legacy/` is raw static — Vite passes through |
| Bundle compatibility (v1 envelope format) | Browser / Client | — | Constant-defined envelope; no negotiation |
| Reduced-motion guard | Browser / Client (CSS engine) | — | `@media (prefers-reduced-motion: reduce)` evaluated by browser |
| Test execution | Node (Vitest worker) | Browser (jsdom for `<App />` only) | Pure modules tested in node env per D-25 |

No capabilities belong to API/Backend, Database/Storage, or Frontend Server tiers — this is a single-tier client-only PWA.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite` | 8.0.13 | Dev server, build, HMR | Locked by PROJECT.md tech stack; latest stable [VERIFIED: npm view vite version] |
| `react` | 19.2.6 | UI library | Locked by PROJECT.md; React 19 stable, no forwardRef, native ref-as-prop [VERIFIED] |
| `react-dom` | 19.2.6 | DOM renderer | Pair-versioned with react [VERIFIED] |
| `typescript` | 6.0.3 | Type system | Latest stable; satisfies all strictness flags in D-15 [VERIFIED] |
| `@vitejs/plugin-react` | 6.0.2 | Vite React integration (Fast Refresh) | Standard Vite-React plugin [VERIFIED] |
| `tailwindcss` | 4.3.0 | Utility CSS | Locked by PROJECT.md; v4 CSS-first config matches D-18 [VERIFIED] |
| `@tailwindcss/vite` | 4.3.0 | Tailwind v4 Vite plugin | **Preferred over PostCSS** for Tailwind v4 — first-party, faster, idiomatic [CITED: tailwindcss.com/blog/tailwindcss-v4] |
| `react-router-dom` | 7.15.1 | Routing | D-01 locks v7; `createHashRouter` is supported in v7 [VERIFIED: reactrouter.com/api/data-routers/createHashRouter] |
| `zustand` | 5.0.13 | State management | D-04 locks Zustand; ~1 KB, custom middleware compatible [VERIFIED] |
| `vite-plugin-pwa` | 1.3.0 | PWA / SW generation | Locked by PROJECT.md; wraps Workbox [VERIFIED] |

### Supporting (devDependencies)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.1.6 | Test runner | Locked by PROJECT.md; latest stable. **Note: 4.x removes `environmentMatchGlobs`** [VERIFIED] |
| `@testing-library/react` | 16.3.2 | React testing helpers | For `<App />` smoke render (FOUND-06) [VERIFIED] |
| `@testing-library/jest-dom` | 6.9.1 | DOM matchers | Optional but standard; nicer assertions [VERIFIED] |
| `jsdom` | 29.1.1 | DOM environment for `<App />` only | Per-file `// @vitest-environment jsdom` [VERIFIED] |
| `eslint` | 10.3.0 | Linter | D-16 flat config; v10 stable [VERIFIED] |
| `typescript-eslint` | 8.59.3 | TS lint rules | D-16; uses the unified `typescript-eslint` meta-package [VERIFIED] |
| `eslint-plugin-react-hooks` | 7.1.1 | React hooks lint rules | D-16 [VERIFIED] |
| `eslint-plugin-react-refresh` | 0.5.2 | Vite Fast Refresh lint guard | D-16 [VERIFIED] |
| `prettier` | 3.8.3 | Formatter | D-16; single quotes, no semi |
| `@types/node` | latest | Node types for `vite.config.ts` | Per shadcn-vite flow [CITED: ui.shadcn.com/docs/installation/vite] |
| `shadcn` (CLI only) | 4.7.0 | Component scaffolding | Used once via `npx shadcn@latest init -t vite`, no runtime dep [VERIFIED] |

### Font Sourcing
| Option | Package(s) | Recommended? | Why |
|--------|------------|--------------|-----|
| **Fontsource variable packages** | `@fontsource-variable/dm-sans@5.2.8`, `@fontsource-variable/playfair-display@5.2.8` | ✅ Recommended | Variable WOFF2, opsz + ital axes for DM Sans, ital + wght axes for Playfair, ships with proper `@font-face` CSS; npm-managed [VERIFIED: npm view @fontsource-variable/dm-sans version; fontsource.org/fonts/dm-sans] |
| Direct WOFF2 in `public/fonts/` | — | Alternative | More control over file paths but manual sourcing; only worth it if Fontsource axes don't match exactly |

**Recommendation:** Use `@fontsource-variable/dm-sans` and `@fontsource-variable/playfair-display`. Import their CSS in `src/main.tsx` (or `src/styles/fonts.css`). They ship the WOFF2 files via `import.meta.glob`-friendly paths Vite will copy into the build. Confirm `font-display: swap` (D-20) is set — Fontsource defaults to `swap` already. **Post-build grep step must still verify zero `fonts.googleapis.com` / `fonts.gstatic.com` strings** in `dist/`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff | Status |
|------------|-----------|----------|--------|
| `@tailwindcss/vite` plugin | `@tailwindcss/postcss` + PostCSS config | Slower, extra config file | **Rejected** — shadcn v4 docs explicitly recommend the Vite plugin |
| Fontsource packages | Hand-downloaded WOFF2 from Google Fonts | More work, but zero npm deps | **Acceptable** — but Fontsource is so well-trodden that hand-rolling is contrarian |
| Custom Zustand persist middleware | `zustand/middleware/persist` | The built-in persist has a `version` field for migrations that doesn't match v1.0's stored shape; would force a non-byte-compatible key | **Rejected** per D-06 |
| `react-i18next` | Custom 50-line t() function | Bigger dep, type ergonomics worse than typed const maps | **Rejected** per D-12 |
| `tailwindcss-animate` plugin | Hand-written keyframes in `animations.css` | shadcn v4 deprecated `tailwindcss-animate` in favor of `tw-animate-css`, but neither matches the bespoke Celestial Map keyframes (the animation surface is large, multi-property, and would be utility-soup) | **Rejected** per D-08 |
| `environmentMatchGlobs` (Vitest config) | `projects: [...]` in vitest.config.ts | Vitest 4 removes `environmentMatchGlobs` entirely | **Forced switch** — see Pitfall 9 |

**Installation (single canonical command sequence):**
```bash
# 1. Seed with shadcn's Vite template (gets Vite + React + TS + Tailwind v4 + path aliases all configured)
pnpm dlx shadcn@latest init -t vite
# (or: npx shadcn@latest init -t vite)

# 2. Add runtime deps
pnpm add react-router-dom zustand
pnpm add @fontsource-variable/dm-sans @fontsource-variable/playfair-display

# 3. Add devDeps (vite-plugin-pwa + test stack)
pnpm add -D vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom jsdom @types/node

# 4. (After theme.css is in place) Add the only Phase-1 shadcn component (proves FOUND-03 acceptance)
pnpm dlx shadcn@latest add button
```

**Version verification:** All versions above were resolved via `npm view <pkg> version` against the live registry on 2026-05-15. Re-run those commands at plan-execution time and lock to the resolved versions in `pnpm-lock.yaml` (or `package-lock.json`). [VERIFIED: npm registry, 2026-05-15]

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                Browser                                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   New App (scope: /)                                  │  │
│  │                                                                       │  │
│  │   index.html (Vite-generated)                                        │  │
│  │      │                                                                │  │
│  │      └──► <RouterProvider router={createHashRouter([...])}>           │  │
│  │              │                                                        │  │
│  │              ├──► "/" placeholder route                               │  │
│  │              └──► "/design-system" → <DesignSystem />                │  │
│  │                                                                       │  │
│  │   Zustand store (with relationshapePersist middleware)               │  │
│  │      │                                                                │  │
│  │      ├──► read selectors (getProfile, getResult, getSettings, ...)   │  │
│  │      ├──► write actions  (saveResult, setTheme, setLang, ...)         │  │
│  │      └──► lastSaveError field — observed by UI for toast              │  │
│  │                  │                                                    │  │
│  │                  ▼                                                    │  │
│  │   localStorage["relationshape.v1"]  ◄── byte-compatible with v1.0    │  │
│  │      shape: { profiles, results, imports, settings, scale }           │  │
│  │                                                                       │  │
│  │   crypto.ts (pure WebCrypto) — encryptResult / decryptResult          │  │
│  │   data.ts   (typed const arrays)                                      │  │
│  │   i18n.ts   (typed EN+DE maps, t(), getLang, setLang)                 │  │
│  │                                                                       │  │
│  │   Workbox SW @ /sw.js (precache build manifest, nav fallback /index)  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                  Legacy App (scope: /legacy/)                         │  │
│  │   public/legacy/index.html — loaded via <a href="/legacy/">           │  │
│  │   public/legacy/js/app.js  (vanilla ESM)                              │  │
│  │   public/legacy/sw.js      (cache-name "rshape-v9", scope /legacy/)   │  │
│  │   ↓ shares localStorage with new app (same origin) ↓                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                ┌──────────────────────────────────┐
                │   Vite Build (`pnpm run build`)   │
                │                                   │
                │   src/  ──► dist/                 │
                │   public/  ──► dist/ (raw copy)   │
                │       legacy/**  ◄── globIgnores  │
                │                                   │
                │   vite-plugin-pwa generates:      │
                │     dist/sw.js (Workbox precache) │
                │     dist/manifest.webmanifest     │
                │     dist/registerSW.js            │
                └──────────────────────────────────┘
```

### Recommended Project Structure

```
relationshape/
├── index.html                          # Vite entry (new app)
├── package.json
├── pnpm-lock.yaml                      # (or package-lock.json)
├── tsconfig.json                       # strict mode + path alias
├── tsconfig.node.json                  # for vite.config.ts
├── vite.config.ts                      # Vite + @tailwindcss/vite + vite-plugin-pwa
├── vitest.config.ts                    # or merge into vite.config.ts
├── eslint.config.js                    # flat config
├── .prettierrc.json
├── components.json                     # shadcn config (generated by init)
├── public/
│   ├── icons/
│   │   ├── favicon.svg                 # copied from icons/
│   │   ├── icon-192.svg
│   │   └── icon-512.svg
│   ├── fonts/                          # only if NOT using Fontsource packages
│   └── legacy/                         # D-22: legacy app coexistence
│       ├── index.html                  # v1.0 entry
│       ├── manifest.json
│       ├── sw.js                       # legacy SW; scope /legacy/
│       ├── css/style.css
│       ├── css/additions.css
│       ├── js/app.js                   # 3496 lines vanilla ESM
│       ├── js/storage.js
│       ├── js/crypto.js
│       ├── js/data.js
│       ├── js/i18n.js
│       ├── js/charts.js
│       └── icons/
├── src/
│   ├── main.tsx                        # ReactDOM.createRoot + RouterProvider
│   ├── App.tsx                         # router + ThemeProvider hook
│   ├── routes/
│   │   ├── PlaceholderHome.tsx         # "/" — "Skeleton alive"
│   │   └── DesignSystem.tsx            # "/design-system" — D-27 five sections
│   ├── store/
│   │   ├── index.ts                    # createStore + persistence middleware
│   │   ├── types.ts                    # Profile, Result, Import, Scale, Settings
│   │   └── middleware.ts               # relationshapePersist (custom)
│   ├── lib/
│   │   ├── crypto.ts                   # CORE-04 port
│   │   ├── data.ts                     # CORE-05 port (as const)
│   │   ├── i18n.ts                     # CORE-06 port (t(), getLang, setLang)
│   │   ├── i18n/en.ts                  # typed EN map (304 keys)
│   │   ├── i18n/de.ts                  # typed DE map (304 keys, constrained)
│   │   └── utils.ts                    # cn() from shadcn init
│   ├── hooks/
│   │   └── useTheme.ts                 # reads Zustand, applies data-theme to html
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx              # shadcn-added (FOUND-03 acceptance)
│   └── styles/
│       ├── globals.css                 # @import "tailwindcss"; @import "./theme.css"; etc.
│       ├── theme.css                   # @theme block — all 42 :root tokens
│       ├── fonts.css                   # @font-face (or @fontsource-variable imports)
│       └── animations.css              # 8 @keyframes + prefers-reduced-motion guard
└── tests/
    ├── fixtures/
    │   ├── README.md                   # How to regenerate fixtures
    │   ├── v1-bundle.rshape.txt        # captured manually from /legacy/
    │   ├── v1-bundle.fixture.ts        # { ARMORED, PASSPHRASE, EXPECTED_PAYLOAD }
    │   └── v1-localstorage.fixture.ts  # serialised localStorage blob
    ├── crypto.test.ts                  # node env (default); CORE-04 round-trip
    ├── storage.test.ts                 # node env; CORE-02/03/07/08
    ├── i18n.test.ts                    # node env; CORE-06 key parity
    ├── data.test.ts                    # node env; CORE-05 shape sanity
    ├── theme-tokens.test.ts            # node env; DESIGN-01 parity check
    ├── App.smoke.test.tsx              # jsdom env (per-file directive); FOUND-06
    └── setup.ts                        # if jest-dom matchers used
```

### Pattern 1: Vite + Tailwind v4 + shadcn-vite seed

**What:** Use `pnpm dlx shadcn@latest init -t vite` once to seed Vite + React 19 + TS + Tailwind v4 + path aliases + `components.json` in a single step.

**When to use:** As the first action of Phase 1 — before adding any other dependencies.

**Why:** It handles the entire scaffolding flow (Vite scaffold, Tailwind v4 install with `@tailwindcss/vite` plugin, path-alias configuration in both `tsconfig.json` and `vite.config.ts`, `src/index.css` with `@import "tailwindcss"`). All of FOUND-01, FOUND-02, FOUND-03 fall out of one command.

**Example:**
```bash
# In an empty (or pre-cleaned) project root:
pnpm dlx shadcn@latest init -t vite
# Answers when prompted:
#   - Style: new-york (D-26)
#   - Base color: slate (D-26 — placeholder; theme.css overrides)
#   - CSS variables: yes (D-26)
```

After this seed:
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `components.json` all exist
- `@tailwindcss/vite` plugin is wired in `vite.config.ts`
- Path alias `@/*` → `src/*` is set in both `tsconfig.json` and `vite.config.ts`

[CITED: ui.shadcn.com/docs/installation/vite — `pnpm dlx shadcn@latest init -t vite`]

### Pattern 2: Tailwind v4 `@theme` block for design tokens

**What:** Express every `:root` design token from v1.0 as a `@theme` block in `src/styles/theme.css`.

**When to use:** As the canonical source of truth for the design system — referenced by both Tailwind utilities (e.g., `bg-bg`, `text-text`) and direct CSS variable consumers.

**Example:**
```css
/* src/styles/theme.css */
/* Source: ported from css/style.css :root block (42 unique tokens) */
@import "tailwindcss";

@theme {
  /* Core palette — dark default */
  --color-bg:         #07091a;
  --color-bg-2:       #0c1028;
  --color-surface:    #111528;
  --color-surface-2:  #171d38;
  --color-surface-3:  #1d2344;
  --color-text:       #ede8ff;
  --color-muted:      #8880b8;
  --color-line:       rgba(130, 100, 220, 0.22);

  /* Brand */
  --color-primary:        #b96eff;
  --color-primary-strong: #cf8fff;
  --color-accent:         #ff4da6;

  /* Status */
  --color-green: #22d460;
  --color-red:   #ff4545;

  /* Typography */
  --font-sans:    "DM Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-heading: "Playfair Display Variable", Georgia, "Times New Roman", serif;

  /* Elevation */
  --shadow:    0 24px 64px -12px rgba(0,0,0,.85), 0 4px 16px rgba(0,0,0,.5);
  --shadow-sm: 0 4px 16px -4px rgba(0,0,0,.5);

  /* Glass surfaces */
  --color-glass:        rgba(10, 13, 35, 0.72);
  --color-glass-border: rgba(130, 100, 220, 0.2);
  --glass-blur:         blur(20px) saturate(1.5);

  /* Neon glow */
  --shadow-glow:    0 0 22px rgba(185, 110, 255, 0.3), 0 0 44px rgba(185, 110, 255, 0.1);
  --shadow-glow-sm: 0 0 12px rgba(185, 110, 255, 0.25);

  /* Radii */
  --radius:    18px;
  --radius-lg: 28px;
}

/* Light theme override — applied via data-theme attribute on <html> */
:root[data-theme="light"] {
  --color-bg:        #f2eeff;
  --color-bg-2:      #e8dfff;
  --color-surface:   #ffffff;
  --color-surface-2: #ede5ff;
  --color-surface-3: #dfd4ff;
  --color-text:      #1a0f3a;
  --color-muted:     #6a5a9a;
  --color-line:      rgba(100, 70, 180, 0.22);
  --color-primary:        #7c3aed;
  --color-primary-strong: #6d28d9;
  --color-accent:         #db2777;
  --shadow:    0 16px 48px -12px rgba(90,50,170,.32), 0 4px 12px rgba(90,50,170,.14);
  --shadow-sm: 0 4px 16px -4px rgba(90,50,170,.22);
  --color-glass:        rgba(255, 255, 255, 0.80);
  --color-glass-border: rgba(100, 70, 180, 0.25);
  --shadow-glow:    0 0 28px rgba(124, 58, 237, 0.28), 0 0 56px rgba(124, 58, 237, 0.12);
  --shadow-glow-sm: 0 0 16px rgba(124, 58, 237, 0.24);
}

/* auto mode = follow prefers-color-scheme */
@media (prefers-color-scheme: light) {
  :root[data-theme="auto"],
  :root:not([data-theme]) {
    /* same light token values */
  }
}
```

**Token name note:** Tailwind v4's `@theme` directive uses prefixed names (`--color-*`, `--font-*`, `--shadow-*`, `--radius-*`) so utility classes auto-generate (e.g., `bg-bg`, `text-primary`, `shadow-glow`). v1.0 used unprefixed names (`--bg`, `--primary`). The token *values* are identical; only the *variable names* change. This is a one-time port and does not affect runtime behaviour.

[CITED: tailwindcss.com/blog/tailwindcss-v4 — CSS-first `@theme` directive]

### Pattern 3: Custom Zustand persistence middleware

**What:** A custom middleware that loads/saves `localStorage["relationshape.v1"]` with the byte-compatible shape, instead of `zustand/middleware/persist`.

**When to use:** Per D-06 — the built-in `persist` middleware adds a `version` field and migration model incompatible with v1.0's stored shape.

**Example:**
```typescript
// src/store/middleware.ts
// Source: ported from v1.0 js/storage.js load()/save() with quota handling added.
import type { StateCreator, StoreApi } from 'zustand';
import { DEFAULT_SCALE } from '@/lib/data';
import { migrateScale } from '@/lib/scale';
import type { AppState } from './types';

const KEY = 'relationshape.v1';

type PersistedShape = Pick<AppState, 'profiles' | 'results' | 'imports' | 'settings' | 'scale'>;

export const relationshapePersist = <T extends AppState>(
  config: StateCreator<T>
): StateCreator<T> => (set, get, api) => {
  const hydrate = (): Partial<T> => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {};
      const data = JSON.parse(raw) as Partial<PersistedShape>;
      return {
        profiles: data.profiles ?? [],
        results:  data.results  ?? [],
        imports:  data.imports  ?? [],
        settings: data.settings ?? { theme: 'auto' },
        scale:    Array.isArray(data.scale) ? migrateScale(data.scale) : DEFAULT_SCALE,
      } as Partial<T>;
    } catch {
      return {};
    }
  };

  const persist = (state: T) => {
    const slice: PersistedShape = {
      profiles: state.profiles,
      results:  state.results,
      imports:  state.imports,
      settings: state.settings,
      scale:    state.scale,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(slice));
      if (state.lastSaveError) {
        // clear prior error on successful write
        set({ lastSaveError: null } as Partial<T>);
      }
    } catch (err) {
      const isQuota = err instanceof DOMException &&
        (err.name === 'QuotaExceededError' || err.code === 22);
      set({
        lastSaveError: {
          kind: isQuota ? 'QUOTA_EXCEEDED' : 'UNKNOWN',
          message: err instanceof Error ? err.message : 'Unknown storage error',
          at: Date.now(),
        }
      } as Partial<T>);
    }
  };

  // wrap set so every mutation triggers persist
  const wrappedSet: typeof set = (partial, replace) => {
    set(partial, replace as false);
    persist(get());
  };

  const initial = config(wrappedSet, get, api);
  return { ...initial, ...hydrate() };
};
```

**Why this exact shape:** CORE-02 mandates that quota overflow surfaces as a typed result (`lastSaveError`) for the UI to subscribe to. CORE-03 mandates an in-memory cache eliminating per-call `JSON.parse` — Zustand state IS the cache (D-05).

### Pattern 4: WebCrypto byte-for-byte port

**What:** Port `js/crypto.js` to TypeScript with identical envelope shape — only add types, never change runtime behaviour.

**When to use:** CORE-04. Verified by fixture round-trip test.

**Example:**
```typescript
// src/lib/crypto.ts
// Source: ported verbatim from js/crypto.js with TypeScript types.
// DO NOT change envelope fields, key derivation params, or armor format.

const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERS = 250_000;
const VERSION = 'v1';
const HEADER = '-----BEGIN RELATIONSHAPE BUNDLE-----';
const FOOTER = '-----END RELATIONSHAPE BUNDLE-----';

export interface Envelope {
  kdf:    { n: 'PBKDF2'; h: 'SHA-256'; i: number; s: string };
  cipher: { n: 'AES-GCM'; iv: string };
  data:   string;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase),
    { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptResult(payload: unknown, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));   // 16-byte salt — locked
  const iv   = crypto.getRandomValues(new Uint8Array(12));   // 12-byte IV — locked
  const key  = await deriveKey(passphrase, salt);
  const plaintext = enc.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  );
  const envelope: Envelope = {
    kdf:    { n: 'PBKDF2', h: 'SHA-256', i: PBKDF2_ITERS, s: bytesToB64(salt) },
    cipher: { n: 'AES-GCM', iv: bytesToB64(iv) },
    data:   bytesToB64(ciphertext),
  };
  const body = wrapLines(strToB64(JSON.stringify(envelope)));
  return `${HEADER}\n${VERSION}\n${body}\n${FOOTER}\n`;
}

export async function decryptResult(armored: string, passphrase: string): Promise<unknown> {
  const env = parseArmor(armored);
  const salt = b64ToBytes(env.kdf.s);
  const iv   = b64ToBytes(env.cipher.iv);
  const ct   = b64ToBytes(env.data);
  const key  = await deriveKey(passphrase, salt);
  let pt: ArrayBuffer;
  try {
    pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  } catch {
    throw new Error('Wrong passphrase or corrupted bundle.');
  }
  return JSON.parse(dec.decode(pt));
}

// ... (parseArmor, parseEnvelopeJson, bytesToB64, b64ToBytes, strToB64, b64ToStr, wrapLines — verbatim from v1.0)
```

**Critical:** `PBKDF2_ITERS`, `VERSION`, `HEADER`, `FOOTER`, the field names (`n`, `h`, `i`, `s`, `iv`, `data`), the salt length (16), and the IV length (12) are all part of the locked bundle format. Changing any of these breaks PWA-04 / PWA-05.

[Source: ported from `js/crypto.js` — verbatim envelope shape and constants]

### Pattern 5: Custom typed i18n

**What:** A 50-line TS module reproducing `t()` with full type-checking of translation keys.

**When to use:** CORE-06 + D-12 + D-13.

**Example:**
```typescript
// src/lib/i18n/en.ts
export const EN = {
  nav_profiles:   '👤 Profiles',
  nav_import:     '📥 Import/Export',
  nav_compare:    '📊 Results/Compare',
  nav_settings:   '⚙️ Settings',
  // ... 300 more keys (verbatim from js/i18n.js TRANSLATIONS.en)
} as const;

export type TranslationKey = keyof typeof EN;

// src/lib/i18n/de.ts
import type { TranslationKey } from './en';
export const DE: Record<TranslationKey, string> = {
  nav_profiles:   '👤 Profile',
  nav_import:     '📥 Import/Export',
  // ... type checker enforces every key exists
};

// src/lib/i18n.ts
import { EN, type TranslationKey } from './i18n/en';
import { DE } from './i18n/de';

const TRANSLATIONS = { en: EN, de: DE } as const;
type Lang = keyof typeof TRANSLATIONS;

function detectLanguage(): Lang {
  // mirror v1.0 logic: localStorage settings.lang → navigator.language → 'en'
  try {
    const raw = localStorage.getItem('relationshape.v1');
    const data = raw ? JSON.parse(raw) : null;
    const stored = data?.settings?.lang;
    if (stored === 'en' || stored === 'de') return stored;
  } catch {}
  const browser = (navigator.language || 'en').split('-')[0].toLowerCase();
  return browser === 'de' ? 'de' : 'en';
}

let _lang: Lang = detectLanguage();

export function getLang(): Lang { return _lang; }

export function setLang(lang: Lang): void {
  _lang = lang;
  // store side-effect handled by Zustand action that calls this
}

export function t(key: TranslationKey, vars: Record<string, string | number> = {}): string {
  const dict = TRANSLATIONS[_lang];
  let str: string = dict[key] ?? EN[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}
```

**Why the typed approach:** Compile-time error on any missing DE key. Eliminates the v1.0 "missing translation silently falls back to raw key" failure mode for any key present at build time.

[Source: ported from `js/i18n.js` lines 5-846 — same semantics, added types]

### Pattern 6: `<DesignSystem />` route

**What:** Single-page scroll at `/design-system` with five sections — referenced by both the Phase-1 verifier and human designers eyeballing parity.

**When to use:** D-27 + D-28.

**Structure:**
```tsx
// src/routes/DesignSystem.tsx
export function DesignSystem() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <header className="flex items-center justify-between">
        <h1 className="font-heading text-4xl">Design System</h1>
        <div className="flex gap-3">
          <ThemeToggle />        {/* uses shadcn Button — D-28 */}
          <LanguageToggle />     {/* plain <select> in Phase 1 */}
        </div>
      </header>

      <section id="palette">
        <h2 className="font-heading text-2xl mb-4">1. Palette</h2>
        {/* Render every @theme token as a 120x120 swatch with label + hex */}
      </section>

      <section id="typography">
        <h2 className="font-heading text-2xl mb-4">2. Typography</h2>
        {/* DM Sans 12/14/16/18/24/32; Playfair Display 24/32/48 */}
      </section>

      <section id="animations">
        <h2 className="font-heading text-2xl mb-4">3. Animations</h2>
        {/* 8 keyframes shown live, each labeled */}
        {/* Toggle: data-prm="reduce" attribute on <body> for in-page reduced-motion preview */}
      </section>

      <section id="surfaces">
        <h2 className="font-heading text-2xl mb-4">4. Surfaces</h2>
        {/* glass cards, glow buttons, shadcn Button variants */}
      </section>

      <section id="reduced-motion">
        <h2 className="font-heading text-2xl mb-4">5. Reduced Motion</h2>
        <p>Open DevTools → Rendering → Emulate "prefers-reduced-motion: reduce" and reload. Above animations should freeze.</p>
      </section>
    </div>
  );
}
```

[Source: D-27 + `specifics` in CONTEXT.md re: data-prm toggle for in-page preview]

### Anti-Patterns to Avoid

- **Putting i18n in `react-i18next` "for the ecosystem":** D-12 locks custom port. The 50-line TS function gives compile-time key validation that `react-i18next`'s key types can't match without ts-codegen.
- **Using `zustand/middleware/persist`:** D-06 — its `version` migration model adds bytes to the stored shape that v1.0 can't parse. Custom middleware is mandatory.
- **Changing the crypto envelope keys (`n`/`h`/`i`/`s`/`iv`):** PWA-05 requires v2.0 bundles to decrypt in v1.0. The verbose key names look ugly; they're locked.
- **Storing the in-memory cache outside the Zustand store:** D-05 — Zustand state IS the cache. Adding a separate `_cache` variable duplicates the source of truth.
- **Putting font CSS imports in `index.html` `<link>`:** D-20 — must self-host. Use `import '@fontsource-variable/dm-sans'` in `src/main.tsx` (Vite handles bundling).
- **Adding more shadcn components than `Button`:** D-28 — Phase 1's only component is Button. Everything else is plain HTML + Tailwind. Component sprawl is a Phase 2 concern.
- **Using PostCSS for Tailwind:** Tailwind v4's `@tailwindcss/vite` is the recommended path. PostCSS works but is slower and adds config files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vite + React + TS + Tailwind v4 scaffold | A hand-written `vite.config.ts` + manual `tsconfig.json` | `pnpm dlx shadcn@latest init -t vite` | Gets path aliases, Tailwind plugin, and components.json in one step |
| Service worker registration + lifecycle | Custom `navigator.serviceWorker.register(...)` block in index.html | `vite-plugin-pwa` `registerType: 'autoUpdate'` | Workbox handles precache, update notification, scope; matches D-23 verbatim |
| WebCrypto polyfill | Anything | Native `crypto.subtle` (Node 22+ has it; browsers have it) | Verified Node 24 host; same API surface |
| Variable font `@font-face` declarations | Hand-written `@font-face` blocks | `@fontsource-variable/*` packages | Pre-built CSS with all axes wired |
| React reactivity around theme/lang | useState + manual sync | Zustand selector | Single source of truth; subscriptions auto-fire |
| Test environment switching | Conditional `globalThis.crypto = ...` polyfills | Vitest's per-file `// @vitest-environment` directive | Built-in, supported in all v3/v4 |
| ASCII armor parsing | A new parser | Port the existing `parseArmor()` verbatim from `js/crypto.js` | Battle-tested; handles PEM, bare base64, raw JSON paths |
| Reduced-motion override per-animation | Per-component CSS-in-JS | Single global `@media (prefers-reduced-motion: reduce) { ... }` block in `animations.css` | One rule, eight keyframes, zero per-component plumbing |

**Key insight:** Phase 1 is mostly *configuration* and *literal porting*. The decisions about library choice are already made (D-01..D-28). The risk surface is in *getting current versions to play nice together*, not in *picking a stack*. Hand-rolling anything in this phase costs more than it saves.

## Common Pitfalls

### Pitfall 1: Tailwind v4 token names ≠ v1.0 token names

**What goes wrong:** Tailwind v4's `@theme` block uses prefixed token names (`--color-bg`, `--shadow-glow`) to generate utility classes. v1.0 used unprefixed names (`--bg`, `--glow`). If the port keeps the v1.0 names verbatim, Tailwind utilities like `bg-bg` won't generate.

**Why it happens:** v4 introspects `--color-*`, `--font-*`, `--shadow-*`, `--radius-*` prefixes to generate utilities.

**How to avoid:** Use the prefixed names inside `@theme`. The token *values* are the same hex strings as v1.0; only the *variable names* change. Verifier check: every token from v1.0 `:root` has a corresponding `@theme` entry with the same value.

**Warning signs:** Tailwind classes like `bg-bg`, `text-primary`, `shadow-glow` don't apply visually.

### Pitfall 2: `vite-plugin-pwa` precaches the legacy app

**What goes wrong:** Without `globIgnores: ['legacy/**']`, vite-plugin-pwa scans `dist/` (which includes the copied `public/legacy/*` files) and adds the legacy app to the SW precache manifest. Now the new SW competes with the legacy SW.

**Why it happens:** Workbox `generateSW` mode walks the entire output folder by default.

**How to avoid:** Set `workbox.globIgnores: ['legacy/**']` in `vite.config.ts`. Also exclude the legacy SW file: `globIgnores: ['legacy/**', '**/legacy/sw.js']`. [CITED: Workbox docs — `globIgnores` is part of workbox-build configuration]

**Warning signs:** Post-build inspection of `dist/sw.js` references `/legacy/js/app.js`, `/legacy/css/style.css`, etc.

### Pitfall 3: SW scope conflict — legacy SW claims `/`, not `/legacy/`

**What goes wrong:** A service worker's scope defaults to its location's directory. The legacy `sw.js` at `/legacy/sw.js` has implicit scope `/legacy/`. But v1.0 originally registered its SW at the root (`./sw.js`), so its `clients.claim()` call would claim `/`. If the user has an old SW registration from before the move, it may try to claim the new app's scope.

**Why it happens:** SW registrations persist across page loads. A user upgrading from v1.0 → v2.0 may carry a stale `/` registration.

**How to avoid:**
1. The new app's SW (`/sw.js`) takes over `/` on first load via `clients.claim()`.
2. Add a one-time cleanup in `src/main.tsx`: if `navigator.serviceWorker.getRegistrations()` shows a registration for `/sw.js` from before the move (pre-vite-plugin-pwa), let the new SW supersede it (vite-plugin-pwa handles this automatically with `registerType: 'autoUpdate'` + `clientsClaim`).
3. The legacy app at `/legacy/index.html` should register its SW with explicit scope `/legacy/`: `navigator.serviceWorker.register('./sw.js', { scope: '/legacy/' })`. The legacy sw.js currently registers from `index.html` via `navigator.serviceWorker.register("./sw.js")` — implicit scope of `/legacy/`. Verify after move.
4. **Phase 1 verification step:** load `/`, open DevTools → Application → Service Workers; confirm exactly one SW under scope `/` (the new one), and after navigating to `/legacy/`, exactly one SW under scope `/legacy/`.

**Warning signs:** Both apps showing stale content; clearing one SW's cache affects the other.

### Pitfall 4: Vitest 4 removes `environmentMatchGlobs`

**What goes wrong:** D-25 says "per-glob in `vitest.config.ts`" — this implies `environmentMatchGlobs`, which is **deprecated in Vitest 3 and removed in Vitest 4** (current 4.1.6). Configs using it silently no-op.

**Why it happens:** Vitest migrated to a `projects` configuration that's more powerful (full vitest config per project, not just env override).

**How to avoid:** Two viable patterns:
- **Recommended (simpler):** Per-file `// @vitest-environment jsdom` comment at the top of `tests/App.smoke.test.tsx`. All other test files default to `node`. Zero config.
- **Alternative (if jsdom tests grow):** Use `projects` in `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'node', include: ['tests/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'dom',  include: ['tests/**/*.test.tsx'], environment: 'jsdom' } },
    ],
  },
});
```

**Warning signs:** `<App />` smoke test fails with "document is not defined".

[VERIFIED: vitest.dev/guide/migration.html — environmentMatchGlobs removed in 4.0]

### Pitfall 5: Variable WOFF2 sourcing — Google Fonts CDN doesn't ship variable font files reliably

**What goes wrong:** Even though Google Fonts CDN serves DM Sans as `@import url(...)`, the actual served file is a normal WOFF2 — not always the full variable file with opsz axis. Hand-downloading from Google may give static slices.

**Why it happens:** Google Fonts CDN does its own subsetting; the API URL with `:wght@300..700` returns a single WOFF2 file but axis-completeness varies.

**How to avoid:** Use Fontsource Variable packages (`@fontsource-variable/dm-sans`, `@fontsource-variable/playfair-display`). They ship the full variable WOFF2 files from upstream sources, with proper `@font-face` CSS already defined. Vite copies them into the build automatically. [VERIFIED: fontsource.org/fonts/dm-sans confirms opsz + ital axes]

**Warning signs:** Optical sizing doesn't differ visually between display and body text; italics fail to render.

### Pitfall 6: `prefers-reduced-motion` doesn't disable a continuously-running animation

**What goes wrong:** A `@media (prefers-reduced-motion: reduce)` rule that only zeros `animation-duration` keeps the animation visually playing (just very slowly looped, which can still cause GPU compositing on infinite animations).

**Why it happens:** Many "reduced motion" CSS rules just compress duration, leaving `animation-name` set.

**How to avoid:** D-10 says "disabled entirely." The global rule should set `animation: none !important;` on the eight specific keyframes (or use the universal-selector pattern with `animation-iteration-count: 1`). Pattern:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  /* per-keyframe overrides for the eight Celestial animations */
  body::before, body::after,
  .btn-primary::after,
  .hero-feat-icon::before,
  .section-head h2::after,
  .page-head h1::after,
  .scale-btn.is-active::after,
  .li-avatar::before {
    animation: none !important;
  }
}
```

**Warning signs:** With DevTools "Emulate prefers-reduced-motion: reduce" enabled, the silk-shimmer effect on `.li-avatar::before` is still subtly visible.

### Pitfall 7: `crypto.randomUUID()` fallback in browsers without it

**What goes wrong:** Some older Safari versions (pre-15.4) don't have `crypto.randomUUID()`. v1.0's `js/storage.js:9-13` has a fallback. The TS port should preserve it.

**Why it happens:** Browser support gap; though by 2026 the fallback is increasingly defensive.

**How to avoid:** Keep the fallback verbatim from v1.0:
```typescript
function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
```

**Warning signs:** Empty profile/result IDs on a stale Safari.

### Pitfall 8: `migrateScale` mutates input

**What goes wrong:** The v1.0 `migrateScale(scale)` clones internally but the surrounding flow (`getScale()`) sometimes assigns to `data.scale` and re-saves. A TS port that's "stricter" might add `readonly` annotations and trip on this.

**Why it happens:** `migrateScale` returns a new array via `recalcScaleValues(cloneScale(scale))`, but the surrounding `getScale()` immediately assigns and saves.

**How to avoid:** Port the function with `readonly` arrays in/out as input type, but internally clone. The Vitest test for CORE-07 must cover: (a) reversed old-format scale gets re-reversed and re-valued; (b) un-modified English default is replaced with localized default; (c) un-modified DE default is replaced with localized default. [Source: `js/storage.js:50-55` + `js/storage.js:139-159`]

**Warning signs:** Strict TS errors about readonly arrays inside the migration helper.

### Pitfall 9: Vite's `publicDir` files are NOT processed — they're raw copies

**What goes wrong:** Putting v1.0's source files in `public/legacy/` works for serving them, but you cannot import from `public/` in TS source. Also, Vite doesn't transpile or bundle anything in `public/` — it's a passthrough copy.

**Why it happens:** Per Vite docs, `public/` is for assets that should be served as-is at the root URL.

**How to avoid:** This is actually the desired behaviour (D-22 — legacy app stays in vanilla ESM). But:
- Don't try to `import` from `public/legacy/js/storage.js` in TS code (use the new `src/store/`).
- The legacy app's `sw.js` will run unmodified inside `/legacy/` — verify its asset paths still resolve relative to that scope.
- The legacy `manifest.json` reference in legacy `index.html` is `manifest.json` (relative) — resolves to `/legacy/manifest.json` ✓.

**Warning signs:** Trying to import legacy JS from TS gives "Cannot find module" or "outside src directory" errors.

### Pitfall 10: `tsconfig.json` shadcn-vite default may not include all D-15 strictness flags

**What goes wrong:** `shadcn init -t vite` writes a `tsconfig.json` with `strict: true` but D-15 requires extra flags (`noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`).

**Why it happens:** The shadcn template is conservative; turning all these on by default would break in many existing projects.

**How to avoid:** As a post-init step, patch `tsconfig.app.json` (or `tsconfig.json` depending on what shadcn generated) to add the six D-15 flags. This is a one-line each addition. Run `pnpm typecheck` immediately to catch any code that needs adjusting (likely none for Phase 1 since the codebase is brand new).

**Warning signs:** Phase 2 work hits previously-silent type errors that should have been caught in Phase 1.

## Runtime State Inventory

Phase 1 is foundational scaffolding plus one rename-adjacent action: moving `js/`, `css/`, `sw.js`, `index.html`, `manifest.json`, `icons/` from the repo root into `public/legacy/`. That move triggers runtime-state concerns:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `localStorage["relationshape.v1"]` (single key, same origin shared by new + legacy apps) — shape unchanged. v1.0 fixtures must continue to parse | None (intentional) — but the v2.0 custom persistence middleware MUST read/write the byte-compatible shape. Verified by CORE-08 Vitest fixture test |
| Live service config | None — there are no external services (no backend, no analytics) | None |
| OS-registered state | Service worker registration from v1.0 (`/sw.js` scope `/`). After the move, the v1.0 SW would 404 on its registration URL. Browsers handle this gracefully (unregister on 404), but a returning user may briefly see a stale shell | Add a one-time SW cleanup probe in `src/main.tsx` that checks `navigator.serviceWorker.getRegistrations()`, identifies any with scriptURL ending in `/sw.js` and scope `/` from before vite-plugin-pwa took over, and lets the new SW supersede (vite-plugin-pwa's `clientsClaim` does this automatically). **Phase 1 task:** verify in DevTools that exactly one SW is registered at `/` after migration. |
| Secrets/env vars | None — no `.env`, no API keys, no SOPS | None |
| Build artifacts | None yet — `node_modules/`, `dist/`, `pnpm-lock.yaml` are all new. .gitignore must include them | Add `.gitignore` entries for `node_modules/`, `dist/`, `*.log`, `.DS_Store`. Verify no existing `package-lock.json` (project has none currently). |

**Nothing found in category "Live service config" or "Secrets/env vars":** Verified by `grep -rE "(api|token|secret|key)\s*[:=]" --include='*.js' --include='*.html' --include='*.json'` returning only crypto-related constants and PALETTE colour hex codes. Verified by `find . -name '.env*'` returning nothing. The Relationshape app is genuinely client-only.

## Code Examples

### Verified Vite + Tailwind v4 + vite-plugin-pwa config

```typescript
// vite.config.ts
// Source: shadcn-vite seed + vite-plugin-pwa docs + D-23 config decisions
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: false,   // D-23: no SW in dev
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['legacy/**', '**/legacy/sw.js'],    // D-23 + Pitfall 2
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/legacy/],          // never SPA-fallback into legacy
        clientsClaim: true,                                // Pitfall 3
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
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

[CITED: vite-pwa-org.netlify.app — config schema]

### Verified `tsconfig.app.json` with D-15 strictness

```jsonc
// tsconfig.app.json — strict mode per D-15
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,

    /* strict mode — D-15 */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,

    /* path alias */
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests"]
}
```

### Verified Vitest config (no environmentMatchGlobs)

```typescript
// vitest.config.ts — Pitfall 4
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'node',                  // default
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // Per-file override: tests that need jsdom add `// @vitest-environment jsdom` at top
  },
});
```

```typescript
// tests/App.smoke.test.tsx
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

### Verified crypto fixture round-trip

```typescript
// tests/crypto.test.ts
// Default node environment per D-25. Node 24 has crypto.subtle natively.
import { describe, it, expect } from 'vitest';
import { encryptResult, decryptResult } from '@/lib/crypto';
import { ARMORED, PASSPHRASE, EXPECTED_PAYLOAD } from './fixtures/v1-bundle.fixture';

describe('crypto round-trip (CORE-04)', () => {
  it('decrypts v1.0 fixture to expected payload', async () => {
    const payload = await decryptResult(ARMORED, PASSPHRASE);
    expect(payload).toEqual(EXPECTED_PAYLOAD);
  });

  it('re-encrypts and decrypts back to parity', async () => {
    const armored = await encryptResult(EXPECTED_PAYLOAD, 'fresh-pass-1');
    const restored = await decryptResult(armored, 'fresh-pass-1');
    expect(restored).toEqual(EXPECTED_PAYLOAD);
  });

  it('produces an envelope with locked byte-shape', async () => {
    const armored = await encryptResult({ hello: 'world' }, 'x');
    // Decode the armor to inspect envelope shape
    const inner = armored
      .split('-----BEGIN RELATIONSHAPE BUNDLE-----')[1]
      .split('-----END RELATIONSHAPE BUNDLE-----')[0]
      .trim()
      .split('\n')
      .filter(Boolean);
    expect(inner[0]).toBe('v1');                                  // VERSION
    const b64 = inner.slice(1).join('');
    const envelope = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
    expect(envelope.kdf.n).toBe('PBKDF2');
    expect(envelope.kdf.h).toBe('SHA-256');
    expect(envelope.kdf.i).toBe(250_000);
    expect(Buffer.from(envelope.kdf.s, 'base64').length).toBe(16);  // salt
    expect(envelope.cipher.n).toBe('AES-GCM');
    expect(Buffer.from(envelope.cipher.iv, 'base64').length).toBe(12);  // IV
  });
});
```

### Verified theme-token parity check (DESIGN-01)

```typescript
// tests/theme-tokens.test.ts
// Node env. Greps style.css and theme.css to confirm parity.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const V1_TOKENS_REQUIRED = [
  '--bg', '--bg-2', '--surface', '--surface-2', '--surface-3',
  '--text', '--muted', '--line',
  '--primary', '--primary-strong', '--accent',
  '--green', '--red',
  '--font-sans', '--font-heading',
  '--shadow', '--shadow-sm',
  '--glass', '--glass-border', '--glass-blur',
  '--glow', '--glow-sm',
  '--radius', '--radius-lg',
];

// In v4, tokens become prefixed: --bg → --color-bg, --shadow → --shadow, etc.
const tokenMap: Record<string, string> = {
  '--bg': '--color-bg',
  '--surface': '--color-surface',
  '--text': '--color-text',
  '--primary': '--color-primary',
  '--accent': '--color-accent',
  '--glass': '--color-glass',
  '--glow': '--shadow-glow',
  // ... (full map in actual test)
};

describe('design token parity (DESIGN-01)', () => {
  it('every v1.0 :root token maps to a @theme entry in theme.css', () => {
    const themeCss = readFileSync(resolve(__dirname, '../src/styles/theme.css'), 'utf-8');
    for (const token of V1_TOKENS_REQUIRED) {
      const targetName = tokenMap[token] ?? token;
      expect(themeCss).toMatch(new RegExp(`\\${targetName}\\s*:`));
    }
  });
});
```

### Verified i18n key parity (CORE-06)

```typescript
// tests/i18n.test.ts
import { describe, it, expect } from 'vitest';
import { EN } from '@/lib/i18n/en';
import { DE } from '@/lib/i18n/de';
import { t, setLang, getLang } from '@/lib/i18n';

describe('i18n (CORE-06)', () => {
  it('EN and DE have identical key sets', () => {
    const enKeys = Object.keys(EN).sort();
    const deKeys = Object.keys(DE).sort();
    expect(deKeys).toEqual(enKeys);
    expect(enKeys.length).toBe(304);   // v1.0 baseline
  });

  it('t() falls back to EN when DE key missing (compile-time prevented, runtime safety)', () => {
    setLang('en');
    expect(t('welcome_title')).toBe('Relationshapes');
  });

  it('{var} substitution works', () => {
    setLang('en');
    // pick any v1.0 key that uses {var} — example
    expect(t('seeded_toast', { name: 'Alice' })).toContain('Alice');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` JS-first config with `theme.extend` | `@theme` CSS-first directive in CSS file | Tailwind v4 (Jan 2025) | D-18 forces CSS-first; `tailwind.config.ts` reduced to a thin shim |
| `tailwindcss-animate` plugin | `tw-animate-css` (or hand-written keyframes) | shadcn v4 (mid 2025) | We're using hand-written keyframes (D-08) so neither matters here |
| `forwardRef` in React | `ref` as prop | React 19 (Dec 2024) | shadcn primitives updated; only affects the `Button` we add — uses the new pattern automatically |
| `environmentMatchGlobs` in Vitest config | `projects` array | Vitest 3 deprecated, Vitest 4 removed | D-25 wording needs Pitfall-4 correction |
| `@tailwindcss/postcss` for Vite | `@tailwindcss/vite` plugin | Tailwind v4 (recommended) | We use the Vite plugin (faster, simpler) |
| `crypto-js` or hand-polyfill for SubtleCrypto in tests | Native `crypto.subtle` in Node 22+ | Node 22 LTS (Apr 2024) | Vitest tests run in `node` env with no polyfill — Pattern 4 verified |
| Google Fonts CDN `<link>` for variable fonts | Fontsource Variable npm packages | Steady evolution; the privacy-first path | D-20 + Pitfall 5 |
| Default shadcn style "default" | Default shadcn style "new-york" | shadcn v4 deprecates "default" | D-26 already specifies "new-york" |
| Service worker hand-rolled | vite-plugin-pwa / Workbox-based | PWA-plugin ecosystem matured | Replaces v1.0's `sw.js` |

**Deprecated/outdated:**
- `environmentMatchGlobs` in Vitest config — removed in v4
- `tailwindcss-animate` — superseded by `tw-animate-css` (but not needed here)
- React `forwardRef` — superseded by ref-as-prop in React 19 (auto-applied by shadcn templates)
- Hand-rolled `sw.js` — superseded by vite-plugin-pwa

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pnpm dlx shadcn@latest init -t vite` succeeds cleanly on a fresh empty project with Node 24 | Pattern 1 + Standard Stack | If the `-t vite` template flag is removed/renamed, we fall back to the manual setup (Pattern 1 alternate) — small delay |
| A2 | Fontsource variable packages for DM Sans + Playfair Display will work when `import '@fontsource-variable/dm-sans'` is added to `main.tsx` | Standard Stack (Fonts) | If Fontsource changes import path, fallback is to download WOFF2 files to `public/fonts/` and write `@font-face` by hand (~30 min extra work) |
| A3 | `@tailwindcss/vite` plugin + `@theme` directive supports `[data-theme="light"]` selector overrides outside the `@theme` block | Pattern 2 | If v4 enforces all tokens inside `@theme`, we'd need to use `[data-theme]` variant config (e.g., `@variant` directive). Either way it's a 10-line config tweak |
| A4 | Workbox's `globIgnores: ['legacy/**']` correctly excludes the entire `public/legacy/` tree from the precache manifest | Pitfall 2 + verified config | If pattern syntax differs, post-build grep of `dist/sw.js` for `/legacy/` will catch any leakage — fixable by tightening pattern |
| A5 | The legacy app's `js/i18n.js`-driven `_lang` detection at module-load time will still work when served from `/legacy/index.html` (since it reads from the same localStorage key) | D-22 + Pitfall 9 | If browsers ever isolate localStorage by path within an origin (they don't today), shared state breaks. Verified per HTML/storage spec — localStorage is scoped per origin, not per path |
| A6 | Phase-1 verifier will manually walk through `/design-system` for eyeball parity (no automated visual regression) | D-11 + D-27 | If the user later wants automated visual regression (Percy / Chromatic), it's a v2.1+ add — not Phase 1 |

If this table is empty: all claims in this research were verified or cited. **Six assumptions remain.** None are blockers; all have low-effort fallbacks. Recommend the planner surface A1 (shadcn-vite template flag) to the user for explicit confirmation if planning is paused for any reason — it's the one assumption that, if wrong, changes the plan structure (extra manual setup step instead of one-command seed).

## Open Questions

1. **What's the canonical command flow if `shadcn@latest init -t vite` is renamed/removed before execution?**
   - What we know: As of 2026-05-15 the `-t vite` template flag is the documented quick-start path.
   - What's unclear: Future shadcn releases may move flags.
   - Recommendation: Plan should pin `shadcn@4.7.0` (the version verified today) for the init step, OR document a manual fallback (pnpm create vite@latest react-ts → install tailwind → init shadcn with no template flag) as a backup task.

2. **Does the legacy SW's `clients.claim()` (in `sw.js:24`) need explicit scope tightening after the move to `/legacy/`?**
   - What we know: SW scope defaults to its location (`/legacy/`); `clients.claim()` claims clients within scope only.
   - What's unclear: Whether v1.0 users with a prior `/` registration of the legacy SW will see odd behaviour.
   - Recommendation: Verification task — DevTools → Application → Service Workers should show exactly one SW per scope after migration. If a stale `/` SW shows up, the new SW's `clientsClaim: true` overrides it.

3. **Are there any v1.0 translation keys that already differ between EN and DE in semantics (not just translation)?**
   - What we know: 304 keys in both; structural parity confirmed.
   - What's unclear: Whether any DE key intentionally returns a different *placeholder set* than its EN counterpart (e.g., `{name}` in EN but `{Name}` in DE).
   - Recommendation: Phase 1's i18n.test.ts should add a placeholder-set parity assertion. If a mismatch surfaces, fix the DE source — it's a pre-existing bug, not new work.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite, Vitest, all build tooling | ✓ | v24.2.0 | — |
| npm | Initial install (pnpm-recommended fallback) | ✓ | 11.3.0 | — |
| pnpm | Preferred package manager (shadcn-vite default) | likely | — | Use `npm` if pnpm not installed; functionally equivalent |
| Git | Source control | ✓ (clean repo on `main`) | — | — |
| Browser (Chromium/Firefox/Safari) | Manual verification of `/design-system` + reduced-motion eyeball | ✓ | system | — |
| Internet access | npm registry; Fontsource font files; vite-plugin-pwa Workbox bundle | ✓ | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `pnpm` may be absent — `npm` works for everything, just with slightly worse install ergonomics. The shadcn docs show both `pnpm dlx` and `npx` forms; use whichever is available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.ts` (or merged into `vite.config.ts`) |
| Quick run command | `pnpm test` (alias for `vitest run`) — runs the full Phase-1 suite in ~10 seconds (mostly crypto's PBKDF2 cost) |
| Full suite command | `pnpm test && pnpm typecheck && pnpm lint && pnpm build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Vite + React + TS scaffolded; placeholder route renders | smoke | `pnpm test -- App.smoke.test.tsx` | ❌ Wave 0 |
| FOUND-02 | Tailwind v4 utility applies to placeholder | manual eyeball | Visual verification at `/` after `pnpm dev` | manual |
| FOUND-03 | `npx shadcn@latest add button` succeeds, file appears | unit (file-existence) | `pnpm test -- shadcn-button.test.ts` (asserts `src/components/ui/button.tsx` exists) | ❌ Wave 0 |
| FOUND-04 | vite-plugin-pwa generates SW + manifest | unit (build-artifact) | `pnpm build && pnpm test -- pwa-output.test.ts` (asserts `dist/sw.js`, `dist/manifest.webmanifest` exist) | ❌ Wave 0 |
| FOUND-05 | typecheck + lint clean | CI script | `pnpm typecheck && pnpm lint` (exit 0) | ✅ once configs exist |
| FOUND-06 | `<App />` renders without crashing | smoke (jsdom) | `pnpm test -- App.smoke.test.tsx` | ❌ Wave 0 |
| FOUND-07 | Vite dev server serves `/` (new) + `/legacy/` (passthrough) | manual eyeball + curl check | After `pnpm dev`: `curl localhost:5173/legacy/index.html` returns v1.0 HTML | manual |
| CORE-01 | `Store` ported to TS module with explicit types | unit | `pnpm test -- storage.test.ts` | ❌ Wave 0 |
| CORE-02 | `Store.save()` catches QuotaExceededError → typed result | unit | `pnpm test -- storage.test.ts -t "quota"` (mock localStorage to throw) | ❌ Wave 0 |
| CORE-03 | In-memory cache eliminates per-call `JSON.parse` | unit (perf) | `pnpm test -- storage.test.ts -t "cache"` (spy on `localStorage.getItem`, assert call count == 1 after 10 reads) | ❌ Wave 0 |
| CORE-04 | Encrypt/decrypt round-trip + byte-shape match | unit | `pnpm test -- crypto.test.ts` | ❌ Wave 0 (requires fixture pre-captured) |
| CORE-05 | data.ts content matches v1.0 (no content changes) | unit | `pnpm test -- data.test.ts` (assert category IDs, item counts) | ❌ Wave 0 |
| CORE-06 | t() resolves every v1.0 EN+DE key; getLocalizedDefaultScale works | unit | `pnpm test -- i18n.test.ts` | ❌ Wave 0 |
| CORE-07 | migrateScale + custom-items + __hidden semantics preserved | unit | `pnpm test -- storage.test.ts -t "migrate"` | ❌ Wave 0 |
| CORE-08 | Loading v1.0 localStorage blob → identical in-memory state | unit | `pnpm test -- storage.test.ts -t "hydrate v1"` | ❌ Wave 0 |
| DESIGN-01 | Every `:root` token from v1.0 expressed in theme.css | unit (grep) | `pnpm test -- theme-tokens.test.ts` | ❌ Wave 0 |
| DESIGN-02 | Zero Google Fonts refs in production build | build-output grep | `pnpm build && ! grep -r "fonts.googleapis.com\|fonts.gstatic.com" dist/` | manual/CI |
| DESIGN-03 | 8 keyframes reproduced | unit (grep on animations.css) | `pnpm test -- animations.test.ts` (assert presence of 8 `@keyframes` names) | ❌ Wave 0 |
| DESIGN-04 | With `prefers-reduced-motion: reduce`, all 8 keyframes disabled | manual eyeball (not unit-testable headlessly) | DevTools → Rendering → Emulate reduce → reload `/design-system` → verify visual freeze | manual |
| DESIGN-05 | Theme toggle (auto/light/dark) applies `data-theme` to `<html>` | unit (component) | `pnpm test -- DesignSystem.test.tsx` (jsdom; click toggle; assert `document.documentElement.dataset.theme === 'light'`) | ❌ Wave 0 |
| DESIGN-06 | `/design-system` route renders 5 sections | smoke (jsdom) | `pnpm test -- DesignSystem.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test -- --changed` (Vitest's `--changed` flag) for the file modified; `pnpm typecheck` for any `.ts/.tsx` edit
- **Per wave merge:** `pnpm test && pnpm typecheck && pnpm lint` (≤ 30 seconds total once tests exist)
- **Phase gate (before `/gsd-verify-work`):** `pnpm test && pnpm typecheck && pnpm lint && pnpm build && grep -L 'fonts.googleapis.com\|fonts.gstatic.com' dist/**/*.{js,css,html}` (must produce zero matching files)

### Wave 0 Gaps
- [ ] `tests/setup.ts` — shared Vitest setup (if jest-dom matchers used)
- [ ] `tests/fixtures/v1-bundle.rshape.txt` — pre-captured from `/legacy/` (manual, one-time per `specifics` in CONTEXT.md)
- [ ] `tests/fixtures/v1-bundle.fixture.ts` — exports `{ ARMORED, PASSPHRASE, EXPECTED_PAYLOAD }`
- [ ] `tests/fixtures/v1-localstorage.fixture.ts` — exports serialised v1.0 localStorage blob
- [ ] `tests/fixtures/README.md` — fixture regeneration procedure
- [ ] `tests/App.smoke.test.tsx` — `<App />` smoke (jsdom)
- [ ] `tests/crypto.test.ts` — CORE-04
- [ ] `tests/storage.test.ts` — CORE-01, CORE-02, CORE-03, CORE-07, CORE-08
- [ ] `tests/i18n.test.ts` — CORE-06
- [ ] `tests/data.test.ts` — CORE-05
- [ ] `tests/theme-tokens.test.ts` — DESIGN-01
- [ ] `tests/animations.test.ts` — DESIGN-03 (grep `@keyframes`)
- [ ] `tests/DesignSystem.test.tsx` — DESIGN-05, DESIGN-06 (jsdom)
- [ ] `tests/shadcn-button.test.ts` — FOUND-03 (file-existence check)
- [ ] `tests/pwa-output.test.ts` — FOUND-04 (build-artifact check; gated on `dist/` existing)
- [ ] Framework install: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom`

*(In total: ~10 test files + 4 fixture artefacts. All authored fresh in Phase 1. The framework itself is installed at scaffold-time; tests are added incrementally as each ported module lands.)*

## Sequencing / Wave Hints for the Planner

This phase has a clear dependency graph. The planner should structure plans roughly as:

### Wave 0 — Scaffold (sequential, must come first)
1. **Scaffold**: `pnpm dlx shadcn@latest init -t vite` (one-command seed: Vite + React 19 + TS + Tailwind v4 + path aliases + components.json)
2. **Patch tsconfig**: Add D-15 strictness flags to `tsconfig.app.json`
3. **Patch ESLint**: Write `eslint.config.js` (flat config) with D-16 plugin set
4. **Patch Prettier**: `.prettierrc.json` with single-quote, no-semi (matches v1.0 style)
5. **Install runtime + dev deps**: `pnpm add react-router-dom zustand @fontsource-variable/dm-sans @fontsource-variable/playfair-display`; `pnpm add -D vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom jsdom`
6. **Configure `vite.config.ts`**: Add vite-plugin-pwa block (D-23 config); configure Vitest (or `vitest.config.ts`)
7. **Move legacy app**: Move v1.0's `index.html`, `js/`, `css/`, `sw.js`, `manifest.json`, `icons/` into `public/legacy/`. Also COPY (not move) `icons/*` into `public/icons/` for the new PWA manifest.
8. **Capture v1.0 fixture bundle**: Manual step per CONTEXT.md `specifics` — open `/legacy/`, create "Test Subject" profile (🌱, #7c83ff), one result with ≥ 3 enabledCategories + 2 custom items + 1 `__hidden` item, share with known passphrase, save armored text to `tests/fixtures/v1-bundle.rshape.txt`. Create `tests/fixtures/v1-bundle.fixture.ts` with `{ ARMORED, PASSPHRASE, EXPECTED_PAYLOAD }`. Create `tests/fixtures/v1-localstorage.fixture.ts` with the serialised localStorage blob from the same session.
9. **Write `tests/fixtures/README.md`**: Document the fixture regeneration procedure.

### Wave 1 — Parallel ports + design (4 parallel streams once Wave 0 lands)

**Stream A — TypeScript module ports (independent of streams B/C/D once tsconfig is set):**
- A1: `src/lib/crypto.ts` + `tests/crypto.test.ts` (CORE-04)
- A2: `src/lib/data.ts` + `tests/data.test.ts` (CORE-05)
- A3: `src/lib/i18n.ts` + `src/lib/i18n/en.ts` + `src/lib/i18n/de.ts` + `tests/i18n.test.ts` (CORE-06)
- A4: `src/store/types.ts` + `src/store/middleware.ts` + `src/store/index.ts` + `tests/storage.test.ts` (CORE-01, CORE-02, CORE-03, CORE-07, CORE-08)

**Stream B — Design tokens + fonts:**
- B1: `src/styles/theme.css` with `@theme` block + `[data-theme]` overrides + `prefers-color-scheme` auto mode (DESIGN-01)
- B2: `src/styles/fonts.css` (or `src/main.tsx` Fontsource imports) (DESIGN-02)
- B3: `tests/theme-tokens.test.ts` parity grep (DESIGN-01 verification)

**Stream C — Animations:**
- C1: `src/styles/animations.css` with 8 `@keyframes` + global `prefers-reduced-motion: reduce` block + per-keyframe disable overrides (DESIGN-03, DESIGN-04)
- C2: `tests/animations.test.ts` keyframe-name grep (DESIGN-03 verification)

**Stream D — Theme reactivity:**
- D1: `src/hooks/useTheme.ts` (read Zustand settings.theme, apply `data-theme` to `<html>`, react to changes) (DESIGN-05)
- D2: `src/components/ui/button.tsx` via `pnpm dlx shadcn@latest add button` (FOUND-03)

Streams A, B, C, D can run in parallel after Wave 0. Stream D depends on Stream A's `src/store/` landing. Stream A and Stream B/C/D are mutually independent.

### Wave 2 — App shell + design-system route + smoke test (depends on Wave 1)
1. **Router setup**: `src/main.tsx` + `src/App.tsx` with `createHashRouter([{ path: '/', element: <PlaceholderHome /> }, { path: '/design-system', element: <DesignSystem /> }])` + `<RouterProvider />` (D-02, D-03)
2. **Placeholder route**: `src/routes/PlaceholderHome.tsx` — minimal "Skeleton alive" view with Tailwind utility classes proving FOUND-02
3. **DesignSystem route**: `src/routes/DesignSystem.tsx` with five sections per D-27 (palette grid, type scale, animation gallery, surfaces, reduced-motion preview toggle)
4. **Theme toggle component**: Uses shadcn `Button` (D-28)
5. **Smoke test**: `tests/App.smoke.test.tsx` (`// @vitest-environment jsdom`)
6. **DesignSystem behavioural test**: `tests/DesignSystem.test.tsx` (jsdom) — verifies theme toggle applies `data-theme` attribute, language toggle changes `t()` output

### Wave 3 — Verification (depends on Wave 2)
1. Run full validation suite: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
2. Post-build grep: `! grep -r 'fonts.googleapis.com\|fonts.gstatic.com' dist/`
3. SW scope check: load `/` and `/legacy/` in browser, verify exactly one SW per scope in DevTools
4. Manual eyeball: `/design-system` route — verify 5 sections render; toggle `data-theme` between light/dark/auto and confirm reactive update; DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` → reload → verify all 8 animations freeze

### What MUST come first
- Vite scaffold (Wave 0.1) — everything else depends on a working `pnpm dev`
- tsconfig strictness (Wave 0.2) — must be in place before any `.ts` file is authored to catch type errors at write-time
- vite-plugin-pwa configuration (Wave 0.6) — needed before the SW scope verification at Wave 3
- Legacy move (Wave 0.7) — needed before fixture capture (Wave 0.8) since the fixture is captured by interacting with `/legacy/`
- Fixture capture (Wave 0.8) — gates the entire crypto and storage test suite

### What can parallel
- All four Stream-A module ports (crypto.ts, data.ts, i18n.ts, store) once tsconfig and the test framework are wired
- All three design streams (B, C, D) in parallel with Stream A — they don't share source files

### What is blocked on what
- `<DesignSystem />` route (Wave 2.3) → blocked on theme.css, animations.css, fonts.css, useTheme.ts (all of Wave 1 streams B + C + D)
- `<App />` smoke test (Wave 2.5) → blocked on router + routes (Wave 2.1, 2.2, 2.3)
- Final verification (Wave 3) → blocked on everything

## Sources

### Primary (HIGH confidence)
- **npm registry (verified via `npm view <pkg> version`, 2026-05-15):**
  vite 8.0.13, react 19.2.6, react-dom 19.2.6, typescript 6.0.3, react-router-dom 7.15.1, zustand 5.0.13, tailwindcss 4.3.0, @tailwindcss/vite 4.3.0, vite-plugin-pwa 1.3.0, vitest 4.1.6, @vitejs/plugin-react 6.0.2, @testing-library/react 16.3.2, @testing-library/jest-dom 6.9.1, jsdom 29.1.1, eslint 10.3.0, typescript-eslint 8.59.3, eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.5.2, prettier 3.8.3, shadcn 4.7.0, @fontsource-variable/dm-sans 5.2.8, @fontsource-variable/playfair-display 5.2.8
- **v1.0 source files (read directly, 2026-05-15):**
  `js/storage.js` (305 lines), `js/crypto.js` (136 lines), `js/data.js` (870 lines, sampled), `js/i18n.js` (847 lines, sampled — 304 EN keys, 304 DE keys), `css/style.css` `:root` block (42 unique CSS variables), `css/additions.css` (8 `@keyframes` at lines 828, 833, 873, 903, 933, 964, 1367, 1398), `index.html`, `sw.js`, `manifest.json`
- **Project planning documents (read directly, 2026-05-15):**
  `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/phases/01-skeleton/01-CONTEXT.md`, all of `.planning/codebase/*.md`
- **Official docs (WebFetch, 2026-05-15):**
  - [ui.shadcn.com/docs/installation/vite](https://ui.shadcn.com/docs/installation/vite) — shadcn-vite init flow
  - [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4) — Tailwind v4 + React 19 compatibility
  - [vitest.dev/guide/projects](https://vitest.dev/guide/projects) — `projects` config replacing `environmentMatchGlobs`
  - [fontsource.org/fonts/dm-sans](https://fontsource.org/fonts/dm-sans) — DM Sans variable axes (ital, opsz, wght)
  - [fontsource.org/fonts/playfair-display](https://fontsource.org/fonts/playfair-display) — Playfair Display variable axes (ital, wght)

### Secondary (MEDIUM confidence — WebSearch verified by linking to official sources)
- [Tailwind v4 blog post](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first `@theme` directive
- [React Router v7 createHashRouter API](https://reactrouter.com/api/data-routers/createHashRouter) — confirmed v7 supports `createHashRouter`
- [vitest.dev/guide/migration.html](https://vitest.dev/guide/migration.html) — `environmentMatchGlobs` removal in v4
- [Vite PWA guide](https://vite-pwa-org.netlify.app/guide/service-worker-precache) — vite-plugin-pwa Workbox configuration
- [Workbox `globIgnores` docs (Chrome for Developers)](https://developer.chrome.com/docs/workbox/modules/workbox-build) — Workbox glob exclusion
- [shadcn-ui/ui discussion #6714](https://github.com/shadcn-ui/ui/discussions/6714) — Tailwind v4 + React 19 status (non-breaking)

### Tertiary (LOW confidence — WebSearch only, would benefit from validation at execution time)
- None — all critical facts cross-verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — all versions verified against live npm registry; user decisions D-01..D-28 align with current ecosystem
- Architecture: **HIGH** — single-tier client PWA; no novel patterns; v1.0 contract is the source of truth and is fully read
- Pitfalls: **HIGH** — all 10 pitfalls verified against current docs (Tailwind v4 token naming, Vitest 4 `environmentMatchGlobs` removal, vite-plugin-pwa globIgnores syntax, SW scope semantics)
- Code examples: **HIGH** — all snippets traceable to either ported v1.0 source or cited upstream docs
- Sequencing: **HIGH** — derived directly from dependency graph; no guesswork

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (30 days — most of the stack is stable; only Vitest 4.x and shadcn CLI are evolving fast enough that re-verification before execution is worth a 5-minute `npm view` pass)
