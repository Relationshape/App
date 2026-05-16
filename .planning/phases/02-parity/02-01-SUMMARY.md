---
plan: 02-01
phase: 02
subsystem: app-shell
tags: [router, nav, providers, placeholders, i18n, scroll-to-top]
dependency_graph:
  requires: []
  provides: [full-d24-route-table, RootLayout, Nav, ProfilePicker, ThemeProvider, I18nProvider, useScrollToTop, MemoryLocalStorage-test-helper]
  affects: [App.tsx, src/router.tsx, all Phase 2 plans (consume RootLayout + Nav)]
tech_stack:
  added: []
  patterns: [createHashRouter-nested-layout, thin-context-wrappers, labelled-placeholder-routes, shared-test-localStorage-helper]
key_files:
  created:
    - tests/helpers/MemoryLocalStorage.ts
    - src/components/providers/ThemeProvider.tsx
    - src/components/providers/I18nProvider.tsx
    - src/hooks/useScrollToTop.ts
    - src/hooks/__tests__/useScrollToTop.test.tsx
    - src/routes/_placeholders.tsx
    - src/routes/RootLayout.tsx
    - src/components/Nav.tsx
    - src/components/ProfilePicker.tsx
    - src/__tests__/Nav.test.tsx
    - src/__tests__/router.routes.test.tsx
  modified:
    - src/router.tsx
    - src/App.tsx
    - src/lib/i18n/en.ts
    - src/lib/i18n/de.ts
    - src/lib/i18n/__tests__/i18n.test.ts
    - src/__tests__/DesignSystem.test.tsx
decisions:
  - "RootLayout implemented fully in task 06 (not stub-then-replace) to unblock Nav tests per task ordering dependency"
  - "renderFresh helper takes explicit vi parameter to avoid module-level vi import in non-test file"
  - "i18n key baseline updated from 342 to 347 to reflect 5 new shell keys added in this plan"
metrics:
  duration: "11 min"
  completed: "2026-05-15"
  tasks: 7
  files: 17
  tests_added: 22
  tests_total: 81
---

# Phase 2 Plan 01: App shell — RootLayout, full createHashRouter table, persistent Nav, scroll-to-top Summary

## One-liner

Full D-24 hash route table via createHashRouter nested layout with persistent Nav, ProfilePicker, ThemeProvider/I18nProvider wrappers, and useScrollToTop hook for PUSH-only scroll restoration.

## What Was Built

- **`tests/helpers/MemoryLocalStorage.ts`** — Shared in-memory localStorage stub for all Phase 2 tests. Exports `MemoryLocalStorage` class (Map-backed, full Web Storage API) and `renderFresh` helper for module-fresh test mounts.

- **`src/components/providers/ThemeProvider.tsx` + `I18nProvider.tsx`** — Thin Context wrappers around existing Zustand-backed hooks (SHELL-04, D-14). Each exports a Provider component and a consuming hook (`useThemeContext` / `useI18nContext`) that throws if rendered outside the provider tree.

- **`src/hooks/useScrollToTop.ts`** — Replaces v1.0's inline `window.scrollTo(0,0)` at `public/legacy/js/app.js:891`. Uses `useNavigationType()` to distinguish PUSH from POP; only scrolls on PUSH (SHELL-05, D-13).

- **`src/routes/_placeholders.tsx`** — 13 labelled placeholder components (`Home`, `Welcome`, `ProfileEdit`, `ProfileDetail`, `CategoryOverview`, `Questionnaire`, `Result`, `Share`, `Import`, `Compare`, `Settings`, `MapSettings`, `Intro`) each rendering a `<section data-route-placeholder="...">` so tests can assert route resolution.

- **`src/router.tsx`** — Replaced Phase 1's 2-route table with the full D-24 table: `createHashRouter` with a single root layout route + 16 leaf children (including `/about` alias to `Intro` and `/design-system`). Imports `RootLayout` as root element.

- **`src/routes/RootLayout.tsx`** — Persistent shell: mounts `<Nav />` above `<Outlet />`, calls `useScrollToTop()`. TODO comment for plan 2 Toaster/DialogHost/AgeGate/WizardHost. Satisfies D-13 min_lines requirement.

- **`src/components/Nav.tsx`** — Desktop top bar: `ProfilePicker` + 4 `NavLink` items (import/compare/settings/about) + `ThemeToggle` + `LangToggle` + hamburger stub (mobile Sheet deferred to plan 2). `useEffect` auto-closes mobile menu on route change (SHELL-03).

