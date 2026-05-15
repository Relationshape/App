# Phase 2: Parity - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the React app shell (typed `ThemeProvider` + `I18nProvider`, persistent `<Nav />`, scroll-to-top + active-link behaviour, full `createHashRouter` route table covering every v1.0 hash route, shadcn-based `useToast` + typed `<Dialog />` primitives) and ship every v1.0 view as React components at full feature parity — **Welcome / Home / Profile CRUD / Wizard / Age gate / Intro & About / Category overview / Questionnaire (list + single-card swipe) / Result + 4 chart types / Share / Import / Compare / global Settings / per-map Settings** — with EN/DE strings preserved key-for-key, encrypted bundle round-trip preserved, and accessible dialogs.

**In scope:**
- Full app shell: router with every SHELL-01 route, `ThemeProvider` + `I18nProvider`, `<Nav />` (profile picker, imports link, compare link, settings, theme toggle, language picker), shadcn `Sonner` toast + typed `<Dialog />` / `<AlertDialog />`.
- Profile lifecycle: Welcome (hero + features + CTA + how-to scroll), Home (profiles + imports cards), Profile create/edit/delete with emoji picker + PALETTE colour, Profile detail view, first-visit Wizard, Age gate, Intro / About.
- Questionnaire: Category overview (toggle on/off, persist `enabledCategories`), List mode (G/R/Both toggles, notes, custom items add/edit/delete, hidden items), Single-card swipe mode (touch swipe + arrow keys + peek-next card animation, fractional scales, per-item scale override), scale picker snap-dots, `#/result/:id/:catId` deep-link, "always-visible save button" + template warning behaviours from v1.0, German gendered translations.
- Results & Charts: Result header (subject + colour + profile context + edit/share/delete), overview spider (≤ 4 datasets, dynamic axis labels, hover/touch reveal of per-category detail), per-category bar diff, item-level spider, alignment heat strip (top matches + biggest gaps), enlarged-chart modal, RESULT-07 XSS escape audit.
- Share / Import / Compare: Share view (passphrase, copy textarea, `.rshape.txt` download), Import view (paste text OR file upload, decrypt, saved to separate `imports` pool), v1.0 fixture-bundle regression for `Import` shape, Compare view (mixed own + import IDs in URL, ≤ 4 datasets), full backup export + restore round-trip via `Store.replaceAll`.
- Settings: Global scale editor (add/edit/delete/reorder steps), Theme picker (auto/light/dark) + Language picker (en/de) reachable from Settings and Nav, per-map Settings (subject identity + scale override + category toggles), Data management (export backup, import backup, clear all data with confirmation), accessible dialog/toast meeting shadcn focus-trap + ESC + ARIA expectations.

**Out of scope (deferred to Phase 3):**
- PWA manifest + Workbox service worker for the new app (`PWA-01`, `PWA-02`).
- v1.0 → v2.0 install upgrade verification (`PWA-03`).
- v1↔v2 bundle compatibility proof (`PWA-04`, `PWA-05`) — the Phase 2 fixture regression covers v1→v2 read; cross-direction proof is Phase 3.
- Lighthouse PWA audit (`PWA-06`).
- Legacy retirement — `public/legacy/`, `js/`, `css/`, `sw.js` removal (`PWA-07`).
- Deploy preview smoke walk (`PWA-08`).

**Out of scope (deferred to v2.1+):**
- Bundle-size CI enforcement (`QUAL-03`), broader Vitest coverage beyond the targeted fixture + smoke tests (`QUAL-01`), Playwright E2E (`QUAL-02`), profile colour themes (`FEAT-02`), additional languages beyond EN+DE (`FEAT-03`), richer compare visualisations (`FEAT-04`).
</domain>

<decisions>
## Implementation Decisions

### Plan decomposition (strategic anchor)

- **D-01:** **Foundation-first horizontal slicing** is the wave strategy. Phase 2 plans run sequentially in this order: (1) **App shell** — router with full SHELL-01 route table, `ThemeProvider` + `I18nProvider`, persistent `<Nav />`, scroll-to-top + active-link, route placeholders for every view. (2) **Primitives** — shadcn additions (Dialog, AlertDialog, Sonner, Sheet, Popover, Tabs), typed `<Dialog />` / `<AlertDialog />` wrappers, `useToast` shim, common form helpers, `useSwipe` wrapper around `@use-gesture/react`, age gate + wizard hosting. (3) **Profile lifecycle** — Welcome, Home, Profile CRUD, Intro/About, wizard content. (4) **Questionnaire** — Category overview, List mode, Single-card mode (the hardest view), scale picker, deep-link to category. (5) **Results & Charts** — Result header + 4 chart components + enlarged modal. (6) **Share / Import / Compare** — encryption flow, import-from-paste/file, compare view with up to 4 datasets, backup export/restore. (7) **Settings** — global scale editor, per-map settings, data management, theme/lang pickers in Settings (the Nav copies live earlier).
- **D-02:** Each plan adds **only the i18n keys, shadcn primitives, and routes it needs** — incremental layering. Plans 3–7 are sequential (no parallel waves) because each adds to the same Nav + provider tree and we want one in-flight surface to review at a time. **Reviewability over throughput.**
- **D-03:** **Plan-level acceptance** is verifiable in isolation per plan (its own Vitest suite + a Testing-Library smoke render of its top route). The phase-final verify gate runs the full ROADMAP §"Phase 2" success-criteria checklist against the integrated app.

