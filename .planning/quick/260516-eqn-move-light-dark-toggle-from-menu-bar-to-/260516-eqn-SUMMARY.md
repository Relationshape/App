---
quick_id: 260516-eqn
status: complete
date: 2026-05-16
---

# Quick Task 260516-eqn — Summary

## What changed

- `src/components/Nav.tsx`: removed `ThemeToggle` import and render. The nav now contains: ProfilePicker, 4 NavLinks, and a compact LangToggle. Light/dark mode is reached via the existing Settings → Theme section.
- `src/components/LangToggle.tsx`: rewritten as a compact segmented `Button` group (one `Button` per `availableLangs()` entry, `size="sm"`, `h-7 px-2 text-xs uppercase`, uses the language code as visible text and the full label as `aria-label`). Wrapping element keeps `role="group"` + `aria-label="Language"` + `data-testid="lang-toggle"` so accessibility and existing test selectors hold; new per-button testids `lang-toggle-{code}` mirror the ThemeToggle pattern.
- `src/__tests__/Nav.test.tsx`: dropped the assertion that `theme-toggle-auto` exists inside the nav; replaced with a negative assertion to lock in that it's no longer there. Updated the `it(...)` title and file header comment to match.
- `src/__tests__/DesignSystem.test.tsx`: updated the stale comment that said "Nav + DesignSystem both render ThemeToggle" — only DesignSystem renders it now. `findAllByTestId` still works (returns 1 instead of 2).

## What did not change

- `ThemeToggle` itself is untouched — still used by `src/routes/Settings.tsx` and `src/routes/DesignSystem.tsx`.
- Settings page layout, store actions, i18n, and theme application logic (`useTheme`) are untouched.
- Translation files were not modified — language buttons display the language code (EN/DE) which doesn't need translation.

## Verification

- `pnpm tsc -p tsconfig.app.json --noEmit` → clean
- `pnpm vitest run src/__tests__/Nav.test.tsx src/__tests__/DesignSystem.test.tsx` → 7/7 passed
- `pnpm vitest run --no-file-parallelism` (full suite, serial) → 226/226 passed across 43 files
  - Note: parallel `vitest run` produced vitest-pool worker timeouts on this machine; serial run confirms no real failures.

## Files

- Modified: `src/components/Nav.tsx`, `src/components/LangToggle.tsx`, `src/__tests__/Nav.test.tsx`, `src/__tests__/DesignSystem.test.tsx`
- Created: `.planning/quick/260516-eqn-move-light-dark-toggle-from-menu-bar-to-/260516-eqn-PLAN.md`, `…/260516-eqn-SUMMARY.md`
