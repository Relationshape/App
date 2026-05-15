# Roadmap: Relationshape v2.0 — React + Tailwind + shadcn/ui Migration

## Overview

Port the existing vanilla-JS PWA to a React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + vite-plugin-pwa stack at full feature parity. The migration is a greenfield rewrite alongside the legacy code with a single cutover at the end: the existing `js/`, `css/`, and `sw.js` continue to serve real users until Phase 10 confirms feature parity, decrypts a v1.0 bundle, and Lighthouse PWA passes — then the legacy files are removed in the same phase. Phases proceed bottom-up: toolchain first, then pure typed core modules, then the design system, then the app shell, then five feature phases each tied to a v1.0 view family, then a settings phase, then PWA verification + legacy retirement.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Vite + React 19 + TS + Tailwind v4 + shadcn + PWA plugin scaffolded, tests + linters wired, legacy app preserved at `/legacy/`
- [ ] **Phase 2: Core Logic Port** - Pure TypeScript modules for Store, crypto, data schema, and i18n with backward-compatible runtime and fixture-driven tests
- [ ] **Phase 3: Design System** - Celestial Map design tokens, self-hosted fonts, 8 keyframe animations, reduced-motion guards, theme + reference route
- [ ] **Phase 4: App Shell** - Router covering every v1.0 hash route, providers, persistent nav, toast + dialog primitives, hash-deep-link compatibility
- [ ] **Phase 5: Profile Lifecycle** - Welcome, home, profile CRUD, intro, onboarding wizard, and age-gate views at v1.0 parity
- [ ] **Phase 6: Questionnaire** - Category overview, list-mode and single-card swipe-mode answer flows with per-keystroke persistence and deep-link to category
- [ ] **Phase 7: Results & Charts** - Spider, item-spider, bar diff, and alignment chart React components with hover/touch interactivity and enlarged modal
- [ ] **Phase 8: Share / Import / Compare** - Encrypted bundle export (textarea + download), import (paste + upload), and multi-dataset compare view
- [ ] **Phase 9: Settings** - Global scale editor, theme + language pickers, per-map settings, data management (backup export / import / clear), accessible dialogs
- [ ] **Phase 10: PWA, Parity & Cutover** - Manifest, Workbox precache, install + offline verified, v1↔v2 bundle compatibility proven, Lighthouse passes, legacy files removed, deploy preview smoke-walked

## Phase Details

### Phase 1: Foundation
**Goal**: Stand up the modern toolchain (Vite + React 19 + TS + Tailwind v4 + shadcn/ui + vite-plugin-pwa + Vitest) alongside the existing app so all later phases have a working, typed, testable skeleton.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts Vite and serves a React placeholder route at `/`, while the legacy vanilla-JS app still loads at `/legacy/`.
  2. `npm run build` produces a `dist/` directory; `npm run test` runs Vitest with a passing `<App />` smoke render; `npm run typecheck` and `npm run lint` both exit clean.
  3. `tailwind.config.ts` is present with PostCSS / Vite plugin wired in; a sample utility class applies to the placeholder route.
  4. `shadcn` has been initialised with the project's path aliases and a base theme; adding a `Button` via `npx shadcn@latest add` succeeds.
  5. `vite-plugin-pwa` is configured for auto-update with Workbox precache of the build output and an offline fallback to `index.html`.
**Plans**: TBD

### Phase 2: Core Logic Port
**Goal**: Port every pure (non-UI) v1.0 module — `Store`, `crypto`, `data`, `i18n` — to TypeScript with explicit types and backward-compatible runtime behaviour, including the silent-data-loss bug fix from CONCERNS.md.
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08
**Success Criteria** (what must be TRUE):
  1. A Vitest suite proves that an encrypted bundle produced by v1.0 (fixture under `tests/fixtures/`) round-trips through the new `decryptResult` / `encryptResult` with byte-for-byte parity (AES-GCM 256, PBKDF2 SHA-256 × 250 000, 16-byte salt, 12-byte IV, PEM-style armor).
  2. Loading the new app against a `localStorage["relationshape.v1"]` blob produced by v1.0 yields the same in-memory `Profile[]`, `Result[]`, `Import[]`, `Scale`, and `Settings` (asserted by Vitest fixture).
  3. `Store.save()` catches `QuotaExceededError` and returns a typed result that the UI can surface as a toast — no more silent overflow.
  4. `migrateScale`, custom-items handling, and `__hidden` items semantics are covered by Vitest and produce identical outputs to v1.0 for every fixture.
  5. `t()` resolves every EN and DE key from v1.0's `js/i18n.js` (key-for-key coverage); `getLocalizedDefaultScale()` returns the German scale for `de` and the English default otherwise.
