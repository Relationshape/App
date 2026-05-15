# Phase 2: Parity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 2-Parity
**Areas discussed:** Plan decomposition, Chart components port, Swipe + arrow-key navigation, Long-form prose sourcing

---

## Plan decomposition

| Option | Description | Selected |
|--------|-------------|----------|
| Foundation-first horizontal | Plans run in order: App shell → Primitives → Profile → Questionnaire → Result+Charts → Share/Import/Compare → Settings. Sequential, each builds on the last. Easier to review; slower to demo a working view. | ✓ |
| Vertical feature slices | Each plan ships one capability end-to-end and is independently demoable. Shell+primitives are bundled as the smallest possible spine, then 1 plan per capability. Demo-driven. | |
| Hybrid: spine + parallel slices | Plan 1 = full spine (router + providers + nav + primitives). Capability plans can then run in parallel where possible. Mostly the same plan count as vertical, parallelizable in Wave 2. | |

**User's choice:** Foundation-first horizontal slicing.
**Notes:** Sequential 7-plan order: App shell → Primitives → Profile → Questionnaire → Result+Charts → Share/Import/Compare → Settings. Reviewability over throughput — one in-flight surface at a time, no parallel waves. Each plan adds only the i18n keys, shadcn primitives, and routes it needs. See CONTEXT.md D-01, D-02, D-03.

---

## Chart components port

| Option | Description | Selected |
|--------|-------------|----------|
| Full declarative React/JSX | Each chart becomes a React component emitting `<svg>` JSX directly (polygons, paths, labels as JSX children mapped from data). React event handlers replace `bindSpiderInteractivity`. RESULT-07 XSS escape is structural — no `innerHTML` path. Bigger up-front port; cleaner long-term. | ✓ |
| Pragmatic SVG-string + sanitized data | Keep `charts.ts` returning SVG strings (near-verbatim port). React wrapper uses `dangerouslySetInnerHTML`. RESULT-07 covered by escaping at data-entry. Faster port, keeps v1.0 math 1:1, `dangerouslySetInnerHTML` smell remains. | |
| Hybrid: JSX shell + computed primitives | Outer `<svg>`, layers, grid, labels are JSX. Inner data primitives computed in TS helpers, rendered via `<polygon points={...} />`. No `innerHTML` anywhere. Less code than full declarative. | |

**User's choice:** Full declarative React/JSX (the recommended path).
**Notes:** Pure math helpers move to `src/lib/charts/math.ts`; SVG renderers become `src/components/charts/*.tsx`. `bindSpiderInteractivity` is replaced by per-component React handlers via a `useSpiderInteraction` hook. The enlarged-chart modal (RESULT-06) re-renders the same component at a larger `size` prop. Vitest snapshot test asserts that XSS payloads in labels render as inert text. See CONTEXT.md D-04, D-05, D-06, D-07.

---

## Swipe + arrow-key navigation

| Option | Description | Selected |
|--------|-------------|----------|
| `@use-gesture/react` | ~5 KB gzip mature library. Ergonomic `useDrag` / `useGesture` hooks with thresholds, velocity, pointer-type filtering. Replaces ~80 lines of v1.0 swipe code. | ✓ |
| Custom useSwipe hook | ~30 lines TS mirroring v1.0's raw touchstart/touchend (40 px threshold, passive listeners). Zero deps; re-implements known edge cases. | |
| framer-motion drag | `<motion.div drag='x' ...>` with spring physics + reduced-motion handling. ~30 KB gzip; unlocks card peek animations + modal transitions. Probably overkill for v2.0 parity. | |

**User's choice:** `@use-gesture/react`.
**Notes:** Used by Single-card questionnaire mode, Wizard step navigation, and the global-scale editor reorder. Wrapped in a project `useSwipe(ref, { onLeft, onRight, threshold })` hook with axis-lock defaults that fix v1.0's Android scroll-vs-swipe edge case. Arrow keys via a separate `useKeydown` hook. Both respect `prefers-reduced-motion: reduce` — swipe threshold still works, momentum/spring visuals are disabled. See CONTEXT.md D-08, D-09, D-10.

---

## Long-form prose sourcing (Welcome / Intro / About)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep in flat i18n maps (parity) | Welcome marketing copy + Intro/About story/credits/privacy stay as long string values in `en.ts` / `de.ts` (1:1 with v1.0's `js/i18n.js`). Components consume via `t('welcome_hero_title')`. Lowest-risk parity port; brittle for HTML-ish content. | ✓ |
| JSX components + per-string i18n | Welcome / Intro / About become real components. Structure lives in JSX; only headings + short labels go through `t()`. Cleaner i18n maps; more work to keep DE/EN sync. | |
| MDX per language | Author Welcome / Intro / About content as `.mdx` files (one per locale). Cleanest for content; another build dep to wire. | |

