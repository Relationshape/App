---
phase: 04-port-compare-page
plan: 02
subsystem: ui
tags: [react, component, compare, category-card, fabi-mode, port]

requires:
  - phase: 02-build-react-shell
    provides: ChartDataset type, categoryAverage / closestScaleEntry helpers, getLang i18n
  - phase: 03-port-questionnaire
    provides: AnswersBlob / __custom / __hidden shape, MutableScaleStep type
provides:
  - "RsCategoryCard: shared cat-card primitive (D-05 hide/dim rule + D-06 visual contract)"
  - "RsSummaryCells: per-dataset summary cells inside cat-card.cat-card-summary (D-06 Fabi-mode)"
  - "Per-category filledCount computed inline (does NOT reuse per-result countAnswers helper)"
affects: [04-port-compare-page wave 2 (Compare.tsx rewire), 05-result-detail (Result.tsx rewire)]

tech-stack:
  added: []
  patterns:
    - "Shared cat-card primitive consumed by both Compare (wave 2) and Result (wave 3) — no drift between callsites"
    - "Per-dataset scale slice (ds.scale ?? []) passed explicitly to categoryAverage / closestScaleEntry (matches Spider.tsx + Alignment.tsx)"
    - "vi.mock @/lib/i18n/i18n for locale toggling in component tests"

key-files:
  created:
    - src/components/RsCategoryCard.tsx
    - src/components/RsSummaryCells.tsx
    - src/components/__tests__/RsCategoryCard.test.tsx
    - src/components/__tests__/RsSummaryCells.test.tsx
  modified: []

key-decisions:
  - "computeFilledCount is inlined inside RsCategoryCard (not exported) — it is the per-category counting variant of countAnswers; reusing countAnswers would have summed across all categories"
  - "RsSummaryCells reads ds.scale per-dataset (legacy parity: each dataset carries its own scale), with [] fallback. categoryAverage and closestScaleEntry are called with an explicit scale arg — the legacy implicit-scale signature was not preserved"
  - "fabiMode renders <RsSummaryCells> inside .cat-card-head before .cat-card-toggle (mirrors legacy app.js:2858-2872 DOM order)"
  - "DE locale fallback for title/blurb is local to RsCategoryCard (lifted from the duplicated lambdas in Compare.tsx:78-83) — no shared helper exported"

patterns-established:
  - "Shared cat-card primitive: any wave needing the cat-card visual contract consumes <RsCategoryCard cat datasets editableResult? fabiMode? onClick /> — no per-callsite duplication of the hide/dim rule"
  - "Per-dataset summary cells: <RsSummaryCells datasets catId /> drives the visual closest-scale mapping; the parent does not pre-compute averages"

requirements-completed: [D-05, D-06]

duration: 35min
completed: 2026-05-17
---

# Phase 04 Plan 02: RsCategoryCard + RsSummaryCells Summary

**Shared `.cat-card.cat-card-btn` primitive with D-05 hide/dim rule and D-06 Fabi-mode per-dataset summary cells — ready for Wave 2 Compare.tsx rewire and Wave 3 Result.tsx rewire with zero further changes.**

## Performance

- **Duration:** ~35 min (includes recovery from interrupted task 2)
- **Tasks:** 3 (RsCategoryCard component + RsCategoryCard tests + RsSummaryCells + wiring)
- **Files created:** 4
- **Files modified:** 0 (additive only)

## Accomplishments

- Ported the legacy `categoryCards()` per-card body from `public/legacy/js/app.js:2838-2876` to a single React component (`RsCategoryCard`).
- Implemented the D-05 hide-vs-dim rule (filledCount === 0 && !editableResult → null; filledCount === 0 && editableResult → `.is-empty`; otherwise render normally) with full test coverage including `__custom` counting and `__hidden` exclusion.
- Ported `summaryCellsHTML(datasets, catId)` from `app.js:3193-3200` to `RsSummaryCells` — one `.cell` span per dataset, colored via `closestScaleEntry(categoryAverage(...))`, muted "—" fallback when the dataset has no answers in the category. The legacy implicit-scale signature is replaced by the explicit `(answers, catId, scale)` form used by the ported math helpers.
- Wired `fabiMode` from a `TODO` placeholder to a live `<RsSummaryCells>` block rendered inside `.cat-card-head` immediately before `.cat-card-toggle`, mirroring legacy DOM order.
- 14 vitest tests pass (11 RsCategoryCard + 3 RsSummaryCells), `tsc --noEmit` clean.

## Task Commits