### Chart components port

- **D-04:** **Full declarative React/JSX** for every chart. `renderSpider`, `renderItemSpider`, `renderCategoryBars`, `renderAlignment` become React components in `src/components/charts/` that emit `<svg>` JSX directly — `<polygon points={…} />`, `<path d={…} />`, `<text>{label}</text>`, `<line />`, etc. Pure math helpers (axis projection, `categoryAverage`, `closestScaleEntry`, the answer-to-fraction maths) move to `src/lib/charts/math.ts` as pure functions covered by Vitest.
- **D-05:** **No `dangerouslySetInnerHTML` anywhere in chart code.** RESULT-07 (XSS escape audit) is structural — user-supplied labels go through React text-node escaping by default. Vitest snapshot test asserts that a profile name containing `<script>alert(1)</script>` and `"` characters renders as inert text in every chart output.
- **D-06:** `bindSpiderInteractivity` is replaced by **per-component React handlers** (`onPointerEnter` / `onPointerLeave` / `onTouchStart` on each axis label or polygon vertex). A `useSpiderInteraction(datasets)` hook owns the selected-axis state and exposes `{ activeAxis, onAxisEnter, onAxisLeave, onAxisTap }` to the spider component and its drill-down sibling.
- **D-07:** The enlarged-chart modal (RESULT-06) uses shadcn `Dialog` with the same chart component re-rendered at a larger `size` prop. No separate "high-res" path — the SVG scales by `viewBox`, so the same JSX works at 640px or 1280px.

### Swipe + arrow-key navigation

- **D-08:** **Add `@use-gesture/react`** as a runtime dep (~5 KB gzip). Used by the Single-card questionnaire mode (`useDrag` on the active card for swipe-left/right; threshold matches v1.0's 40 px; `axis: 'x'` so vertical scroll doesn't trigger card advance — fixes the v1.0 Android scroll-vs-swipe edge case noted in `.planning/codebase/CONCERNS.md`). Also used by the first-visit Wizard for step swipe and the enlarged-chart modal pinch (if a no-cost addition).
- **D-09:** A small **`useSwipe` hook** in `src/lib/hooks/useSwipe.ts` wraps `useDrag` with the project's preferred defaults (axis lock, threshold, `pointer: { touch: true }`) so call sites stay tidy. The arrow-key handler is a separate `useKeydown(['ArrowLeft','ArrowRight'], handler)` hook — both live in `src/lib/hooks/`.
- **D-10:** Both hooks respect `prefers-reduced-motion: reduce` — under that condition `useDrag`'s spring/momentum visuals are disabled but the swipe-trigger threshold still works (so the answer flow remains usable). The peek-next-card animation collapses to an instant swap.

### Long-form prose (Welcome / Intro / About)

- **D-11:** **Keep multi-paragraph prose in the flat i18n maps**, exactly mirroring v1.0's pattern in `js/i18n.js`. Welcome marketing copy, Intro story / credits / licence / privacy explainer, Wizard step bodies stay as long string values in `src/lib/i18n/en.ts` and `src/lib/i18n/de.ts`. Components consume via `t('welcome_hero_title')`, `t('intro_privacy_body')`, etc. **Lowest-risk parity port** — no key renames, no MDX/JSX migration risk.
- **D-12:** Where v1.0 strings contain inline `<strong>` / `<em>` / `<a>`, the React component renders the string with `dangerouslySetInnerHTML` **only for known-safe i18n keys** (a typed allow-list `RICH_TEXT_KEYS`). User-supplied content NEVER flows through this path. A unit test asserts every key in `RICH_TEXT_KEYS` exists in both EN and DE.

### App shell composition

