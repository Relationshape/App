# Phase 04 — Port Compare page (context)

<domain>
Bring the React Compare flow to full legacy parity. Two surfaces:

1. **Result detail Compare landing** (`/result/:id`) — add a "Compare with someone" section that lets the user pick another own-map or imported result to overlay. Also bring the legacy header subtitle and the legacy category-card grid (replacing the current inline Spider + drill-down on this page).
2. **Compare overlay page** (`/compare?ids=…`) — already partly ported; close the remaining gaps so it matches legacy `viewCompare` (app.js:3453–3544) and the Screenshot 2 reference.

Discussion clarifies HOW to implement what's already scoped. New capabilities (sync, redesign, mobile-specific layouts) are out of scope.
</domain>

<canonical_refs>
- `public/legacy/js/app.js:2770-2821` — `viewResult` (Result detail page)
- `public/legacy/js/app.js:3212-3279` — `compareTargetPicker` (the "Compare with someone" picker)
- `public/legacy/js/app.js:3453-3544` — `viewCompare` (the `#/compare` overlay page)
- `public/legacy/js/app.js:2838-2876` — `categoryCards` helper (filledCount → `is-empty` opacity rule)
- `public/legacy/css/style.css:840-868` — `.compare-grid`, `.compare-tile`, `.compare-tile-arrow`
- `public/legacy/css/additions.css:147-160` — `.compare-pickers-split`, `.compare-section-title`, `.compare-tile-import`
- `public/legacy/css/style.css:796` — `.cat-card.is-empty { opacity: .58 }` — the reduced-opacity threshold
- `src/styles/legacy-components.css:758-782, 1583-1587` — `.compare-tile` rules already ported
- `src/routes/Compare.tsx` — current React Compare page (close to legacy, needs finishing)
- `src/routes/Result.tsx` — current React Result page (missing "Compare with someone" + cat-card grid)
- `src/components/RsCategoryPicker.tsx` — existing modal that already replaces legacy `openAddCategoriesDialog`
- `src/components/RsTile.tsx` — existing tile primitive; reuse where possible
- `src/components/charts/CategoryModal.tsx` — per-category modal (Spider | Items | Edit)
- `src/components/charts/Alignment.tsx` — alignment overview chart
- `src/lib/charts/datasets.ts` — `mapResultToDataset`, `mapImportToDataset`
- `src/lib/i18n/{en,de}.ts` — translation keys: `compare_own_maps`, `compare_imports_title`, `btn_add_categories`, `compare_with`, `result_last_edited`, `answers`, `updated`, `imported_on`, `btn_import_map`
- `tests/example-localstorage.json` — canonical localStorage shape sample (per global memory)
- `.planning/phases/02-parity/02-CONTEXT.md` — prior decisions on `Rs*` prefix + reusing chart primitives
</canonical_refs>

<decisions>

### 1 — Result page restructure (replace inline drilldown with cat-card grid)
**Lock:** Match legacy `viewResult` structurally. After the header card:
- (Fabi-mode only) "Category overview" Spider section (existing behaviour, kept behind `settings.fabiMode`).
- **"Compare with someone"** section (new).
- **"By category"** section: cat-card grid that opens `CategoryModal` per card.

**Remove from Result page:** the current `activeAxis`-driven inline `ItemSpider` + `CategoryBars` drill-down section, the always-visible main Spider chart (move into Fabi-only section), the hidden deep-link anchor `<span>`s (re-implement scroll target via the cat-card grid itself — clicking the right card opens the modal).

**Deep-link `:catId`:** when the URL carries `/result/:id/:catId`, open the matching category's `CategoryModal` directly on mount (RAF-deferred, mirrors legacy `viewResult` line 2817-2820). No more inline scroll target.

**Why:** Screenshot 1 shows no inline Spider and no inline drill-down on the landing variant — the user-facing page is header → Compare-with → cat-grid. The existing inline behaviour is a phase-02 placeholder.

### 2 — Result header layout & action set
**Lock the header content:**
- Back button (left).
- Profile/subject emoji avatar (`.li-avatar`).
- Title block: `<h1>` = `result.subject` (with `(vN)` suffix if `version > 1`); subtitle = `${profile.emoji} ${profile.name} · ${countAnswers(r)} ${t('answers')} · ${t('result_last_edited')} ${fmtDate(r.updatedAt)}`.
- `flex-spacer`.
- Actions in this order (left→right): **Map settings** → **Continue editing** → **Share** (primary).

**Drop from header:** the current **Delete** button. Move delete into the existing Map settings page or surface via a kebab — out of scope here unless trivial; leave the existing delete behaviour reachable from Map settings (already present there). If not currently reachable elsewhere, planner picks: kebab on the header or stays on Map settings.

**Why:** Screenshot 1 shows exactly the four legacy actions (Back / Map settings / Continue editing / Share); Delete is not in the header. Adding the `N answers · last edited <date>` subtitle is a clear legacy parity gap.

