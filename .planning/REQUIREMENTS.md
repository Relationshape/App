# Requirements: Relationshape v2.0 — React Migration

**Defined:** 2026-05-15
**Core Value:** Your data never leaves your device — preserved across the stack migration.

## v2.0 Requirements

Each requirement maps to one roadmap phase (filled in during roadmap creation). Every v1.0 capability must reach parity in v2.0 unless explicitly moved to Out of Scope.

### Foundation (FOUND)

Toolchain, scaffolding, and build pipeline so subsequent work has a working app skeleton.

- [ ] **FOUND-01**: Vite + React 19 + TypeScript project scaffolded at the repository root, coexisting with legacy `js/` and `css/` during the migration
- [ ] **FOUND-02**: Tailwind CSS v4 configured with PostCSS / Vite plugin and a `tailwind.config.ts` ready to absorb design tokens
- [ ] **FOUND-03**: shadcn/ui initialised via `npx shadcn@latest init` with the project's path aliases, base theme, and component target directory
- [ ] **FOUND-04**: `vite-plugin-pwa` configured (auto-update, Workbox precache of build output, offline fallback to `index.html`)
- [ ] **FOUND-05**: ESLint + Prettier + a `typecheck` script wired into `package.json`; CI-friendly `npm run build` and `npm run test` scripts present
- [ ] **FOUND-06**: Vitest + Testing Library installed and a smoke test (`<App />` renders without crashing) passes
- [ ] **FOUND-07**: Root-level `dev` command starts the Vite dev server and serves a placeholder React route at `/` while preserving the legacy app at `/legacy/` for cross-checking during migration

### Core Logic Port (CORE)

Pure (non-UI) modules ported to TypeScript with backward-compatible runtime behaviour.

- [ ] **CORE-01**: `Store` ported to a TypeScript module exposing the same methods (`getProfile`, `createProfile`, `saveResult`, `getResult`, `saveImport`, `replaceAll`, `setTheme`, `setLang`, etc.) with explicit `Profile`, `Result`, `Import`, `Scale`, `Settings` types
- [ ] **CORE-02**: `Store.save()` wraps `localStorage.setItem` in `try/catch` and surfaces `QuotaExceededError` as a typed result the UI can show as a toast — fixing the silent-data-loss bug from v1.0
- [ ] **CORE-03**: An optional in-memory cache invalidated on writes eliminates the per-call `JSON.parse(localStorage.getItem(...))` cost (v1.0 anti-pattern noted in `.planning/codebase/CONCERNS.md`)
- [ ] **CORE-04**: `encryptResult` and `decryptResult` ported with byte-for-byte compatibility (AES-GCM 256, PBKDF2 SHA-256 × 250 000, 16-byte salt, 12-byte IV, PEM-style armor); a Vitest round-trip test asserts compatibility with at least one v1.0-produced fixture bundle
- [ ] **CORE-05**: `CATEGORIES`, `DEFAULT_SCALE`, `SPIDER_AXES`, `CATEGORY_GROUPS`, `FILE_FORMAT` ported to a typed `data.ts` with no content changes
- [ ] **CORE-06**: `t()` and language detection ported via `react-i18next` (or equivalent) with EN + DE message catalogues exported from `js/i18n.js` key-for-key; `getLocalizedDefaultScale` preserved
- [ ] **CORE-07**: `migrateScale`, custom-items handling, and `__hidden` items semantics preserved end-to-end (Vitest covers at least the migration path)
- [ ] **CORE-08**: Loading the new app against a `localStorage["relationshape.v1"]` blob produced by v1.0 yields identical in-memory state (verified with a fixture)

### Design System (DESIGN)

Visual parity for the Celestial Map aesthetic, expressed as Tailwind tokens and shadcn theme.