- **D-13:** `createHashRouter` with a **single root layout route** (`<RootLayout />`) that mounts `<Nav />`, age-gate dialog host, wizard host, `<Toaster />`, and the route `<Outlet />`. Every leaf route is a child. Scroll-to-top + active-link logic live in a `useScrollToTop()` hook called from the root layout.
- **D-14:** `ThemeProvider` and `I18nProvider` wrap the router at the `<App />` root. Both are **thin Context wrappers around the existing Zustand store** — they read theme / lang from the store, apply side effects (`document.documentElement.setAttribute('data-theme', …)`, `document.documentElement.lang = …`, listen for `prefers-color-scheme` change), and expose `useTheme()` / `useI18n()` hooks. The hooks subscribe to the store directly; the Context is mainly for **enforcing** "use these hooks, not the store, from view components" via a `useContext` hard-error if not wrapped (helps reviewers).
- **D-15:** **`<Nav />` layout** mirrors v1.0: horizontal top bar on desktop with the profile picker (Popover dropdown), imports link, compare link, settings link, theme toggle, language picker; **shadcn `Sheet`** drawer for mobile (hamburger). `<NavLink>` from React Router supplies `active` state. Hamburger / `Sheet` close on route change (auto-handled by mounting a `useEffect` watching `location`).

### shadcn primitives to vendor

- **D-16:** Vendored in the **Primitives plan** (plan 2): `Dialog`, `AlertDialog`, `Sonner` (toast), `Sheet` (mobile nav drawer), `Popover` (profile picker + emoji picker host), `Tabs` (used in Settings sections), `Slider` (deferred — see D-20). Added on demand by later plans if needed (no premature vendoring).
- **D-17:** Each shadcn primitive is added via `npx shadcn@latest add <name>` so it lands in `src/components/ui/` per Phase 1 D-26. Class-merge utility (`cn`) already in `src/lib/utils.ts`.

### Forms

- **D-18:** **Plain controlled components with `useState` / `useReducer`** — no `react-hook-form`. Phase 2 forms are small and bounded (profile edit ~5 fields; share/import passphrase prompts; scale editor list manipulation; settings inline edits). Validation is inline. This decision is reviewable; if any form grows past ~10 interacting fields in a later plan, the planner may revisit.
- **D-19:** **`useFormError(field)` helper** in `src/lib/hooks/useFormError.ts` standardises field-level error surfacing across forms (inline error text + `aria-invalid` + `aria-describedby` wired through shadcn input variants).

### Bespoke UI components (preserve v1.0 visual identity)

- **D-20:** **Scale picker (snap-dots)** is a **bespoke React component**, NOT shadcn `Slider`. v1.0's `scaleClickEl` is a horizontal row of snap-dots + visible label per step + fractional drag — visually different from `Slider`'s thumb/track idiom. Port with `@use-gesture/react` for the optional drag, keyboard arrow-key support, and shadcn theme tokens for colours.
- **D-21:** **Emoji picker** is bespoke too: shadcn `Popover` hosts a grid of `EMOJI_BANK` glyphs from `js/data.js`'s `EMOJI_BANK` (copied verbatim into TS data). No `emoji-picker-react` / `emoji-mart` dep.
- **D-22:** **Chart components** (D-04) are bespoke (no charting library) — already a locked PROJECT.md key decision; restated here for visibility.
- **D-23:** **Wizard** uses `useReducer` with `{step, totalSteps, dir}` state shape. Step content lives as a config array `WIZARD_STEPS` (mirroring `buildWizardSteps`). Swipe (left/right) + arrow keys + skip button + finish action. First-visit gating: persist `Store.getSettings().wizardDone = true` after finish or skip.

### Routes (full SHELL-01 table)

- **D-24:** Every v1.0 hash route lands as a leaf route under the root layout, all matching v1.0 path segments exactly:

  | v1.0 hash | v2.0 route |
  |---|---|
  | `#/` | `/` → `<Home />` (lists profiles + imports) |
  | `#/welcome` | `/welcome` → `<Welcome />` |
  | `#/profile/new` | `/profile/new` → `<ProfileEdit />` (create mode) |
  | `#/profile/:id` | `/profile/:id` → `<ProfileDetail />` |
  | `#/profile/:id/edit` | `/profile/:id/edit` → `<ProfileEdit />` |
  | `#/q-categories/:profileId/:resultId` | `/q-categories/:profileId/:resultId` → `<CategoryOverview />` |
  | `#/q/:profileId/:resultId` | `/q/:profileId/:resultId` → `<Questionnaire />` (dispatches to List or Single by `result.progress.mode`) |
  | `#/result/:id` | `/result/:id` → `<Result />` |
  | `#/result/:id/:catId` | `/result/:id/:catId` → `<Result />` with `catId` param consumed for scroll-into-view + opened drill-down |
  | `#/share/:id` | `/share/:id` → `<Share />` |
  | `#/import` | `/import` → `<Import />` |
  | `#/compare` | `/compare` → `<Compare />` (reads `?ids=…`) |
  | `#/settings` | `/settings` → `<Settings />` |
  | `#/map/:id/settings` | `/map/:id/settings` → `<MapSettings />` |
  | `#/intro` | `/intro` → `<Intro />` |
  | `#/about` | `/about` → `<About />` (same component as `<Intro />`, alias route) |