### 3 — "Compare with someone" picker (new section / new component)
**Lock the structure (matches legacy `compareTargetPicker`):**
- Container: `<div class="compare-pickers-split">` with two sub-sections.
- **"Overlay your own maps"** — section title `<h3 class="compare-section-title">`. Grid (`.compare-grid`) of tiles, one per OTHER own-result (excluding the current `resultId`).
- **"Compare with imported results"** — same shape, one tile per import + an **Import…** tile at the end that navigates to `#/import`.

**Tile shape (`<button class="compare-tile" style="--c:<color>">`):**
- `.li-avatar` with the dataset emoji (`subjectEmoji || profileEmoji || 💞` for results; `i.emoji || 📨` for imports).
- `.compare-tile-body`: `<h3>` = `${profileName} → ${subject}` (for own results) or `${import.name} → ${import.subject}` (for imports); `<p class="muted small">` = `${t('updated')} ${fmtDate(updatedAt)}` or `${t('imported_on')} ${fmtDate(importedAt)}`.
- `.compare-tile-arrow` `→` on the right.
- Click → `navigate(/compare?ids=${currentResultId},${otherId})`.

**Import… tile:** `.compare-tile.compare-tile-import` with `--c:#7c3aed`, `📥` avatar, h3 = `t('btn_import_map')`, no sub-text. Click → `navigate('/import')`.

**Empty states:**
- If `others.length === 0 && imports.length === 0` → render `<p class="muted">{t('no_compare')}</p>` (matches legacy 3215-3217).
- If `others.length === 0` → omit the "Overlay your own maps" section entirely; the imports section (with Import… tile) still renders.
- The imports section **always** renders (even with zero imports) so the Import… tile is always reachable.

**Component decision:** create `src/components/RsCompareTile.tsx` (per `Rs*` global memory rule — lift the duplicated tile shape into a shared component, do not copy-paste JSX). The "Compare with someone" section itself can live inline in `Result.tsx` or as `src/components/CompareWithSomeone.tsx` — planner's call (single-use today, but the section is a clear unit). Default: extract as `CompareWithSomeone.tsx`.

### 4 — Compare overlay page gaps
The current `src/routes/Compare.tsx` is close to parity. Lock these remaining changes:

- **Add "Add more categories" button** in the "Category details" section header — but only when there is a `firstEditableResult` (the first selected dataset that is an own-result, mirroring legacy 3539). Wire to `RsCategoryPicker` (already in use in `CategoryOverview.tsx`), passing `firstEditableResult.profileId` and `firstEditableResult.id`. Remove the existing TODO comment on line 171.
- **Apply `compareFilterIds` union** when computing visible cat-cards: union all `enabledCategories` from selected own-result datasets; if any selected own-result has an `enabledCategories` filter, the cat-grid is filtered to that union; otherwise show all categories (mirrors legacy 3489-3498). The existing `hasItemValues` check stays as an additional filter.
- **Chip styling:** keep `.pick-chip` / `.compare-pick` (already used). The screenshot's pill shape is achievable with the existing CSS — no class rename. Verify the dot+swatch render matches the screenshot's selected/unselected look; small CSS polish is allowed.
- **Fabi-mode tip callout:** keep as-is; rendered when `datasets.length > 0 && !fabiMode`. Matches screenshot 2.
- **Default-to-first-2:** keep existing behaviour (line 53-55). Matches legacy `viewCompare:3480`.
- **`>4` truncation toast:** keep existing behaviour (line 30-33).

### 5 — Reduced-opacity rule for category cards
**Lock:** Use the legacy `.cat-card.is-empty { opacity: .58 }` rule from `style.css:796`. Trigger: `filledCount === 0` across all selected datasets (per legacy `categoryCards` 2845-2856). In **read-only** contexts (Compare overlay, Result detail without `editableResult`) — categories with zero answers are **hidden entirely**, not just dimmed (`if (filledCount === 0 && !editableResult) return null` — legacy 2856).

**Where dimmed-but-shown applies:** only when there IS an `editableResult` (Result page own-result, Compare with own-result selected). Then cards with zero filled answers render with `.is-empty`. Cards with some answers render normally.

**Note:** the user's screenshot description originally said "cards for results with too few answers render at reduced opacity" — the actual legacy rule is binary (`=== 0` → empty), not threshold-based. We follow legacy.

### 6 — Cat-card component decision (avoid drift)
Both the new Result page and the existing Compare page need the same cat-card grid (icon, title, blurb, `--c` colour, `is-empty` modifier, click → open `CategoryModal`, optional Fabi-mode summary cells).

**Lock:** extract `src/components/CategoryCard.tsx` (or `RsCategoryCard.tsx` — planner picks; default `RsCategoryCard.tsx` per Rs* prefix rule) that takes `{ cat, datasets, editableResult?, fabiMode, onClick }`. Both `Result.tsx` and `Compare.tsx` use it. The current ad-hoc `RsTile` usage in `Compare.tsx` (line 175-188) is replaced.

