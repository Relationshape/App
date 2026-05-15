# Phase 2: Parity - Research

**Researched:** 2026-05-15
**Domain:** React app shell + every v1.0 view at full feature parity (router, providers, nav, dialogs, profile lifecycle, questionnaire, charts, share/import/compare, settings)
**Confidence:** HIGH

## Summary

Phase 1 left a clean foundation: React 19.2.6 + Vite 8 + Tailwind v4 + Zustand 5 + Radix-UI 1.4.3 + React Router 7.15.1 + Vitest 4 are installed and the pure layers (`crypto`, `data`, `i18n`, Zustand `store` with `relationshapePersist` middleware) are in place. The router currently wires only `/` and `/design-system`; Phase 2 must extend it to every v1.0 hash route, mount a root layout with persistent `<Nav />`, add the shadcn primitives D-16 lists, and port the 14 `viewX` functions in `public/legacy/js/app.js` and the 4 chart renderers in `public/legacy/js/charts.js` to React.

The hardest views are: (1) Single-card questionnaire (swipe + peek-next + keyboard + per-item scale override + reduced-motion collapse), (2) the four chart components with adaptive label sizing and hover/touch drilldown owned by `useSpiderInteraction`, (3) the imperative `dialog({...}): Promise<value>` shim on top of declarative Radix Dialog. Locked decisions D-08–D-10 commit to `@use-gesture/react` 10.3.1 for swipe; D-04–D-07 commit to declarative React/SVG charts with no charting library; D-13–D-15 commit to `createHashRouter` + `<RootLayout />` + shadcn `Sheet` mobile nav.

**Primary recommendation:** Treat Plan 1 (App Shell) and Plan 2 (Primitives) as a tight pair — they unblock all of plans 3–7 and have the highest review value. Vendor every shadcn primitive D-16 lists in plan 2 even if a later plan ends up not using one; the small bundle cost is dwarfed by the cost of inserting a primitive mid-plan. Lift every `viewX` to a route component that reads from `useStore(s => …)` selectors so the migration is mechanical (no orchestration logic beyond the store actions Phase 1 already exposes).

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Plan decomposition (strategic anchor)**

- **D-01:** Foundation-first horizontal slicing — 7 sequential plans: (1) App shell with full SHELL-01 route table + `ThemeProvider` + `I18nProvider` + persistent `<Nav />` + scroll-to-top + active-link + route placeholders. (2) Primitives — shadcn Dialog, AlertDialog, Sonner, Sheet, Popover, Tabs + typed `<Dialog />` / `<AlertDialog />` wrappers + `useToast` shim + form helpers + `useSwipe` + age gate + wizard host. (3) Profile lifecycle — Welcome, Home, Profile CRUD, Intro/About, wizard content. (4) Questionnaire — Category overview, List mode, Single-card mode, scale picker, deep-link to category. (5) Results & Charts — Result header + 4 chart components + enlarged modal. (6) Share / Import / Compare. (7) Settings.
- **D-02:** Each plan adds only the i18n keys, shadcn primitives, and routes it needs — incremental layering. Plans 3–7 are sequential.
- **D-03:** Plan-level acceptance is verifiable in isolation per plan. Phase-final verify gate runs the full ROADMAP §"Phase 2" success-criteria checklist against the integrated app.

**Chart components port**

- **D-04:** Full declarative React/JSX for every chart. `renderSpider`, `renderItemSpider`, `renderCategoryBars`, `renderAlignment` become React components in `src/components/charts/` that emit `<svg>` JSX directly. Pure math helpers move to `src/lib/charts/math.ts`.
- **D-05:** No `dangerouslySetInnerHTML` anywhere in chart code. RESULT-07 XSS escape audit is structural — user-supplied labels go through React text-node escaping.
- **D-06:** `bindSpiderInteractivity` is replaced by per-component React handlers. A `useSpiderInteraction(datasets)` hook owns the selected-axis state and exposes `{ activeAxis, onAxisEnter, onAxisLeave, onAxisTap }`.
- **D-07:** The enlarged-chart modal uses shadcn `Dialog` with the same chart component re-rendered at a larger `size` prop. SVG scales by `viewBox`.

**Swipe + arrow-key navigation**

- **D-08:** Add `@use-gesture/react` as a runtime dep. Used by the Single-card questionnaire mode, the first-visit Wizard, and the enlarged-chart modal pinch.
- **D-09:** A small `useSwipe` hook in `src/lib/hooks/useSwipe.ts` wraps `useDrag`. Arrow-key handler is a separate `useKeydown(['ArrowLeft','ArrowRight'], handler)` hook.
- **D-10:** Both hooks respect `prefers-reduced-motion: reduce` — spring/momentum visuals disabled but swipe-trigger threshold still works. Peek-next-card animation collapses to instant swap.

**Long-form prose (Welcome / Intro / About)**

- **D-11:** Keep multi-paragraph prose in the flat i18n maps. Welcome marketing copy, Intro story / credits / licence / privacy explainer, Wizard step bodies stay as long string values in `src/lib/i18n/en.ts` and `src/lib/i18n/de.ts`.
- **D-12:** Where v1.0 strings contain inline `<strong>` / `<em>` / `<a>`, the React component renders the string with `dangerouslySetInnerHTML` only for known-safe i18n keys (a typed allow-list `RICH_TEXT_KEYS`). User-supplied content NEVER flows through this path.

**App shell composition**

- **D-13:** `createHashRouter` with a single root layout route (`<RootLayout />`) that mounts `<Nav />`, age-gate dialog host, wizard host, `<Toaster />`, and the route `<Outlet />`. Every leaf route is a child. Scroll-to-top + active-link logic live in a `useScrollToTop()` hook called from the root layout.
- **D-14:** `ThemeProvider` and `I18nProvider` wrap the router at the `<App />` root. Both are thin Context wrappers around the existing Zustand store.
- **D-15:** `<Nav />` layout mirrors v1.0: horizontal top bar on desktop with the profile picker (Popover dropdown), imports link, compare link, settings link, theme toggle, language picker; shadcn `Sheet` drawer for mobile (hamburger). `<NavLink>` from React Router supplies `active` state.

**shadcn primitives to vendor**

- **D-16:** Vendored in the Primitives plan (plan 2): `Dialog`, `AlertDialog`, `Sonner` (toast), `Sheet` (mobile nav drawer), `Popover` (profile picker + emoji picker host), `Tabs` (used in Settings sections), `Slider` (deferred — see D-20).
- **D-17:** Each shadcn primitive is added via `npx shadcn@latest add <name>` so it lands in `src/components/ui/` per Phase 1 D-26.

**Forms**

- **D-18:** Plain controlled components with `useState` / `useReducer` — no `react-hook-form`.
- **D-19:** `useFormError(field)` helper in `src/lib/hooks/useFormError.ts` standardises field-level error surfacing.

**Bespoke UI components**

- **D-20:** Scale picker (snap-dots) is a bespoke React component, NOT shadcn `Slider`.
- **D-21:** Emoji picker is bespoke too: shadcn `Popover` hosts a grid of `EMOJI_BANK` glyphs.
- **D-22:** Chart components are bespoke (no charting library).
- **D-23:** Wizard uses `useReducer` with `{step, totalSteps, dir}` state shape. Step content lives as a config array `WIZARD_STEPS`. Swipe + arrow keys + skip button + finish action. First-visit gating via `Store.getSettings().wizardDone`.

**Routes (full SHELL-01 table)**

- **D-24:** Every v1.0 hash route lands as a leaf route under the root layout, all matching v1.0 path segments exactly (full table preserved in Architecture Patterns section below).
- **D-25:** Compare URL scheme preserved verbatim: `#/compare?ids=a,b,imp:c` — comma-separated, `imp:` prefix denotes an import. Up to 4 datasets enforced.
- **D-26:** Hash deep-link for `#/result/:id/:catId` opens the result page, scrolls to the category section, and triggers the same drill-down view.

**Toast / Dialog primitives (SHELL-06)**

- **D-27:** `useToast()` is a thin wrapper around shadcn `Sonner`'s `toast()` API, re-exposing `toast.success` / `toast.error` / `toast.message`.
- **D-28:** `<Dialog />` and `<AlertDialog />` are typed wrappers. Two APIs: declarative for in-tree dialogs; imperative `dialog({title, body, actions}): Promise<value>` via a portal-hosted `<DialogHost />` + Zustand `dialogQueue` slice.
- **D-29:** Age gate is a `<AgeGate />` component mounted by the root layout; blocking `AlertDialog` on first visit; "Under 18" routes to hard-stop view; "I'm 18+" persists `ageConfirmed = true`.

**Questionnaire behaviours**

- **D-30:** Template warning preserved as `useTemplateWarning(result)` hook returning a `confirmIfTemplate()` async function. Called before every answer mutation in List + Single modes.
- **D-31:** "Always-visible save button" — reproduce as sticky bottom actions inside the questionnaire route ("← Categories" + "See results →"). Answers auto-save on every change.
- **D-32:** Single-card peek-next animation uses Tailwind `transition-transform` + a `data-state="entering|active|leaving"` attribute. Under reduced-motion collapse to instant swap.
- **D-33:** Per-item scale override ports to an in-flow `<Dialog />` from the card's "Edit scale for this item" button. Confirms before discarding existing fractional answer if scale changes.

**Result view behaviours**

- **D-34:** Result chart layout matches v1.0: header → overview spider → per-category breakdown → item-level spider → bar diff → alignment heat strip. Active category state owned by `<Result />`.
- **D-35:** Up to 4 datasets enforced at the `<Compare />` and `<Result />` boundary. Toast surfaces if more IDs passed.

**Share / Import / Compare**