**Plans**: TBD

### Phase 3: Design System
**Goal**: Reproduce the Celestial Map aesthetic as a Tailwind theme + self-hosted fonts + reduced-motion-guarded animation set, exposed via a `<DesignSystem />` reference route for eyeball parity against v1.0.
**Depends on**: Phase 1
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06
**Success Criteria** (what must be TRUE):
  1. Every `:root` token from `css/style.css` (`--bg`, `--surface`, `--primary`, `--accent`, `--glass`, `--glow`, radii, shadows) is expressed in `tailwind.config.ts`; light and dark variants resolve through `data-theme` on `<html>`.
  2. Production build contains no `fonts.googleapis.com` / `fonts.gstatic.com` references — DM Sans and Playfair Display load from `public/fonts/` via `@font-face`.
  3. All eight `@keyframes` from `additions.css` (`heroBlobPulse`, `holoOrbDrift`, `holoBtnSpin`, `holoIconSpin`, `holoUnderlineSlide`, `iridShift`, `bgPulse`, `silkShift`) are reproducible as Tailwind utilities or component styles and side-by-side match the v1.0 reference.
  4. With `prefers-reduced-motion: reduce` set in DevTools, every non-essential animation stops or simplifies; the design-system reference page confirms this.
  5. A `/design-system` route renders the colour, typography, and animation scale — designers can flip between auto / light / dark via the theme toggle and the change is reactive across the tree.
**Plans**: TBD

### Phase 4: App Shell
**Goal**: Build the React app shell — typed providers, persistent nav, full route table, hash-deep-link compatibility, and shadcn-based toast + dialog primitives — so feature phases can mount views into a working chrome.
**Depends on**: Phase 2, Phase 3
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06
**Success Criteria** (what must be TRUE):
  1. Every v1.0 hash route (`#/`, `#/welcome`, `#/profile/:id`, `#/profile/:id/edit`, `#/profile/new`, `#/q/:profileId/:resultId`, `#/q-categories/:profileId/:resultId`, `#/result/:id`, `#/result/:id/:catId`, `#/share/:id`, `#/import`, `#/compare`, `#/settings`, `#/map/:id/settings`, `#/intro`, `#/about`) resolves to a route handler in the new app — either via hash routing or a hash→path redirect shim — without 404s.
  2. A persistent `<Nav />` renders profile picker, imports link, compare link, settings, theme toggle, and language picker; navigating updates the active-link state and scrolls to top.
  3. `ThemeProvider` and `I18nProvider` wrap the app: flipping theme or language anywhere updates every consumer without manual re-renders.
  4. `useToast` (shadcn Sonner) and a typed `<Dialog />` replace `showToast`, `dlgAlert`, `dlgConfirm`, and the bespoke `dialog({...})` system — calling them from any component produces a working transient toast / modal.
  5. A pasted v1.0 deep link such as `https://app/#/result/abc/intimacy` opens the v2.0 result view on the correct category without an extra redirect.
**UI hint**: yes
**Plans**: TBD