Fabi-mode summary cells (legacy `summaryCellsHTML`) — port if not already present; planner can flag as a follow-up if it requires new chart helpers.

### 7 — Hash-route compatibility
**Lock:** `#/compare?ids=...` continues to work with mixed own-result IDs and `imp:<importId>` IDs (already handled in current Compare.tsx 57-66). No URL scheme change. Adding/removing from the picker uses `setSearchParams({ ids: next.join(',') })`.

### 8 — i18n keys (verify presence)
Planner must verify these keys exist in `src/lib/i18n/{en,de}.ts` and add any that are missing: `compare_with`, `compare_own_maps`, `compare_imports_title`, `result_last_edited`, `answers`, `updated`, `imported_on`, `btn_import_map`, `btn_add_categories`, `no_compare`. Legacy keys are the source of truth.

### 9 — Storage / Zustand
**Lock:** No store API changes. Reads only:
- `useStore(s => s.results)`, `s.profiles`, `s.imports`, `s.settings.fabiMode`.
- Helper: `countAnswers(result)` exists in legacy `app.js` — port or reuse if a React equivalent already exists; planner checks `src/lib/storage/` for an existing helper before adding a new one.

### 10 — Out of scope (defer)
- Backend/sync.
- Visual redesign beyond what the screenshots show.
- A separate `/result/:id/compare` sub-route — the Compare-with-someone section lives ON the Result page.
- Mobile-specific layout overrides — the grid is already responsive via legacy CSS.
- Reworking `CategoryModal` internals (tabs, edit flow) — already done in phase 02.
</decisions>

<code_context>

**Reusable (do NOT reimplement):**
- `src/components/charts/Spider.tsx` — overview spider.
- `src/components/charts/Alignment.tsx` — alignment overview.
- `src/components/charts/CategoryModal.tsx` — per-category modal with Spider/Items/Edit tabs.
- `src/components/charts/ItemSpider.tsx` — item-level radar (used inside CategoryModal).
- `src/components/charts/CategoryBars.tsx` — bar chart (used inside CategoryModal).
- `src/components/RsCategoryPicker.tsx` — modal replacement for legacy `openAddCategoriesDialog`.
- `src/components/RsTile.tsx` — generic tile primitive (used by current Compare.tsx cat cards).
- `src/lib/charts/datasets.ts` — `mapResultToDataset(result, profile)`, `mapImportToDataset(import)`.
- `src/lib/storage/store.ts` — Zustand store (`results`, `profiles`, `imports`, `settings.fabiMode`).
- `src/styles/legacy-components.css` — `.compare-tile`, `.compare-grid`, `.compare-section-title`, `.cat-card.is-empty`, `.pick-chip`, `.compare-pick` all already ported.
- `src/lib/i18n/i18n.ts` — `t()`, `getLang()`.

**To add (per decisions above):**
- `src/components/RsCompareTile.tsx` — single tile in the compare-with-someone grid.
- `src/components/CompareWithSomeone.tsx` — the two-section picker (own maps + imports + Import… tile), used on Result page.
- `src/components/RsCategoryCard.tsx` — the cat-card used in both Result page and Compare page; replaces the current `RsTile`-based ad-hoc usage in `Compare.tsx`.

**To modify:**
- `src/routes/Result.tsx` — restructure per decision 1 + 2; mount `<CompareWithSomeone>` and the new cat-card grid; drop inline Spider/drilldown (move Spider into Fabi-only section); honour `:catId` deep-link by opening `CategoryModal` on mount.
- `src/routes/Compare.tsx` — add Add-more-categories button (decision 4), apply `compareFilterIds` union, swap ad-hoc cat tiles for `RsCategoryCard`.

**Patterns to follow:**
- Hash routing via `react-router-dom` + `useSearchParams` (already in use).
- Zustand selectors at the top of the component (no destructuring of the whole store).
- i18n via `t('key')` — never inline English/German strings.
- Style via existing legacy classes from `legacy-components.css`; Tailwind utilities only where they don't conflict.

</code_context>

<deferred>
- Spider summary cells inside cat-cards (Fabi-mode) — port if cheap during planning, otherwise queue as a follow-up phase.
- Delete-result UX after removing the header Delete button — verify Map settings or another surface exposes delete; otherwise spawn a small follow-up.
- Cross-fade / animated chip selection on Compare page — visual polish, not parity.
- Backlog: keyboard-accessible compare-tile arrow nav for screen-reader users (legacy lacks it too).
</deferred>

<spec_lock>
No SPEC.md exists for this phase. Requirements are derived from:
1. The two reference screenshots in the discuss-phase invocation.
2. The legacy implementation (canonical_refs above).
3. The pre-existing CONTEXT.md from earlier exploration (now superseded by this file).
</spec_lock>
