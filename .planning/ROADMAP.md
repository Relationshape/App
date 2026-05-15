# Roadmap: Relationshape v2.0 — React + Tailwind + shadcn/ui Migration

## Overview

Port the existing vanilla-JS PWA to a React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + vite-plugin-pwa stack at full feature parity. The migration is a greenfield rewrite alongside the legacy code with a single cutover at the end: the existing `js/`, `css/`, and `sw.js` continue to serve real users until Phase 3 confirms feature parity, decrypts a v1.0 bundle, and Lighthouse PWA passes — then the legacy files are removed in the same phase.

The work is consolidated into three phases — **Skeleton** (toolchain + pure core + design system), **Parity** (shell + every v1.0 view at feature parity), **Cutover** (PWA + parity proof + legacy retirement). Phases proceed in order; each plan inside a phase still subdivides naturally along the original feature areas (FOUND, CORE, DESIGN, SHELL, PROFILE, QUEST, RESULT, SHARE, SETTINGS, PWA).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Skeleton** - Vite + React 19 + TS + Tailwind v4 + shadcn + PWA plugin + Vitest scaffolded; pure TS port of Store / crypto / data / i18n with v1.0 fixture round-trip tests; Celestial Map design system as Tailwind tokens + self-hosted fonts + reduced-motion-guarded animations exposed via `<DesignSystem />` reference route. Skeleton works, no user-visible features yet.
- [ ] **Phase 2: Parity** - React app shell (router covering every v1.0 hash route, providers, persistent nav, toast + dialog primitives) plus every v1.0 view ported to React with full feature parity: profile lifecycle, questionnaire (list + swipe modes), result + chart components, share / import / compare, settings. EN/DE strings preserved, encrypted bundle round-trip preserved.
- [ ] **Phase 3: Cutover** - PWA manifest + Workbox service worker, install + offline verified, v1↔v2 bundle compatibility proven, Lighthouse PWA passes, legacy `js/` + `css/` + `sw.js` removed, deploy preview smoke-walked end-to-end.

## Phase Details

### Phase 1: Skeleton
**Goal**: Stand up the modern toolchain, port every pure (non-UI) v1.0 module to TypeScript with backward-compatible runtime behaviour (including the silent-data-loss bug fix), and reproduce the Celestial Map aesthetic as a Tailwind theme + self-hosted fonts + reduced-motion-guarded animation set — exposed via a `<DesignSystem />` reference route for eyeball parity against v1.0.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts Vite and serves a React placeholder route at `/`, while the legacy vanilla-JS app still loads at `/legacy/`. `npm run build` produces a `dist/` directory; `npm run test` runs Vitest with a passing `<App />` smoke render; `npm run typecheck` and `npm run lint` both exit clean.
  2. `tailwind.config.ts` is present with PostCSS / Vite plugin wired in; a sample utility class applies to the placeholder route. `shadcn` has been initialised with the project's path aliases and a base theme; adding a `Button` via `npx shadcn@latest add` succeeds. `vite-plugin-pwa` is configured for auto-update with Workbox precache of the build output and an offline fallback to `index.html`.
  3. A Vitest suite proves that an encrypted bundle produced by v1.0 (fixture under `tests/fixtures/`) round-trips through the new `decryptResult` / `encryptResult` with byte-for-byte parity (AES-GCM 256, PBKDF2 SHA-256 × 250 000, 16-byte salt, 12-byte IV, PEM-style armor).
  4. Loading the new app against a `localStorage["relationshape.v1"]` blob produced by v1.0 yields the same in-memory `Profile[]`, `Result[]`, `Import[]`, `Scale`, and `Settings` (asserted by Vitest fixture). `Store.save()` catches `QuotaExceededError` and returns a typed result that the UI can surface as a toast — no more silent overflow. `migrateScale`, custom-items handling, and `__hidden` items semantics are covered by Vitest and produce identical outputs to v1.0 for every fixture.
  5. `t()` resolves every EN and DE key from v1.0's `js/i18n.js` (key-for-key coverage); `getLocalizedDefaultScale()` returns the German scale for `de` and the English default otherwise.
  6. Every `:root` token from `css/style.css` (`--bg`, `--surface`, `--primary`, `--accent`, `--glass`, `--glow`, radii, shadows) is expressed in `tailwind.config.ts`; light and dark variants resolve through `data-theme` on `<html>`. Production build contains no `fonts.googleapis.com` / `fonts.gstatic.com` references — DM Sans and Playfair Display load from `public/fonts/` via `@font-face`.
  7. All eight `@keyframes` from `additions.css` (`heroBlobPulse`, `holoOrbDrift`, `holoBtnSpin`, `holoIconSpin`, `holoUnderlineSlide`, `iridShift`, `bgPulse`, `silkShift`) are reproducible as Tailwind utilities or component styles and side-by-side match the v1.0 reference. With `prefers-reduced-motion: reduce` set in DevTools, every non-essential animation stops or simplifies; the design-system reference page confirms this.
  8. A `/design-system` route renders the colour, typography, and animation scale — designers can flip between auto / light / dark via the theme toggle and the change is reactive across the tree.
