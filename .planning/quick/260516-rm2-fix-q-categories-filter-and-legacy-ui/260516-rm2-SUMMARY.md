---
phase: quick/260516-rm2
plan: 01
status: complete
completed: 2026-05-16
commits:
  - 87ee39e  # feat(quick/260516-rm2): filter questionnaire to active category + extract RsQuestionCard/RsScaleLegend (Task 1)
  - 2cfd46f  # test(quick/260516-rm2): cover single-category filter + nav for List/Single mode (Task 2)
files_created:
  - src/components/questionnaire/RsQuestionCard.tsx
  - src/components/questionnaire/RsScaleLegend.tsx
files_modified:
  - src/components/questionnaire/ListMode.tsx
  - src/components/questionnaire/SingleMode.tsx
  - src/components/questionnaire/QuestionnaireHeader.tsx
  - src/components/questionnaire/QuestionnaireNav.tsx
  - src/components/questionnaire/__tests__/ListMode.test.tsx
  - src/components/questionnaire/__tests__/SingleMode.test.tsx
  - src/styles/legacy-components.css
files_deleted:
  - src/components/questionnaire/ItemRow.tsx  # superseded by RsQuestionCard
requirements:
  - QUICK-260516-rm2
---

# Quick 260516-rm2: Fix q-categories Filter + Legacy Questionnaire UI

## One-liner
Clicking a category tile now opens the questionnaire filtered to that single category in both List and Single mode; shared question-card layout extracted into `RsQuestionCard` + `RsScaleLegend` (Rs* prefix per project memory).

## Active-category contract (`progress.catIndex`)
`CategoryOverview.openCategory` already seeds `result.progress.catIndex` before navigating to `/q/:profileId/:resultId`. We kept this in-store mechanism rather than adding a `:categoryId` URL param because:
- The contract was already shipped and covered by `CategoryOverview.test.tsx`.
- Adding a URL param would have introduced a second source of truth alongside `progress.catIndex` (collision risk).
- Legacy `viewQuestionnaireSingle` in `public/legacy/js/app.js` also drives off an in-memory cat index.

Both `ListMode` and `SingleMode` now resolve the active category as `enabledCats[clamp(progress.catIndex, 0, n-1)]` and use `enabledItemsForCat(result.answers, cat.id)` exclusively — `flatItemsForResult` is no longer used in `SingleMode`. `progress.flatIndex` is interpreted as "index within current category" (legacy parity).

## New components
- **`RsQuestionCard`** — sole renderer of the question card (title + Edit Item/Scale ghost button, `ScalePicker` slider, Reset, optional Note textarea, G/R/Both toggle when the category supports GR). Used by both List (`variant="list"`, with keyboard 1–N / N+1 / Enter / Arrows) and Single (`variant="single"`). Replaces the old `ItemRow.tsx`.
- **`RsScaleLegend`** — 7-chip numbered legend bound to `result.scale ?? storeScale`. Never hardcoded.

## Verified user clarifications
- Slider (ScalePicker) stays — rendered inside `RsQuestionCard` for both modes.
- 7-chip scale legend stays — `RsScaleLegend` rendered at the top of each mode's view.
- List mode shows ALL non-hidden questions of the active category (`enabledItemsForCat` already filters `__hidden`).
- Single mode prev/next navigates ONLY within the active category — items array is built from `enabledItemsForCat(result.answers, cat.id)`, not `flatItemsForResult`.

## Test additions / changes
- `ListMode.test.tsx`:
  - Replaced "renders one section per enabled category" with "renders the active category section" — asserts new `q-active-cat` testid (plus legacy `q-cat-${id}` still preserved).
  - Added "with progress.catIndex=1 renders ONLY the second enabled category" — asserts first cat's items are absent.
  - GR toggle test now picks a GR-enabled category dynamically (defensive against `CATEGORIES[0]` GR flag changes).
  - Added scale legend chip-count test (`rs-scale-legend` testid).
- `SingleMode.test.tsx`:
  - Added "with progress.catIndex=1 the rendered item belongs to the SECOND category".
  - Added test for `single-back` + `single-next` + `single-progress` counter; clicking Next advances `flatIndex` in the persisted result.
  - Updated existing card-content test to read `<strong>` (RsQuestionCard title) instead of `<h1>`.
  - Reduced-motion test simplified to a single-category fixture now that `peekNext` is per-category.

## CSS
Single small addition to `legacy-components.css`: `.rs-segmented` constrained to `max-content` width with `justify-self: start` so the List/Single mode toggle matches the legacy layout. All other classes (`.q-cat-head`, `.q-items`, `.q-item`, `.scale-legend`, `.chip`, `.q-card-note`, `.q-card-actions`, `.q-card-progress`, `.q-cat-pip`) were already present.

## Verification
- `npx tsc -p tsconfig.json --noEmit` → clean (exit 0, no output).
- `npx vitest run` → **43 files / 237 tests, all passing.**
- Affected suites (`ListMode`, `SingleMode`, `CategoryOverview`) → 19 tests, all pass.

## Self-Check: PASSED
- Commit `87ee39e` present in `git log`: FOUND.
- Commit `2cfd46f` present in `git log`: FOUND.
- `src/components/questionnaire/RsQuestionCard.tsx`: FOUND.
- `src/components/questionnaire/RsScaleLegend.tsx`: FOUND.
- All four user clarifications verified against current source (see "Verified user clarifications" above).
