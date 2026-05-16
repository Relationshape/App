---
id: 260516-qva
slug: fix-q-categories-route-replace-toggle-al
date: 2026-05-16
status: in-progress
---

# Fix `/q-categories` route — replace tile-toggle with legacy-parity picker modal

## Problem

The current `CategoryOverview` (`src/routes/CategoryOverview.tsx`) renders **every** category as a `RsTile` toggle. Clicking a tile flips that category in `result.enabledCategories`. This conflicts with the legacy UX:

- Legacy page shows only the **enabled** category tiles (the user already chose these — they should appear as “open work to do,” not toggle buttons).
- Adding more categories happens through a separate **modal** (`runCategoryPicker(existing)`), which lists ALL groups but **locks** already-enabled rows.
- Tile click in legacy navigates into the questionnaire for that category, it does not toggle.

The `enabledCategories: string[]` field on `Result` already supports this — no localStorage / type change needed.

## Scope

1. **New component** — `src/components/RsCategoryPicker.tsx`
   - Radix `<Dialog>` mirroring legacy `runCategoryPicker(existing, { showBack: false })`.
   - Reads `CATEGORY_GROUPS` from `@/lib/data/data` and renders one section per group with `.cat-picker-group-title`, `.cat-picker-items`, `.cat-picker-item` markup that already has CSS in `src/styles/legacy-components.css:1270-1304`.
   - Props: `open`, `onOpenChange`, `existingIds: string[]`, `onSubmit(mergedIds: string[])`.
   - Existing IDs are pre-checked AND locked (rendered with `.is-locked` + lock check). New rows are normal checkboxes (the row label is a clickable label feeding a hidden checkbox, per legacy pattern).
   - Footer: ghost “Cancel” + primary “Add more categories”. Primary is disabled until at least one **new** id is checked (mirror of legacy `onboarding_empty_warning` but tuned for the “add more” entry point).
   - i18n: reuses `onboarding_title`, `onboarding_sub`, `btn_add_categories`, `btn_cancel` (all present in `src/lib/i18n/en.ts` and `de.ts`).
   - `data-testid="cat-picker"`, `data-testid="cat-picker-item-${id}"`, `data-testid="cat-picker-submit"` for tests.

2. **Update** `src/routes/CategoryOverview.tsx`
   - Filter the rendered tiles to **only enabled categories** (preserve group order from `CATEGORY_GROUPS` is not required; current `CATEGORIES.map` order is fine since `CATEGORIES` is itself the canonical order).
   - Remove the `toggle()` handler. Tile click now navigates to `/q/${profileId}/${resultId}` (legacy `cat-overview-tile onClick` at `public/legacy/js/app.js:1668-1673`). The legacy code also writes `result.progress.catIndex = i` to seed the questionnaire pointer; we set the same on click before navigating, so the user lands on the clicked category in `ListMode`/`SingleMode`. `catIndex` already exists on `ResultProgress` (`src/lib/storage/types.ts:37`).
   - Add a row above the existing “Start questionnaire” button: ghost button `{t('btn_add_categories')}` that opens `<RsCategoryPicker open existingIds={enabledIds} ...>`. On submit, `saveResult({ ...result, enabledCategories: mergedIds })`.
   - Keep the existing “Start questionnaire →” primary CTA wired to `#/q/...`.

3. **Update tests** — `src/routes/__tests__/CategoryOverview.test.tsx`
   - `renders one tile per CATEGORY` → assert tile count equals the **enabled** count (use a fixture that enables a subset, e.g. first 3 ids), and assert disabled categories don’t render tiles.
   - `toggling a tile flips enabledCategories…` → replace with “Add more categories opens picker, checking a disabled cat then submitting merges into enabledCategories” (use `fireEvent.click` on the `Add more categories` button, then click `cat-picker-item-${disabledId}`, then click `cat-picker-submit`; assert stored shape).
   - `confirm button links to /q/...` → unchanged.
   - `resultId === 'new'…` → unchanged.

## Out of scope

- Onboarding picker at `result = new` (legacy `startBlank` runs the picker first). React port currently defaults to all-on; we keep that.
- Removing categories from `/q-categories` (legacy doesn't do that here; MapSettings already covers it).
- Restyling the existing tile/spacing — only the toggle interaction changes.
- `askedItems` seeding: existing port already does without it; ListMode/SingleMode read `enabledCategories` directly.

## Files modified

- `src/components/RsCategoryPicker.tsx` (new)
- `src/routes/CategoryOverview.tsx`
- `src/routes/__tests__/CategoryOverview.test.tsx`

## Acceptance criteria

- `/#/q-categories/:profileId/:resultId` renders **only** tiles for `enabledCategories` (when set), in the same RsTile look.
- Clicking a tile navigates to `#/q/...` (no localStorage toggle).
- A ghost “Add more categories” button is visible alongside the “Start questionnaire” CTA.
- Clicking it opens a modal titled “Choose your categories” with category groups; already-enabled rows are locked + checked; previously-disabled rows can be toggled.
- Submitting the modal merges the newly-checked ids into `result.enabledCategories` and closes the modal; the page immediately reflects the new tiles.
- `npm run build` + `npm test -- src/routes/__tests__/CategoryOverview.test.tsx` pass.