### Phase 5: Profile Lifecycle
**Goal**: Ship the welcome, home, profile CRUD, intro, onboarding wizard, and age-gate views as React components with full v1.0 parity and EN/DE strings.
**Depends on**: Phase 4
**Requirements**: PROFILE-01, PROFILE-02, PROFILE-03, PROFILE-04, PROFILE-05, PROFILE-06, PROFILE-07
**Success Criteria** (what must be TRUE):
  1. A first-time visitor sees the welcome view with hero, feature highlights, "Try it now" CTA, and how-to scroll section at parity with v1.0 in both EN and DE.
  2. The user can create, edit, and delete a profile (name, pronouns, emoji + emoji picker, accent colour from PALETTE, optional notes) and the change persists across reload via `Store.createProfile` / `updateProfile` / `deleteProfile`.
  3. Home lists existing profiles and imports with the same cards, deletion affordance, and create-profile button as v1.0; tapping a profile opens the profile detail view with its results.
  4. The first-visit onboarding wizard (steps from `buildWizardSteps`) responds to touch swipe and arrow-key navigation, supports skip, and never re-shows after completion.
  5. The age-gate dialog blocks app usage on first visit for under-18 selection; the user's answer persists via `Store` and the gate does not re-prompt on next load.
**UI hint**: yes
**Plans**: TBD

### Phase 6: Questionnaire
**Goal**: Ship the category overview + list-mode + single-card swipe-mode questionnaire flows with per-keystroke persistence, custom + hidden items, scale picker, and deep-link to a focused category.
**Depends on**: Phase 5
**Requirements**: QUEST-01, QUEST-02, QUEST-03, QUEST-04, QUEST-05, QUEST-06, QUEST-07, QUEST-08
**Success Criteria** (what must be TRUE):
  1. The user can toggle categories on/off in the category overview screen and confirming opens the questionnaire with the selected `enabledCategories` persisted on the result.
  2. List-mode renders every enabled category as answer rows with G/R/Both toggles, optional notes, and the user can add, edit, delete, and hide custom items — all changes save instantly to `localStorage`.
  3. Single-card / swipe-mode flips one item at a time and responds to both touch swipe and arrow keys on `(pointer: coarse)` and `(pointer: fine)` devices respectively, matching v1.0 behaviour.
  4. The scale picker (snap-dots) renders the active scale steps with correct colours and labels; tapping a step saves the answer through `Store.saveResult` and reflects the choice immediately.
  5. Navigating to `#/result/:id/:catId` from outside the questionnaire opens the corresponding spider chart focused on that category; the "always-visible save button" and "tab-switch prompt" behaviours from v1.0 are preserved; German gendered translations (`*innen` / `*r`) render correctly in `de`.
**UI hint**: yes
**Plans**: TBD

### Phase 7: Results & Charts
**Goal**: Port the SVG chart family (spider, item-spider, bar diff, alignment heat strip, enlarged modal) to React components with hover/touch interactivity, XSS-safe label handling, and up-to-4-dataset support.
**Depends on**: Phase 6
**Requirements**: RESULT-01, RESULT-02, RESULT-03, RESULT-04, RESULT-05, RESULT-06, RESULT-07
**Success Criteria** (what must be TRUE):
  1. The result view header renders subject emoji, colour, profile context, date, and edit / share / delete actions at visual parity with v1.0.
  2. The overview spider chart accepts up to 4 datasets, draws dynamic axis labels, and responds to hover (desktop) and touch (mobile) — selecting an axis surfaces the per-category breakdown, matching `bindSpiderInteractivity`.
  3. The per-category bar diff, the item-level spider chart for a single category, and the alignment heat strip (top matches + biggest gaps) all render correctly side-by-side for two profiles.
  4. Tapping the spider chart opens the enlarged modal at higher resolution; closing returns focus to the trigger.
  5. A user-supplied label containing `<script>` or quote characters is escaped before insertion into any chart SVG — a Vitest snapshot covers the escape path.
**UI hint**: yes
**Plans**: TBD

### Phase 8: Share / Import / Compare
**Goal**: Ship the encrypted-bundle share view, paste/upload import view, and multi-dataset compare view — preserving the v1.0 bundle format end-to-end.
**Depends on**: Phase 7
**Requirements**: SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05, SHARE-06
**Success Criteria** (what must be TRUE):
  1. The share view encrypts a result + profile metadata with a user-supplied passphrase and renders the armored output in a textarea with a working copy-to-clipboard button.
  2. The share view offers a `.rshape.txt` download of the armored bundle and the downloaded file decrypts identically to the textarea content.
  3. The import view accepts pasted text or an uploaded file, decrypts with a passphrase, and saves the result to the `imports` pool — never mixed with own results.
  4. A v1.0-produced fixture bundle imports cleanly and the resulting `Import` object shape matches v1.0 exactly (Vitest regression).
  5. The compare view accepts mixed own-result + import IDs in the URL and renders spider + alignment + bar comparison for up to 4 datasets; backup export / restore (`Store.replaceAll`) round-trips a full data snapshot without loss.
