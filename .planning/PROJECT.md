# Relationshape

## What This Is

A privacy-friendly Progressive Web App for mapping and sharing the shape of relationships across many dimensions (emotional intimacy, physical intimacy, romance, partnership, financial, domestic, etc.) — an app implementation of the [Relationshape](https://github.com/Relationshape/Relationshape-Pre-release-1) questionnaire from the world of relationship anarchy. All data lives in the user's browser; comparisons with others happen via end-to-end-encrypted bundles exchanged out of band.

## Core Value

**Your data never leaves your device.** Everything else — the questionnaire flow, the visualisations, the comparisons — exists to support honest self-reflection and conversation between people who choose to share with each other. If the privacy guarantee breaks, nothing else matters.

## Current Milestone: v2.0 React + Tailwind + shadcn/ui Migration

**Goal:** Port the existing vanilla-JS PWA to a React + Vite + TypeScript + Tailwind + shadcn/ui stack at full feature parity, preserving on-device data, the encrypted bundle format, and the Celestial Map aesthetic.

**Target features:**
- Modern, typed component architecture in place of the `viewX()` + `h()` imperative pattern
- Tailwind-based design system replacing the dual `style.css` + `additions.css` CSS files
- shadcn/ui primitives (Dialog, Slider, Toast, Tabs, Sheet, etc.) replacing hand-rolled equivalents
- Vite + `vite-plugin-pwa` build pipeline replacing the no-build setup
- Strict TypeScript domain model (Profile, Result, Import, Scale, AnswerCell) with backward-compatible localStorage migration
- Existing encrypted bundle format (magic, kdf, cipher envelope) read/write compatible — old shares must still decrypt; new shares must still decrypt in v1
- Full route, view, and interaction parity (questionnaire list + single modes, spider/bar/alignment charts, share/import/compare, settings, wizard, age gate)
- EN/DE translations preserved
- PWA installable + offline capable (same standard as v1.0)

## Requirements

### Validated

<!-- Shipped in v1.0 (vanilla JS). Functional baseline that v2.0 must preserve. -->

- ✓ Multi-profile model on one device — v1.0
- ✓ 30-category questionnaire with 7-step scale (No → Need), G/R/Both notation, notes, custom items, hidden items — v1.0
- ✓ List mode + single-card swipe mode for answering — v1.0
- ✓ Per-result custom scale override — v1.0
- ✓ Auto-save every answer to `localStorage["relationshape.v1"]` — v1.0
- ✓ AES-GCM 256 + PBKDF2 250 000 iter end-to-end-encrypted share bundles, PEM-style ASCII armor — v1.0
- ✓ Import received bundles into a separate imports pool (never mixed with own results) — v1.0
- ✓ Spider chart (overview + per-category), bar diff per category, alignment heat strip (up to 4 datasets) — v1.0
- ✓ EN/DE i18n with `navigator.language` auto-detection — v1.0
- ✓ Dark / light / auto theme — v1.0
- ✓ PWA install + offline (service worker, cache-first) — v1.0
- ✓ Onboarding wizard + age gate — v1.0
- ✓ Settings: global scale editor, per-map settings, backup export/restore — v1.0

### Active

<!-- Current scope for v2.0. -->

- [ ] **FOUND** Toolchain & scaffolding migration (Vite + React + TS + Tailwind + shadcn/ui + PWA plugin)
- [ ] **CORE** Domain logic ported to TypeScript (storage, crypto, data schema, i18n)
- [ ] **DESIGN** Tailwind design system reproducing Celestial Map aesthetic
- [ ] **SHELL** React app shell — routing, navigation, layout, theme & language providers
- [ ] **PROFILE** Profile lifecycle views (welcome, home, profile CRUD, intro, wizard, age gate)
- [ ] **QUEST** Questionnaire flow (category overview, list mode, single-card swipe mode)
- [ ] **RESULT** Result view + chart components (spider, item-spider, bars, alignment)
- [ ] **SHARE** Share / Import / Compare flows with backward-compatible bundle format
- [ ] **SETTINGS** Settings, map settings, dialog/toast system
- [ ] **PWA** PWA, data migration, parity verification, legacy retirement

### Out of Scope

- Backend / server / accounts — would break the core privacy guarantee
- Analytics / telemetry — same
- Real-time collaboration — out of scope by privacy model; sharing remains async via bundles
- Native mobile app — PWA already installs on iOS/Android home screen
- Migrating questionnaire content / categories themselves — content is CC BY-NC 4.0 and tracked upstream; v2.0 is a *stack* migration
- Adding new features beyond v1.0 parity — defer to v2.1+
- Replacing the hand-built SVG charts with a charting library — bespoke shape matters for the Celestial Map aesthetic; ports as React components instead

## Context

**Codebase origin:** v1.0 is a no-build vanilla ES-modules PWA (~3 500 lines `js/app.js` monolith, `js/storage.js`, `js/crypto.js`, `js/data.js`, `js/i18n.js`, `js/charts.js`, two CSS files). Fully mapped in `.planning/codebase/`.

**Visual language:** "Celestial Map" — dark default with iridescent gradients, hero blobs, silk-shimmer animations on cards/buttons, glass surfaces, DM Sans + Playfair Display. Eight `@keyframes` animations run sitewide (motion-reduced fallback is largely unimplemented — opportunity to fix during migration).

**Known tech debt to leave behind during the migration:**
- `js/app.js` is a 3 500-line monolith — extraction into components is built into the migration
- `style.css` and `additions.css` have 31 overlapping selectors — consolidating into a Tailwind config is built into the migration
- `Store.save()` swallows quota errors silently — surface as a toast in v2.0
- `prefers-reduced-motion` only guards one animation in v1.0 — guard all animations in v2.0
- No automated tests around crypto round-trip / scale migration / armor parsing — v2.0 should add at least a smoke test suite (Vitest)

**External dependency:** Google Fonts CDN at runtime — privacy claim is technically inaccurate. v2.0 should self-host the two font families and remove the external link.

**Data shape constraint:** `localStorage["relationshape.v1"]` JSON blob and `data.imports[]` / `data.results[]` shapes are pinned by users' existing data. Migration must read v1.0 data without loss.

**Bundle format constraint:** `{ magic, v: "v1", kdf: { name, hash, iters, salt }, cipher: { name, iv }, data }` with PEM-style ASCII armor (`-----BEGIN RELATIONSHAPE-----` / `-----END RELATIONSHAPE-----`). v2.0 must read v1 bundles and produce v1-compatible bundles.

## Constraints

- **Tech stack**: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + vite-plugin-pwa — Modern, typed, low-churn stack with components co-located in the repo
- **Privacy**: No network calls after first load — Core value. Service worker must cache shell; self-host fonts; no analytics
- **Browser only**: No Node.js runtime in production — PWA stays purely client-side
- **Data compatibility**: Read & write `localStorage["relationshape.v1"]` and v1 bundle format unchanged — Users must not lose data across the cutover
- **Build artefacts**: Static deployable bundle (Vite default) — Must run on any static host (GitHub Pages, Netlify, Cloudflare Pages)
- **Performance**: ≤ ~250 KB initial JS (gzip) — Matches current v1.0 payload after SW caching
- **i18n parity**: EN + DE strings preserved key-for-key — Existing users must see no English fallbacks
- **Accessibility**: Respect `prefers-reduced-motion` and `prefers-color-scheme` — Improves on v1.0; required for accessibility audit
- **Licence**: App code MIT, questionnaire content CC BY-NC 4.0 — Unchanged from v1.0

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React 19 + Vite + TypeScript over Next.js / Remix | App is a single-page client-only PWA with zero SSR/RSC needs — Vite is the simplest fit | — Pending |
| shadcn/ui over Ant Design | Components live in the repo (no vendored theme to fight); native Tailwind; preserves the bespoke Celestial Map aesthetic | — Pending |
| Tailwind CSS v4 over CSS-modules / styled-components | Single design-token surface in a config file; replaces the dual style.css/additions.css cascade problem | — Pending |
| `vite-plugin-pwa` (Workbox) over hand-rolled service worker | Generates the asset list automatically, eliminates the "forgot to bump CACHE name" failure mode | — Pending |
| Greenfield rewrite alongside legacy code, single cutover | Migration scope is total — strangler pattern adds routing complexity without payoff for a personal-data PWA | — Pending |
| Preserve `localStorage["relationshape.v1"]` key and bundle format unchanged | Zero-friction upgrade for existing users; old shared bundles must still decrypt | — Pending |
| Self-host DM Sans + Playfair Display | Closes the only remaining external-network gap and satisfies the privacy claim literally | — Pending |
| TanStack Router or React Router v7 (TBD in FOUND phase) | Hash-routing remains an option for static hosts; decide during scaffolding | — Pending |
| Vitest + Testing Library for new test coverage | Vite-native, fast, minimal config; covers crypto round-trip and scale migration | — Pending |
| Migrate charts as React components (not a charting library) | Bespoke SVG shapes are part of the visual identity | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-15 after bootstrap for milestone v2.0*
