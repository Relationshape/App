---
plan: 02-02
phase: 02
subsystem: primitives
tags: [shadcn, dialog, toast, age-gate, wizard, swipe, hooks, i18n]
dependency_graph:
  requires: [02-01-PLAN.md]
  provides: [shadcn-primitives, dialog-queue, DialogHost, useToast, useSwipe, AgeGate, WizardHost, setSettings]
  affects: [RootLayout.tsx, Nav.tsx, ProfilePicker.tsx, all Phase 2 plans consuming dialog/toast/swipe]
tech_stack:
  added: ["@use-gesture/react@10.3.1", "sonner@2.0.7", "lucide-react@1.16.0", "next-themes@0.4.6", "radix-ui primitives (dialog, alert-dialog, sheet, popover, tabs)"]
  patterns: [zustand-queue-for-imperative-dialog, jsdom-pointer-fallback-for-gesture-tests, matchMedia-stub-vitest-setup, ageConfirmed-seeding-in-tests]
key_files:
  created:
    - src/components/ui/dialog.tsx
    - src/components/ui/alert-dialog.tsx
    - src/components/ui/sonner.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/popover.tsx
    - src/components/ui/tabs.tsx
    - src/lib/dialog/dialogQueue.ts
    - src/lib/dialog/dialog.ts
    - src/components/DialogHost.tsx
    - src/lib/hooks/useToast.ts
    - src/lib/hooks/useSwipe.ts
    - src/lib/hooks/useKeydown.ts
    - src/lib/hooks/useReducedMotion.ts
    - src/lib/hooks/useIsCoarsePointer.ts
    - src/lib/hooks/useFormError.ts
    - src/lib/hooks/__tests__/useSwipe.test.tsx
    - src/components/AgeGate.tsx
    - src/components/WizardHost.tsx
    - src/components/__tests__/AgeGate.test.tsx
    - src/components/__tests__/WizardHost.test.tsx
    - src/__tests__/primitives.test.tsx
  modified:
    - package.json
    - pnpm-lock.yaml
    - src/lib/storage/types.ts
    - src/lib/storage/store.ts
    - src/lib/i18n/en.ts
    - src/lib/i18n/de.ts
    - src/lib/i18n/__tests__/i18n.test.ts
    - src/routes/RootLayout.tsx
    - src/components/Nav.tsx
    - src/components/ProfilePicker.tsx
    - src/__tests__/Nav.test.tsx
    - src/__tests__/router.routes.test.tsx
    - src/__tests__/DesignSystem.test.tsx
    - tests/setup.ts
    - vitest.config.ts
decisions:
  - "lucide-react installed as explicit dep (shadcn dialog.tsx and sheet.tsx import XIcon from it)"
  - "next-themes added by shadcn CLI for sonner; sonner.tsx rewritten to remove lucide+next-themes imports and fix exactOptionalPropertyTypes"
  - "useSwipe tests use jsdom fallback: handler called directly via handlerRef since useDrag requires setPointerCapture (unavailable in jsdom)"
  - "Wizard keys kept as v1.0 values (plan note: prefer v1.0 if key already exists)"
  - "age_gate_stop is the only NEW i18n key (all others already existed in v1.0 en.ts)"
  - "window.matchMedia stubbed globally in tests/setup.ts (Sonner Toaster requires it in jsdom)"
  - "router.routes.test.tsx, Nav.test.tsx, DesignSystem.test.tsx: seed ageConfirmed+wizardSeen to prevent AgeGate/WizardHost blocking route assertions"
metrics:
  duration: "35 min"
  completed: "2026-05-15"
  tasks: 8
  files: 35
  tests_added: 17
  tests_total: 98
---

# Phase 2 Plan 02: Primitives Summary

## One-liner

Six shadcn primitives vendored (dialog, alert-dialog, sonner, sheet, popover, tabs), imperative dialog() queue + DialogHost, useToast/useSwipe/useKeydown/useReducedMotion/useIsCoarsePointer/useFormError hooks, AgeGate + WizardHost blocking gates with legacy localStorage migration, and Nav upgraded to Sheet drawer + ProfilePicker to Popover.

## What Was Built