- [ ] **DESIGN-01**: Design tokens from `:root` in `style.css` (`--bg`, `--surface`, `--primary`, `--accent`, `--glass`, `--glow`, radii, shadows) modelled as Tailwind theme extensions; light & dark variants resolved via CSS variables under `data-theme`
- [ ] **DESIGN-02**: DM Sans and Playfair Display **self-hosted** in `public/fonts/` and referenced via `@font-face`; no Google Fonts CDN link remains in the production bundle
- [ ] **DESIGN-03**: All eight `@keyframes` animations from `additions.css` (`heroBlobPulse`, `holoOrbDrift`, `holoBtnSpin`, `holoIconSpin`, `holoUnderlineSlide`, `iridShift`, `bgPulse`, `silkShift`) reproduced as Tailwind utilities or component styles
- [ ] **DESIGN-04**: All non-essential animations are guarded by `@media (prefers-reduced-motion: reduce)` and disabled or simplified there
- [ ] **DESIGN-05**: Theme toggle (`auto` / `light` / `dark`) applies `data-theme` to `<html>` and persists via `Store.setTheme` — same UX as v1.0
- [ ] **DESIGN-06**: A `<DesignSystem />` reference route renders the colour, typography, and animation scale so the team can eyeball parity against v1.0

### App Shell (SHELL)

- [ ] **SHELL-01**: Client-side routing covers every v1.0 hash route: `/`, `/welcome`, `/profile/:id`, `/profile/:id/edit`, `/profile/new`, `/q/:profileId/:resultId`, `/q-categories/:profileId/:resultId`, `/result/:id`, `/result/:id/:catId`, `/share/:id`, `/import`, `/compare?ids=…`, `/settings`, `/map/:id/settings`, `/intro`, `/about`
- [ ] **SHELL-02**: Existing v1.0 deep links continue to resolve — either by keeping hash routing or by adding a hash→path redirect shim
- [ ] **SHELL-03**: Persistent global navigation component (`<Nav />`) replaces `bindGlobalNav` — profile picker, imports link, compare link, settings, theme toggle, language picker
- [ ] **SHELL-04**: A typed `ThemeProvider` and `I18nProvider` wrap the app; theme and language are reactive across the tree without manual re-renders
- [ ] **SHELL-05**: A scroll-to-top + active-link behaviour matches the v1.0 `route()` flow
- [ ] **SHELL-06**: Toast (`useToast` / shadcn `Sonner`) and `<Dialog />` primitives in place — replacing `showToast`, `dlgAlert`, `dlgConfirm`, and the bespoke `dialog({...})` system

### Profile Lifecycle (PROFILE)

- [ ] **PROFILE-01**: Home view lists profiles + imports with the same cards, deletion, and create-profile affordance as v1.0
- [ ] **PROFILE-02**: Welcome view renders the hero, feature highlights, "Try it now" CTA, and how-to scroll section at parity with v1.0
- [ ] **PROFILE-03**: Profile create / edit form (name, pronouns, emoji + emoji picker, accent colour from PALETTE, optional notes) saves through `Store.createProfile` / `Store.updateProfile`
- [ ] **PROFILE-04**: Profile detail view lists the profile's results with create-result, open-result, share, delete actions
- [ ] **PROFILE-05**: First-visit onboarding wizard (steps from `buildWizardSteps`) ports including swipe / arrow-key navigation and skip behaviour
- [ ] **PROFILE-06**: Age-gate dialog blocks the app for under-18 users on first visit; result persists via `Store`
- [ ] **PROFILE-07**: Intro / About page reproduces the v1.0 content (story, credits, licence, privacy explainer) with EN + DE strings

### Questionnaire (QUEST)

- [ ] **QUEST-01**: Category overview screen lets the user toggle categories on/off, opens questionnaire on confirm, preserves `enabledCategories` per result
- [ ] **QUEST-02**: List-mode questionnaire renders all enabled categories with answer rows, G/R/Both toggles, optional notes, custom-item add/edit/delete, hidden-item handling
- [ ] **QUEST-03**: Single-card / swipe-mode questionnaire flips one item at a time with touch swipe + arrow-key support; respects `(pointer: coarse)` like v1.0
- [ ] **QUEST-04**: Scale picker (snap-dots) presents the active scale steps with correct colours and labels; tapping a step saves the answer
- [ ] **QUEST-05**: Every answer change persists to `localStorage` via `Store.saveResult`; UI shows save confirmation per v1.0 patterns
- [ ] **QUEST-06**: Deep-link to a specific category (`#/result/:id/:catId`) opens the spider chart focused on that category
- [ ] **QUEST-07**: "Always-visible save button" and "tab-switch prompt" behaviours from v1.0 are preserved
- [ ] **QUEST-08**: German gendered translations (`*innen` / `*r` forms) preserved per the v1.0 i18n keys

