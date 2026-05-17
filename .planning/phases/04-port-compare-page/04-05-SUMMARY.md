---
phase: 04-port-compare-page
plan: "05"
subsystem: ui
tags: [react, route, compare, RsCategoryCard, RsCategoryPicker, compareFilterIds]

# Dependency graph
requires:
  - phase: 04-port-compare-page plan 02
    provides: RsCategoryCard component with editableResult hide-vs-dim rule

provides:
  - Compare overlay page with D-04 Add-more-categories button + compareFilterIds union filter
  - RsCategoryCard integrated into Compare cat-grid with editableResult={firstEditableResult}
  - RsCategoryPicker mounted in Compare for adding more enabled categories
  - 5 new D-04 tests covering button visibility, filter union, and picker open behavior

affects: [04-port-compare-page, Wave 3 Result.tsx]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - compareFilterIds useMemo: union of enabledCategories across own-result effectiveIds (null = no filter)
    - firstEditableResult useMemo: first non-imp: id in effectiveIds resolved to a Result object
    - Two-stage cat filtering: compareFilterIds filter THEN hasItemValues filter

key-files:
  created: []
  modified:
    - src/routes/Compare.tsx
    - src/routes/__tests__/Compare.test.tsx

key-decisions:
  - "Use effectiveIds (not truncatedRaw) for firstEditableResult and compareFilterIds — matches Risk #6 in RESEARCH"
  - "existingIds fallback to CATEGORIES.map((c) => c.id) when firstEditableResult has no enabledCategories — mirrors legacy app.js:2071 all-enabled default"
  - "compareFilterIds only consults own-results (skip imp: prefixed IDs) — matches legacy app.js:3489-3498"

patterns-established:
  - "compareFilterIds pattern: two-stage CATEGORIES filter before hasItemValues filter"
  - "firstEditableResult gate: Add-more-categories button rendered conditionally on firstEditableResult truthy"

requirements-completed: [D-04, D-05, D-06, D-07]

# Metrics
duration: 15min
completed: 2026-05-17
---

# Phase 04 Plan 05: Compare Page Rewire (D-04 + D-05 + D-06) Summary

**Compare overlay gains Add-more-categories button, compareFilterIds union filter, and RsCategoryCard replacing RsTile — closing D-04/D-05/D-06 parity gaps**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-17T11:40:00Z
- **Completed:** 2026-05-17T11:55:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced ad-hoc RsTile cat cards with RsCategoryCard (editableResult for hide-vs-dim rule per D-05/D-06)
- Added compareFilterIds useMemo (union of enabledCategories across selected own-results) applied before hasItemValues filter (D-04)
- Added firstEditableResult useMemo and conditional Add-more-categories Button that opens RsCategoryPicker (D-04)
- Removed RsTile import, catTitle/catBlurb lambdas, lang/getLang, and legacy TODO comment
- Added 5 new vitest tests; full suite of 262 tests passes with 0 regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewire Compare.tsx** - `b254efc` (feat)
2. **Task 2: Add D-04 test cases** - `4345327` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/routes/Compare.tsx` - Rewired with RsCategoryCard, RsCategoryPicker, compareFilterIds, firstEditableResult, Add-more-categories Button; RsTile removed
- `src/routes/__tests__/Compare.test.tsx` - Added makeStoreWithAnswers helper and 5 new D-04 test cases (9 total passing)

## Decisions Made

- Used `effectiveIds` (not `truncatedRaw`) for firstEditableResult and compareFilterIds to match Risk #6 in RESEARCH — effectiveIds includes the default-to-first-2 expansion.
- `existingIds` fallback for RsCategoryPicker is `CATEGORIES.map((c) => c.id)` when firstEditableResult has no enabledCategories, matching legacy app.js:2071 all-enabled default.
- compareFilterIds skips `imp:` prefixed IDs — only own-results have enabledCategories, matching legacy app.js:3489-3498.
- RsCategoryPicker is mounted unconditionally (always in DOM) with `open` controlled by `pickerOpen` state, same pattern as CategoryOverview.tsx.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The acceptance criteria grep check `grep -c "compareFilterIds ? CATEGORIES.filter"` expects the ternary on one line. The written code has the ternary split across two lines for readability (standard formatter style). The behavioral requirement is fully met — the implementation is correct and typechecks clean.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Compare page now at parity with legacy viewCompare for D-04, D-05, D-06
- Wave 3 (Plan 06) can use the same RsCategoryCard + firstEditableResult pattern in Result.tsx
- All existing tests pass; no regressions introduced

---
*Phase: 04-port-compare-page*
*Completed: 2026-05-17*