- **D-36:** Share view uses an in-tree `<Dialog />` (or shadcn `Sheet` on small screens) for passphrase entry, then renders armored output in `<Textarea>` with "Copy" + "Download `.rshape.txt`" buttons.
- **D-37:** Import view accepts `<Textarea>` paste OR `<input type="file">` upload, requires passphrase, calls `decryptResult`, surfaces error on wrong-passphrase. On success: `Store.saveImport(payload)`, navigate to `/compare?ids=imp:<newId>`.
- **D-38:** v1.0 fixture regression for SHARE-04 uses `tests/fixtures/v1-bundle.rshape.txt` + `v1-bundle.fixture.ts` (already captured in Phase 1's plan 03).
- **D-39:** Backup export downloads `relationshape-backup-<isoDate>.v1.json`. Backup import uses file picker + `JSON.parse` + `Store.replaceAll(...)` gated by an `<AlertDialog />`. Clear all data uses `<AlertDialog />` with "Type DELETE to confirm" input gate.

**Settings**

- **D-40:** Global scale editor renders the current scale as a draggable list (uses `@use-gesture/react` for reorder).
- **D-41:** Per-map Settings renders subject identity edit + scale override + category toggles in one form.
- **D-42:** Theme picker is a 3-button toggle group (auto/light/dark); Language picker is a 2-button toggle group (EN/DE).

**Testing**

- **D-43:** Per-plan test surface — App shell (RTL render + route resolution); Primitives (`useToast`, `<Dialog />` API, `useSwipe`); Profile (Zustand round-trip); Questionnaire (math helpers + mode dispatch); Result/Charts (pure math + SVG snapshot + XSS escape); Share/Import (fixture regression + round-trip); Settings (scale editor reorder + backup round-trip).

### Claude's Discretion

The user's four strategic picks (D-01 plan slicing, D-04 declarative charts, D-08 `@use-gesture/react`, D-11 flat-i18n prose) anchor the architecture. The remaining decisions (D-02, D-03, D-05–D-07, D-09, D-10, D-12–D-43) are implementation details Claude resolved using Phase 1's locked decisions, the v1.0 baseline, and `.planning/codebase/` analysis. Downstream researcher/planner should treat these as the working defaults but may revisit any item that conflicts with an evidence-backed concern surfaced during research — particularly the per-plan shadcn vendoring list (D-16) if a primitive turns out to be unsuitable, and D-18's "no react-hook-form" call if a form grows past ~10 interacting fields.

### Deferred Ideas (OUT OF SCOPE)

- PWA manifest + Workbox SW for the new app — Phase 3 (PWA-01, PWA-02). Phase 2 makes the app static-deployable but does NOT generate a manifest.
- v1→v2 install upgrade smoke — Phase 3 (PWA-03).
- Cross-direction bundle compat (v2→v1 decrypt) — Phase 3 (PWA-05).
- Lighthouse PWA audit — Phase 3 (PWA-06).
- Legacy retirement (`public/legacy/`, `js/`, `css/`, `sw.js` removal) — Phase 3 (PWA-07). Phase 2 KEEPS legacy alive at `/legacy/` for eyeball-parity comparison.
- `react-hook-form` — revisit only if a form grows past ~10 interacting fields.
- `framer-motion` or richer chart animations — out of scope for v2.0 parity.
- `emoji-picker-react` / `emoji-mart` — bespoke `EMOJI_BANK` picker preserves visual parity and bundle budget.
- Bundle-size CI (size-limit) — v2.1+ (QUAL-03).
- Broader Vitest coverage — v2.1+ (QUAL-01).
- Playwright E2E — out of scope for v2.0 entirely.
- Profile colour themes / cover images (FEAT-02), additional languages (FEAT-03), richer compare visualisations (FEAT-04) — explicitly v2.1+.
- "Always-visible save button" as a literal save button — v1.0 doesn't have one (auto-save covers it).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHELL-01 | Client-side routing covers every v1.0 hash route | D-24 route table verified against legacy `route()` at `public/legacy/js/app.js:861–884`; `createHashRouter` extension pattern documented below |
| SHELL-02 | v1.0 deep links continue to resolve (hash kept) | Already locked via `createHashRouter`; verified `useLocation`/`useSearchParams` parse the v1.0 `?ids=…` format unchanged |
| SHELL-03 | Persistent global `<Nav />` (profile picker / imports / compare / settings / theme / lang) | `<Nav />` layout in D-15; mobile `Sheet` pattern verified via shadcn Sheet docs |
| SHELL-04 | Typed `ThemeProvider` + `I18nProvider`; reactive across tree | Already wired in Phase 1: `useTheme()` reads from Zustand `useStore`, applies `data-theme` to `<html>`; `useLang` returns `{lang, setLang}` — D-14 thin Context wrappers around these hooks |
| SHELL-05 | Scroll-to-top + active-link matches v1.0 | `useScrollToTop()` hook reading `useLocation().pathname`; `<NavLink>` from `react-router-dom` gives `aria-current` + `active` class — pattern documented |
| SHELL-06 | Toast + `<Dialog />` primitives in place | Sonner 2.0.7 wired via `npx shadcn@latest add sonner`; declarative + imperative wrapper patterns documented below |
| PROFILE-01 | Home view lists profiles + imports with cards / delete / create | Port from `public/legacy/js/app.js:987` `viewHome()` |
| PROFILE-02 | Welcome view (hero + features + CTA + how-to scroll) at v1.0 parity | Port from `viewWelcome()` at `public/legacy/js/app.js:1014` |
| PROFILE-03 | Profile create/edit (name, pronouns, emoji + picker, accent colour, notes) saves through Store | Phase 1's Zustand store already exposes `createProfile` / `updateProfile` / `deleteProfile`; emoji picker is bespoke per D-21 |
| PROFILE-04 | Profile detail view: results + create-result / share / delete | Port from `viewProfile()` at `public/legacy/js/app.js:1172` |
| PROFILE-05 | First-visit Wizard (swipe + arrow keys + skip) | D-23 `useReducer` + `WIZARD_STEPS` config; swipe via `useSwipe` (D-09) |
| PROFILE-06 | Age gate blocks first visit; persists via Store | D-29 `<AgeGate />` mounted by root layout; v1.0 uses a separate `rs-age-confirmed` localStorage key — Phase 2 unifies into Zustand `settings.ageConfirmed` (NEW field) |
| PROFILE-07 | Intro/About page (story + credits + licence + privacy) | Port from `viewIntro()` at `public/legacy/js/app.js:3474`; D-11 flat-i18n + D-12 typed `RICH_TEXT_KEYS` |
| QUEST-01 | Category overview toggle + persist `enabledCategories` | Port from `viewCategoryOverview()` at `public/legacy/js/app.js:1230` |
| QUEST-02 | List-mode questionnaire (G/R/Both, notes, custom, hidden) | Port from `viewQuestionnaireList()` at `public/legacy/js/app.js:1750` |
| QUEST-03 | Single-card / swipe-mode with touch + arrow keys; `(pointer: coarse)` aware | Port from `viewQuestionnaireSingle()` at `public/legacy/js/app.js:2047`; `useSwipe` + `useKeydown` + `useIsCoarsePointer` hooks |
| QUEST-04 | Scale picker (snap-dots) with correct colours + labels; tap saves answer | Port `scaleClickEl` from `public/legacy/js/app.js:262`; D-20 bespoke component |
| QUEST-05 | Every answer change persists; UI confirmation | Auto-save through `useStore.saveResult`; toast on save confirmation per v1.0 (D-31) |
| QUEST-06 | Deep-link `#/result/:id/:catId` opens spider focused on category | D-26 `useParams().catId` consumed for scroll-into-view + drill-down |
| QUEST-07 | "Always-visible save" + tab-switch prompt | D-31 sticky bottom actions; tab-switch via `useBlocker` from React Router v7 — see Architecture Patterns |
| QUEST-08 | German gendered translations (`*innen` / `*r`) | Already preserved key-for-key in `src/lib/i18n/de.ts` from Phase 1 |
| RESULT-01 | Result view header (emoji + colour + profile context + edit/share/delete) | Port from `viewResult()` at `public/legacy/js/app.js:2770` |
| RESULT-02 | Overview spider ≤ 4 datasets, dynamic axis labels, hover/touch | D-04 declarative SVG + D-06 `useSpiderInteraction(datasets)` hook |
| RESULT-03 | Per-category bar diff (item marks) | Port `renderCategoryBars` from `public/legacy/js/charts.js:373` |
| RESULT-04 | Item-level spider chart | Port `renderItemSpider` from `public/legacy/js/charts.js:333` |
| RESULT-05 | Alignment heat strip (top matches + biggest gaps) | Port `renderAlignment` from `public/legacy/js/charts.js:424` |
| RESULT-06 | Enlarged spider modal | D-07 shadcn `Dialog` + same chart at larger `size` prop |
| RESULT-07 | XSS escape audit | D-05 structural via React text-node escaping; snapshot test for `<script>alert(1)</script>` payload |
| SHARE-01 | Share view encrypts result + profile metadata with passphrase | Port from `viewShare()` at `public/legacy/js/app.js:2875`; uses ported `encryptResult` from Phase 1 |
| SHARE-02 | `.rshape.txt` download | `<a href={URL.createObjectURL(blob)} download>` pattern |
| SHARE-03 | Import view accepts paste OR file upload, decrypts, saves to `imports` | Port from `viewImport()` at `public/legacy/js/app.js:2952`; uses ported `decryptResult` from Phase 1 |
| SHARE-04 | v1.0 fixture imports cleanly; `Import` shape matches | D-38 Vitest regression against `tests/fixtures/v1-bundle.rshape.txt` |
| SHARE-05 | Compare ≤ 4 datasets via URL with mixed own + import IDs | Port from `viewCompare()` at `public/legacy/js/app.js:3033`; D-25 + D-35 |
| SHARE-06 | Backup export + restore round-trip via `Store.replaceAll` | D-39 JSON dump + `<AlertDialog />` confirmation; Phase 1 store exposes `replaceAll(snapshot)` |
| SETTINGS-01 | Global scale editor (add/edit/delete/reorder) | Port from `viewSettings()` at `public/legacy/js/app.js:3547`; `useStore.setScale` |
| SETTINGS-02 | Theme + language picker reachable from Settings + Nav | Already wired in Phase 1 (`ThemeToggle` + `LangToggle`); reuse |
| SETTINGS-03 | Per-map Settings (subject identity + scale override + category toggles) | Port from `viewMapSettings()` at `public/legacy/js/app.js:3338` |
| SETTINGS-04 | Data management: export / import / clear all (confirmation gated) | D-39 |
| SETTINGS-05 | Dialog & toast accessibility (focus trap, ESC, ARIA) | Radix UI primitives handle this for free; documented below |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hash routing, route table | Browser / Client | — | Static SPA; routes resolve client-side via `createHashRouter` (no server) |
| Theme + lang reactive providers | Browser / Client | — | Read from Zustand store; apply DOM attribute + lang attr; no server involved |
| Profile / Result / Import CRUD | Browser / Client | Database / Storage (localStorage) | Zustand store mutates in-memory state; `relationshapePersist` middleware writes to `localStorage["relationshape.v1"]` |
| Encrypted bundle exchange | Browser / Client | — | WebCrypto `subtle` in-browser; no network calls |
| Chart rendering (SVG) | Browser / Client | — | Pure React + SVG; no canvas / WebGL / library |
| Toast / Dialog primitives | Browser / Client | — | Sonner + Radix portal-mounted, all client-side |
| Service worker / offline | CDN / Static | — | Vite-plugin-pwa generates the SW (Phase 3 — out of scope for Phase 2) |
| Static font hosting | CDN / Static | — | `@fontsource-variable/*` self-hosts; resolved at build time |

All Phase 2 capabilities live entirely in the browser tier. There is no backend / API tier in this product. The only "tier crossing" is reads/writes to `localStorage` (the persistence boundary) which the Zustand `relationshapePersist` middleware (Phase 1 D-06) already mediates.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.6 | UI library | Already installed (Phase 1) `[VERIFIED: package.json]` |
| react-dom | 19.2.6 | DOM renderer | Already installed `[VERIFIED: package.json]` |
| react-router-dom | 7.15.1 | Hash routing + data router | Already installed; Phase 1 D-01 locks this `[VERIFIED: package.json]` |
| zustand | 5.0.13 | State store | Already installed; Phase 1 D-04 locks this `[VERIFIED: package.json]` |
| radix-ui | 1.4.3 (meta package) | Headless primitives shadcn uses | Already installed `[VERIFIED: package.json]` |
| class-variance-authority | 0.7.1 | Variant typing for component APIs | Already installed (used by Button) `[VERIFIED: package.json]` |
| clsx + tailwind-merge | 2.1.1 / 3.0.0 | `cn()` helper composition | Already installed `[VERIFIED: package.json]` |

### Supporting (Phase 2 adds)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @use-gesture/react | 10.3.1 | Drag / swipe gestures (axis lock, threshold, touch+pointer events) | Single-card swipe (D-08), Wizard swipe (D-23), Scale editor reorder (D-40); enlarged-chart pinch if no-cost. Peer deps: `react: >= 16.8.0` (compatible with React 19) `[VERIFIED: npm view 10.3.1 published 2024-08-30]` |
| sonner | 2.0.7 | Toast primitive (via shadcn vendor) | `useToast` shim (D-27). Peer deps: `react: ^18 \|\| ^19` (verified). Tailwind v4 compatible per shadcn docs `[VERIFIED: npm view 2.0.7]` |

**Already in dependencies, just need to install via `shadcn add`** (radix-ui meta package is already at 1.4.3 so individual primitives may be tree-shakeable from there; shadcn pulls in `@radix-ui/react-{dialog,alert-dialog,popover,tabs}` individually):

| Primitive | Underlying Radix Package | Latest Version | shadcn install command |
|-----------|--------------------------|----------------|-------------------------|
| Dialog | `@radix-ui/react-dialog` | 1.1.15 | `npx shadcn@latest add dialog` `[VERIFIED]` |
| Alert Dialog | `@radix-ui/react-alert-dialog` | 1.1.15 | `npx shadcn@latest add alert-dialog` `[VERIFIED]` |
| Sonner | `sonner` (NPM dep) | 2.0.7 | `npx shadcn@latest add sonner` `[VERIFIED]` |
| Sheet | `@radix-ui/react-dialog` (reuses) | 1.1.15 | `npx shadcn@latest add sheet` `[VERIFIED]` |
| Popover | `@radix-ui/react-popover` | 1.1.15 | `npx shadcn@latest add popover` `[VERIFIED]` |
| Tabs | `@radix-ui/react-tabs` | 1.1.13 | `npx shadcn@latest add tabs` `[VERIFIED]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff | Verdict |
|------------|-----------|----------|---------|
| `@use-gesture/react` | Raw `touchstart/touchmove/touchend` (v1.0 pattern at `app.js:2700`) | Smaller bundle; more fragile (Android scroll-vs-swipe bug from `.planning/codebase/CONCERNS.md`) | LOCKED to @use-gesture/react per D-08 — fixes the v1.0 scroll-vs-swipe pitfall |
| `sonner` (shadcn default) | Radix-only `<Toast />` | Sonner has better stacking + dismiss API; shadcn deprecated `<Toast />` in favour of Sonner | LOCKED to Sonner — confirmed via shadcn docs that `<Toast />` is deprecated |
| shadcn `Slider` | Bespoke scale picker (snap-dots) | shadcn `Slider` doesn't match v1.0's visible step labels + colour-per-step + fractional answer | LOCKED to bespoke per D-20 |
| `emoji-picker-react` / `emoji-mart` | Bespoke `EMOJI_BANK` picker | Bespoke is ~1KB; libraries are 40–80KB | LOCKED to bespoke per D-21 |
| `react-hook-form` | Plain `useState` | Phase 2 forms are small (≤ 5 fields); `react-hook-form` is overkill | LOCKED to plain per D-18 |
| `framer-motion` | CSS transitions + Tailwind variants | Phase 2's animation needs are simple; `framer-motion` adds 50KB | LOCKED to CSS per D-32 |

**Installation:**

```bash
# Runtime dep
pnpm add @use-gesture/react@10.3.1

# shadcn primitives (D-16 list, all in plan 2)
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add sonner
npx shadcn@latest add sheet
npx shadcn@latest add popover
npx shadcn@latest add tabs
```

**Version verification (against npm registry, 2026-05-15):**

| Package | Installed (package.json) | npm latest | Action |
|---------|--------------------------|------------|--------|
| react | 19.2.6 | — | locked Phase 1 |
| react-router-dom | 7.15.1 | — | locked Phase 1 |
| zustand | 5.0.13 | — | locked Phase 1 |
| radix-ui (meta) | 1.4.3 | 1.4.3 (verified via `npm view radix-ui version`) | up to date |
| @radix-ui/react-dialog | (not yet) | 1.1.15 (verified) | install via shadcn |
| @radix-ui/react-alert-dialog | (not yet) | 1.1.15 (verified) | install via shadcn |
| @radix-ui/react-popover | (not yet) | 1.1.15 (verified) | install via shadcn |
| @radix-ui/react-tabs | (not yet) | 1.1.13 (verified) | install via shadcn |
| @use-gesture/react | (not yet) | 10.3.1 (verified, 37 KB unpacked) | install runtime |
| sonner | (not yet) | 2.0.7 (verified) | install via shadcn |

## Architecture Patterns

### System Architecture Diagram

```text
                        ┌─────────────────────────────┐
                        │  Browser entry (main.tsx)   │
                        │  loads StrictMode + <App /> │
                        └──────────────┬──────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │ <App />                              │
                    │  - useTheme() side-effect            │
                    │  - <ThemeProvider> (Context = store) │
                    │  - <I18nProvider> (Context = store)  │
                    │  - <RouterProvider router={...} />   │
                    └──────────────┬───────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────────────┐
        │ <RootLayout /> (the only route's element)                    │
        │  - <Nav /> (desktop top-bar + mobile Sheet drawer)           │
        │  - <AgeGate /> (gates first-visit access; portal AlertDialog)│
        │  - <WizardHost /> (first-visit-only via Store.wizardDone)    │
        │  - <DialogHost /> (imperative dialog({...}) portal)          │
        │  - <Toaster /> (sonner)                                      │
        │  - <Outlet />  ← child routes render here                    │
        │  - useScrollToTop()  watches useLocation()                   │
        │  - useToastSubscriber()  reads useStore(s=>s.lastSaveError)  │
        └──────────────┬───────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼      (15 leaf routes, every v1.0 hash preserved)
   ┌────────────┬─────────────┬──────────────┬─────────────┐
   │  <Home/>   │  <Welcome/> │  <ProfileEdit/> │ <Profile/>│
   │  <Q.Cats/> │  <Q.flow/>  │  <Result/>   │  <Share/>   │
   │  <Import/> │  <Compare/> │  <Settings/> │ <MapSet./>  │
   │  <Intro/>  │ (alias About)               │             │
   └────────────┴─────────────┴──────────────┴─────────────┘
        │
        ▼
   ┌──────────────────────────────────────────────────────┐
   │  View components read from Zustand selectors:        │
   │  useStore(s => s.profiles)                           │
   │  useStore(s => s.results.find(r => r.id === rid))    │
   │  useStore(s => s.saveResult) (action)                │
   │  ── selector-based subscriptions, O(1) reads         │
   └──────────────────────────────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────────────────────────────┐
   │  relationshapePersist middleware (Phase 1 D-06)      │
   │  - serialises canonical slice on every set()         │
   │  - writes to localStorage["relationshape.v1"]        │
   │  - catches QuotaExceededError → state.lastSaveError  │
   └──────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────┐
   │  Encrypted bundle exchange (Share + Import only)     │
   │  encryptResult(payload, pass) → ASCII armor          │
   │  decryptResult(armor, pass) → payload (or throw)     │
   │  Both ported byte-compatible with v1.0 in Phase 1    │
   └──────────────────────────────────────────────────────┘
```

### Recommended Project Structure (Phase 2 additions only)

```text
src/
├── App.tsx                            # MODIFIED — add ThemeProvider + I18nProvider wrappers
├── router.tsx                         # MODIFIED — full SHELL-01 table; nested under <RootLayout />
├── components/
│   ├── ui/                            # shadcn primitives — Phase 2 adds dialog, alert-dialog, sheet, popover, tabs, sonner
│   │   ├── button.tsx                 # (Phase 1)
│   │   ├── dialog.tsx                 # NEW (D-16)
│   │   ├── alert-dialog.tsx           # NEW (D-16)
│   │   ├── sheet.tsx                  # NEW (D-16)
│   │   ├── popover.tsx                # NEW (D-16)
│   │   ├── tabs.tsx                   # NEW (D-16)
│   │   └── sonner.tsx                 # NEW (D-16) — exports <Toaster />
│   ├── ThemeToggle.tsx                # (Phase 1)
│   ├── LangToggle.tsx                 # (Phase 1)
│   ├── Nav.tsx                        # NEW (D-15)
│   ├── ProfilePicker.tsx              # NEW (Popover-hosted; D-15)
│   ├── DialogHost.tsx                 # NEW (D-28 imperative dialog portal)
│   ├── AgeGate.tsx                    # NEW (D-29)
│   ├── WizardHost.tsx                 # NEW (D-23)
│   ├── EmojiPicker.tsx                # NEW (D-21)
│   ├── ScalePicker.tsx                # NEW (D-20 bespoke snap-dots)
│   ├── charts/
│   │   ├── Spider.tsx                 # NEW (D-04 declarative SVG)
│   │   ├── ItemSpider.tsx             # NEW (D-04)
│   │   ├── CategoryBars.tsx           # NEW (D-04)
│   │   ├── Alignment.tsx              # NEW (D-04)
│   │   ├── SpiderRadar.tsx            # NEW (internal helper for both Spider variants)
│   │   └── SpiderTooltip.tsx          # NEW (portal-mounted tooltip)
│   └── questionnaire/
│       ├── ListMode.tsx               # NEW (QUEST-02)
│       ├── SingleMode.tsx             # NEW (QUEST-03 — the hardest view)
│       ├── QuestionnaireHeader.tsx    # NEW (sticky header)
│       ├── QuestionnaireNav.tsx       # NEW (D-31 sticky bottom nav pair)
│       └── ItemRow.tsx                # NEW (List mode row)
├── hooks/
│   ├── useTheme.ts                    # (Phase 1)
│   ├── useLang.ts                     # (Phase 1)
│   └── useScrollToTop.ts              # NEW (D-13)
├── lib/
│   ├── charts/
│   │   ├── math.ts                    # NEW — pure helpers (categoryAverage, closestScaleEntry, etc.)
│   │   └── math.test.ts               # NEW
│   ├── dialog/
│   │   ├── dialogQueue.ts             # NEW (D-28 Zustand slice)
│   │   └── dialog.ts                  # NEW — exports `dialog({...}): Promise<value>` helper
│   ├── hooks/
│   │   ├── useSwipe.ts                # NEW (D-09)
│   │   ├── useKeydown.ts              # NEW (D-09)
│   │   ├── useIsCoarsePointer.ts      # NEW (mirrors v1.0 `(pointer: coarse)` check)
│   │   ├── useReducedMotion.ts        # NEW (matchMedia('(prefers-reduced-motion: reduce)'))
│   │   ├── useFormError.ts            # NEW (D-19)
│   │   ├── useTemplateWarning.ts      # NEW (D-30)
│   │   └── useSpiderInteraction.ts    # NEW (D-06 active-axis state)
│   └── data/
│       └── emoji.ts                   # NEW — EMOJI_BANK copied verbatim from public/legacy/js/app.js:97
├── routes/
│   ├── RootLayout.tsx                 # NEW (D-13)
│   ├── DesignSystem.tsx               # (Phase 1)
│   ├── Placeholder.tsx                # (Phase 1) — kept until plan 3 replaces it
│   ├── Home.tsx                       # NEW (PROFILE-01)
│   ├── Welcome.tsx                    # NEW (PROFILE-02)
│   ├── ProfileEdit.tsx                # NEW (PROFILE-03)
│   ├── ProfileDetail.tsx              # NEW (PROFILE-04)
│   ├── Intro.tsx                      # NEW (PROFILE-07; also serves /about route)
│   ├── CategoryOverview.tsx           # NEW (QUEST-01)
│   ├── Questionnaire.tsx              # NEW (QUEST-02..QUEST-08 — dispatches by mode)
│   ├── Result.tsx                     # NEW (RESULT-01..RESULT-07)
│   ├── Share.tsx                      # NEW (SHARE-01, SHARE-02)
│   ├── Import.tsx                     # NEW (SHARE-03, SHARE-04)
│   ├── Compare.tsx                    # NEW (SHARE-05, RESULT-02..RESULT-05)
│   ├── Settings.tsx                   # NEW (SETTINGS-01, SETTINGS-02, SETTINGS-04)
│   └── MapSettings.tsx                # NEW (SETTINGS-03)
└── lib/storage/
    └── store.ts                       # MODIFIED — add dialogQueue slice (D-28); add ageConfirmed + wizardDone to Settings type
```

### Pattern 1: Nested Route Layout with `<RootLayout />` and `<Outlet />`

**What:** A single root route (`/`) renders persistent UI (Nav, dialog host, toaster) and a child `<Outlet />` for leaf routes. Every leaf is a child of root, so the shell is always mounted exactly once.

**When to use:** Always for this app — the app shell (`<Nav />`, `<Toaster />`, `<DialogHost />`, `<AgeGate />`, `<WizardHost />`) must persist across navigation.

**Example (target `src/router.tsx` shape):**

```typescript
// Source: React Router v7 docs — createHashRouter + nested routes
// https://reactrouter.com/api/data-routers/create-hash-router
import { createHashRouter } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { Home } from './routes/Home'
import { Welcome } from './routes/Welcome'
import { ProfileEdit } from './routes/ProfileEdit'
import { ProfileDetail } from './routes/ProfileDetail'
import { CategoryOverview } from './routes/CategoryOverview'
import { Questionnaire } from './routes/Questionnaire'
import { Result } from './routes/Result'
import { Share } from './routes/Share'
import { Import } from './routes/Import'
import { Compare } from './routes/Compare'
import { Settings } from './routes/Settings'
import { MapSettings } from './routes/MapSettings'
import { Intro } from './routes/Intro'
import { DesignSystem } from './routes/DesignSystem'

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },                                  // #/
      { path: 'welcome', element: <Welcome /> },                           // #/welcome
      { path: 'profile/new', element: <ProfileEdit /> },                   // #/profile/new
      { path: 'profile/:id', element: <ProfileDetail /> },                 // #/profile/:id
      { path: 'profile/:id/edit', element: <ProfileEdit /> },              // #/profile/:id/edit
      { path: 'q-categories/:profileId/:resultId', element: <CategoryOverview /> },
      { path: 'q/:profileId/:resultId', element: <Questionnaire /> },      // dispatches list/single
      { path: 'result/:id', element: <Result /> },
      { path: 'result/:id/:catId', element: <Result /> },                  // D-26 deep-link
      { path: 'share/:id', element: <Share /> },
      { path: 'import', element: <Import /> },
      { path: 'compare', element: <Compare /> },                           // reads ?ids=…
      { path: 'settings', element: <Settings /> },
      { path: 'map/:id/settings', element: <MapSettings /> },
      { path: 'intro', element: <Intro /> },
      { path: 'about', element: <Intro /> },                               // alias per D-24
      { path: 'design-system', element: <DesignSystem /> },                // (Phase 1) — kept
    ],
  },
])
```

**`<RootLayout />` skeleton:**

```typescript
// src/routes/RootLayout.tsx — D-13
import { Outlet } from 'react-router-dom'
import { Nav } from '@/components/Nav'
import { AgeGate } from '@/components/AgeGate'
import { WizardHost } from '@/components/WizardHost'
import { DialogHost } from '@/components/DialogHost'
import { Toaster } from '@/components/ui/sonner'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { useStore } from '@/lib/storage/store'
import { useToast } from '@/lib/hooks/useToast'
import { useEffect } from 'react'

