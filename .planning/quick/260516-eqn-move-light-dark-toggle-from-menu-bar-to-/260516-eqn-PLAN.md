---
quick_id: 260516-eqn
description: Move light/dark toggle from menu bar to settings; make language a small styled select or segmented button
date: 2026-05-16
mode: quick
---

# Quick Task 260516-eqn — Nav cleanup: theme → settings only; compact LangToggle

## Goal

The menu bar currently shows both the three-way ThemeToggle and a full `<label>Language <select></label>` LangToggle. Strip the menu bar back so that:

1. **Light/Dark mode** lives only in Settings (where it already exists). Remove `<ThemeToggle />` from `<Nav>`.
2. **Language** stays in the menu bar but renders as a very small styled control. With only two languages (en/de), a segmented button (matching the existing ThemeToggle pattern) is the cleanest fit — compact and consistent with the rest of the shell.

Settings already contains a Theme section that uses the same `ThemeToggle` component, so no user-visible feature is lost.

## Files

- `src/components/Nav.tsx` — remove ThemeToggle import + render
- `src/components/LangToggle.tsx` — replace `<label>Language <select></label>` with a compact segmented Button group (EN / DE); move the visible "Language" word into an `aria-label`
- `src/__tests__/Nav.test.tsx` — drop the `theme-toggle-auto` assertion (no longer rendered in nav); keep `lang-toggle` assertion (now matches the segmented group)
- Settings/DesignSystem routes need no change — they already use `<LangToggle />` and `<ThemeToggle />` and benefit from the more compact lang control

## Tasks

### Task 1 — Remove ThemeToggle from Nav

- **files**: `src/components/Nav.tsx`
- **action**: Delete `import { ThemeToggle } from './ThemeToggle'` and the `<ThemeToggle />` element from the shared `items` fragment. Leave LangToggle in place.
- **verify**: `grep -n ThemeToggle src/components/Nav.tsx` returns nothing; `src/routes/Settings.tsx` still imports and renders ThemeToggle.
- **done**: Nav file no longer references ThemeToggle.

### Task 2 — Compact LangToggle as segmented button

- **files**: `src/components/LangToggle.tsx`
- **action**: Replace the `<label>…<select>` with a `role="group" aria-label="Language"` flex row of `Button` primitives, one per `availableLangs()` entry. Use `size="sm"`, `variant={current===code?'default':'outline'}`, `aria-pressed`, and a short uppercase label (the language code in uppercase) as the visible text so the control stays small. Keep `data-testid="lang-toggle"` on the wrapping group so existing Nav test still passes, and add per-button testids `lang-toggle-{code}` to mirror the ThemeToggle pattern.
- **verify**: `grep -n "<select" src/components/LangToggle.tsx` returns nothing; rendered control uses shadcn `Button`; clicking a button calls `setLang(code)`.
- **done**: LangToggle renders as compact segmented Button group; component still exports the same default `LangToggle` function.

### Task 3 — Update Nav test

- **files**: `src/__tests__/Nav.test.tsx`
- **action**: Remove the `theme-toggle-auto` assertion (and the surrounding "+ theme" mention in the `it(...)` description). Keep the `lang-toggle` assertion — the new segmented group still carries that testid on its `role="group"` wrapper.
- **verify**: `npx vitest run src/__tests__/Nav.test.tsx` passes.
- **done**: Nav test no longer expects a theme toggle inside the nav.

### Task 4 — Sanity build/test

- **files**: —
- **action**: `pnpm tsc -p tsconfig.app.json --noEmit` then `pnpm vitest run src/__tests__/Nav.test.tsx src/__tests__/DesignSystem.test.tsx` to catch any fallout (DesignSystem also renders both toggles).
- **verify**: Both commands exit 0.
- **done**: Typecheck + relevant tests green.

## Out of scope

- No changes to Settings layout/styling (Theme section there already works).
- No new translations needed — the language buttons display the language code (EN/DE), which is universal.
- No removal of the `ThemeToggle` component itself — still used by Settings and DesignSystem.
- DesignSystem header still renders both toggles by design (it is a component showcase).