**shadcn primitives (Task 01):**
- `src/components/ui/dialog.tsx`, `alert-dialog.tsx`, `sonner.tsx`, `sheet.tsx`, `popover.tsx`, `tabs.tsx` — vendored via `npx shadcn@latest add`
- `@use-gesture/react@10.3.1`, `sonner`, `lucide-react`, `next-themes` added as deps
- `sonner.tsx` fixed: removed lucide-react/next-themes imports; default theme parameter to fix `exactOptionalPropertyTypes` error

**Imperative dialog system (Task 02):**
- `src/lib/dialog/dialogQueue.ts`: Zustand queue + `dialog<T>()` helper (SHELL-06, D-28)
- `src/lib/dialog/dialog.ts`: re-export shim
- `src/components/DialogHost.tsx`: portal renderer draining `queue[0]` (serialises stacked dialogs per Pitfall 3)

**Utility hooks (Task 03):**
- `useToast`: sonner.toast wrapper with success/error/message (1900ms/3500ms durations)
- `useReducedMotion`: matchMedia prefers-reduced-motion with addEventListener (D-10)
- `useIsCoarsePointer`: matchMedia pointer:coarse with addEventListener (QUEST-03, D-08)
- `useKeydown`: document-level keydown with cleanup (QUEST-03)
- `useSwipe`: axis-locked @use-gesture/react drag, threshold=40 (D-08, D-09)
- `useFormError`: aria-invalid + aria-describedby wiring for field-level errors (D-19)
- `useSwipe.test.tsx`: 4 tests using jsdom fallback (direct handler invocation)

**Settings extension (Task 04):**
- `Settings.ageConfirmed?: boolean` added to types.ts (PROFILE-06, D-29)
- `AppState.setSettings` action + store implementation

**i18n (Task 05):**
- `age_gate_stop` added to en.ts and de.ts (the only key missing from v1.0)
- All existing wizard/age-gate keys preserved with v1.0 values per plan note
- i18n key count updated from 347 → 348

**AgeGate + WizardHost (Task 06):**
- `AgeGate.tsx`: blocking AlertDialog on first visit; migrates legacy `rs-age-confirmed` localStorage key (Pitfall 13, D-29)
- `WizardHost.tsx`: 7-step wizard with useReducer + useSwipe + useKeydown; gated on ageConfirmed + !wizardSeen (D-23)
- `AgeGate.test.tsx`: 4 tests (block, legacy migration, yes-click, no-click)
- `WizardHost.test.tsx`: 5 tests (no-render, step1, next, finish, ArrowRight)

**Nav + ProfilePicker upgrade (Task 07):**
- `Nav.tsx`: hamburger placeholder → shadcn Sheet mobile drawer with close-on-route-change (SHELL-03, D-15)
- `ProfilePicker.tsx`: `<details>` shim → shadcn Popover with profile list and create-new link
- `Nav.test.tsx`: updated to click Popover trigger before asserting menu content

**RootLayout wiring + integration tests (Task 08):**
- `RootLayout.tsx`: mounts `<Toaster>`, `<DialogHost>`, `<AgeGate>`, `<WizardHost>`; lastSaveError subscriber fires toast.error and clears (D-13, SHELL-06)
- `primitives.test.tsx`: 4 integration tests (toast, dialog, serialisation, lastSaveError)
- `tests/setup.ts`: stub `window.matchMedia` + `ResizeObserver` for jsdom
- `vitest.config.ts`: added setupFiles
- Existing tests updated to seed `ageConfirmed: true, wizardSeen: true` to prevent gate blocking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sonner.tsx imported lucide-react and next-themes (not in project)**
- **Found during:** Task 01 (shadcn add sonner)
- **Issue:** Generated file imported `lucide-react` (not installed) and `useTheme()` from `next-themes`; caused typecheck errors
- **Fix:** Rewrote sonner.tsx to remove both imports; used `{ theme = "system", ...props }` destructuring to fix `exactOptionalPropertyTypes` for the theme prop
- **Files modified:** `src/components/ui/sonner.tsx`
- **Commit:** d8ff717