export function RootLayout() {
  useScrollToTop()

  // Subscribe to lastSaveError → toast (CORE-02 surfacing)
  const lastSaveError = useStore((s) => s.lastSaveError)
  const clearLastSaveError = useStore((s) => s.clearLastSaveError)
  const { toast } = useToast()
  useEffect(() => {
    if (!lastSaveError) return
    toast.error(lastSaveError.message)
    clearLastSaveError()
  }, [lastSaveError, toast, clearLastSaveError])

  return (
    <>
      <Nav />
      <main id="app" className="min-h-screen">
        <Outlet />
      </main>
      <Toaster richColors position="bottom-center" />
      <DialogHost />
      <AgeGate />
      <WizardHost />
    </>
  )
}
```

### Pattern 2: `useScrollToTop()` (SHELL-05)

**What:** Scroll to top on every navigation. v1.0 `route()` calls `window.scrollTo(0, 0)` at the end (`public/legacy/js/app.js:891`).

**When to use:** Once in `<RootLayout />`. Not on POP navigation (back/forward) — that's the browser's job.

**Example:**

```typescript
// src/hooks/useScrollToTop.ts
import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function useScrollToTop(): void {
  const { pathname, search } = useLocation()
  const navType = useNavigationType()
  useEffect(() => {
    if (navType === 'POP') return // browser restores; don't fight
    window.scrollTo(0, 0)
  }, [pathname, search, navType])
}
```

### Pattern 3: `<Nav />` with desktop top-bar + mobile `<Sheet />` drawer (D-15)

**What:** A persistent global nav. Desktop renders horizontal links; mobile shows a hamburger that opens a shadcn `Sheet` drawer.

**Example (skeleton):**

```typescript
// src/components/Nav.tsx — D-15
import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ProfilePicker } from './ProfilePicker'
import { ThemeToggle } from './ThemeToggle'
import { LangToggle } from './LangToggle'
import { t } from '@/lib/i18n/i18n'