1. **Task 1: Create RsCategoryCard.tsx** — `6f2a79c` (feat)
2. **Task 2: RsCategoryCard behavior tests (D-05 + D-06)** — `eb6e430` (test)
3. **Task 3a: Port summaryCellsHTML → RsSummaryCells + wire D-06 Fabi-mode** — `bf7bb70` (feat)
4. **Task 3b: RsSummaryCells tests + RsCategoryCard Fabi-mode tests** — `383c6a9` (test)

## Files Created/Modified

- `src/components/RsCategoryCard.tsx` — Shared `.cat-card.cat-card-btn` primitive. Exports `RsCategoryCard` + `RsCategoryCardProps`. Implements per-category `computeFilledCount`, the D-05 hide-vs-dim rule, DE locale fallback for title/blurb, and conditional `<RsSummaryCells>` rendering when `fabiMode === true`.
- `src/components/RsSummaryCells.tsx` — Per-dataset summary cells inside a Fabi-mode cat-card. Exports `RsSummaryCells` + `RsSummaryCellsProps`. Maps each dataset → `<span class="cell">` colored by `closestScaleEntry(categoryAverage(ds.answers, catId, ds.scale))`, or muted `<span class="cell muted">—</span>` when the dataset has no answers.
- `src/components/__tests__/RsCategoryCard.test.tsx` — 11 behavior tests: hide-rule, dim-rule, normal-rule, `__custom` counting, `__hidden` exclusion, `--c` CSS variable, onClick, DE locale title/blurb (present and fallback), Fabi-mode summary rendering, Fabi-mode opt-out.
- `src/components/__tests__/RsSummaryCells.test.tsx` — 3 behavior tests: one cell per dataset; muted `"—"` when categoryAverage returns null; non-null cells set background / color / borderColor inline.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `closestScaleEntry` arg type**
- **Found during:** Task 3 (initial RsSummaryCells implementation)
- **Issue:** The plan's snippet called `closestScaleEntry(avg, scale)` but `categoryAverage` returns `{ value, norm } | null` — passing the whole object to `closestScaleEntry(value: number, scale)` would have computed `Math.abs(e.value - object)` (NaN) and silently degraded all colors.
- **Fix:** Pass `avg.value` (the numeric mean), matching the call convention in `Spider.tsx:73` and `Alignment.tsx`.
- **Files modified:** `src/components/RsSummaryCells.tsx`
- **Commit:** `bf7bb70`

**2. [Rule 1 - Bug] Test dataset answers used non-existent `item1` key on `connection`**
- **Found during:** Task 3 (test run — `cat-summary-cell` query returned null because every dataset fell through to the muted branch).
- **Issue:** `categoryAverage` iterates `CATEGORIES[catId].items` for the predefined items and `slot.__custom` for custom items. The test's `connection: { item1: { scale: 'open' } }` matched neither bucket, so `values` was empty and `categoryAverage` returned `null` for every dataset.
- **Fix:** Use `__custom: { c1: { scale: '…' } }` in the RsSummaryCells tests (also matches the documented `__custom` counting behavior in plan task 1 acceptance test 4).
- **Files modified:** `src/components/__tests__/RsSummaryCells.test.tsx`
- **Commit:** `383c6a9`

## Verification

- `npx vitest run src/components/__tests__/RsCategoryCard.test.tsx src/components/__tests__/RsSummaryCells.test.tsx` → **14 / 14 passing** (11 cat-card + 3 summary-cells).
- `npx tsc --noEmit -p .` → **0 errors** (clean).
- `grep -c "TODO(fabiMode)" src/components/RsCategoryCard.tsx` → **0** (placeholder fully resolved).
- `grep -c "fabiMode: _fabiMode" src/components/RsCategoryCard.tsx` → **0** (underscore-prefix dropped; param now consumed).
- `grep -v '^[[:space:]]*//' src/components/RsCategoryCard.tsx | grep -c "countAnswers"` → **0** (per-result helper NOT reused; D-05 per-category counting is inlined).

## Self-Check: PASSED

- File `src/components/RsCategoryCard.tsx` — FOUND
- File `src/components/RsSummaryCells.tsx` — FOUND
- File `src/components/__tests__/RsCategoryCard.test.tsx` — FOUND
- File `src/components/__tests__/RsSummaryCells.test.tsx` — FOUND
- Commit `6f2a79c` (feat RsCategoryCard) — FOUND
- Commit `eb6e430` (test RsCategoryCard) — FOUND
- Commit `bf7bb70` (feat RsSummaryCells + wire) — FOUND
- Commit `383c6a9` (test RsSummaryCells + Fabi-mode) — FOUND