**2. [Rule 3 - Blocking] lucide-react not installed (required by dialog.tsx and sheet.tsx)**
- **Found during:** Task 01 (typecheck after shadcn adds)
- **Issue:** shadcn added `dialog.tsx` and `sheet.tsx` which import `XIcon` from `lucide-react`, but it wasn't installed
- **Fix:** `pnpm add lucide-react`
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Commit:** d8ff717

**3. [Rule 3 - Blocking] useSwipe tests: jsdom pointer capture prevents gesture pipeline**
- **Found during:** Task 03 (useSwipe.test.tsx first run)
- **Issue:** `@use-gesture/react` `useDrag` calls `element.setPointerCapture()` which jsdom doesn't implement; pointer events dispatch but gesture state doesn't update
- **Fix:** Plan-approved fallback — direct handler invocation via `handlerRef.current` with synthetic DragState objects; 4 tests cover threshold, direction, and mid-drag guard
- **Files modified:** `src/lib/hooks/__tests__/useSwipe.test.tsx`
- **Commit:** 9d014c3

**4. [Rule 1 - Bug] AgeGate.test.tsx had unused `beforeEach` import causing typecheck error**
- **Found during:** Task 07 (typecheck after Nav upgrade)
- **Issue:** `beforeEach` imported from vitest but never used — TypeScript strict mode catches this
- **Fix:** Removed from import list
- **Files modified:** `src/components/__tests__/AgeGate.test.tsx`
- **Commit:** b5f2e09

**5. [Rule 2 - Critical] window.matchMedia not stubbed in jsdom — Sonner Toaster crashes**
- **Found during:** Task 08 (primitives tests + router regression run)
- **Issue:** Sonner's `<Toaster>` calls `window.matchMedia('(prefers-color-scheme: dark)')` on mount; jsdom doesn't implement matchMedia → React Router error boundary fires
- **Fix:** Added matchMedia stub to `tests/setup.ts`; added `setupFiles` to `vitest.config.ts`
- **Files modified:** `tests/setup.ts`, `vitest.config.ts`
- **Commit:** 1a30d25

**6. [Rule 2 - Critical] AgeGate in RootLayout blocked all existing router + nav + design-system tests**
- **Found during:** Task 08 (full test run)
- **Issue:** `router.routes.test.tsx`, `Nav.test.tsx`, `DesignSystem.test.tsx` all mount `<App>` without `ageConfirmed: true`; AgeGate now shows blocking dialog that hides all route content
- **Fix:** Seeded `relationshape.v1` localStorage with `ageConfirmed: true, wizardSeen: true` in each affected test before mounting
- **Files modified:** `src/__tests__/router.routes.test.tsx`, `src/__tests__/Nav.test.tsx`, `src/__tests__/DesignSystem.test.tsx`
- **Commit:** 1a30d25

**7. [Rule 1 - Minor] Nav.test.tsx ProfilePicker assertions needed Popover click**
- **Found during:** Task 07 (Nav tests after ProfilePicker → Popover upgrade)
- **Issue:** Popover content is portal-rendered and only mounted after trigger click; the two tests asserting `no_profiles_yet` text and `profile-picker-create` link found nothing
- **Fix:** Added `fireEvent.click(trigger)` before the assertions; added `fireEvent` import
- **Files modified:** `src/__tests__/Nav.test.tsx`
- **Commit:** b5f2e09

## Known Stubs

None. All components created in this plan are wired to real data sources. No placeholder content.

## Threat Flags

No new threat surface beyond the plan's documented threat model (T-02-04 through T-02-07):
- `DialogHost.tsx` contains no `dangerouslySetInnerHTML` (T-02-04 mitigated)
- `AgeGate.tsx` deletes the legacy key after migration; no console.log of the value (T-02-05)
- `DialogHost.tsx` renders only `queue[0]` — stacked dialogs serialised (T-02-06)
- `<Toaster>` provides ARIA live region via Sonner (T-02-07)

## Self-Check: PASSED

All 21 created files confirmed present. All 8 task commits found in git log (d8ff717, cd4be69, 9d014c3, eacabbb, 07da518, 420e8d6, b5f2e09, 1a30d25). Full test suite: 16 test files, 98 tests, 0 failures. TypeScript build clean. Production build succeeds.