**UI hint**: yes
**Plans**: TBD

### Phase 9: Settings
**Goal**: Ship Global Settings (default scale editor), per-map Settings (subject + scale override + enabled categories), theme + language pickers, data management (backup / restore / clear), and a fully accessible dialog + toast layer.
**Depends on**: Phase 8
**Requirements**: SETTINGS-01, SETTINGS-02, SETTINGS-03, SETTINGS-04, SETTINGS-05
**Success Criteria** (what must be TRUE):
  1. In Global Settings the user can add, edit, delete, and reorder steps of the default scale and the change persists via `Store.setScale`; reopening shows the same order.
  2. Theme picker (`auto` / `light` / `dark`) and language picker (`en` / `de`) are reachable from both Settings and the nav and changes are reactive across the tree.
  3. Per-map Settings can edit subject label / emoji / colour, override the scale for that map, and toggle enabled categories; saving routes through `Store.saveResult` and the result view reflects the change.
  4. Data management offers export-backup (full `relationshape.v1` JSON download), import-backup (restore from file), and "clear all data" (gated by a confirmation dialog) — all three are smoke-walked end-to-end.
  5. Every dialog and toast meets shadcn accessibility expectations: focus trap on open, ESC dismisses, correct ARIA roles, and screen-reader announcements verified manually.
**UI hint**: yes
**Plans**: TBD

### Phase 10: PWA, Parity & Cutover
**Goal**: Ship the PWA manifest + Workbox service worker, prove v1↔v2 bundle compatibility, pass Lighthouse PWA, remove the legacy `js/` + `css/` + `sw.js`, and confirm the deployed `dist/` smoke-walks end-to-end.
**Depends on**: Phase 9
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04, PWA-05, PWA-06, PWA-07, PWA-08
**Success Criteria** (what must be TRUE):
  1. The generated `manifest.webmanifest` declares `standalone`, portrait, SVG icons at 192×192 and 512×512; installing the PWA succeeds on Chrome (desktop + Android) and Safari (iOS home-screen).
  2. Reopening the installed PWA after a v1.0→v2.0 upgrade preserves the user's `localStorage["relationshape.v1"]` data — profiles, results, imports, settings all reload intact.
  3. A v1.0-produced encrypted bundle decrypts in v2.0 (Vitest fixture); a v2.0-produced encrypted bundle decrypts in v1.0 (manually verified, evidence captured in PR notes).
  4. Lighthouse PWA audit on the production build reports installable, offline-capable, manifest valid — score documented in PR.
  5. Legacy `js/`, `css/`, and `sw.js` are removed from the repository; the root `index.html` is now the Vite entry; a deploy preview (Cloudflare Pages / GitHub Pages / Netlify) serves the built `dist/` and a smoke walkthrough (create profile → answer → share → import → compare) succeeds end-to-end against the deployed URL.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

Phase 3 (Design System) may overlap with Phase 4 (App Shell) once Phase 2 lands — they consume Phase 1 and Phase 2 separately and converge at Phase 5.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Not started | - |
| 2. Core Logic Port | 0/TBD | Not started | - |
| 3. Design System | 0/TBD | Not started | - |
| 4. App Shell | 0/TBD | Not started | - |
| 5. Profile Lifecycle | 0/TBD | Not started | - |
| 6. Questionnaire | 0/TBD | Not started | - |
| 7. Results & Charts | 0/TBD | Not started | - |
| 8. Share / Import / Compare | 0/TBD | Not started | - |
| 9. Settings | 0/TBD | Not started | - |
| 10. PWA, Parity & Cutover | 0/TBD | Not started | - |