**Plans:** 9 plans

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Move v1.0 sources into public/legacy/, duplicate icons to public/icons/ (CORE-07)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 01-02-PLAN.md — Scaffold Vite + React 19 + TS + Tailwind v4 + shadcn + vite-plugin-pwa + ESLint + Prettier + Vitest baseline (FOUND-01..07)

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 01-03-PLAN.md — Capture v1.0 fixtures: bundle (manual) + localStorage blob (synthetic) + setup.ts (CORE-04, CORE-08, FOUND-06)

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 01-04-PLAN.md — Port crypto.ts (CORE-04) with round-trip + envelope byte-shape test against v1.0 fixture
- [ ] 01-05-PLAN.md — Port data.ts (CORE-05) + en/de/i18n.ts (CORE-06) with 304-key parity test
- [ ] 01-07-PLAN.md — Port theme.css (DESIGN-01) + animations.css with reduced-motion guard (DESIGN-03, DESIGN-04) + Fontsource fonts (DESIGN-02)

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 01-06-PLAN.md — Port storage.ts as Zustand store + custom relationshapePersist middleware (CORE-01, CORE-02, CORE-03, CORE-05, CORE-07, CORE-08)

**Wave 6** *(blocked on Wave 5 completion)*
- [ ] 01-08-PLAN.md — Wire router + useTheme/useLang hooks + ThemeToggle/LangToggle + Placeholder + DesignSystem route + App smoke test (FOUND-06, DESIGN-05, DESIGN-06)

**Wave 7** *(blocked on Wave 6 completion)*
- [ ] 01-09-PLAN.md — Phase-final verify gate + DESIGN-02 grep guard + manual eyeball checklist


### Phase 2: Parity
**Goal**: Build the React app shell (typed providers, persistent nav, full route table, hash-deep-link compatibility, shadcn-based toast + dialog primitives) and ship every v1.0 view as React components with full feature parity — profile lifecycle, questionnaire (list + swipe modes), results & charts, share/import/compare, and settings — including EN/DE strings, encrypted bundle round-trip, and accessible dialogs.
**Depends on**: Phase 1
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06, PROFILE-01, PROFILE-02, PROFILE-03, PROFILE-04, PROFILE-05, PROFILE-06, PROFILE-07, QUEST-01, QUEST-02, QUEST-03, QUEST-04, QUEST-05, QUEST-06, QUEST-07, QUEST-08, RESULT-01, RESULT-02, RESULT-03, RESULT-04, RESULT-05, RESULT-06, RESULT-07, SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05, SHARE-06, SETTINGS-01, SETTINGS-02, SETTINGS-03, SETTINGS-04, SETTINGS-05
**Success Criteria** (what must be TRUE):

*App Shell*
  1. Every v1.0 hash route (`#/`, `#/welcome`, `#/profile/:id`, `#/profile/:id/edit`, `#/profile/new`, `#/q/:profileId/:resultId`, `#/q-categories/:profileId/:resultId`, `#/result/:id`, `#/result/:id/:catId`, `#/share/:id`, `#/import`, `#/compare`, `#/settings`, `#/map/:id/settings`, `#/intro`, `#/about`) resolves to a route handler in the new app — either via hash routing or a hash→path redirect shim — without 404s. A pasted v1.0 deep link such as `https://app/#/result/abc/intimacy` opens the v2.0 result view on the correct category without an extra redirect.
  2. A persistent `<Nav />` renders profile picker, imports link, compare link, settings, theme toggle, and language picker; navigating updates the active-link state and scrolls to top. `ThemeProvider` and `I18nProvider` wrap the app: flipping theme or language anywhere updates every consumer without manual re-renders.
  3. `useToast` (shadcn Sonner) and a typed `<Dialog />` replace `showToast`, `dlgAlert`, `dlgConfirm`, and the bespoke `dialog({...})` system — calling them from any component produces a working transient toast / modal.