export function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  const items = (
    <>
      <ProfilePicker />
      <NavLink to="/import">{t('nav_import')}</NavLink>
      <NavLink to="/compare">{t('nav_compare')}</NavLink>
      <NavLink to="/settings">{t('nav_settings')}</NavLink>
      <NavLink to="/intro">{t('nav_about')}</NavLink>
      <ThemeToggle />
      <LangToggle />
    </>
  )

  return (
    <nav id="nav" className="…">
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4">{items}</div>
      {/* Mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="md:hidden">☰</SheetTrigger>
        <SheetContent side="left">{items}</SheetContent>
      </Sheet>
    </nav>
  )
}
```

### Pattern 4: Imperative `dialog({...}): Promise<value>` over Radix Dialog (D-28)

**What:** Replace v1.0's `dialog({...})` (at `public/legacy/js/app.js:379`) with a Zustand-slice-backed queue + a single `<DialogHost />` portal mounted in `<RootLayout />`. The helper `dialog({title, body, actions})` returns a `Promise<value>` that resolves when the user picks an action.

**When to use:** Confirm-flow callsites (template-warning, discard-changes, delete-confirm). Prefer the **declarative** `<Dialog open={…} onOpenChange={…}>` for in-tree dialogs (profile edit, share passphrase prompt, per-item scale override).

**Example (skeleton):**

```typescript
// src/lib/dialog/dialogQueue.ts — D-28 Zustand slice
import { create } from 'zustand'

export interface DialogAction<T> {
  label: string
  kind?: 'primary' | 'ghost' | 'danger'
  value: T
}

export interface DialogRequest<T = unknown> {
  id: string
  title?: string
  body: React.ReactNode | ((close: (v: T) => void) => React.ReactNode)
  actions: DialogAction<T>[]
  dismissable?: boolean
  resolve: (v: T | null) => void
}

interface DialogQueueState {
  queue: DialogRequest[]
  push: (req: DialogRequest) => void
  shift: (id: string) => void
}

export const useDialogQueue = create<DialogQueueState>((set) => ({
  queue: [],
  push: (req) => set((s) => ({ queue: [...s.queue, req] })),
  shift: (id) => set((s) => ({ queue: s.queue.filter((r) => r.id !== id) })),
}))

// Public API
export function dialog<T>(opts: Omit<DialogRequest<T>, 'id' | 'resolve'>): Promise<T | null> {
  return new Promise((resolve) => {
    const id = crypto.randomUUID()
    useDialogQueue.getState().push({ ...opts, id, resolve })
  })
}
```

```typescript
// src/components/DialogHost.tsx — portal-mounted imperative renderer
import { useDialogQueue } from '@/lib/dialog/dialogQueue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function DialogHost() {
  const queue = useDialogQueue((s) => s.queue)
  const shift = useDialogQueue((s) => s.shift)

  return (
    <>
      {queue.map((req) => {
        const close = (v: unknown) => {
          req.resolve(v as never)
          shift(req.id)
        }
        return (
          <Dialog
            key={req.id}
            open={true}
            onOpenChange={(o) => { if (!o && req.dismissable !== false) close(null) }}
          >
            <DialogContent>
              {req.title && <DialogHeader><DialogTitle>{req.title}</DialogTitle></DialogHeader>}
              <div>{typeof req.body === 'function' ? req.body(close) : req.body}</div>
              <DialogFooter>
                {req.actions.map((a, i) => (
                  <Button key={i} variant={a.kind === 'primary' ? 'default' : a.kind === 'danger' ? 'destructive' : 'ghost'} onClick={() => close(a.value)}>
                    {a.label}
                  </Button>
                ))}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })}
    </>
  )
}
```

**Accessibility note:** Because the wrapper sits on top of Radix Dialog, it gets focus trap, ESC dismiss, `role="dialog"`, `aria-modal="true"`, focus return to the trigger element, and screen-reader announcements for free. Radix is the substrate that shadcn vends — see Accessibility section below for verification points.

### Pattern 5: Sonner Toast (`useToast`) — D-27

**What:** Wrap the global `toast()` from `sonner` in a `useToast()` hook so call sites have a stable contract and project-default durations.

**Toaster mount:** In `<RootLayout />` once. Position `bottom-center` matches v1.0's `.toast` element behaviour at `public/legacy/js/app.js:511`. Auto-dismiss after 1900ms in v1.0 — `<Toaster duration={1900} />` preserves this.

**Example:**

```typescript
// src/lib/hooks/useToast.ts
import { toast as sonner } from 'sonner'

export function useToast() {
  return {
    toast: {
      message: (msg: string) => sonner(msg, { duration: 1900 }),
      success: (msg: string) => sonner.success(msg, { duration: 1900 }),
      error: (msg: string) => sonner.error(msg, { duration: 3500 }),
    },
  }
}
```

Source: [Sonner shadcn docs](https://ui.shadcn.com/docs/components/radix/sonner) `[CITED]`

### Pattern 6: `useSwipe` and `useKeydown` (D-09)

**What:** Thin wrappers around `@use-gesture/react`'s `useDrag` and DOM key events with project-default config. `axis: 'x'` so vertical scroll passes through; `threshold: 40` matching v1.0; `touch-action: pan-y` on the swipeable element so the browser natively scrolls vertically while horizontal drag is captured.

**When to use:** Single-card questionnaire (`<SingleMode />`), Wizard step swipe (`<WizardHost />`), scale-editor reorder (`<Settings />`).

**Example:**

```typescript
// src/lib/hooks/useSwipe.ts — D-09
import { useDrag } from '@use-gesture/react'
import { useReducedMotion } from './useReducedMotion'

interface UseSwipeOpts {
  onLeft?: () => void
  onRight?: () => void
  threshold?: number  // default 40 to match v1.0
}

export function useSwipe(opts: UseSwipeOpts) {
  const reduced = useReducedMotion()
  return useDrag(
    ({ swipe: [sx], movement: [mx], last, cancel }) => {
      // Use sonner's "swipe" detection if available; fall back to threshold on `last`
      if (last) {
        const t = opts.threshold ?? 40
        if (mx < -t) opts.onLeft?.()
        else if (mx > t) opts.onRight?.()
      }
    },
    {
      axis: 'x',
      pointer: { touch: true },
      filterTaps: true,
      // Under reduced-motion, disable rubberband/spring visuals — handler still fires
      rubberband: reduced ? 0 : 0.15,
    },
  )
}
```

**Touch-action requirement:** On the bound element add `style={{ touchAction: 'pan-y' }}` so vertical browser scroll continues to work on Android (this is the fix for the Android scroll-vs-swipe pitfall noted in `.planning/codebase/CONCERNS.md`).

Sources: [@use-gesture options docs](https://use-gesture.netlify.app/docs/options/), [GitHub use-gesture issue 216 — scroll prevention](https://github.com/pmndrs/use-gesture/issues/216) `[CITED]`

### Pattern 7: Charts — `useSpiderInteraction` + declarative SVG (D-04, D-06)

**What:** Each chart returns JSX. A shared `useSpiderInteraction()` hook owns `{ activeAxis, onAxisEnter, onAxisLeave, onAxisTap }`. The `<Result />` route owns the active-category state and passes it down to per-category sub-charts.

**Math helpers (pure, lift from `public/legacy/js/charts.js`):**

```typescript
// src/lib/charts/math.ts — D-04 pure helpers
// Source: public/legacy/js/charts.js:52, :67, :76, :104, :114, :119, :324, :460, :469
import type { MutableScaleStep } from '@/lib/data/types'

export function scaleMaxValue(scale: readonly MutableScaleStep[]): number { /* ... */ }

export function categoryAverage(
  answers: AnswersBlob | undefined,
  catId: string,
  scale: readonly MutableScaleStep[],
): { value: number; norm: number } | null { /* ... */ }

export function answerScaleKey(entry: AnswerCell | undefined): string | null { /* ... */ }
export function answerAvgValue(entry: AnswerCell | undefined, scale: readonly MutableScaleStep[]): /* ... */
export function closestScaleEntry(value: number, scale: readonly MutableScaleStep[]): MutableScaleStep { /* ... */ }
export function pickCategoryAxes(datasets: ChartDataset[]): string[] { /* ... */ }
export function labelFontSize(axisCount: number): number { return Math.round(Math.max(18, Math.min(34, 220 / axisCount))) }
export function wrapLabel(text: string, maxChars: number): string[] { /* ... */ }
export function polarToCartesian(i: number, n: number, radius: number, cx: number, cy: number): [number, number] {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2
  return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]
}
```

**Spider component skeleton:**

```typescript
// src/components/charts/Spider.tsx — D-04 fully declarative SVG
import { useSpiderInteraction } from '@/lib/hooks/useSpiderInteraction'
import { polarToCartesian, labelFontSize, wrapLabel, categoryAverage, closestScaleEntry, pickCategoryAxes } from '@/lib/charts/math'
import { CATEGORIES } from '@/lib/data/data'

export interface ChartDataset {
  name: string
  color: string
  answers: AnswersBlob
  scale: MutableScaleStep[]
}

