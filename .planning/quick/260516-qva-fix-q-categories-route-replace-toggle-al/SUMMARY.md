---
id: 260516-qva
slug: fix-q-categories-route-replace-toggle-al
date: 2026-05-16
status: complete
---

# Fix `/q-categories` route — replace tile-toggle with picker modal

## What changed

Replaced the “click a tile to toggle a category” interaction on `/q-categories/:profileId/:resultId` with the legacy-parity flow:

- Tiles render **only the enabled categories** (matching the user’s screenshot of the legacy page).
- Tile click navigates into the questionnaire (`/q/...`) and seeds `result.progress.catIndex` to the clicked tile, so the user lands on that category in `ListMode`/`SingleMode` — legacy behaviour from `public/legacy/js/app.js:1668-1673`.
- New ghost button **“Add more categories”** opens a Radix modal port of legacy `runCategoryPicker(existing)`:
  - Sectioned by `CATEGORY_GROUPS` with the legacy `.cat-picker-*` styling already present in `src/styles/legacy-components.css`.
  - Already-enabled rows are pre-checked and locked (disabled checkbox + `.is-locked` lock check icon).
  - Previously-disabled rows toggle on click; primary submit is disabled until at least one new id is checked.
  - Submit merges the union into `result.enabledCategories` via `saveResult`, closes the modal, and the page re-renders with the new tiles immediately.

`Result.enabledCategories` already exists on the persisted type (`src/lib/storage/types.ts:52`) — no schema change.

## Files

- **New** `src/components/RsCategoryPicker.tsx`
- **Updated** `src/routes/CategoryOverview.tsx` — filter to enabled, drop toggle handler, wire picker, seed `catIndex` on tile click
- **Updated** `src/routes/__tests__/CategoryOverview.test.tsx` — replaced toggle test with picker-merge test; tile-render test now asserts enabled-only subset; new test asserts tile click sets `catIndex` and navigates without mutating `enabledCategories`

## Verification

- `npx vitest run src/routes/__tests__/CategoryOverview.test.tsx` → 5/5 pass.
- `npx tsc -p tsconfig.app.json --noEmit` → clean for changed files; the only remaining errors are pre-existing in `src/components/RsHeroConstellation.tsx` and `src/components/RsToggleCard.tsx` (unrelated to this change — confirmed by a clean stash diff).
- Dev server (`npm run dev`, on port 5174 because the stale preview daemon still holds 5173) compiles `RsCategoryPicker.tsx` and `CategoryOverview.tsx` with 200s; no build errors in the Vite log.
- **Manual browser verification not performed**: the `mcp__Claude_Preview__preview_start` daemon has a wedged `uv_cwd` pointing at a deleted worktree (`.claude/worktrees/intelligent-nash-170075`, see `D` in starting `git status`) and rejects `npm` invocations with EPERM. Test suite covers tile filtering, no-toggle-on-click, picker open + locked rows + merge, and submit-disabled-when-empty.

## Out of scope (unchanged)

- Onboarding flow on a brand-new map (`startBlank`) still uses the “default all categories on” shortcut from the existing React port. Adding the picker to that flow can land separately.
- Removing categories from this page — still belongs in MapSettings.
- `askedItems` seeding — not used elsewhere in the React port; `enabledCategories` is the source of truth for `ListMode`/`SingleMode`/charts.