### Results & Charts (RESULT)

- [ ] **RESULT-01**: Result view header (subject emoji, colour, profile context, date, edit/share/delete actions) at parity
- [ ] **RESULT-02**: Overview spider chart with up to 4 datasets, dynamic axis labels, hover/touch interactivity (`bindSpiderInteractivity` equivalent) — ported as a React component
- [ ] **RESULT-03**: Per-category bar diff component renders item-level marks for the active category(ies)
- [ ] **RESULT-04**: Item-level spider chart for a single category renders correctly
- [ ] **RESULT-05**: Alignment heat strip across all categories renders top matches and biggest gaps for two profiles
- [ ] **RESULT-06**: Enlarged spider chart modal (from `additions.css`) reopens at higher resolution on tap
- [ ] **RESULT-07**: All chart SVG output passes a basic XSS escape audit — user-supplied labels are escaped before insertion

### Share / Import / Compare (SHARE)

- [ ] **SHARE-01**: Share view encrypts a result + profile metadata with a user-supplied passphrase and renders armored output in a textarea with copy-to-clipboard
- [ ] **SHARE-02**: Share view offers a `.rshape.txt` download with the armored bundle
- [ ] **SHARE-03**: Import view accepts pasted text OR uploaded file, decrypts with the passphrase, and saves the result to the `imports` pool
- [ ] **SHARE-04**: Importing a v1.0 bundle produces the same `Import` object shape as v1.0 (regression-tested with a fixture bundle from v1.0)
- [ ] **SHARE-05**: Compare view accepts mixed own-result + import IDs via the URL, renders spider + alignment + bar comparison, supports up to 4 datasets
- [ ] **SHARE-06**: Backup export (full `relationshape.v1` JSON download) and restore-from-backup (`Store.replaceAll`) flows at parity

### Settings (SETTINGS)

- [ ] **SETTINGS-01**: Global Settings view edits the default scale (add/edit/delete/reorder steps), persists via `Store.setScale`
- [ ] **SETTINGS-02**: Theme picker (`auto` / `light` / `dark`) and language picker (`en` / `de`) accessible from Settings and from the nav
- [ ] **SETTINGS-03**: Per-map (per-result) settings: subject label + emoji + colour, scale override, enabled categories — saves through `Store.saveResult`
- [ ] **SETTINGS-04**: Data management section: export backup, import backup, clear all data (with confirmation dialog)
- [ ] **SETTINGS-05**: Dialog & toast primitives meet shadcn accessibility expectations (focus trap, ESC dismiss, ARIA roles)

### PWA & Migration (PWA)

- [ ] **PWA-01**: `manifest.json` (or `manifest.webmanifest` generated by vite-plugin-pwa) declares `standalone`, portrait, SVG icons at 192×192 and 512×512 — equivalent to v1.0
- [ ] **PWA-02**: Service worker (generated by Workbox via vite-plugin-pwa) precaches the build output and falls back to `index.html` for offline navigation
- [ ] **PWA-03**: Installing the PWA on a v1.0-installed browser preserves the existing `localStorage["relationshape.v1"]` data and the app loads with the user's history intact
- [ ] **PWA-04**: A v1.0-produced encrypted bundle decrypts in v2.0 (fixture-driven regression test)
- [ ] **PWA-05**: A v2.0-produced encrypted bundle decrypts in v1.0 (manual verification documented; no regression in bundle format)
- [ ] **PWA-06**: Lighthouse PWA audit on the production build passes (installable, offline, manifest valid)
- [ ] **PWA-07**: Legacy `js/`, `css/`, and `sw.js` files removed from the repository after parity verification; root `index.html` is now the Vite entry
- [ ] **PWA-08**: Deploy preview (Cloudflare Pages / GitHub Pages / Netlify — whichever is current) serves the built `dist/` output and a smoke walkthrough (create profile → answer → share → import → compare) succeeds

## v2.1+ Requirements (Deferred)

Acknowledged but not in this milestone.

### Quality / Hardening

- **QUAL-01**: Broader Vitest unit coverage for storage edge cases, scale migration paths, armor parsing variants
- **QUAL-02**: Playwright end-to-end tests covering the golden user journey
- **QUAL-03**: Bundle-size budget enforcement in CI (size-limit or similar)

### Features Beyond Parity

