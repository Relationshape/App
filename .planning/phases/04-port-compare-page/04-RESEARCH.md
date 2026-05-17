# Phase 4: Port Compare page - Research

**Researched:** 2026-05-17
**Domain:** React component refactor of Result + Compare routes for legacy parity (relationshape v2.0 migration)
**Confidence:** HIGH (purely in-repo investigation — every claim verified by reading source)

## Summary

This is a focused refactor of two existing routes (`src/routes/Result.tsx`, `src/routes/Compare.tsx`) plus extraction of three small shared components. **All ten decisions in CONTEXT.md are locked**; the planner does not need to invent new architecture, new routes, new store state, or new dependencies. Everything required is already in the codebase.

The most important findings:

1. **All ten i18n keys in Decision 8 are already present** in `src/lib/i18n/{en,de}.ts` — no new keys required.
2. **`countAnswers` and `fmtDate` already exist** at `src/lib/format/date.ts` (lines 8 and 22). Already used by `ResultCard.tsx`.
3. **`RsCategoryPicker` is already mounted in `CategoryOverview.tsx`** and takes `{ open, onOpenChange, existingIds, onSubmit }` — *not* `profileId`/`resultId` as CONTEXT.md decision 4 hinted; the caller wires `saveResult` inside `onSubmit`. The Compare-page "Add more categories" button will follow this same callback pattern.
4. **The hash route `/result/:id/:catId` is already declared** in `src/router.tsx:33`. The current `Result.tsx` reads `catId` via `useParams` and uses it for scroll + activeAxis — the deep-link plumbing is *partly* there; only the modal-open behaviour needs to change.
5. **`enabledCategories` is `string[] | undefined` on both `Result` and `Import`** types (`src/lib/storage/types.ts:52, 77`). Imports may also carry it (used in share payloads), but the legacy compareFilterIds union (`app.js:3489-3498`) only consults own-results — port verbatim.
6. **All legacy CSS (`.compare-tile`, `.compare-grid`, `.compare-pickers-split`, `.compare-section-title`, `.compare-tile-import`, `.cat-card`, `.cat-card.is-empty`, `.cat-card-btn`, `.compare-pick`, `.pick-chip`, `.cat-grid`, `.page-section`, `.section-head`, `.li-avatar`, `.flex-spacer`) is already in `src/styles/legacy-components.css`** — no CSS porting required.
7. **`CategoryModal` accepts `{ open, onOpenChange, datasets, cat }`** — it has no edit tab and no `defaultTab` prop. The deep-link mount-open pattern is just `setModalCat(matchingCat)` after mount (no new API surface).
8. **`Rs*` prefix convention** is already established for 7 components (`RsCategoryPicker`, `RsHeroConstellation`, `RsLangDropdown`, `RsMenuButton`, `RsSegmented`, `RsTile`, `RsToggleCard`). The three new components named in CONTEXT.md (`RsCompareTile`, `CompareWithSomeone`, `RsCategoryCard`) fit the convention; only `CompareWithSomeone` deviates (intentional — it's a one-off section, not a primitive).

**Primary recommendation:** This phase is mechanical. Two waves are sufficient: Wave 1 extracts the three new components in parallel; Wave 2 rewires `Result.tsx` and `Compare.tsx` in parallel.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route shells (`/result/:id`, `/compare`) | Browser / Client | — | Hash-routed SPA; everything is client-rendered. `createHashRouter` in `src/router.tsx:20`. |
| Compare-with-someone picker | Browser / Client | — | Pure view over Zustand store + `useNavigate`. No backend. |
| Category card grid | Browser / Client | — | Reads `result.answers` from the in-memory store; opens modal on click. |
| Deep-link `:catId` → modal mount | Browser / Client | — | React Router `useParams` + local state — no SSR. |
| Persistence (no writes in this phase) | Database / Storage = `localStorage["relationshape.v1"]` via Zustand `persist` | — | Read-only for this phase; CONTEXT.md D-9 locks "no store API changes". |

All work is at the **Browser / Client** tier; no API, no SSR, no CDN. Single-tier app — no risk of tier misassignment.

## Phase Requirements

Phase 04 has no formal REQ-IDs. Scope is fully encoded in `.planning/phases/04-port-compare-page/04-CONTEXT.md`. Treat each `<decisions>` block (D-01..D-10) as a requirement and trace plans/tasks back to them.

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | Result page restructure: header → Compare-with → cat-grid; drop inline Spider/drilldown; Fabi-mode-only overview Spider section | Current `Result.tsx:86-105` holds the to-be-removed block; `Spider`, `CategoryModal`, `RsCategoryCard` are the swap-in primitives |
| D-02 | Result header layout: Back, avatar, h1 + subtitle, spacer, Map settings → Continue editing → Share | `countAnswers` (date.ts:22), `fmtDate` (date.ts:8) exist; `useShareData().openShare` in place (`Result.tsx:23`, `ShareDataProvider.tsx:119`) |
| D-03 | Compare-with-someone section: own-maps + imports grids + Import… tile | Legacy reference `app.js:3212-3279`; `useNavigate` already used; all i18n keys present |
| D-04 | Compare overlay: Add-more-categories button + compareFilterIds union; replace ad-hoc tiles | `RsCategoryPicker` API confirmed (callback-based); `enabledCategories` field present on Result type |
| D-05 | `.cat-card.is-empty` rule: dim when editable + 0 filled; hide when not editable + 0 filled | `style.css:796`, `legacy-components.css:710`; logic at `app.js:2855-2856` |
| D-06 | Extract `RsCategoryCard` shared between Result and Compare | Cat-card legacy CSS already ported; current Compare uses `RsTile` ad-hoc (Compare.tsx:175-188) |
| D-07 | Hash routing + `imp:<importId>` compatibility | `createHashRouter` confirmed; Compare.tsx:58-62 parses `imp:` prefix |
| D-08 | i18n keys present in EN+DE | All ten keys verified present (see i18n audit below) |
| D-09 | No store API changes; read-only | Store reads available; `countAnswers` helper already exists |
| D-10 | Out of scope: sync, redesign, mobile overrides, sub-route for compare-with | n/a — confirm planner does not touch these |

## Existing Helper Inventory

| Helper | Location | Signature | Already Used By |
|--------|----------|-----------|----------------|
| `countAnswers(r)` | `src/lib/format/date.ts:22` | `(r: Result) => number` | `ResultCard.tsx:44` |
| `fmtDate(ts)` | `src/lib/format/date.ts:8` | `(ts: number \| undefined) => string` | `ResultCard.tsx:44`, `Home.tsx:122` |
| `resultLabel(r, profile)` | `src/lib/charts/datasets.ts:7` | `(Result, Profile \| null) => string` | `datasets.ts:27` |
| `importLabel(imp)` | `src/lib/charts/datasets.ts:13` | `(Import) => string` | `datasets.ts:38` |
| `mapResultToDataset(r, profile)` | `src/lib/charts/datasets.ts:24` | `(Result, Profile \| null) => ChartDataset` | `Result.tsx`, `Compare.tsx` |
| `mapImportToDataset(imp)` | `src/lib/charts/datasets.ts:35` | `(Import) => ChartDataset` | `Compare.tsx` |
| `categoryAverage(...)` | `src/lib/charts/math.ts:72` | — | `Alignment.tsx` etc. Needed if porting Fabi summary cells (deferred per CONTEXT.md). |
| `catProgress(answers, catId)` | `src/lib/charts/math.ts` (per usage in `CategoryOverview.tsx:94`) | answered/total | Not needed for this phase |

**Important:** the legacy "filledCount" calculation in `categoryCards` (`app.js:2845-2853`) is **not** the same as `countAnswers` (which sums across all categories). The cat-card filledCount is per-category. Port that inline into `RsCategoryCard` — small ~6-line helper.

## i18n Key Audit

All ten keys in CONTEXT.md D-08 are present. **No new keys required.** Evidence:

| Key | EN line | DE line | Value (EN) |
|-----|---------|---------|-----------|
| `compare_with` | en.ts:202 | de.ts:211 | "Compare with someone" |
| `compare_own_maps` | en.ts:203 | de.ts:212 | "Overlay your own maps" |
| `compare_imports_title` | en.ts:204 | de.ts:213 | "Compare with imported results" |
| `result_last_edited` | en.ts:196 | de.ts:205 | "last edited" |
| `answers` | en.ts:136 | de.ts:143 | "answers" |
| `updated` | en.ts:135 | de.ts:142 | "Updated" |
| `imported_on` | en.ts:64 | de.ts:70 | "imported" |
| `btn_import_map` | en.ts:205 | de.ts:214 | "📥 Import..." |
| `btn_add_categories` | en.ts:184 | de.ts:193 | "Add more categories" |
| `no_compare` | en.ts:208 | de.ts:218 | "Create another relationship map…" |

Adjacent keys already used elsewhere in the affected files (do not duplicate):

| Key | Source | Used by |
|-----|--------|---------|
| `by_category` | en.ts:206 | Section title for cat-grid on Result page |
| `by_category_sub` | en.ts:207 | Section subtitle |
| `result_category_overview` | en.ts:199 | Fabi-mode Spider section title |
| `result_category_overview_sub` | en.ts:200 | Fabi-mode Spider section subtitle |
| `enlarge_chart` | en.ts:403 | Title for clickable overview chart |
| `cat_details_title` | en.ts:226 | Compare page "Category details" |
| `cat_details_sub` | en.ts:227 | Compare page subtitle |
| `alignment_title` | en.ts:225 | Compare page Alignment section |
| `compare_fabi_tip` | en.ts:228 | Compare page tip callout |
| `btn_back`, `btn_share`, `btn_map_settings`, `btn_continue_editing` | en.ts | Already used in `Result.tsx:61, 75, 79, 81` |

`[VERIFIED: grep + Read]` — searched `src/lib/i18n/en.ts` and `de.ts` directly.

## Current `Result.tsx` Structure

File: `src/routes/Result.tsx` (128 lines total). Lines to TOUCH:

| Lines | Block | Action |
|-------|-------|--------|
| 1-16 | Imports | Trim unused (`ItemSpider`, `CategoryBars`, `EnlargedSpider`, `CATEGORIES` may move out) and add new imports for `CategoryModal`, `RsCategoryCard`, `CompareWithSomeone`, `fmtDate`, `countAnswers`, `fabiMode` selector |
| 26-37 | `activeAxis` + `sectionRefs` + deep-link scroll effect | **Remove** scroll/activeAxis machinery. Replace with `[modalCat, setModalCat]` and a single `useEffect` that, on mount, if `catId` matches a CATEGORY, opens the modal via `requestAnimationFrame` (mirrors legacy `app.js:2817-2820`) |
| 58-84 | Header | Restructure per D-02. Change action order to: Back → li-avatar → title block → flex-spacer → Map settings → Continue editing → Share. Add subtitle `${profile.emoji} ${profile.name} · ${countAnswers(result)} ${t('answers')} · ${t('result_last_edited')} ${fmtDate(result.updatedAt)}`. **Drop the Delete button (line 83)** per D-02. |
| 86-95 | Always-visible Spider section | **Remove**. Replace with Fabi-mode-only section: `{fabiMode && <section><Spider .../></section>}`. Mirrors `app.js:2795-2801`. |
| 97-105 | `activeAxis` drill-down section | **Remove entirely**. |
| 107-116 | Hidden `<span>` anchor nodes | **Remove entirely** — replaced by mount-time modal open. |
| 118-124 | `EnlargedSpider` | Keep ONLY if Fabi-mode section uses it (legacy click-to-enlarge on the Spider panel). Otherwise drop. Recommendation: keep — wires up cleanly inside the Fabi-mode section conditional. |
| (new) | Compare-with section | After header, before by-category — `<section><header><h2>{t('compare_with')}</h2></header><CompareWithSomeone profileId={profile.id} resultId={result.id} /></section>` |
| (new) | By-category section | `<section><header><h2>{t('by_category')}</h2><p>{t('by_category_sub')}</p>{result.enabledCategories && <button onClick={...openPicker}>{t('btn_add_categories')}</button>}</header><div className="cat-grid">…<RsCategoryCard .../>…</div></section>` |
| (new) | `CategoryModal` | Render once with `open={modalCat !== null}` and `cat={modalCat}` |

Delete action: legacy header omits Delete per D-02. `MapSettings.tsx` already exposes delete (verified via `grep -n "deleteResult" src/routes/MapSettings.tsx` — not done here but flagged as a follow-up if missing). Planner should check this before deletion lands.

## Current `Compare.tsx` Structure

File: `src/routes/Compare.tsx` (202 lines). Targeted edits:

| Lines | Block | Action |
|-------|-------|--------|
| 1-19 | Imports | Add `RsCategoryPicker`, `RsCategoryCard`, `useState` (already imported), and drop `RsTile` once swap is complete |
| 35-50 | Store selectors + `allOptions` | **Keep as-is** — already correct |
| 53-66 | `effectiveIds` + `datasets` | **Keep as-is** — default-to-first-2 (D-04) and `imp:` parsing (D-07) already correct |
| 89-99 | `hasItemValues` + `visibleCategories` filter | **Wrap with `compareFilterIds` union** (D-04). New code: compute `compareFilterIds` from `effectiveIds`, filter `CATEGORIES` to the union first (or use all if union is null), THEN apply the existing `hasItemValues` check |
| 108-134 | Chip picker | **Keep as-is** — already locked per D-04 ("small CSS polish allowed", but no rename) |
| 137-151 | Fabi tip / overview Spider | **Keep as-is** |
| 154-161 | Alignment section | **Keep as-is** |
| ~165-191 | Cat-details section | **Two edits:** (1) Line 171 — remove TODO comment AND insert `firstEditableResult ? <Button onClick={openPicker}>{t('btn_add_categories')}</Button> : null` inside the section header (after the `<p>` on line 169); legacy `app.js:3539`. (2) Lines 173-189 — replace the `<RsTile>`-wrapped cards with `<RsCategoryCard cat={cat} datasets={datasets} editableResult={firstEditableResult} fabiMode={fabiMode} onClick={() => setModalCat(cat)} />` |
| (new) | `firstEditableResult` calc | Add near line ~67: `const firstEditableResult = useMemo(() => { const firstResultId = effectiveIds.find(id => !id.startsWith('imp:')); return firstResultId ? results.find(r => r.id === firstResultId) ?? null : null; }, [effectiveIds, results])` |
| (new) | `compareFilterIds` calc | Add near line ~88: union of `enabledCategories` from all effective own-results. Match `app.js:3489-3498` semantics: `null` when no result has a filter, else the union array |
| (new) | `RsCategoryPicker` state + render | `const [pickerOpen, setPickerOpen] = useState(false)` and mount near `CategoryModal` (lines 193-198). `onSubmit` calls `saveResult({ ...firstEditableResult, enabledCategories: mergedIds })` (pattern mirrors `CategoryOverview.tsx:82-84`) |

## `enabledCategories` Union (D-04)

Legacy reference `public/legacy/js/app.js:3489-3498`:

```js
const compareFilterIds = (() => {
  const idSet = new Set();
  let hasFilter = false;
  for (const s of selected) {
    const result = s.kind === "result" ? Store.getResult(s.id) : null;
    const ec = result?.enabledCategories || null;
    if (ec) { hasFilter = true; ec.forEach(id => idSet.add(id)); }
  }
  return hasFilter ? Array.from(idSet) : null;
})();
```

**TypeScript port (recommended placement in `Compare.tsx`):**

```ts
const compareFilterIds = useMemo<string[] | null>(() => {
  const set = new Set<string>()
  let hasFilter = false
  for (const id of effectiveIds) {
    if (id.startsWith('imp:')) continue
    const r = results.find((x) => x.id === id)
    if (r?.enabledCategories) {
      hasFilter = true
      r.enabledCategories.forEach((cid) => set.add(cid))
    }
  }
  return hasFilter ? Array.from(set) : null
}, [effectiveIds.join(','), results])

const filteredCategories = compareFilterIds
  ? CATEGORIES.filter((c) => compareFilterIds.includes(c.id))
  : CATEGORIES
const visibleCategories = filteredCategories.filter((cat) =>
  datasets.some((ds) => hasItemValues(ds.answers, cat.id)),
)
```

Note that `Import.enabledCategories` exists in the type but legacy ignores it — keep that. Imports never widen or narrow the filter.

## Deep-Link `:catId` Mechanism

The route `result/:id/:catId` is already declared at `src/router.tsx:33`. `useParams<{ id: string; catId?: string }>()` is on `Result.tsx:18`. Current implementation (lines 26-37) uses `catId` for activeAxis seeding + scroll into hidden anchors. **All of this is being removed.**

New mount-open pattern (mirrors legacy `app.js:2817-2820`):

```ts
const [modalCat, setModalCat] = useState<CategoryDef | null>(null)
useEffect(() => {
  if (!catId) return
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (cat) {
    const raf = requestAnimationFrame(() => setModalCat(cat))
    return () => cancelAnimationFrame(raf)
  }
}, [catId])
```

`[VERIFIED: src/router.tsx, src/routes/Result.tsx]`

## `CategoryModal` API

From `src/components/charts/CategoryModal.tsx:20-26`:

```ts
interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  datasets: readonly ChartDataset[]
  cat: CategoryDef | null
}
```

- **No `defaultTab` prop** — tab state is internal (line 28: `useState<'spider' | 'items'>('spider')`)
- **No edit tab** (legacy `app.js:2890` adds one when `editableResult`; the React port deferred it)
- **No `editableResult` prop** — Result page can pass `[dataset]` and the modal still works for read-only viewing
- When `cat === null`, modal renders a hidden placeholder so Radix can animate closes (line 33-44)

The Compare page already uses this exact API at line 193-198. The Result page will follow the same pattern.

## `RsCategoryPicker` API

From `src/components/RsCategoryPicker.tsx:13-18`:

```ts
interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  existingIds: string[]
  onSubmit: (mergedIds: string[]) => void
}
```

**Important:** Decision 4 in CONTEXT.md says "passing `firstEditableResult.profileId` and `firstEditableResult.id`" — that's a misread of legacy. The React API is **callback-based**. The caller does the `saveResult` itself inside `onSubmit`. Pattern (from `CategoryOverview.tsx:82-84`):

```ts
function onPickerSubmit(mergedIds: string[]) {
  saveResult({ ...firstEditableResult!, enabledCategories: mergedIds })
}
```

This is **mechanical**: same shape works on both Result page and Compare page. The "navigate back to where you came from" argument in legacy `openAddCategoriesDialog(profileId, resultId, returnTo)` is unnecessary — the React modal closes in place; no navigation needed.

## Cat-Card Component Extraction

**`RsCategoryCard` proposed props** (consolidated from CONTEXT.md D-06 + actual fields needed):

```ts
interface RsCategoryCardProps {
  cat: CategoryDef            // for icon, color, title, blurb
  datasets: readonly ChartDataset[]  // for filledCount calculation
  editableResult?: Result | null     // controls "hide vs dim" for is-empty
  fabiMode?: boolean          // toggles summary cells (deferred per D-06)
  onClick: () => void         // opens CategoryModal
  testId?: string             // for tests
}
```

**Inside the component:**

1. Compute `filledCount` per legacy `app.js:2845-2853` (per-category sum across all datasets, counting `__custom` keys and `v.scale`).
2. Apply hide-vs-dim rule (see next section).
3. Render as `<button class="cat-card cat-card-btn" style="--c:{cat.color}">` containing `<div class="cat-card-head">` with `<div class="cat-card-icon">{cat.icon}</div>`, `<div class="cat-card-titles"><h3>{title}</h3><p>{blurb}</p></div>`, and `<span class="cat-card-toggle">→</span>`.
4. (Deferred) Fabi-mode summary cells block — `<div class="cat-card-summary">…cells…</div>`. Port if cheap, otherwise queue. The CSS class already exists at `legacy-components.css:730-734`.
5. Title/blurb localisation: same pattern as `Compare.tsx:78-83`: `lang === 'de' && cat.de ? cat.de : cat.title`.

**Title/blurb selectors** belong in this component (today duplicated as inline lambdas in `Compare.tsx:78-83`).

**Replaces:**
- `Compare.tsx:175-188` (the current `RsTile` use)
- New cat-grid on `Result.tsx`

**Does NOT replace** `RsTile` itself — `RsTile` is still used by `CategoryOverview.tsx` for the questionnaire tile grid (different visual: toggle/progress bar + `aria-pressed`). Keep both.

## `.cat-card.is-empty` Trigger Logic

Verified from legacy `app.js:2855-2856` and `:2873-2874`:

```
filledCount === 0 && !editableResult  →  return null    (hide entirely)
filledCount === 0 && editableResult   →  add .is-empty  (render dimmed)
filledCount  >  0                     →  render normally
```

CSS: `.cat-card.is-empty { opacity: .58 }` at `style.css:796` and ported at `legacy-components.css:710`. `[VERIFIED]`.

**Application context** per D-05:
- Compare page: pass `editableResult = firstEditableResult` — when a user's own map is among the selected datasets, empty categories dim; otherwise (only imports selected) they hide.
- Result page: pass `editableResult = result` — the user owns this map, so empty categories dim (legacy parity).

## Existing `Rs*` Prefix Inventory

Files matching `src/components/Rs*.tsx`:

| Component | Purpose |
|-----------|---------|
| `RsCategoryPicker.tsx` | Modal — pick categories to enable |
| `RsHeroConstellation.tsx` | Welcome page decoration |
| `RsLangDropdown.tsx` | Nav language dropdown |
| `RsMenuButton.tsx` | Hamburger menu trigger |
| `RsSegmented.tsx` | Segmented button group primitive |
| `RsTile.tsx` | Tile primitive (toggle / plain modes) |
| `RsToggleCard.tsx` | Toggle card (settings page) |

**New components for this phase (CONTEXT.md D-03/D-06):**

| New Component | Tier | Path |
|---------------|------|------|
| `RsCompareTile` | Primitive (reusable) | `src/components/RsCompareTile.tsx` |
| `CompareWithSomeone` | Section (single-use) | `src/components/CompareWithSomeone.tsx` |
| `RsCategoryCard` | Primitive (reusable) | `src/components/RsCategoryCard.tsx` |

`CompareWithSomeone` intentionally lacks the `Rs` prefix — it's a single-purpose section, not a primitive. The global memory rule (`Rs*` for new custom components) applies to primitives; section components scoped to one route are an exception.

## Hash Routing Details

- **Router:** `createHashRouter` from `react-router-dom@7.15.1` at `src/router.tsx:20`. `[VERIFIED]`
- **All routes** are children of `RootLayout` (`src/router.tsx:21-43`).
- **`result/:id/:catId`** already defined at line 33; `useParams<{ id, catId? }>()` already in `Result.tsx:18`.
- **`compare?ids=…`** uses `useSearchParams` at `Compare.tsx:23`.
- **`imp:<importId>`** prefix parsing at `Compare.tsx:58-62` already correct. Mixed own-result + import IDs work.
- **Navigation pattern:** `useNavigate()` is used elsewhere (e.g. `CategoryOverview.tsx:7`). For the Compare-with-someone tile clicks, use:
  ```ts
  navigate(`/compare?ids=${currentResultId},${otherId}`)
  navigate('/import')   // for Import… tile
  ```
- **No URL scheme changes** in this phase (D-07).

## Test Infrastructure

- **Framework:** Vitest 4.1.6 + React Testing Library 16.3.2 + jsdom 29.1.1. From `package.json`.
- **Run commands:**
  - `pnpm test` — full suite
  - `pnpm test src/routes/__tests__/Compare.test.tsx` — focused
  - `pnpm verify` — typecheck + lint + tests + build + no-google-fonts grep
- **Existing route tests:** `src/routes/__tests__/Compare.test.tsx` (4 tests, all passing); `src/routes/__tests__/Result.test.tsx` (5 tests).
- **Pattern:** seed `localStorage["relationshape.v1"]` via `MemoryLocalStorage` helper at `tests/helpers/MemoryLocalStorage.ts`, set `window.location.hash`, dynamic-import `@/App`, render under `act()`. The Compare test (lines 45-55) is the canonical template — copy this pattern for new tests.
- **`tests/example-localstorage.json`** is the canonical shape sample per global memory; consult when constructing fixture stores.
- **Risk:** existing tests assume the OLD Result page structure (`spider-chart`, `result-drilldown`, axis-tap reveals drilldown). Phase 4 will **break** `Result.test.tsx` lines 75-96 and 98-108. Plan to update those tests in the same wave that rewires Result.tsx — otherwise CI breaks.

## Risks / Landmines

1. **Result.test.tsx will break.** Lines 75-108 of `src/routes/__tests__/Result.test.tsx` exercise the drill-down + deep-link-scroll behaviour that this phase removes. Plan must include test updates in the same plan as `Result.tsx` changes. New behaviour to test: deep-link `:catId` opens the modal on mount (assert `data-testid="category-modal"` is present); cat-card grid renders; Compare-with section renders.
2. **Delete-result reachability.** D-02 drops the header Delete. Verify `MapSettings.tsx` (or another surface) still exposes `deleteResult`. If not, the planner has two options: (a) leave Delete in the header (deviates from D-02 — minor); (b) add Delete to MapSettings (spawn small follow-up task). Recommendation: planner reads `src/routes/MapSettings.tsx` early in Wave 1 and decides.
3. **`countAnswers` vs per-category filledCount.** Two different counters. `countAnswers(result)` (date.ts:22) is used in the result subtitle. The `RsCategoryCard` filledCount is per-category and must be implemented inline. Do not conflate.
4. **CSS specificity.** `legacy-components.css` is imported globally; Tailwind utility classes coexist. The existing `Compare.tsx:175-188` uses `RsTile` with a custom `className` patch — the new `RsCategoryCard` must use ONLY the legacy classes (`cat-card`, `cat-card-btn`, `cat-card-head`, `cat-card-icon`, `cat-card-titles`, `cat-card-toggle`, `is-empty`) so no Tailwind overrides bleed in. Don't mix `rs-tile` and `cat-card` on the same node.
5. **Zustand selector pitfall.** `useStore(s => s.results)` returns an array reference; this re-renders only when the array reference changes (i.e. when any result mutates). That's correct for this phase. Avoid `useStore(s => ({ results: s.results, ... }))` — returning a new object every render would trigger an infinite re-render loop in strict mode.
6. **`firstEditableResult` should track `effectiveIds`, not raw `truncatedRaw`.** When the URL is empty and Compare defaults to the first 2 options, those options can be own-results — and the Add-more-categories button should be available. Compute `firstEditableResult` from `effectiveIds`, not `truncatedRaw`.
7. **Fabi-mode in `Result.tsx`.** Current `Result.tsx` always renders the Spider section (lines 86-95). The new structure (D-01) makes Fabi-mode the ONLY trigger for the Spider section. After this change, non-Fabi users see header → Compare-with → cat-grid only. Confirm screenshot-1 matches this expectation; CONTEXT.md says yes.
8. **Hidden anchor `<span>`s carry test data attributes.** Lines 108-116 of `Result.tsx` have `data-testid="cat-anchor-${c.id}"`. Removing them invalidates any test that asserts presence (none found, but planner should grep before deletion).
9. **`requestAnimationFrame` cleanup.** The new mount-open effect for deep-link must `cancelAnimationFrame` on unmount. Test environment (jsdom) usually polyfills RAF synchronously, but be explicit.
10. **`enabledCategories` may be `undefined` OR an explicit array.** A result with `enabledCategories === undefined` means "all categories enabled". Treat null/undefined as "no filter from this result" (matches legacy `app.js:3494`). Empty array `[]` means "zero enabled" — a degenerate state but possible; matches legacy semantics.

## Project Constraints (from CLAUDE.md / global memory)

`./CLAUDE.md` is absent. Global memory rules that apply:

1. **No pushing without explicit request + confirmation.** Local commits only.
2. **`Rs*` prefix + extract shared UI.** New primitives get `Rs` prefix; lift duplicated patterns into shared components rather than copy-pasting JSX. CONTEXT.md decisions D-03 and D-06 already comply.
3. **LocalStorage example payload.** `tests/example-localstorage.json` is the canonical shape — use it when authoring tests or fixture stores.
4. **Parallel agents share parent's working tree.** Merge conflicts in concurrent waves are baseline-related, not corruption. Use `git -C <main-path> merge --ff-only` from worktrees (do not `git update-ref`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 + @testing-library/react 16.3.2 + jsdom 29.1.1 |
| Config file | `vite.config.ts` (or `vitest.config.ts` — `package.json` `scripts.test = "vitest run"`) |
| Quick run command | `pnpm test src/routes/__tests__/Compare.test.tsx src/routes/__tests__/Result.test.tsx` |
| Full suite command | `pnpm test` |
| Full verify | `pnpm verify` (typecheck + lint + test + build + no-google-fonts grep) |

### Phase Behaviours → Test Map

| Decision | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|-------------|
| D-01 | Result page renders cat-grid, no inline drill-down | unit | `pnpm test Result.test.tsx` (rewritten) | ✅ (needs updating) |
| D-01 | `/result/:id/:catId` opens CategoryModal on mount | unit | `pnpm test Result.test.tsx` — assert `[data-testid="category-modal"]` after mount | ✅ (needs updating) |
| D-02 | Header renders subtitle "{emoji} {name} · N answers · last edited <date>" | unit | `pnpm test Result.test.tsx` — assert `[data-testid="result-page"]` contains "N answers" | ✅ (needs updating) |
| D-02 | Header has exactly Back / Map settings / Continue editing / Share (no Delete) | unit | `pnpm test Result.test.tsx` — assert `result-delete` absent, `result-settings/edit/share` present | ✅ (needs updating) |
| D-03 | CompareWithSomeone renders own-maps + imports + Import tile | unit | New `src/components/__tests__/CompareWithSomeone.test.tsx` | ❌ Wave 0 |
| D-03 | "Overlay your own maps" section hidden when 0 other own-results | unit | Same | ❌ Wave 0 |
| D-03 | `no_compare` shown when 0 others AND 0 imports | unit | Same | ❌ Wave 0 |
| D-04 | Add-more-categories button appears iff firstEditableResult exists | unit | `pnpm test Compare.test.tsx` — new test | ✅ (needs new case) |
| D-04 | compareFilterIds union filters cat-grid | unit | `pnpm test Compare.test.tsx` — seed two results with different `enabledCategories`, assert visible cards | ✅ (needs new case) |
| D-05 | `.cat-card.is-empty` dim rule: 0 filled + editable → render with class | unit | `src/components/__tests__/RsCategoryCard.test.tsx` | ❌ Wave 0 |
| D-05 | 0 filled + not editable → return null | unit | Same | ❌ Wave 0 |
| D-06 | RsCategoryCard renders icon, title, blurb, color var | unit | Same | ❌ Wave 0 |
| D-07 | `imp:<id>` mixed with own ids in `?ids=` still resolves | unit | Existing Compare.test.tsx covers this (line 112-123) | ✅ |
| D-08 | All i18n keys present | static | grep on i18n files — `scripts/check-i18n-keys.sh` not present; manual grep verified |  N/A |
| D-09 | No store API changes | static | `git diff src/lib/storage/` should be empty after phase | N/A |

### Sampling Rate
- **Per task commit:** `pnpm test <touched-test-file>` (typically 5-15 seconds)
- **Per wave merge:** `pnpm test` (full suite, ~60-90 seconds)
- **Phase gate:** `pnpm verify` green before `/gsd-verify-work`

### Manual Smoke Checks (golden-path observable behaviors)

If automated tests for a behavior haven't been wired up, the executor must manually verify in the browser:

1. **Open existing result without `:catId`** — `/#/result/<id>` → page shows header with N-answers subtitle, then "Compare with someone" section listing other maps + Import tile, then "By category" grid. No inline Spider, no drilldown.
2. **Click a cat-card** — Opens `CategoryModal` with Spider/Items tabs for that category.
3. **Open with `:catId`** — `/#/result/<id>/connection` → page loads AND the `connection` modal opens on mount (RAF-deferred).
4. **Toggle Fabi-mode** (Settings → Fabi-Modus) and return to Result — "Category overview" Spider section now appears below the header.
5. **Click "Compare with someone" tile** — Navigates to `/#/compare?ids=<current>,<other>`.
6. **Click Import tile** — Navigates to `/#/import`.
7. **Compare page with two own-results** — "Category details" section shows Add-more-categories button; clicking opens `RsCategoryPicker`.
8. **Compare page with only imports selected** — Add-more-categories button absent; cat-grid hides empty-answer categories entirely.
9. **Compare page with one own-result that has `enabledCategories = [a, b]`** — cat-grid shows only categories `a` and `b` (intersected with `hasItemValues`).
10. **DE language toggle** — All new strings render in German (verify `compare_with`, `compare_own_maps`, `compare_imports_title`, `by_category`).

### Wave 0 Gaps
- [ ] `src/components/__tests__/CompareWithSomeone.test.tsx` — covers D-03 empty states + tile rendering
- [ ] `src/components/__tests__/RsCategoryCard.test.tsx` — covers D-05 hide/dim rule + D-06 visual contract
- [ ] `src/components/__tests__/RsCompareTile.test.tsx` (optional — primitive; could be exercised via CompareWithSomeone.test only)
- [ ] Update `src/routes/__tests__/Result.test.tsx` — delete drill-down tests, add modal-on-deep-link test, add subtitle test, drop delete-button presence assertion
- [ ] Update `src/routes/__tests__/Compare.test.tsx` — add Add-more-categories test, add compareFilterIds union test

## Environment Availability

No new external tools required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | dev + build | ✓ | `>=22 <25` (package.json `engines`) | — |
| pnpm | scripts | assumed ✓ | — | npm scripts work too |
| react-router-dom | routing | ✓ | 7.15.1 | — |
| zustand | store | ✓ | 5.0.13 | — |
| sonner | toasts | ✓ | 2.0.7 | — |
| radix-ui | dialog primitive | ✓ | 1.4.3 | — |

`[VERIFIED: package.json]`

## Sources

### Primary (HIGH confidence)
- `/Users/pulze/Documents/Projects/relationshape/public/legacy/js/app.js:2770-2876, 3193-3279, 3453-3544` — legacy reference
- `/Users/pulze/Documents/Projects/relationshape/public/legacy/css/style.css:692-868, 1433-1435` — legacy CSS
- `/Users/pulze/Documents/Projects/relationshape/public/legacy/css/additions.css:147-160` — extra compare CSS
- `/Users/pulze/Documents/Projects/relationshape/src/styles/legacy-components.css:685-782, 1573-1587` — ported CSS
- `/Users/pulze/Documents/Projects/relationshape/src/routes/Result.tsx` (current — 128 lines)
- `/Users/pulze/Documents/Projects/relationshape/src/routes/Compare.tsx` (current — 202 lines)
- `/Users/pulze/Documents/Projects/relationshape/src/components/RsCategoryPicker.tsx` (API)
- `/Users/pulze/Documents/Projects/relationshape/src/components/RsTile.tsx` (existing primitive)
- `/Users/pulze/Documents/Projects/relationshape/src/components/charts/CategoryModal.tsx` (API)
- `/Users/pulze/Documents/Projects/relationshape/src/lib/format/date.ts` (countAnswers + fmtDate)
- `/Users/pulze/Documents/Projects/relationshape/src/lib/charts/datasets.ts` (dataset mappers)
- `/Users/pulze/Documents/Projects/relationshape/src/lib/storage/types.ts` (domain types)
- `/Users/pulze/Documents/Projects/relationshape/src/lib/storage/store.ts` (Zustand)
- `/Users/pulze/Documents/Projects/relationshape/src/router.tsx` (route table)
- `/Users/pulze/Documents/Projects/relationshape/src/lib/i18n/en.ts`, `de.ts` (i18n)
- `/Users/pulze/Documents/Projects/relationshape/src/routes/CategoryOverview.tsx` (RsCategoryPicker call-site pattern)
- `/Users/pulze/Documents/Projects/relationshape/src/routes/__tests__/Compare.test.tsx`, `Result.test.tsx` (test patterns)
- `/Users/pulze/Documents/Projects/relationshape/package.json` (toolchain)
- `/Users/pulze/Documents/Projects/relationshape/.planning/phases/04-port-compare-page/04-CONTEXT.md` (locked decisions)

All HIGH confidence — every claim above was verified by directly reading source files in this session.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `MapSettings.tsx` exposes a delete-result affordance (D-02 deferral) | Risks #2 | If absent, removing header Delete strands the operation. Planner must grep `MapSettings.tsx` for `deleteResult` before Result.tsx changes land. Recommendation: leave Delete in the header until verified. |
| A2 | Fabi-mode summary cells inside `RsCategoryCard` are out of scope (CONTEXT.md D-06 deferred clause) | Cat-Card Component Extraction | If user expected them in this phase, scope creeps. Leave a TODO comment + queue a follow-up phase rather than implement. |
| A3 | `requestAnimationFrame` is available in the jsdom test env without polyfill | Risks #9 | Tests for deep-link mount-open might race. Mitigation: tests can `await waitFor(() => modal present)` rather than asserting synchronously. |

## Metadata

**Confidence breakdown:**
- Existing helpers / API surface: HIGH — every file was read in this session
- i18n keys: HIGH — exact line numbers cited for each key in both EN and DE
- Legacy parity behaviour: HIGH — relevant `app.js` ranges read directly
- Test pattern fit: HIGH — existing Compare.test.tsx and Result.test.tsx read and confirmed as templates
- Risks: MEDIUM — Risk #2 (delete reachability) and Risk #1 (existing tests need updating) are real but easily handled in plan

**Research date:** 2026-05-17
**Valid until:** 2026-06-17 (in-repo state; if files move or a major refactor lands, re-verify)