**User's choice:** Keep multi-paragraph prose in the flat i18n maps (the parity-preserving choice).
**Notes:** Welcome marketing copy, Intro story / credits / licence / privacy explainer, Wizard step bodies all stay as long strings in `src/lib/i18n/en.ts` and `de.ts`. Components consume via `t('welcome_hero_title')`. Where v1.0 strings contain inline `<strong>` / `<em>` / `<a>`, the React component renders via `dangerouslySetInnerHTML` only for keys in a typed `RICH_TEXT_KEYS` allow-list — user content never flows through this path. Unit test asserts every `RICH_TEXT_KEYS` entry exists in both EN and DE. See CONTEXT.md D-11, D-12.

---

## Claude's Discretion

The user's four strategic picks above anchor the architecture. Claude resolved the following implementation details using Phase 1's locked decisions, `.planning/codebase/` analysis, and the v1.0 baseline; downstream researcher/planner may revisit any item that conflicts with an evidence-backed concern surfaced during research:

- **D-02, D-03** Sequential plan order (no parallel waves in Phase 2); plan-level acceptance verifiable in isolation; phase-final verify gate runs the full success-criteria checklist.
- **D-05, D-06, D-07** Chart XSS escape strategy (text-node escape via React, snapshot test); per-component React handlers replace `bindSpiderInteractivity`; enlarged modal re-renders same component at larger `size`.
- **D-09, D-10** `useSwipe` + `useKeydown` hook wrappers; reduced-motion guards on swipe visuals (threshold still active).
- **D-12** `RICH_TEXT_KEYS` allow-list for the few i18n entries containing inline markup.
- **D-13–D-15** Root layout with `<Outlet />`; thin `ThemeProvider` + `I18nProvider` Context wrappers around the existing Zustand store; `<Nav />` top bar + `Sheet` drawer mirroring v1.0.
- **D-16, D-17** shadcn primitives vendored in Plan 2 (Dialog, AlertDialog, Sonner, Sheet, Popover, Tabs); add on demand later.
- **D-18, D-19** No `react-hook-form`; plain controlled components with `useFormError` helper for accessibility wiring.
- **D-20–D-23** Bespoke scale picker (NOT shadcn `Slider`), bespoke emoji picker (NOT a library), bespoke chart components, `useReducer`-driven Wizard.
- **D-24** Full SHELL-01 route table mapped 1:1 from v1.0 hash routes.
- **D-25, D-26** Compare URL scheme preserved verbatim (`?ids=a,b,imp:c`); `#/result/:id/:catId` deep-link scrolls to the category and opens drill-down.
- **D-27, D-28, D-29** `useToast` wrapping Sonner; typed `<Dialog />` + imperative `dialog({...})` via a portal-hosted DialogHost subscribed to a Zustand `dialogQueue` slice; age gate as `<AgeGate />` mounted by the root layout.
- **D-30–D-33** Template warning hook; "always-visible" navigation footer (auto-save covers the literal save concept); single-card peek animation via Tailwind `data-state`; per-item scale override flows through in-tree `<Dialog />`.
- **D-34, D-35** Result drill-down state owned by `<Result />`; up-to-4-datasets enforced at view boundaries.
- **D-36–D-39** Share view via `<Dialog />` or `<Sheet />` on small screens; import accepts paste OR file; v1.0 fixture regression for SHARE-04; backup export/restore/clear gated by AlertDialog confirms.
- **D-40–D-42** Settings scale-editor uses `@use-gesture/react` reorder (same dep as questionnaire); per-map settings as one form; theme + language pickers are bespoke toggle groups.
- **D-43** Per-plan test surface allocation (math helpers as pure Vitest, components via Testing Library, XSS snapshot, v1.0 fixture regression).

## Deferred Ideas

- PWA manifest + Workbox SW for the new app — Phase 3 (PWA-01, PWA-02).
- v1→v2 install upgrade smoke — Phase 3 (PWA-03).
- v2→v1 cross-direction bundle compat — Phase 3 (PWA-05).
- Lighthouse PWA audit — Phase 3 (PWA-06).
- Legacy retirement (`public/legacy/` removal) — Phase 3 (PWA-07).
- `react-hook-form` — revisit only if a form grows past ~10 interacting fields.
- `framer-motion` or richer chart animations — out of scope for v2.0 parity; reduced-motion policy from Phase 1 constrains motion deliberately.
- `emoji-picker-react` / `emoji-mart` — not used; bespoke `EMOJI_BANK` picker preserves visual parity and bundle budget.
- Bundle-size CI enforcement (`size-limit`) — v2.1+ (QUAL-03). Manual `du -sh` per plan suffices for Phase 2.
- Broader Vitest coverage (armor variants, storage edges, full i18n parity check) — v2.1+ (QUAL-01).
- Playwright E2E — out of scope for v2.0 entirely.
- Profile colour themes / cover images (FEAT-02), additional languages (FEAT-03), richer compare visualisations (FEAT-04) — v2.1+.
- An explicit "save now" button — v1.0 auto-saves; revisit only if user feedback indicates a need.
