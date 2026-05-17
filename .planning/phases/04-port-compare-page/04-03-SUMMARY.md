---
phase: 04-port-compare-page
plan: "03"
subsystem: components
tags: [react, component, compare, section, tdd, zustand, react-router]

requires:
  - phase: 04-port-compare-page
    plan: "01"
    provides: [RsCompareTile]
provides:
  - CompareWithSomeone: two-section compare picker with empty-state, own-result tiles, import tiles, Import... CTA
affects: [04-04]

tech-stack:
  added: []
  patterns: [single-key-zustand-selectors, direct-render-vitest-mock]

key-files:
  created:
    - src/components/CompareWithSomeone.tsx
    - src/components/__tests__/CompareWithSomeone.test.tsx
  modified: []

key-decisions:
  - "Single-key useStore selectors (one per key) to prevent infinite re-render in strict mode"
  - "Imports section always renders (never behind a conditional) so Import... tile is always reachable"
  - "vi.mock uses relative path '../../lib/storage/store' (not alias) for reliable Vitest resolution"
  - "Import... tile rendered as last sibling inside imports compare-grid, not wrapped in a conditional"

patterns-established:
  - "Direct-render + MemoryRouter + vi.mock store approach for isolated component tests"
  - "navigateSpy pattern: top-level fn, reset in beforeEach, asserted per test"

requirements-completed: [D-03]

duration: ~8min
completed: 2026-05-17
---

# Phase 04 Plan 03: CompareWithSomeone Section Summary

**Two-section compare picker porting legacy `compareTargetPicker` (app.js:3212-3279) with empty-state guard, own-result tiles, import tiles, always-rendered Import... CTA, and 9 green behavior tests.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-17T11:43:00Z
- **Completed:** 2026-05-17T11:44:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `CompareWithSomeone` component renders two-section picker: "Overlay your own maps" (omitted when no others) + "Compare with imported results" (always rendered)
- Empty-state guard: when both own-results and imports are empty, renders only `<p class="muted">` with `no_compare` i18n string
- Navigation wired correctly: `/compare?ids=<current>,<other>` / `/compare?ids=<current>,imp:<id>` / `/import`
- 9/9 behavior tests GREEN with isolated mock approach, no dependency on Wave 3

## Task Commits

1. **Task 1: Create CompareWithSomeone.tsx** - `ff60c38` (feat)
2. **Task 2: Create CompareWithSomeone.test.tsx** - `3248030` (test)

## Files Created/Modified

- `src/components/CompareWithSomeone.tsx` - Two-section picker component, ~104 lines, store-connected, router-wired
- `src/components/__tests__/CompareWithSomeone.test.tsx` - 9 behavior tests covering all empty-state branches, tile rendering, navigation

## Decisions Made

- Single-key `useStore` selectors (one per key) to prevent infinite re-render in strict mode — per Risk #5 in RESEARCH
- Imports section is never behind a conditional guard — the Import... tile must always be reachable even when `imports.length === 0`
- `key={\`imp:${i.id}\`}` on import tiles prevents key collisions with own-result IDs
- `vi.mock` uses relative path `../../lib/storage/store` (not `@/` alias) for reliable Vitest module resolution

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — component reads live store data; all navigation routes are wired to real paths.

## Threat Flags

None — component is a read-only picker UI with no network, auth, or storage write surface.

## Self-Check: PASSED

- `src/components/CompareWithSomeone.tsx` — exists, ff60c38 committed
- `src/components/__tests__/CompareWithSomeone.test.tsx` — exists, 3248030 committed
- `npx tsc --noEmit -p .` — 0 errors
- `npx vitest run src/components/__tests__/CompareWithSomeone.test.tsx` — 9/9 passed

## Next Phase Readiness

Wave 3 (Plan 04 — Result.tsx) can mount `<CompareWithSomeone currentResultId={result.id} />` and receive a fully-functional two-section picker with no further wiring required.

---
*Phase: 04-port-compare-page*
*Completed: 2026-05-17*