- **D-25:** **Compare URL scheme preserved verbatim:** `#/compare?ids=a,b,imp:c` — mixed own + import IDs, comma-separated, `imp:` prefix denotes an import. `useSearchParams().get('ids')` parses; up to 4 datasets enforced (slice first 4, surface a toast if more passed).
- **D-26:** **Hash deep-link** for `#/result/:id/:catId` opens the result page, scrolls to the category section, and triggers the same drill-down view the user would see after tapping that axis on the overview spider (per ROADMAP success criterion #9). No additional modal — preserves v1.0's behaviour shape.

### Toast / Dialog primitives (SHELL-06)

- **D-27:** **`useToast()`** is a thin wrapper around shadcn `Sonner`'s `toast()` API, re-exposing `toast.success` / `toast.error` / `toast.message` with project-default durations and dismissible behaviour. Replaces v1.0's `showToast(message)`.
- **D-28:** **`<Dialog />` and `<AlertDialog />`** are typed wrappers that replace v1.0's `dialog({...})`, `dlgAlert`, and `dlgConfirm`. Two APIs:
  - **Declarative** (preferred): `<Dialog open={…} onOpenChange={…}>` for in-tree dialogs (profile edit, share passphrase prompt, edit-item-scale dialog).
  - **Imperative**: `dialog({title, body, actions})` returning a `Promise<value>`, implemented by mounting a portal-hosted Dialog instance. Used for confirm-flow callsites and the template-warning prompt. Implementation: a top-level `<DialogHost />` mounted by the root layout subscribes to a tiny Zustand slice (`dialogQueue`); `dialog({...})` pushes onto the queue and resolves the promise on user action. Mirrors v1.0's ergonomics without losing focus-trap or accessibility.
- **D-29:** **Age gate** (PROFILE-06) is a `<AgeGate />` component mounted by the root layout; if `Store.getSettings().ageConfirmed` is false on first render, it shows a blocking `AlertDialog` with "I'm 18 or older" / "Under 18" actions. "Under 18" routes to a hard-stop view (no app access). "I'm 18+" persists `ageConfirmed = true` and unmounts. Does not re-show on subsequent loads.

### Questionnaire behaviours (subtle bits)

- **D-30:** **Template warning** (v1.0 `checkTemplateWarning` at `js/app.js:1049`) is preserved as `useTemplateWarning(result)` hook returning a `confirmIfTemplate()` async function. Any first edit on a result with `seededFromImportId` / `seededFromResultId` triggers the confirm dialog; "disable forever" sets `result.templateWarningDisabled = true` and persists. Called before every answer mutation in List + Single modes (matching v1.0).
- **D-31:** **"Always-visible save button"** (QUEST-07) — v1.0's questionnaire footer always shows the "← Categories" + "See results →" buttons; reproduce as sticky bottom actions inside the questionnaire route, visible regardless of scroll. Answers auto-save on every change (no explicit "save" needed); the always-visible affordance is the navigation pair, NOT a manual save button.
- **D-32:** **Single-card peek-next animation** uses Tailwind `transition-transform` on the card stack + a `data-state="entering|active|leaving"` attribute the component owns. Under reduced-motion the states collapse to instant swap (no transform animation).
- **D-33:** **Per-item scale override** (the `editItemScaleDialog` path in v1.0) ports to an in-flow `<Dialog />` invoked from the card's "Edit scale for this item" button. Confirms before discarding existing fractional answer for the item if scale changes.

### Result view behaviours

- **D-34:** **Result chart layout** matches v1.0: header → overview spider → per-category breakdown (revealed on axis hover/tap) → item-level spider for active category (when comparing) → bar diff → alignment heat strip. The drill-down "active category" state is owned by `<Result />` and passed down — single source of truth.
- **D-35:** **Up to 4 datasets** enforced at the `<Compare />` and `<Result />` boundary. Charts assume `datasets.length ≤ 4` and render only the first 4 colours from the palette. A toast surfaces if more IDs are passed.

### Share / Import / Compare

- **D-36:** **Share view** uses an in-tree `<Dialog />` (or shadcn `Sheet` on small screens — TBD by planner) for the passphrase entry, then renders the armored output in a `<Textarea>` with a "Copy" button (uses `navigator.clipboard.writeText`) and a "Download `.rshape.txt`" button (uses `<a href={blob} download>` pattern).
- **D-37:** **Import view** accepts `<Textarea>` paste OR `<input type="file">` upload, requires a passphrase, calls `decryptResult`, surfaces `dlgAlert(t('unlock_failed'))` on wrong-passphrase or corrupted-bundle. On success: `Store.saveImport(payload)`, navigate to `/compare?ids=imp:<newId>`.
- **D-38:** **v1.0 fixture regression for SHARE-04** uses `tests/fixtures/v1-bundle.rshape.txt` + `v1-bundle.fixture.ts` (already captured in Phase 1's plan 03). The test imports the bundle and asserts the resulting `Import` object deep-equals a snapshot of the expected shape.
- **D-39:** **Backup export** downloads `relationshape-backup-<isoDate>.v1.json` (a JSON dump of the full `Store` blob). **Backup import** uses `<input type="file">` + `JSON.parse` + `Store.replaceAll(...)` gated by an `<AlertDialog />` confirmation. **Clear all data** uses `<AlertDialog />` with a "Type DELETE to confirm" input gate before `Store.replaceAll(defaults())`.

### Settings

- **D-40:** **Global scale editor** (SETTINGS-01) renders the current scale as a draggable list (uses `@use-gesture/react` for reorder — same dep as questionnaire swipe). Add / delete / edit-step affordances. Persists via `Store.setScale`.
- **D-41:** **Per-map Settings** (`/map/:id/settings`, SETTINGS-03) renders subject identity edit + scale override + category toggles in one form; saves through `Store.saveResult`.
- **D-42:** **Theme picker** is a 3-button toggle group (auto / light / dark) — bespoke; **Language picker** is a 2-button toggle group (EN / DE) — bespoke. Both reachable from `<Nav />` and `<Settings />`. Same Zustand-backed `setTheme` / `setLang` actions.

### Testing

- **D-43:** **Test surface per plan**:
  - App shell — Testing Library `<App />` renders, every SHELL-01 route resolves to its placeholder.
  - Primitives — `useToast`, `<Dialog />` / `<AlertDialog />` imperative API, `useSwipe` (jsdom + synthetic events).
  - Profile — Vitest covers create/edit/delete + persist round-trip through Zustand store.
  - Questionnaire — math helpers (`categoryAverage`, frac helpers) covered as pure functions; mode dispatch + scale picker behaviour covered as component tests.
  - Result / Charts — pure-math helpers from `src/lib/charts/math.ts` + snapshot tests for each chart's SVG output, including the XSS-escape snapshot (D-05).
  - Share / Import / Compare — v1.0 fixture regression for import (D-38); round-trip share→import covered by a fresh-passphrase test.
  - Settings — scale-editor reorder + persist; data-management export+import round-trip.

### Claude's Discretion

The user's four strategic picks (**D-01 plan slicing, D-04 declarative charts, D-08 @use-gesture/react, D-11 flat-i18n prose**) anchor the architecture. The remaining decisions (D-02, D-03, D-05–D-07, D-09, D-10, D-12–D-43) are implementation details Claude resolved using Phase 1's locked decisions, the v1.0 baseline, and `.planning/codebase/` analysis. Downstream researcher/planner should treat these as the working defaults but may revisit any item that conflicts with an evidence-backed concern surfaced during research — particularly the **per-plan shadcn vendoring** list (D-16) if a primitive turns out to be unsuitable, and **D-18's "no react-hook-form"** call if a form grows past ~10 interacting fields.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level intent
- `.planning/PROJECT.md` — Milestone v2.0 scope, privacy guarantee, locked tech-stack decisions, data + bundle compatibility constraints, Key Decisions table
- `.planning/REQUIREMENTS.md` §SHELL/§PROFILE/§QUEST/§RESULT/§SHARE/§SETTINGS — All 39 Phase-2 requirements with explicit acceptance text
- `.planning/ROADMAP.md` §"Phase 2: Parity" — Goal + 18 success criteria the verifier checks against

### Prior phase context (carry-forward, NOT re-discuss)
- `.planning/phases/01-skeleton/01-CONTEXT.md` — Locks router (D-01,D-02), state primitive (D-04), persistence middleware (D-06), reduced-motion (D-08–D-10), i18n shape (D-12–D-14), shadcn init (D-26), `<DesignSystem />` route (D-27,D-28). Every Phase 2 decision composes on top of these.
- `.planning/phases/01-skeleton/01-PATTERNS.md` — Existing pattern mappings the planner reused for Phase 1 plans.
- `.planning/phases/01-skeleton/01-RESEARCH.md` — Patterns 1–6 (Vite+Tailwind+shadcn, `@theme` tokens, Zustand persistence, WebCrypto port, custom i18n, design-system route) + pitfalls. Patterns 3 and 5 are directly relevant to Phase 2 view code.

### v1.0 codebase (must achieve parity with)
- `.planning/codebase/ARCHITECTURE.md` — Layer responsibilities, the route/view dispatch shape being ported (the `viewX` functions → React components mapping)
- `.planning/codebase/STRUCTURE.md` §"Where to Add New Code" — Where v1.0 places new views, translation keys, store fields — informs the React equivalents
- `.planning/codebase/CONVENTIONS.md` — `viewX` naming, `h()` and `Store` patterns being replaced, i18n key conventions, `is-on` / `is-active` BEM-lite modifiers (Tailwind data-attributes replace these)
- `.planning/codebase/CONCERNS.md` §Tech Debt + §Fragile Areas — `app.js` monolith (motivates component extraction), 31 overlapping CSS selectors (motivates Tailwind consolidation), Android scroll-vs-swipe edge case (motivates axis-locked `useDrag`), `bindSpiderInteractivity` listener accumulation risk (motivates React-owned chart handlers)
- `.planning/codebase/INTEGRATIONS.md` — How v1.0 modules interconnect; mapping to React imports
- `.planning/codebase/TESTING.md` — Vitest scope (set in Phase 1); Phase 2 expands coverage along the lines in D-43

### v1.0 source files being ported (the bulk of Phase 2 work)
- `public/legacy/js/app.js` — 3 917 lines, every `viewX` function being ported (line ranges captured in CONCERNS.md and STRUCTURE.md); key landmarks:
  - `:36` `navigate(hash)` — replaced by React Router `useNavigate`
  - `:97` `EMOJI_BANK` — copied verbatim into TS for the emoji picker
  - `:728–831` `buildWizardSteps` + `runWizard` — port to `WIZARD_STEPS` config + `useReducer`-driven `<Wizard />`
  - `:942` `bindGlobalNav` — replaced by `<Nav />` component
  - `:987–3895` all `viewX` functions — one-to-one mapping to React route components per D-24
  - `:1049` `checkTemplateWarning` → `useTemplateWarning(result).confirmIfTemplate()` (D-30)
  - `:2450–2769` `viewQuestionnaireSingle` — the most complex view (swipe, peek, frac scales, item scale override); D-32, D-33
- `public/legacy/js/charts.js` — 478 lines being ported per D-04: pure math → `src/lib/charts/math.ts`; SVG renderers → `src/components/charts/*.tsx`
- `public/legacy/js/i18n.js` §welcome / §intro keys — Long-form prose stays as flat keys per D-11; new shell + view keys append to the existing EN+DE TS maps from Phase 1
- `public/legacy/css/style.css` + `additions.css` — Visual reference for parity; tokens already in `src/styles/theme.css` from Phase 1

### Phase 1 outputs already in the repo
- `src/lib/data/data.ts` — `CATEGORIES`, `DEFAULT_SCALE`, `SPIDER_AXES`, `CATEGORY_GROUPS`, `FILE_FORMAT` — consumed by every questionnaire / chart / category-overview component
- `src/lib/data/types.ts` — `Profile`, `Result`, `Import`, `Scale`, `Settings`, `AnswerCell` types — the prop / state vocabulary for Phase 2
- `src/lib/i18n/en.ts` + `de.ts` + `i18n.ts` — `t()` + typed `TranslationKey` union — add new shell/view keys to both maps
- `src/components/ui/button.tsx` — first shadcn primitive — Phase 2 adds Dialog, AlertDialog, Sonner, Sheet, Popover, Tabs next to it
- `src/styles/theme.css` + `animations.css` + `fonts.css` — design tokens and the 8 keyframes used by view components
- `tests/fixtures/v1-bundle.rshape.txt` + `v1-bundle.fixture.ts` — v1.0 bundle fixture for SHARE-04 regression (D-38)
- `tests/fixtures/v1-localstorage.fixture.ts` — synthetic v1.0 localStorage blob for store hydration tests

### External documentation researcher should consult
- React Router v7 — `createHashRouter`, nested routes with `<Outlet />`, `useSearchParams`, `useNavigate`, `<NavLink>`, `useLocation`
- shadcn/ui — `add` CLI for Dialog/AlertDialog/Sonner/Sheet/Popover/Tabs; styling tokens via `data-state`
- `@use-gesture/react` — `useDrag` with `axis: 'x'`, `bounds`, `rubberband`; `useGesture` aggregation
- Sonner — `toast()` API, custom durations, `Toaster` mount point
- Radix UI (shadcn's substrate) — focus-trap behaviour, ARIA roles, `prefers-reduced-motion` interaction in Dialog/AlertDialog

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

**v1.0 logic ports near-verbatim (the math + state-shape stays):**
- `public/legacy/js/charts.js:52` `categoryAverage(answers, catId, scale)` — pure; lifts directly into `src/lib/charts/math.ts`. Includes the `pushAnswerValues` helper that handles every answer shape (discrete key, `scaleFrac`, `giving/receiving`).
- `public/legacy/js/charts.js:67–101` `answerScaleKey`, `answerAvgValue`, `closestScaleEntry` — pure helpers; lift directly.
- `public/legacy/js/charts.js:324` `pickCategoryAxes(datasets)` — pure helper that decides which axes to show on the overview spider; lift verbatim.
- `public/legacy/js/app.js:36` `navigate(hash)` — replaced wholesale by `useNavigate()` + `useLocation()`; the same-hash re-render edge case is handled by React Router v7's data router by default.
- `public/legacy/js/app.js:97` `EMOJI_BANK` array — copy into `src/lib/data/emoji.ts` as a `const` and use from `<EmojiPicker />`.
- `public/legacy/js/app.js:113` emoji picker UI logic — port to a `<EmojiPicker />` component hosted in shadcn `Popover`.
- `public/legacy/js/app.js:728–760` `buildWizardSteps` + swipe handling — port to `WIZARD_STEPS: WizardStep[]` config + `useReducer`-driven `<Wizard />`.
- `public/legacy/js/app.js:1049` `checkTemplateWarning` — port to `useTemplateWarning(result).confirmIfTemplate()` hook.
- `public/legacy/js/app.js:2059` `(pointer: coarse)` check for swipe enablement — port as a `useIsCoarsePointer()` hook (`matchMedia('(pointer: coarse)').matches` + `MediaQueryList.onchange`).

**Already in `src/` (consume directly):**
- `src/lib/data/data.ts`, `src/lib/data/types.ts`, `src/lib/data/index.ts` — schema and types ready.
- `src/lib/i18n/{en,de,i18n}.ts` — `t()` + typed key union ready; append new keys to both maps.
- `src/lib/utils.ts` — `cn` class-merge helper used by every shadcn-styled component.
- `src/components/ui/button.tsx` — first shadcn primitive in place.

### Established Patterns

- **Hash routing locked.** `createHashRouter` with `<Outlet />`-based nested layouts; every leaf route matches v1.0's hash segments exactly (D-24). `<NavLink>` provides active-link state.
- **Zustand-as-cache.** `Store` actions live on the Zustand store from Phase 1; view components subscribe via selectors. Reads are O(1) — no `JSON.parse` per call. The `lastSaveError` slice drives the quota-error toast (Phase 1 D-07) — Phase 2 just wires a subscriber in `<RootLayout />` that calls `useToast().error(...)` when `lastSaveError` flips non-null.
- **`data-theme` on `<html>`.** Theme tokens cascade from CSS variables under `[data-theme="dark"]` / `[data-theme="light"]`; `useTheme()` hook applies the attribute. Components consume tokens via Tailwind utilities — never read CSS vars directly in TS.
- **`motion-safe:` / `motion-reduce:` Tailwind variants** for component-level transitions; global keyframes already guarded by the Phase 1 `@media (prefers-reduced-motion: reduce)` rule. Phase 2 components just opt into existing utility classes.
- **`is-on` / `is-active` BEM modifiers from v1.0 → Tailwind `data-state` attributes** in React components, so shadcn primitives compose cleanly. The visual fall is `data-[state=active]:bg-accent` etc.
- **Single localStorage key** is sacred — Phase 2 must NOT introduce a second key. All persistence routes through Zustand store actions which write through `relationshapePersist`.

### Integration Points

- **`<App />` currently mounts `<Placeholder />` (src/App.tsx:1).** Plan 1 (App shell) replaces this with `<RouterProvider router={hashRouter} />` wrapped in `<ThemeProvider>` and `<I18nProvider>`. The `<Placeholder />` component is deleted or repurposed as a transient loading state.
- **shadcn target dir is `src/components/ui/`** (Phase 1 D-26). Plan 2 (Primitives) adds Dialog, AlertDialog, Sonner, Sheet, Popover, Tabs here.
- **`tests/fixtures/v1-localstorage.fixture.ts`** seeds Vitest tests for store hydration (Phase 1's plan 03 captured a synthetic blob). Phase 2's plan 3+ extends fixtures with realistic Profile/Result/Import shapes that exercise view rendering.
- **`tests/fixtures/v1-bundle.rshape.txt`** + `v1-bundle.fixture.ts` provide the v1.0 fixture for SHARE-04 (D-38). The Phase 2 Share/Import plan reuses these; no new fixture capture.
- **`public/legacy/` stays in place** — Phase 3 removes it. Phase 2 can side-by-side compare any view against the running legacy app at `/legacy/` during eyeball-parity checks.
- **No SW concern in Phase 2.** PWA is Phase 3. `vite-plugin-pwa.devOptions.enabled = false` means dev SW is off (Phase 1 D-23).

</code_context>

<specifics>
## Specific Ideas

- **Plan-1 acceptance demo:** open the app, every SHELL-01 route renders a labelled placeholder ("`<Welcome />` placeholder", "`<Home />` placeholder", etc.). Hamburger / `Sheet` opens on mobile, profile picker shows "(no profiles yet)" empty state in the nav. Theme + language toggles in the nav are wired and reactive — even on the placeholders.
- **Plan-2 acceptance demo:** trigger a sample toast via a temporary button on the placeholder route; trigger a sample `<Dialog />` via another. Swipe a sample card left/right on a temporary "swipe playground" page (removed at end of plan). Age gate visibly blocks the app on first load with no `ageConfirmed` in localStorage.
- **Plan-3 acceptance demo:** create a profile end-to-end, list it on Home, edit it, delete it. Welcome → Home → Profile → Home loop works in both EN and DE. Wizard runs once and never again.
- **Plan-4 acceptance demo:** answer items in List mode and in Single-card mode. Custom item add/edit/delete works. Switching pointer mode (toggling `(pointer: coarse)` via DevTools emulation) toggles swipe enablement live.
- **Plan-5 acceptance demo:** load a fixture-seeded result with 4 datasets; every chart renders, axis hover/tap drills into the per-category view, enlarged modal opens. Render an XSS payload as the dataset name — verify text-only escape via DevTools.
- **Plan-6 acceptance demo:** share a result, copy + download + re-import the bundle in the same session; v1.0 fixture imports cleanly into `imports`; compare own + import IDs in the URL; backup export + restore round-trips a full snapshot.
- **Plan-7 acceptance demo:** add / edit / reorder / delete a scale step (persists across reload); per-map settings override scale + categories; clear-all-data flow gated by AlertDialog confirms before wiping.

- **Bundle-size signal:** Phase 1 baseline was ~61 KB gzip (React + RR + Zustand + Button). Phase 2 adds Sonner / Radix / `@use-gesture/react` and the view + chart code. Working budget: stay under 200 KB initial gzip — leaves ~50 KB headroom for Phase 3's SW + manifest. No CI enforcement yet (deferred to v2.1), but a manual `npm run build` + `du -sh dist/assets` check at every plan's verification step keeps it honest.

- **XSS test data for RESULT-07:** profile name `"<script>alert('xss')</script>"`, subject `"\"><img onerror=alert(1) src=x>"`, custom item `"&lt;script&gt;test&lt;/script&gt;"`. Snapshot every chart's SVG output with all three labels and grep for `<script` substrings — must be empty.

- **Per-plan PR boundary:** every plan creates files under `src/components/<feature>/`, `src/lib/<feature>/`, and adds its own Vitest suite. No cross-plan refactor inside a plan (refactors land as their own plan if needed). Keeps review surface small.

</specifics>

<deferred>
## Deferred Ideas

- **PWA manifest + Workbox SW for the new app** — Phase 3 (PWA-01, PWA-02). Phase 2 makes the app static-deployable but does NOT generate a manifest.
- **v1→v2 install upgrade smoke** — Phase 3 (PWA-03). Phase 2's Vitest fixture covers the storage hydration but not the install-time SW handoff.
- **Cross-direction bundle compat (v2→v1 decrypt)** — Phase 3 (PWA-05). Phase 2 includes the v1→v2 read regression (D-38) but not the reverse manual verification.
- **Lighthouse PWA audit** — Phase 3 (PWA-06). No audit run in Phase 2.
- **Legacy retirement** (`public/legacy/`, `js/`, `css/`, `sw.js` removal) — Phase 3 (PWA-07). Phase 2 KEEPS legacy alive at `/legacy/` for eyeball-parity comparison.
- **`react-hook-form`** — revisit only if a form grows past ~10 interacting fields. Initial Phase-2 forms use plain controlled components (D-18).
- **`framer-motion` or richer chart animations** — out of scope for v2.0 parity. The Phase 1 reduced-motion policy (D-10) constrains motion deliberately.
- **`emoji-picker-react` / `emoji-mart`** — not used; bespoke `EMOJI_BANK` picker preserves visual parity and bundle budget (D-21).
- **Bundle-size CI** (size-limit) — v2.1+ (QUAL-03). Manual `du -sh` per plan suffices for Phase 2.
- **Broader Vitest coverage** (armor variants, storage edge cases, every i18n key parity) — v2.1+ (QUAL-01).
- **Playwright E2E** — out of scope for v2.0 entirely.
- **Profile colour themes / cover images** (FEAT-02), additional languages (FEAT-03), richer compare visualisations (FEAT-04) — explicitly v2.1+.
- **"Always-visible save button" as a literal save button** — v1.0 doesn't have one (auto-save covers it). The roadmap wording is preserved by the always-visible nav-pair footer (D-31). Revisit if user feedback indicates a need for an explicit "save now" affordance.

</deferred>

---

*Phase: 2-Parity*
*Context gathered: 2026-05-15*