export function Spider({ datasets, size = 640, axes: axesOverride }: { datasets: ChartDataset[]; size?: number; axes?: string[] }) {
  const { activeAxis, onAxisEnter, onAxisLeave, onAxisTap } = useSpiderInteraction(datasets)
  const candidates = axesOverride ?? pickCategoryAxes(datasets)
  const axes = candidates.map((id) => {
    const c = CATEGORIES.find((c) => c.id === id)
    return { key: id, title: c?.title ?? id, icon: c?.icon ?? '•' }
  })
  const fs = labelFontSize(axes.length)
  const pad = Math.max(100, Math.min(145, Math.ceil(fs * 4.2)))
  const r = size / 2 - pad
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="rs-chart-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Spider chart">
        {/* Rings */}
        {[1, 2, 3, 4, 5].map((g) => {
          const rr = (r * g) / 5
          const pts = axes.map((_, i) => polarToCartesian(i, axes.length, rr, cx, cy))
          return <polygon key={g} className="rs-grid-ring" points={pts.map((p) => p.join(',')).join(' ')} />
        })}
        {/* Spokes */}
        {axes.map((_, i) => {
          const [x, y] = polarToCartesian(i, axes.length, r, cx, cy)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="rs-grid-spoke" />
        })}
        {/* Datasets — text labels via React text node ⇒ XSS-safe by construction (D-05) */}
        {datasets.map((ds, di) => {
          const pts = axes.map((_, i) => {
            const avg = categoryAverage(ds.answers, axes[i].key, ds.scale)
            const norm = avg ? Math.max(0, Math.min(1, avg.norm)) : 0
            return polarToCartesian(i, axes.length, r * norm, cx, cy)
          })
          return (
            <polygon key={di} points={pts.map((p) => p.join(',')).join(' ')} style={{ fill: ds.color, stroke: ds.color }} />
          )
        })}
        {/* Axis labels with per-handler event binding */}
        {axes.map((ax, i) => {
          const [lx, ly] = polarToCartesian(i, axes.length, r + fs * 1.6, cx, cy)
          const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'
          return (
            <g key={i} onPointerEnter={() => onAxisEnter(ax.key)} onPointerLeave={onAxisLeave} onClick={() => onAxisTap(ax.key)}>
              <text x={lx} y={ly} textAnchor={anchor} fontSize={fs} className={activeAxis === ax.key ? 'is-active' : undefined}>
                {ax.title}  {/* React text node — XSS-safe */}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
```

### Pattern 8: Single-card swipe questionnaire (the hardest view) — QUEST-03

**What:** Renders a stack of cards. The peek-next card sits behind the active one (offset / scaled). Swipe-left advances; swipe-right goes back; keyboard `1`–`N` selects a scale step then auto-advances; `←`/`→` navigates; Space skips.

**Data flow:**

```text
<SingleMode profile={…} result={…}>
 ├─ useReducer({cursor, dir}) — cursor is flatItemIndex; dir is animation direction
 ├─ const items = flatItemsForResult(result)   // pure helper (lifted from app.js:2134)
 ├─ const cur = items[cursor]
 ├─ const peekNext = items[cursor + 1]
 ├─ render order: peek (z=0) then cur (z=1)
 ├─ const bind = useSwipe({ onLeft: () => advance(+1, 'left'), onRight: () => advance(-1, 'right') })
 ├─ useKeydown({
 │     ArrowRight: () => advance(+1, 'right'),
 │     ArrowLeft:  () => advance(-1, 'left'),
 │     ' ':        () => advance(+1, 'left'),     // skip
 │     '1'..'N':   (k) => { setAnswer(SCALE[k-1].key); setTimeout(()=>advance(+1,'right'), 420) },
 │   })
 ├─ const reduced = useReducedMotion()
 │  // Under reduced-motion, omit the data-state transitions; advance instantly.
 └─ Card has:
    ├─ category header
    ├─ <h1> item label (React text-node — XSS safe)
    ├─ <ScalePicker /> (or two for G/R categories)
    ├─ <input type="text" /> note
    ├─ <Button>Edit scale for this item</Button>  → opens <Dialog /> (D-33)
    ├─ Back / Next buttons (kbd: ← / →)
    └─ data-state attribute drives Tailwind transitions
```

**Per-item scale override (D-33):** opens a declarative `<Dialog />`; if the user already answered, an interstitial `dialog({title, body: 'Changing scale will reset this answer', actions: …})` confirms first (the imperative pattern). Implementation calls `setStore(it, prev => ({ ...prev, itemScale: newScale }))` and `result.answers[catId][item]` is rewritten.

**Pointer-mode awareness:** `useIsCoarsePointer()` lets the component conditionally show swipe hints vs keyboard hints (`t('q_single_hint_mobile')` vs `t('q_single_hint_desktop')`).

```typescript
// src/lib/hooks/useIsCoarsePointer.ts — mirrors public/legacy/js/app.js:2462
import { useEffect, useState } from 'react'

export function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(pointer: coarse)')
    setCoarse(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return coarse
}
```

### Pattern 9: Compare URL parsing (D-25, D-35)

**What:** `useSearchParams()` reads `?ids=a,b,imp:c`; split on comma; slice to 4; map to lookup; render. Surface a toast when >4 are passed.

```typescript
// src/routes/Compare.tsx — D-25, D-35
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { useToast } from '@/lib/hooks/useToast'
import { useEffect } from 'react'

export function Compare() {
  const [params] = useSearchParams()
  const rawIds = (params.get('ids') ?? '').split(',').filter(Boolean)
  const truncated = rawIds.slice(0, 4)
  const { toast } = useToast()
  useEffect(() => {
    if (rawIds.length > 4) toast.message(t('compare_too_many_truncated'))
  }, [rawIds.length, toast])

  const datasets = truncated.map((id) => {
    if (id.startsWith('imp:')) {
      const imp = useStore.getState().getImport(id.slice(4))
      return imp ? mapImportToDataset(imp) : null
    }
    const r = useStore.getState().getResult(id)
    return r ? mapResultToDataset(r) : null
  }).filter(Boolean)

  // … render compare view
}
```

### Pattern 10: Deep-link `#/result/:id/:catId` (D-26)

**What:** On mount, if `useParams().catId` is present, scroll the matching `<CategorySection id={catId}>` into view and open its drill-down state.

```typescript
// src/routes/Result.tsx — D-26
import { useParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export function Result() {
  const { id, catId } = useParams<{ id: string; catId?: string }>()
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  useEffect(() => {
    if (!catId) return
    const el = sectionRefs.current.get(catId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Open the drill-down for this category
      // (state managed locally in <Result />)
    }
  }, [catId])
  // …
}
```

### Pattern 11: `useTemplateWarning` hook (D-30)

**What:** A hook that returns `confirmIfTemplate(): Promise<boolean>`. Called before every answer mutation in List + Single modes. v1.0 source: `public/legacy/js/app.js:1049`.

```typescript
// src/lib/hooks/useTemplateWarning.ts — D-30
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import type { Result } from '@/lib/storage/types'
import { t } from '@/lib/i18n/i18n'

export function useTemplateWarning(result: Result | null) {
  const saveResult = useStore((s) => s.saveResult)
  return {
    confirmIfTemplate: async (): Promise<boolean> => {
      if (!result) return true
      if (!result.seededFromImportId && !result.seededFromResultId) return true
      if (result.templateWarningDisabled) return true
      let disableForever = false
      const choice = await dialog<'ok' | 'cancel'>({
        title: t('template_warning_title'),
        body: (close) => (
          <div>
            <p>{t('template_warning')}</p>
            <label>
              <input type="checkbox" onChange={(e) => { disableForever = e.target.checked }} />
              {t('template_warning_disable')}
            </label>
          </div>
        ),
        actions: [
          { label: t('btn_cancel'), kind: 'ghost', value: 'cancel' },
          { label: t('btn_continue_anyway'), kind: 'primary', value: 'ok' },
        ],
      })
      if (choice !== 'ok') return false
      if (disableForever) {
        saveResult({ ...result, templateWarningDisabled: true })
      }
      return true
    },
  }
}
```

**Note: `Result` type needs new fields.** Phase 2 must extend `src/lib/storage/types.ts` to add `seededFromImportId?: string`, `seededFromResultId?: string`, `templateWarningDisabled?: boolean` — these exist in v1.0 results in the wild but are missing from the Phase 1 type. Same for `Settings`: add `ageConfirmed?: boolean` and `wizardDone?: boolean`.

### Pattern 12: Typed `RICH_TEXT_KEYS` allow-list (D-12)

**What:** Some v1.0 i18n strings contain inline `<strong>` / `<em>` / `<a>`. Render those via `dangerouslySetInnerHTML` **only** for keys in the allow-list. User-supplied content never reaches this path.

```typescript
// src/lib/i18n/richText.ts — D-12
import type { TranslationKey } from './en'

export const RICH_TEXT_KEYS = [
  'intro_privacy_body',
  'intro_credits_body',
  'welcome_about_body',
  // … list every key with HTML markup
] as const satisfies readonly TranslationKey[]

export type RichTextKey = typeof RICH_TEXT_KEYS[number]

export function isRichTextKey(k: TranslationKey): k is RichTextKey {
  return (RICH_TEXT_KEYS as readonly string[]).includes(k)
}
```

```typescript
// Use:
import { t } from '@/lib/i18n/i18n'
import { isRichTextKey } from '@/lib/i18n/richText'

function TranslatedText({ k }: { k: TranslationKey }) {
  if (isRichTextKey(k)) {
    return <span dangerouslySetInnerHTML={{ __html: t(k) }} />
  }
  return <span>{t(k)}</span>
}
```

**Test:** A unit test asserts every key in `RICH_TEXT_KEYS` exists in both EN and DE maps (compile-time `satisfies` already enforces it's a `TranslationKey`).

### Anti-Patterns to Avoid

- **Per-call `useStore.getState()`:** Use selector subscriptions via `useStore(s => …)` so React re-renders correctly. `getState()` is reserved for non-React callsites (i18n module, side-effect handlers).
- **`<svg dangerouslySetInnerHTML={…}>` for chart output:** Defeats RESULT-07. Always emit JSX nodes (D-04, D-05).
- **Hand-rolled focus trap:** Radix gives this for free. Use `<Dialog />` / `<AlertDialog />` wrappers, not your own modal element.
- **Reading `localStorage` directly:** Always go through the Zustand store actions. v1.0 read `localStorage` on every method call (`.planning/codebase/CONCERNS.md` notes the perf hit); Phase 1 fixed this with the in-memory cache.
- **`location.hash = …` writes:** Use `useNavigate()` from `react-router-dom`. Direct hash writes bypass the router's data flow.
- **`window.scrollTo` inside leaf routes:** Owned by `useScrollToTop()` in the root layout (Pattern 2). Leaf routes that need to scroll to a specific element use `el.scrollIntoView()` (Pattern 10).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal / dialog | Custom overlay + ESC handler + focus trap | Radix `Dialog` / `AlertDialog` via shadcn | Focus trap, ESC, ARIA roles, focus return, portal — all free, all accessible |
| Toast | Custom DOM element + setTimeout | `sonner` via `npx shadcn@latest add sonner` | Stacking, swipe-to-dismiss, action buttons, ARIA live region, queue mgmt |
| Mobile nav drawer | Custom slide-in overlay | shadcn `Sheet` | Same Radix substrate as Dialog — focus trap, ESC, ARIA |
| Touch swipe | Raw touchstart/touchmove/touchend | `@use-gesture/react` `useDrag` with `axis: 'x'` | Handles pointer events, axis lock, mouse-on-touch-devices, scroll-vs-swipe |
| Active-link state | `className` toggle on every render | `<NavLink>` from `react-router-dom` | Provides `aria-current`, callback `className`, exact-match resolution |
| Hash routing | Custom `hashchange` listener + view dispatch | `createHashRouter` + `<RouterProvider />` | v7 data router gives nested routes, params, loaders, `<Outlet />` |
| URL params parsing | `URLSearchParams` ad-hoc | `useSearchParams()` from `react-router-dom` | Subscriptions + reactive updates |
| Pointer-mode detection | Document-level event listeners | `matchMedia('(pointer: coarse)')` | One API, supports media query change events |
| Reduced-motion detection | Custom CSS only | `matchMedia('(prefers-reduced-motion: reduce)')` + Tailwind `motion-reduce:` variants | Need TS to disable spring physics in `useDrag` etc. |
| Form state | `react-hook-form` | Plain `useState` / `useReducer` (per D-18) | Phase 2 forms are ≤5 fields; library is overkill |

**Key insight:** Phase 2 is mostly a **mechanical port** of `viewX` functions to route components. The big traps are (1) thinking you need a charting library (no — v1.0 hand-rolls SVG and so do we) and (2) thinking you can skip the imperative `dialog({...})` shim (no — too many v1.0 call sites use it; declarative-only would force ~30 inline `useState` flags).

## Common Pitfalls

### Pitfall 1: Android scroll-vs-swipe (LOCKED FIX via D-08)

**What goes wrong:** Vertical scroll on touch-only Android gets misinterpreted as horizontal swipe. v1.0 has a fix attempt at `public/legacy/js/app.js:2700–2730` (`Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > 30` guard).
**Why it happens:** Raw touch events don't distinguish "I'm starting to scroll" from "I'm starting to swipe" until enough movement has happened. By then, both fire.
**How to avoid:** Use `@use-gesture/react` with `axis: 'x'` and `touch-action: 'pan-y'` on the bound element. The browser natively cancels vertical scroll only when horizontal movement is intentional.
**Warning signs:** Cards advance accidentally when the user scrolls the page on a phone. CONCERNS.md flags this as recurring.

### Pitfall 2: Double-tap zoom on iOS

**What goes wrong:** Tapping a scale step twice quickly zooms the viewport instead of registering both taps.
**How to avoid:** Either set `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">` (intrusive but bulletproof) OR set `touch-action: manipulation` on the buttons (preferred — keeps pinch-zoom usable, only disables double-tap zoom).
**Where:** Scale picker, swipe cards, every tappable button on `(pointer: coarse)`.

### Pitfall 3: `dialog({...})` race when stacked

**What goes wrong:** Two consecutive `dialog(...)` calls without `await` produce overlapping modals; Radix only renders one Dialog at a time so the second one is lost.
**How to avoid:** The `<DialogHost />` queue serialises requests; only the first item in `queue` is rendered, the next one becomes the active dialog after the first resolves.

### Pitfall 4: Custom-items duplicate-id edge case

**What goes wrong:** Adding a custom item with the same name as a built-in category item creates two entries with the same key in `result.answers[catId]` — one in `base`, one in `__custom`.
**How to avoid:** Check `cat.items.includes(name) || answers.__custom[name]` before insertion and show a toast (v1.0 pattern at `public/legacy/js/app.js:2207`). Port this guard verbatim.

### Pitfall 5: Hidden items rendering rules

**What goes wrong:** v1.0 `result.answers[catId].__hidden` is a `Record<string, true>` of removed items. List mode filters these out, but **bar diff** must also filter them (matching v1.0 `renderCategoryBars` at `public/legacy/js/charts.js:380`).
**How to avoid:** Centralise the filter in `lib/charts/math.ts` so List, Single, and Bar diff all consume the same `enabledItemsForCat(result, catId)` helper.

### Pitfall 6: German gendered translations

**What goes wrong:** DE strings use `*innen` and `*r` suffixes that change the substring count vs EN. If chart labels word-wrap by character count (v1.0 `labelFontSize` at `public/legacy/js/charts.js:114`), DE labels can break differently from EN.
**How to avoid:** `wrapLabel(text, maxChars)` is the same code path for both; eyeball the result on the DesignSystem page after porting.

### Pitfall 7: `dangerouslySetInnerHTML` regression (RESULT-07)

**What goes wrong:** A future contributor adds a chart label via `<text dangerouslySetInnerHTML={…}>` to "render bold text". XSS surface re-opens.
**How to avoid:** D-05 commits to React text nodes only in chart components. Add a Vitest snapshot test that feeds `<script>alert(1)</script>` as `ds.name` and asserts the output SVG `outerHTML` doesn't contain the substring `<script`.

### Pitfall 8: Quota-exceeded silently regressed

**What goes wrong:** Phase 1's `relationshapePersist` middleware catches `QuotaExceededError` and sets `lastSaveError`. If the Phase 2 root layout doesn't subscribe and toast, the user sees no feedback.
**How to avoid:** `<RootLayout />` skeleton above includes the subscription. Test: write a unit test that simulates a quota error on `useStore.saveResult` and asserts a toast appears.

### Pitfall 9: SW caching old assets across phase boundaries

**What goes wrong:** vite-plugin-pwa generates a SW that caches `index.html` at the new app. Phase 2 changes the route table but the cached `index.html` is unchanged so the SW thinks nothing's new.
**How to avoid:** `registerType: 'autoUpdate'` (Phase 1 default in `vite.config.ts:14`) handles this — the SW checks the precache manifest on every load. **Risk: low** for Phase 2 because the app shell is the same `index.html`; the change is in the bundled JS which gets a new content hash.

### Pitfall 10: Sheet drawer doesn't close on route change

**What goes wrong:** Mobile hamburger opens the Sheet; user taps a nav link; the route changes but the Sheet stays open.
**How to avoid:** `useEffect(() => setOpen(false), [pathname])` inside `<Nav />` (Pattern 3 above).

### Pitfall 11: Same-hash re-render

**What goes wrong:** v1.0's `navigate(hash)` handles the `location.hash === target` case by calling `route()` directly (`public/legacy/js/app.js:36`). React Router v7 handles this automatically via the data router — no extra code needed. Pitfall is **assuming** you need to replicate v1.0's manual handling. You don't.

### Pitfall 12: Wizard re-shows on second visit

**What goes wrong:** First-visit gating relies on `Store.isFirstVisit()` (v1.0 at `public/legacy/js/storage.js:236`) which reads `settings.wizardSeen`. Phase 2's `<WizardHost />` must persist the same `wizardSeen` field — or equivalently `wizardDone` per D-23 — but the Phase 1 `Settings` type doesn't include this field. **Action for planner:** add `wizardDone?: boolean` to `Settings`.

### Pitfall 13: Age-gate storage key drift

**What goes wrong:** v1.0 uses a **separate** localStorage key `rs-age-confirmed` (`public/legacy/js/app.js:810`) — NOT part of the `relationshape.v1` blob. Phase 2's `<AgeGate />` reading from `useStore` will miss this key for upgraded v1.0 users.
**How to avoid:** On first hydration, the `<AgeGate />` should check **both** `useStore.settings.ageConfirmed` AND `localStorage.getItem('rs-age-confirmed') === '1'`; treat either as confirmed; migrate the legacy flag into the unified `settings.ageConfirmed` on first persist. **This is a 5-line one-time migration block.**

### Pitfall 14: `EMOJI_BANK` duplicates between v1.0 storage.js and v1.0 app.js

**What goes wrong:** `public/legacy/js/storage.js:306` exports `EMOJI = ['🌷', '🌻', …]` (14 entries for random profile defaults) — `public/legacy/js/app.js:97` exports `EMOJI_BANK = [70+ entries]` (the emoji picker grid). They are different. The Phase 1 Zustand store at `src/lib/storage/store.ts:32` only ports the 14-entry version (for default profile emoji). Phase 2 needs the 70+ entry version for the picker grid (D-21).
**How to avoid:** Copy the full bank into `src/lib/data/emoji.ts` as a new export. Keep the 14-entry `EMOJI_BANK` in the store for random defaults.

## Runtime State Inventory

> Phase 2 is greenfield React component work — NOT a rename / refactor / migration. No grep-able string change drives this phase. Therefore this section's categories should be **empty**.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — all data already in `localStorage["relationshape.v1"]` from Phase 1; no schema rename | none |
| Live service config | **None** — no external services; no n8n / Datadog / Tailscale | none |
| OS-registered state | **None** — no scheduled tasks / pm2 / launchd | none |
| Secrets/env vars | **None** — app has zero secrets; no `.env`, no API keys | none |
| Build artifacts | **None — verified by inspecting Phase 1's verify chain at `package.json:scripts.verify`** | none |

**Nothing found in any category.** Phase 2 is pure new React code; no v1.0-era runtime state needs scrubbing.

**One adjacent concern that is NOT a runtime-state issue but worth flagging:** the legacy localStorage key `rs-age-confirmed` (separate from `relationshape.v1`) — handled by the 5-line migration in Pitfall 13.

## Code Examples

### Plan-1 example: `<RootLayout />` + extended router

See Pattern 1, Pattern 2 above. Verified against:
- [React Router v7 docs — createHashRouter](https://api.reactrouter.com/v7/) `[CITED]`
- Phase 1 `src/router.tsx` (currently 14 lines; expands to ~30 lines for the full table)

### Plan-2 example: install + wire shadcn primitives

```bash
# Run these in plan 2 task order:
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add sheet
npx shadcn@latest add popover
npx shadcn@latest add tabs
npx shadcn@latest add sonner
pnpm add @use-gesture/react@10.3.1
```

Then create the wrappers:

```typescript
// src/components/ui/dialog.tsx is auto-generated by shadcn; no edits needed.
// src/lib/dialog/dialog.ts (the public helper):
export { dialog } from './dialogQueue'  // re-export
```

### Plan-3 example: Profile create form

```typescript
// src/routes/ProfileEdit.tsx — PROFILE-03
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from '@/components/EmojiPicker'
import { t } from '@/lib/i18n/i18n'

const PALETTE = ['#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#22c55e', '#e11d48']

export function ProfileEdit() {
  const { id } = useParams<{ id?: string }>()
  const existing = useStore((s) => (id ? s.profiles.find((p) => p.id === id) : null))
  const createProfile = useStore((s) => s.createProfile)
  const updateProfile = useStore((s) => s.updateProfile)
  const navigate = useNavigate()

  const [name, setName] = useState(existing?.name ?? '')
  const [pronouns, setPronouns] = useState(existing?.pronouns ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🌷')
  const [color, setColor] = useState(existing?.color ?? PALETTE[0])
  const [notes, setNotes] = useState(existing?.notes ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (id && existing) updateProfile(id, { name, pronouns, emoji, color, notes })
    else createProfile({ name, pronouns, emoji, color, notes })
    navigate('/')
  }

  return (
    <form onSubmit={onSubmit} className="page narrow form">
      <h1>{existing ? t('btn_edit_profile') : t('new_profile_btn')}</h1>
      <label>{t('profile_name_label')}
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>{t('profile_pronouns_label')}
        <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
      </label>
      <label>{t('profile_emoji_label')}
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </label>
      <label>{t('profile_color_label')}
        <div className="palette-row">
          {PALETTE.map((p) => (
            <button key={p} type="button" className={p === color ? 'is-on' : ''} style={{ background: p }} onClick={() => setColor(p)} />
          ))}
        </div>
      </label>
      <label>{t('profile_notes_label')}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Button type="submit">{t('btn_save')}</Button>
    </form>
  )
}
```

### Plan-6 example: Backup export + import (D-39)

```typescript
// src/routes/Settings.tsx — SETTINGS-04 segment
import { useStore } from '@/lib/storage/store'
import { useState } from 'react'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/useToast'

export function DataManagement() {
  const { toast } = useToast()
  const replaceAll = useStore((s) => s.replaceAll)
  const snapshot = useStore.getState  // for export-time read

  function exportBackup() {
    const data = {
      profiles: snapshot().profiles,
      results: snapshot().results,
      imports: snapshot().imports,
      settings: snapshot().settings,
      scale: snapshot().scale,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relationshape-backup-${new Date().toISOString().split('T')[0]}.v1.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('backup_exported'))
  }

  async function importBackup(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      // Gate behind <AlertDialog /> confirmation BEFORE calling replaceAll
      const ok = await dialog<boolean>({
        title: t('backup_restore_confirm_title'),
        body: <p>{t('backup_restore_confirm_body')}</p>,
        actions: [
          { label: t('btn_cancel'), kind: 'ghost', value: false },
          { label: t('btn_restore'), kind: 'danger', value: true },
        ],
      })
      if (!ok) return
      replaceAll(parsed as Partial<PersistedShape>)
      toast.success(t('backup_imported'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const [deleteText, setDeleteText] = useState('')
  function clearAllData() {
    if (deleteText !== 'DELETE') return
    replaceAll({
      profiles: [],
      results: [],
      imports: [],
      settings: { theme: 'auto' },
      scale: [...DEFAULT_SCALE] as MutableScaleStep[],
    })
    toast.success(t('cleared_all_data'))
  }

  return (
    <section className="page-section">
      <Button onClick={exportBackup}>{t('btn_export_backup')}</Button>
      <input type="file" accept=".json" onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">{t('btn_clear_all_data')}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>{t('clear_all_title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('clear_all_body')}</AlertDialogDescription>
          <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Type DELETE to confirm" />
          <AlertDialogCancel>{t('btn_cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={deleteText !== 'DELETE'} onClick={clearAllData}>{t('btn_confirm_delete')}</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
```

## State of the Art

| Old Approach (v1.0) | Current Approach (Phase 2) | When Changed | Impact |
|---------------------|----------------------------|--------------|--------|
| Hash-router via custom `route()` switch | `createHashRouter` with `<Outlet />` nested routes | React Router v7 (2024-12) | Same URL shape; declarative route table; deep-linking and search-params via hooks |
| Imperative `dialog({...})` building DOM | Radix Dialog substrate + portal `<DialogHost />` + queue | shadcn/ui + Radix 1.x | Free focus trap, ESC, ARIA, focus return; same imperative `dialog(...)` ergonomics |
| Custom toast (`showToast` + `.toast` element + 1900ms setTimeout) | `sonner` 2.0.7 via shadcn | shadcn deprecated `<Toast />` in 2025 in favour of Sonner | Stacking, swipe-to-dismiss, ARIA live region |
| Raw `touchstart/touchmove/touchend` | `@use-gesture/react` `useDrag` with `axis: 'x'` | use-gesture 10.x | Native scroll-vs-swipe coexistence; pointer-events unification |
| Plain `<svg innerHTML='…'>` chart injection | Declarative React + SVG JSX | React 19 + RESULT-07 audit | XSS-safe by construction; React-controlled state instead of `data-bound` flags |
| String-based `setState` toggles (`is-on` CSS class) | `data-state` attributes + Tailwind variants | shadcn convention | Composable with Radix primitives |
| Two `<link rel="stylesheet">` files (~111 KB combined CSS) | Tailwind v4 + `@theme` (Phase 1 done) | Tailwind v4 release 2025 | One tokens surface; tree-shaken utilities |

**Deprecated / outdated:**

- shadcn legacy `<Toast />` component is deprecated. Use Sonner.
- React Router v6 `<Routes>` + `<Route>` declarative components are still supported in v7 but the data-router (`createHashRouter`) is the recommended path forward — and is already the locked Phase 1 choice (D-02).
- Tailwind v3-style `tailwind.config.js` `theme.extend` is replaced by `@theme {}` in the CSS (Phase 1 D-18 already adopts this).
- `react-use-gesture` (the old package name) is superseded by `@use-gesture/react`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@use-gesture/react` 10.3.1 works correctly with React 19 (peer dep is `react: >= 16.8.0`; no React 19 issues reported in maintained issue tracker as of this research session). Project plans depend on this. | Standard Stack, Pattern 6 | Worst case: install fails or runtime hook errors. Fallback: pin to known-working version + raise issue / use `--legacy-peer-deps`. **LOW RISK** — peer dep range explicitly includes React 19. |
| A2 | Sonner 2.0.7 + Radix `Dialog` 1.1.15 + shadcn-vendored CSS work together under Tailwind v4. shadcn docs confirm Tailwind v4 + React 19 support, but verbatim composition not tested in this codebase yet. | Standard Stack, Pattern 5 | Tooling friction (CSS variable name mismatches; class-merge issues). Mitigated by adding one shadcn primitive in plan 2 task 1 as a smoke test before adding all six. |
| A3 | The v1.0 legacy `rs-age-confirmed` localStorage key migration (Pitfall 13) needs a 5-line block in `<AgeGate />`. Untested in this session; relies on v1.0 source code reading at `public/legacy/js/app.js:810`. | Common Pitfalls | If wrong, returning v1.0 users see the age gate again on first v2.0 visit (annoying but recoverable; they re-confirm once). **LOW RISK** — easy to fix later. |
| A4 | The `Result` type extensions (`seededFromImportId`, `seededFromResultId`, `templateWarningDisabled`) and `Settings` extensions (`ageConfirmed`, `wizardDone`) are additive and don't conflict with the Phase 1 type definitions. | Pattern 11 + Pitfalls 12, 13 | Phase 1 types may have differently-named fields; planner must verify against `src/lib/storage/types.ts` line by line. **LOW RISK** — Phase 1 source code is in the repo; the planner reads it. |
| A5 | The 1900 ms toast duration in v1.0 (`public/legacy/js/app.js:517`) is the right default for Sonner. Could be too short for screen-reader announcements. | Pattern 5 | Accessibility audit may flag this. Easy adjustment. **LOW RISK**. |
| A6 | shadcn's `Sheet` is appropriate for the mobile hamburger drawer. shadcn vends Sheet on top of `@radix-ui/react-dialog` (same primitive) so this is well-trodden, but not eyeballed in the Phase 1 build. | Pattern 3 | If the visual fit is wrong, switch to a custom Drawer; cost is one component rewrite. **LOW RISK**. |
| A7 | Single-card peek-next animation collapse under reduced-motion (D-32) requires only CSS class toggling, not a separate component path. Untested. | Pattern 8 | If animation library state leaks under reduced-motion, may need explicit guard. **LOW RISK**. |
| A8 | The `RICH_TEXT_KEYS` allow-list will cover all v1.0 strings with inline HTML. Final list determined when porting Welcome / Intro / About — keys with `<strong>`, `<em>`, `<a>` markup. | Pattern 12 | Adding to the list as needed is trivial; a TS `satisfies readonly TranslationKey[]` catches typos at compile time. **LOW RISK**. |
| A9 | Bundle-size budget (≤200 KB gzip working target per CONTEXT.md) is achievable. Phase 1 baseline is 119.95 KB. Phase 2 adds: Sonner (~5 KB gzip), 6 Radix primitives (~25 KB gzip combined), @use-gesture (~5 KB gzip), view code (~30 KB gzip estimated). Total estimate: 185 KB gzip — under target. | Bundle-Size Watch | If exceeds 200 KB, code-split route-level lazy imports for `<Compare />` and `<Result />`. **MEDIUM RISK** — needs measurement after plan 2 install. |

**If this table is non-empty:** the planner should treat A2 and A9 as the items most likely to surface during execution. A2 is a "smoke test in plan 2 task 1" mitigation; A9 is a "measure-after-each-plan" mitigation (manual `du -sh dist/assets` per Phase-2 specifics).

## Open Questions

1. **How does the Phase 1 store expose `getImports()` for the imports list on Home?**
   - What we know: `useStore` from Phase 1 has `saveImport`, `getImport(id)`, `deleteImport`. The full list selector would be `useStore(s => s.imports)`.
   - What's unclear: Whether there's a sort order expected; v1.0 doesn't enforce one.
   - Recommendation: Sort by `importedAt` descending in the Home view component.

2. **Is the `<Toaster />` mount point load-bearing for `useToast` from `<RootLayout />`?**
   - What we know: Sonner's `toast()` is a module-level function; any caller can invoke it as long as `<Toaster />` is somewhere in the tree.
   - What's unclear: Whether early subscribers (e.g., the `lastSaveError` watcher in `<RootLayout />`) fire before `<Toaster />` mounts.
   - Recommendation: Mount `<Toaster />` as the FIRST child of `<RootLayout />` — before `<Outlet />` — so it's available immediately. Sonner queues calls anyway, so this is belt-and-braces.

3. **Should `<AgeGate />` route the under-18 hard-stop, or render a blocking `<AlertDialog />` forever?**
   - What we know: v1.0 overwrites `document.body.innerHTML` with a static stop message (`public/legacy/js/app.js:822`).
   - What's unclear: Whether Phase 2 should route to `/under-18` (a dedicated route) or render the stop message inline.
   - Recommendation: Inline stop message (matches v1.0 exactly; no new route needed; no nav surface to escape).

4. **Where does the legacy `<Compare />` "tip" copy (visible when no datasets selected) live?**
   - What we know: v1.0 has a tip about Fabi mode at `public/legacy/js/app.js:3525–3528`. The string is in JS (not i18n).
   - What's unclear: Whether Phase 2 keeps Fabi mode at all.
   - Recommendation: Port Fabi-mode toggle since the v1.0 settings page exposes it (`public/legacy/js/app.js:3659`). It's a one-line `Store.setFabiMode` toggle. Already in Phase 1's `Settings` type (`fabiMode?: boolean` — line 79).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite, Vitest, pnpm | ✓ | ≥22 (engines field) | — |
| pnpm | All scripts | ✓ | installed locally | — |
| npm registry | shadcn install + @use-gesture install | ✓ | — | — |
| `npx shadcn@latest` | Plan 2 primitive vendoring | ✓ (assumed; Phase 1 used it successfully for Button) | latest CLI | — |
| `crypto.subtle` | Existing Phase 1 tests; Phase 2 share/import | ✓ (Node 22+ exposes globally) | native | — |
| jsdom | Vitest jsdom env for component tests | ✓ | 29.1.1 (verified) | — |

**No external services or paid APIs needed.** No env vars. No secrets.

## Validation Architecture

> Phase 2 will produce 7 plans; each plan emits its own Vitest spec file(s). The validation surface below specifies the **mandatory automated checks** the verifier runs at phase close.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 (already installed) + Testing Library 16.3.2 (already installed) |
| Config file | `vitest.config.ts` (already configured) — `environment: 'node'` default, per-file `// @vitest-environment jsdom` directive for component tests |
| Quick run command | `pnpm run test -- <file-glob>` (≈ 2-5 s per file) |
| Full suite command | `pnpm run test` (Phase 1 baseline: 9 files, 59 tests, 5.91 s) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHELL-01 | Every v1.0 hash route resolves to its handler | integration | `pnpm run test -- src/__tests__/router.routes.test.tsx` | ❌ Wave 0 |
| SHELL-02 | Hash deep-links from v1.0 (e.g. `#/result/abc/intimacy`) open the right view | integration | same file as SHELL-01 | ❌ Wave 0 |
| SHELL-03 | `<Nav />` renders profile picker / imports / compare / settings / theme / lang | component | `pnpm run test -- src/components/__tests__/Nav.test.tsx` | ❌ Wave 0 |
| SHELL-04 | Theme + lang reactivity (already covered by Phase 1's `DesignSystem.test.tsx:test 3`) | component | existing test reused | ✅ |
| SHELL-05 | Scroll-to-top fires on PUSH navigation, NOT POP | unit | `pnpm run test -- src/hooks/__tests__/useScrollToTop.test.tsx` | ❌ Wave 0 |
| SHELL-06 | `useToast` + `<Dialog />` + `<AlertDialog />` reachable from any component | component | `pnpm run test -- src/__tests__/primitives.test.tsx` | ❌ Wave 0 |
| PROFILE-01..04 | Profile CRUD round-trip through Zustand store | integration | `pnpm run test -- src/routes/__tests__/Profile.test.tsx` | ❌ Wave 0 |
| PROFILE-05 | Wizard responds to swipe + arrow keys + skip | component | `pnpm run test -- src/components/__tests__/WizardHost.test.tsx` | ❌ Wave 0 |
| PROFILE-06 | Age-gate blocks on first visit, persists confirmation | component | `pnpm run test -- src/components/__tests__/AgeGate.test.tsx` | ❌ Wave 0 |
| PROFILE-07 | Intro/About route renders v1.0 content (smoke; long-form prose) | component | `pnpm run test -- src/routes/__tests__/Intro.test.tsx` | ❌ Wave 0 |
| QUEST-01 | Category overview toggle + persist `enabledCategories` | integration | `pnpm run test -- src/routes/__tests__/CategoryOverview.test.tsx` | ❌ Wave 0 |
| QUEST-02 | List-mode renders + answers persist | component | `pnpm run test -- src/components/questionnaire/__tests__/ListMode.test.tsx` | ❌ Wave 0 |
| QUEST-03 | Single-mode swipe + keyboard + per-item scale | component | `pnpm run test -- src/components/questionnaire/__tests__/SingleMode.test.tsx` | ❌ Wave 0 |
| QUEST-04 | Scale picker behaviour (tap saves; keyboard navigation; clear) | component | `pnpm run test -- src/components/__tests__/ScalePicker.test.tsx` | ❌ Wave 0 |
| QUEST-05 | Every answer change → `localStorage` round-trip | integration | covered by QUEST-02/03 specs |  |
| QUEST-06 | Deep-link `#/result/:id/:catId` scrolls to category | component | `pnpm run test -- src/routes/__tests__/Result.test.tsx` | ❌ Wave 0 |
| QUEST-07 | Always-visible save buttons (sticky bottom nav) | component | covered by QUEST-02/03 specs |  |
| QUEST-08 | DE gendered translations render correctly | unit | `pnpm run test -- src/lib/i18n/__tests__/de-gendered.test.ts` | ❌ Wave 0 |
| RESULT-01 | Result header renders subject + emoji + colour + actions | component | `pnpm run test -- src/routes/__tests__/Result.test.tsx` | covered |
| RESULT-02..05 | Each chart math helper + each chart SVG snapshot | unit + snapshot | `pnpm run test -- src/lib/charts/__tests__/math.test.ts` + `src/components/charts/__tests__/Spider.test.tsx` | ❌ Wave 0 |
| RESULT-06 | Enlarged spider modal opens + closes | component | `pnpm run test -- src/components/charts/__tests__/EnlargedSpider.test.tsx` | ❌ Wave 0 |
| RESULT-07 | XSS escape — `<script>alert(1)</script>` as label renders inert | snapshot | included in `src/components/charts/__tests__/Spider.test.tsx` | ❌ Wave 0 |
| SHARE-01 | Share view encrypts payload | integration | `pnpm run test -- src/routes/__tests__/Share.test.tsx` | ❌ Wave 0 |
| SHARE-02 | `.rshape.txt` download triggers | component | same file | ❌ Wave 0 |
| SHARE-03 | Import accepts paste / file, decrypts, persists | integration | `pnpm run test -- src/routes/__tests__/Import.test.tsx` | ❌ Wave 0 |
| SHARE-04 | v1.0 fixture bundle imports cleanly | regression | `pnpm run test -- src/routes/__tests__/Import.fixture.test.tsx` | ❌ Wave 0 (uses existing `tests/fixtures/v1-bundle.fixture.ts`) |
| SHARE-05 | Compare ≤ 4 datasets enforced; toast on overflow | component | `pnpm run test -- src/routes/__tests__/Compare.test.tsx` | ❌ Wave 0 |
| SHARE-06 | Backup export → import round-trip | integration | `pnpm run test -- src/routes/__tests__/Settings.backup.test.tsx` | ❌ Wave 0 |
| SETTINGS-01 | Global scale editor add / edit / delete / reorder persist | component | `pnpm run test -- src/routes/__tests__/Settings.test.tsx` | ❌ Wave 0 |
| SETTINGS-02 | Theme + language picker reachable from Settings | component | covered by Phase 1's tests |  |
| SETTINGS-03 | Per-map Settings edits persist via `Store.saveResult` | integration | `pnpm run test -- src/routes/__tests__/MapSettings.test.tsx` | ❌ Wave 0 |
| SETTINGS-04 | Data management (export/import/clear) | integration | covered by SHARE-06 spec |  |
| SETTINGS-05 | Accessibility — focus trap on Dialog/AlertDialog open + return on close | component | `pnpm run test -- src/__tests__/a11y.dialog.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm run test -- <plan's spec glob>` — single plan's test suite, runs in ≤ 10 s
- **Per wave merge:** `pnpm run test` — full suite, runs in < 15 s (Phase 1 baseline was 5.9 s for 59 tests; Phase 2 adds ~25 new files / ~80 new tests → estimated 12–15 s total)
- **Phase gate:** `pnpm run verify` (existing Phase 1 chain: typecheck + lint + test + build + grep guard). Phase 2 must keep all green.

### Wave 0 Gaps

Files to create before plan-level test development begins. The planner should list these in plan 2 or earlier as scaffold tasks; each plan owns the spec files for its requirements:

- [ ] `src/__tests__/router.routes.test.tsx` — SHELL-01 / SHELL-02 — every D-24 row renders a placeholder
- [ ] `src/components/__tests__/Nav.test.tsx` — SHELL-03
- [ ] `src/hooks/__tests__/useScrollToTop.test.tsx` — SHELL-05
- [ ] `src/__tests__/primitives.test.tsx` — SHELL-06 — toast renders, dialog opens / focuses / closes
- [ ] `src/components/__tests__/AgeGate.test.tsx` — PROFILE-06
- [ ] `src/components/__tests__/WizardHost.test.tsx` — PROFILE-05
- [ ] `src/routes/__tests__/Profile.test.tsx` — PROFILE-01..04 — Zustand round-trip
- [ ] `src/routes/__tests__/Intro.test.tsx` — PROFILE-07 — smoke
- [ ] `src/routes/__tests__/CategoryOverview.test.tsx` — QUEST-01
- [ ] `src/components/questionnaire/__tests__/ListMode.test.tsx` — QUEST-02, QUEST-05, QUEST-07
- [ ] `src/components/questionnaire/__tests__/SingleMode.test.tsx` — QUEST-03, QUEST-04 partial
- [ ] `src/components/__tests__/ScalePicker.test.tsx` — QUEST-04
- [ ] `src/lib/i18n/__tests__/de-gendered.test.ts` — QUEST-08
- [ ] `src/lib/charts/__tests__/math.test.ts` — RESULT-02..05 pure math
- [ ] `src/components/charts/__tests__/Spider.test.tsx` — RESULT-02 + RESULT-07
- [ ] `src/components/charts/__tests__/ItemSpider.test.tsx` — RESULT-04 + RESULT-07
- [ ] `src/components/charts/__tests__/CategoryBars.test.tsx` — RESULT-03 + RESULT-07
- [ ] `src/components/charts/__tests__/Alignment.test.tsx` — RESULT-05 + RESULT-07
- [ ] `src/components/charts/__tests__/EnlargedSpider.test.tsx` — RESULT-06
- [ ] `src/routes/__tests__/Result.test.tsx` — RESULT-01 + QUEST-06 deep-link
- [ ] `src/routes/__tests__/Share.test.tsx` — SHARE-01, SHARE-02
- [ ] `src/routes/__tests__/Import.test.tsx` — SHARE-03
- [ ] `src/routes/__tests__/Import.fixture.test.tsx` — SHARE-04 (reuses `tests/fixtures/v1-bundle.fixture.ts`)
- [ ] `src/routes/__tests__/Compare.test.tsx` — SHARE-05
- [ ] `src/routes/__tests__/Settings.test.tsx` — SETTINGS-01, SETTINGS-02
- [ ] `src/routes/__tests__/Settings.backup.test.tsx` — SHARE-06, SETTINGS-04
- [ ] `src/routes/__tests__/MapSettings.test.tsx` — SETTINGS-03
- [ ] `src/__tests__/a11y.dialog.test.tsx` — SETTINGS-05

**No framework install needed** — Vitest, Testing Library, jsdom are already installed.

**Phase-final integration test ("nyquist gate"):** a single test file (`src/__tests__/parity.smoke.test.tsx`) walks the golden path — create profile → answer 3 items → see result → share → import → compare → backup → clear — in one `it()` block. This is the highest-value regression gate and is owned by plan 7 (Settings) as the final integration test.

## Security Domain

`security_enforcement` is not explicitly set in this project's config (file absent). Defaulting to **enabled** per the agent contract.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **No** — no accounts, no login; the only "auth" is a passphrase for encrypting bundles, which is a key derivation (V6 territory) | — |
| V3 Session Management | **No** — no sessions | — |
| V4 Access Control | **No** — single-user app; no multi-tenant boundary | — |
| V5 Input Validation | **Yes** — every user-supplied label (profile name, subject, custom item name, note, scale label) flows into the DOM | React text-node escaping by default; `RICH_TEXT_KEYS` allow-list for i18n-only HTML (D-12); RESULT-07 chart snapshot test (D-05) |
| V6 Cryptography | **Yes** — passphrase-derived AES-GCM 256 for bundle exchange | Already locked: PBKDF2 SHA-256 × 250,000, 16-byte salt, 12-byte IV, key marked `extractable: false`. Phase 1 ported this byte-compatible. No changes in Phase 2. |
| V7 Error Handling and Logging | Partial — `lastSaveError` slice + toast for quota errors. No remote logging. | Already implemented in Phase 1's `relationshapePersist` |
| V8 Data Protection | **Yes** — all data lives in `localStorage`; encrypted bundle for off-device transit | `localStorage` is same-origin; bundle is end-to-end-encrypted off-device |
| V9 Communication | **No** — no network calls; PROJECT.md explicitly forbids them | grep guard at `scripts/check-no-google-fonts.sh` (Phase 1) enforces no font CDN; no analytics; no Sentry; no telemetry |
| V11 Business Logic | n/a single-user; minimal logic | — |
| V12 Files and Resources | Partial — Backup import accepts arbitrary JSON | `replaceAll` shape-checks but doesn't deep-validate. Acceptable (local threat only per `.planning/codebase/CONCERNS.md` §Security). |
| V14 Configuration | n/a | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via user-supplied labels in SVG chart text | Tampering | React text-node escaping (D-05); RICH_TEXT_KEYS allow-list (D-12); Vitest snapshot for `<script>alert(1)</script>` payload |
| XSS via custom item name field | Tampering | Same — render via React text-node, never `innerHTML` |
| XSS via i18n rich-text key with bad markup | Tampering | RICH_TEXT_KEYS allow-list is **typed**; new keys require explicit addition; unit test asserts every key exists in both EN and DE |
| Tampered backup file imports bad data | Tampering | Local-only threat (single-device); `Store.replaceAll` shape-checks the top-level arrays/objects (Phase 1 implementation) |
| Quota exceeded silently swallows data | Repudiation | `lastSaveError` slice + `useToast` subscriber in `<RootLayout />` (Phase 1 fix surfaces it; Phase 2 wires the UI) |
| Wrong passphrase / corrupted bundle | Disclosure | `decryptResult` throws a single generic error message ("Wrong passphrase or corrupted bundle"); does not distinguish to avoid information leakage |
| External CDN reintroduced | Disclosure | Phase 1 `scripts/check-no-google-fonts.sh` runs in `pnpm run verify`; Phase 2's `pnpm run verify` inherits this check |
| Service worker scope conflict (legacy vs new) | DoS | Already handled in `vite.config.ts` — `globIgnores: ['legacy/**']` keeps SWs separate (Phase 1) |
| Focus-trap missing on Dialog | Disclosure (a11y) | Radix Dialog provides this for free; SETTINGS-05 test asserts focus return on close |
| Reduced-motion bypass breaks accessibility | Repudiation (a11y) | D-10 disables all CSS animation under `prefers-reduced-motion: reduce`; D-08 `useSwipe` respects it; QUEST-03 test asserts reduced-motion mode advances instantly |

## Sources

### Primary (HIGH confidence)

- `package.json` and live `npm view <pkg>` queries against the registry on 2026-05-15 — version numbers for React Router 7.15.1, Zustand 5.0.13, Radix 1.4.3 (meta) / 1.1.15 (individual dialog/alert-dialog/popover), Radix Tabs 1.1.13, `@use-gesture/react` 10.3.1, Sonner 2.0.7
- Phase 1 source code in `src/` and Phase 1 plan summaries — what's already built and how it composes
- `public/legacy/js/*` — the v1.0 source code being ported, line-numbered references throughout this research
- `.planning/codebase/*.md` — codebase map (ARCHITECTURE, STRUCTURE, CONVENTIONS, CONCERNS, INTEGRATIONS, STACK, TESTING)
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` — locked constraints and acceptance criteria
- `.planning/phases/02-parity/02-CONTEXT.md` — 43 locked decisions D-01..D-43

### Secondary (MEDIUM confidence)

- [React Router v7 — createHashRouter API](https://reactrouter.com/api/data-routers/create-hash-router) — confirmed nested-route + Outlet pattern
- [React Router v7 — useSearchParams](https://reactrouter.com/api/hooks/useSearchParams) — confirms reactive subscription
- [React Router v7 — ScrollRestoration](https://reactrouter.com/api/components/ScrollRestoration) — alternative to hand-rolled `useScrollToTop`
- [@use-gesture options docs](https://use-gesture.netlify.app/docs/options/) — confirmed `axis`, `pointer.touch`, `threshold`, `rubberband`, `preventScroll` options
- [@use-gesture issue #216 (scroll prevention)](https://github.com/pmndrs/use-gesture/issues/216) — confirms `touch-action: pan-y` recommended pattern
- [shadcn — Sonner docs](https://ui.shadcn.com/docs/components/radix/sonner) — confirms install command + `<Toaster />` mount pattern + deprecation of legacy Toast
- [shadcn — Tailwind v4 + React 19](https://ui.shadcn.com/docs/tailwind-v4) — confirms Tailwind v4 + React 19 supported
- [shadcn — Dialog docs](https://ui.shadcn.com/docs/components/radix/dialog) — confirms install + Radix substrate
- [shadcn — AlertDialog docs](https://ui.shadcn.com/docs/components/radix/alert-dialog) — confirms install + focus-trap behaviour
- [Tailwind v4 — Dark mode docs](https://tailwindcss.com/docs/dark-mode) — confirms `@custom-variant` directive for `data-theme` selector
- [Sonner README](https://github.com/emilkowalski/sonner) — confirms `toast.success/error`, `duration`, `richColors`, `position`, `dismiss`

### Tertiary (LOW confidence)

- npm download stats / package activity (mentioned in search results but not load-bearing for any decision)
- Generic React Router v7 migration blog posts — informational only

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — every version verified against npm registry live; peer deps confirmed for React 19
- Architecture: **HIGH** — `<RootLayout />` + nested routes + selectors are textbook React Router v7 + Zustand; the patterns are demonstrated in Phase 1's existing code
- Pitfalls: **HIGH** for the codebase-specific ones (catalogued in `.planning/codebase/CONCERNS.md` and verified against `public/legacy/js/app.js` source); **MEDIUM** for the new Phase 2 pitfalls (e.g., Sheet drawer close-on-route-change is a standard React Router pattern but untested in this codebase)
- Charts port: **HIGH** — pure math helpers lift verbatim; SVG declarative shape is the standard pattern; `useSpiderInteraction` design follows Radix's controlled-state idiom
- Imperative `dialog({...})` shim: **MEDIUM** — pattern is well-trodden but the exact Zustand+portal implementation is bespoke; needs the Plan-2 test to confirm focus-return semantics
- Bundle-size: **MEDIUM** — estimate is rough; needs measurement after plan 2 install (manual `du -sh dist/assets`)

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 for stable libraries (React, React Router, Tailwind, shadcn primitives); 2026-05-22 for fast-moving items (`@use-gesture/react`, `sonner` — versions can change weekly)