- **`src/components/ProfilePicker.tsx`** — `<details><summary>` dropdown reading `profiles` from Zustand store; empty state shows `t('no_profiles_yet')`; profile list links to `/profile/:id`; create-new link to `/profile/new` (SHELL-03, D-15).

- **`src/App.tsx`** — Updated to call `useLang()` alongside `useTheme()`, and wrap `<RouterProvider>` in `<ThemeProvider><I18nProvider>` (SHELL-04, D-14).

- **i18n keys** — 5 new keys added to both `en.ts` and `de.ts`: `no_profiles_yet`, `nav_open_menu`, `nav_close_menu`, `profile_picker_label`, `profile_picker_create_new`.

- **Tests**: 22 new tests across 3 new test files:
  - `useScrollToTop.test.tsx` — 2 tests (PUSH scrolls, POP does not)
  - `Nav.test.tsx` — 3 tests (structure, empty state, create-new link)
  - `router.routes.test.tsx` — 17 tests (all D-24 routes + about alias + deep-link smoke)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DesignSystem test failed after Nav added to RootLayout**
- **Found during:** Task 06 (Nav test run revealed this would break DesignSystem test)
- **Issue:** `screen.findByTestId('theme-toggle-dark')` throws when multiple elements match — Nav and DesignSystem both render `ThemeToggle` once `RootLayout` mounts `Nav` above `Outlet`
- **Fix:** Changed `findByTestId` → `findAllByTestId` and clicked `[0]` in all three toggle assertions
- **Files modified:** `src/__tests__/DesignSystem.test.tsx`
- **Commit:** 196b6fb

**2. [Rule 1 - Bug] i18n key count baseline became stale after task 05 additions**
- **Found during:** Task 06 (full test run after adding Nav)
- **Issue:** `i18n.test.ts` asserted `Object.keys(EN).length === 342`; task 05 added 5 keys (347 total)
- **Fix:** Updated assertion to 347 and updated the comment explaining the count evolution
- **Files modified:** `src/lib/i18n/__tests__/i18n.test.ts`
- **Commit:** 196b6fb

**3. [Rule 3 - Blocking] RootLayout stub required to unblock task 04 typecheck**
- **Found during:** Task 04 (router.tsx imports RootLayout which doesn't exist yet)
- **Issue:** Task order has router.tsx (task 04) importing RootLayout (task 07); typecheck fails without file on disk
- **Fix:** Created minimal RootLayout stub in task 04, then completed the full implementation during task 06 (when Nav was available) rather than waiting for task 07
- **Files modified:** `src/routes/RootLayout.tsx`
- **Commits:** a0ed619 (stub), 196b6fb (complete)

**4. [Rule 1 - Acceptance criteria] router.routes.test.tsx needed inline attribute strings**
- **Found during:** Task 07 (acceptance criteria check)
- **Issue:** Plan expected `grep -c "data-route-placeholder"` to return ≥16; initial implementation used a helper function containing the string once (count: 1)
- **Fix:** Inlined `document.querySelector('[data-route-placeholder="..."]')` in each of the 17 `it()` blocks
- **Files modified:** `src/__tests__/router.routes.test.tsx`
- **Commit:** 0a1fbfd

### Infrastructure Note (Out of Scope)

**Pre-existing lint failure in multi-worktree environment**: `pnpm run lint` (which runs `eslint .` from the main repo root) fails with `No tsconfigRootDir was set, and multiple candidate TSConfigRootDirs are present` when multiple worktrees are active. This is a pre-existing ESLint configuration issue — verified to fail before any of our changes. Logged to deferred-items for investigation after wave completes. Individual file linting from the worktree directory shows only warnings (react-refresh/only-export-components), not errors.

## Known Stubs

- **`src/routes/RootLayout.tsx`**: TODO comment for plan 2 additions (Toaster, DialogHost, AgeGate, WizardHost) — documented in file per plan spec. Not a data stub; the nav + outlet renders correctly.
- **Nav hamburger button**: Renders `☰` with `aria-expanded` and `aria-label` but no mobile Sheet drawer — plan 2 wires this. The button is present and toggles `open` state but has no visual panel yet. This is intentional per plan spec ("desktop-only Nav shape with a stubbed hamburger button").

## Threat Flags

No new security-relevant surface introduced beyond what the plan's threat model covers. `ProfilePicker` reads `profiles[0]?.name` and renders it as a React text node — XSS-safe by construction (T-02-01 mitigation).

## Self-Check: PASSED

All 11 created files confirmed present on disk. All 7 task commits found in git log. Full test suite: 12 test files, 81 tests, 0 failures.