*Profile Lifecycle*
  4. A first-time visitor sees the welcome view with hero, feature highlights, "Try it now" CTA, and how-to scroll section at parity with v1.0 in both EN and DE. Home lists existing profiles and imports with the same cards, deletion affordance, and create-profile button as v1.0; tapping a profile opens the profile detail view with its results.
  5. The user can create, edit, and delete a profile (name, pronouns, emoji + emoji picker, accent colour from PALETTE, optional notes) and the change persists across reload via `Store.createProfile` / `updateProfile` / `deleteProfile`.
  6. The first-visit onboarding wizard (steps from `buildWizardSteps`) responds to touch swipe and arrow-key navigation, supports skip, and never re-shows after completion. The age-gate dialog blocks app usage on first visit for under-18 selection; the user's answer persists via `Store` and the gate does not re-prompt on next load. Intro / About page reproduces the v1.0 content (story, credits, licence, privacy explainer) with EN + DE strings.

*Questionnaire*
  7. The user can toggle categories on/off in the category overview screen and confirming opens the questionnaire with the selected `enabledCategories` persisted on the result.
  8. List-mode renders every enabled category as answer rows with G/R/Both toggles, optional notes, and the user can add, edit, delete, and hide custom items — all changes save instantly to `localStorage`. Single-card / swipe-mode flips one item at a time and responds to both touch swipe and arrow keys on `(pointer: coarse)` and `(pointer: fine)` devices respectively, matching v1.0 behaviour.
  9. The scale picker (snap-dots) renders the active scale steps with correct colours and labels; tapping a step saves the answer through `Store.saveResult` and reflects the choice immediately. Navigating to `#/result/:id/:catId` from outside the questionnaire opens the corresponding spider chart focused on that category; the "always-visible save button" and "tab-switch prompt" behaviours from v1.0 are preserved; German gendered translations (`*innen` / `*r`) render correctly in `de`.

*Results & Charts*
  10. The result view header renders subject emoji, colour, profile context, date, and edit / share / delete actions at visual parity with v1.0.
  11. The overview spider chart accepts up to 4 datasets, draws dynamic axis labels, and responds to hover (desktop) and touch (mobile) — selecting an axis surfaces the per-category breakdown, matching `bindSpiderInteractivity`. The per-category bar diff, the item-level spider chart for a single category, and the alignment heat strip (top matches + biggest gaps) all render correctly side-by-side for two profiles.
  12. Tapping the spider chart opens the enlarged modal at higher resolution; closing returns focus to the trigger. A user-supplied label containing `<script>` or quote characters is escaped before insertion into any chart SVG — a Vitest snapshot covers the escape path.

*Share / Import / Compare*
  13. The share view encrypts a result + profile metadata with a user-supplied passphrase and renders the armored output in a textarea with a working copy-to-clipboard button. The share view offers a `.rshape.txt` download of the armored bundle and the downloaded file decrypts identically to the textarea content.
  14. The import view accepts pasted text or an uploaded file, decrypts with a passphrase, and saves the result to the `imports` pool — never mixed with own results. A v1.0-produced fixture bundle imports cleanly and the resulting `Import` object shape matches v1.0 exactly (Vitest regression).
  15. The compare view accepts mixed own-result + import IDs in the URL and renders spider + alignment + bar comparison for up to 4 datasets; backup export / restore (`Store.replaceAll`) round-trips a full data snapshot without loss.

*Settings*
  16. In Global Settings the user can add, edit, delete, and reorder steps of the default scale and the change persists via `Store.setScale`; reopening shows the same order. Theme picker (`auto` / `light` / `dark`) and language picker (`en` / `de`) are reachable from both Settings and the nav and changes are reactive across the tree.
  17. Per-map Settings can edit subject label / emoji / colour, override the scale for that map, and toggle enabled categories; saving routes through `Store.saveResult` and the result view reflects the change. Data management offers export-backup (full `relationshape.v1` JSON download), import-backup (restore from file), and "clear all data" (gated by a confirmation dialog) — all three are smoke-walked end-to-end.
  18. Every dialog and toast meets shadcn accessibility expectations: focus trap on open, ESC dismisses, correct ARIA roles, and screen-reader announcements verified manually.
**UI hint**: yes
**Plans**: TBD

### Phase 3: Cutover
**Goal**: Ship the PWA manifest + Workbox service worker, prove v1↔v2 bundle compatibility, pass Lighthouse PWA, remove the legacy `js/` + `css/` + `sw.js`, and confirm the deployed `dist/` smoke-walks end-to-end.
**Depends on**: Phase 2
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
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Skeleton | 0/9 | Not started | - |
| 2. Parity | 0/TBD | Not started | - |
| 3. Cutover | 0/TBD | Not started | - |