- **FEAT-01**: New questionnaire categories / variants (gated by upstream Relationshape release)
- **FEAT-02**: Per-profile colour themes / cover images
- **FEAT-03**: More languages beyond EN + DE
- **FEAT-04**: Richer compare visualisations (timeline, conflict heatmap)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend / server / accounts | Breaks the core privacy guarantee — explicitly excluded |
| Analytics / telemetry | Same |
| Real-time collaboration | Privacy model requires async, encrypted bundles |
| Native mobile apps | PWA already covers home-screen install on iOS / Android |
| Migrating questionnaire content itself | Tracked upstream under CC BY-NC 4.0 — this milestone is a stack migration only |
| Replacing SVG charts with a charting library | Bespoke Celestial Map shapes are part of the visual identity |
| Server-side rendering (Next.js / Remix) | App is single-user client-only; SSR adds infra without value |
| New features beyond v1.0 parity | Defer to v2.1+ to keep the migration scoped and reviewable |
| OAuth / SSO | No accounts; passphrase-protected sharing covers the use case |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | TBD | Pending |
| FOUND-02 | TBD | Pending |
| FOUND-03 | TBD | Pending |
| FOUND-04 | TBD | Pending |
| FOUND-05 | TBD | Pending |
| FOUND-06 | TBD | Pending |
| FOUND-07 | TBD | Pending |
| CORE-01 | TBD | Pending |
| CORE-02 | TBD | Pending |
| CORE-03 | TBD | Pending |
| CORE-04 | TBD | Pending |
| CORE-05 | TBD | Pending |
| CORE-06 | TBD | Pending |
| CORE-07 | TBD | Pending |
| CORE-08 | TBD | Pending |
| DESIGN-01 | TBD | Pending |
| DESIGN-02 | TBD | Pending |
| DESIGN-03 | TBD | Pending |
| DESIGN-04 | TBD | Pending |
| DESIGN-05 | TBD | Pending |
| DESIGN-06 | TBD | Pending |
| SHELL-01 | TBD | Pending |
| SHELL-02 | TBD | Pending |
| SHELL-03 | TBD | Pending |
| SHELL-04 | TBD | Pending |
| SHELL-05 | TBD | Pending |
| SHELL-06 | TBD | Pending |
| PROFILE-01 | TBD | Pending |
| PROFILE-02 | TBD | Pending |
| PROFILE-03 | TBD | Pending |
| PROFILE-04 | TBD | Pending |
| PROFILE-05 | TBD | Pending |
| PROFILE-06 | TBD | Pending |
| PROFILE-07 | TBD | Pending |
| QUEST-01 | TBD | Pending |
| QUEST-02 | TBD | Pending |
| QUEST-03 | TBD | Pending |
| QUEST-04 | TBD | Pending |
| QUEST-05 | TBD | Pending |
| QUEST-06 | TBD | Pending |
| QUEST-07 | TBD | Pending |
| QUEST-08 | TBD | Pending |
| RESULT-01 | TBD | Pending |
| RESULT-02 | TBD | Pending |
| RESULT-03 | TBD | Pending |
| RESULT-04 | TBD | Pending |
| RESULT-05 | TBD | Pending |
| RESULT-06 | TBD | Pending |
| RESULT-07 | TBD | Pending |
| SHARE-01 | TBD | Pending |
| SHARE-02 | TBD | Pending |
| SHARE-03 | TBD | Pending |
| SHARE-04 | TBD | Pending |
| SHARE-05 | TBD | Pending |
| SHARE-06 | TBD | Pending |
| SETTINGS-01 | TBD | Pending |
| SETTINGS-02 | TBD | Pending |
| SETTINGS-03 | TBD | Pending |
| SETTINGS-04 | TBD | Pending |
| SETTINGS-05 | TBD | Pending |
| PWA-01 | TBD | Pending |
| PWA-02 | TBD | Pending |
| PWA-03 | TBD | Pending |
| PWA-04 | TBD | Pending |
| PWA-05 | TBD | Pending |
| PWA-06 | TBD | Pending |
| PWA-07 | TBD | Pending |
| PWA-08 | TBD | Pending |

**Coverage:**
- v2.0 requirements: 60 total
- Mapped to phases: 0 (filled by roadmapper)
- Unmapped: 60 (expected before roadmap)

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after initial definition*
