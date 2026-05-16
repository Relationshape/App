---
quick_id: 260516-tile
status: complete
description: Extract RsTile from cat-toggle / cat-overview-tile; fix invisible aria-pressed state
mode: quick
completed: 2026-05-16
commits:
  - hash: 8cbbc7b
    title: "refactor(rs-tile): extract shared toggle-tile component into RsTile"
files_changed:
  created:
    - src/components/RsTile.tsx
  modified:
    - src/routes/CategoryOverview.tsx
    - src/routes/MapSettings.tsx
    - src/styles/legacy-components.css
verification:
  typecheck_unrelated_only: true
  full_test_suite: "230 / 230 pass"
  vite_build: "succeeds (dist/assets/index-*.css = 140.86 kB)"
  manual_browser: "not run — verified via tests + deterministic CSS rule"
---

# Quick Task 260516-tile — Summary

## What changed

`src/components/RsTile.tsx` (new):
- `<button type="button" aria-pressed>` with `data-state="active|inactive"`
- Props: `color`, `active`, `onClick`, `icon`, `title`, `trailing`,
  `children`, `className`, `ariaLabel`, `testId`
- `color` flows to CSS via `style={{ '--c': color }}`

`src/routes/CategoryOverview.tsx`:
- Replaced inline `<button className="cat-overview-tile …">` with
  `<RsTile color={cat.color} active={isOn} onClick={…} testId="…"
  icon={…} title={catTitle} trailing={`${answered}/${total}`}>`
- Progress bar passed as `children` (Tailwind utilities, no longer a
  dedicated `.cat-overview-bar*` class)
- Dropped `cat-overview-grid` from the grid wrapper (Tailwind grid
  utilities are sufficient; the CSS class only contributed dead
  cross-cutting styles)

`src/routes/MapSettings.tsx`:
- Replaced inline `<button className="cat-toggle …">` with `<RsTile …>`
- Dropped `cat-toggle-grid` from the grid wrapper for the same reason
- Now uses `cn` no longer (one import removed)

`src/styles/legacy-components.css`:
- Added `.rs-tile`, `.rs-tile-icon`, `.rs-tile-body`, `.rs-tile-head`,
  `.rs-tile-title`, `.rs-tile-trailing` styles
- Active state: `.rs-tile[data-state="active"] { opacity: 1; border-color: var(--c) }`
- Inactive default: `.rs-tile { opacity: .55 }` (legacy `.cat-toggle.is-on` parity)
- Removed dead rules: `.cat-toggle*`, `.cat-overview-header`,
  `.cat-overview-grid`, `.cat-overview-tile*`, `.cat-overview-icon`,
  `.cat-overview-body`, `.cat-overview-title`, `.cat-overview-bar*`,
  `.cat-overview-pct`
- Updated cross-cutting comma groups (`box-shadow inner highlight`,
  `glass surfaces micro iridescent`, `depth hover glow`) to target
  `.rs-tile` instead of `.cat-overview-tile`
- Kept shared left-bar foundation: `.scale-row, .rs-tile { border-left: 5px solid var(--c) }`

## Why this fixes `data-testid="cat-tile-connection"` aria-pressed

Before: the cat-overview-tile only toggled `border-color` between
`--color-line` and `var(--c)` on the unfilled three sides. Against the
dark `var(--glass)` surface that difference is barely visible —
indistinguishable from the hover state, and invisible at a glance.

After: aria-pressed flips `data-state` which drives both `opacity`
(.55 ↔ 1) and `border-color` (--glass-border ↔ var(--c)). The active
state is now obvious — selected tiles look bright with a fully
colored frame; unselected tiles are visibly dimmed.

This brings the questionnaire-setup cat grid to parity with the
map-settings cat grid, which already had this opacity treatment via
the legacy `.cat-toggle.is-on` rule.

## Scope decisions

- **`.scale-row` left alone** — same visual idiom (5px left bar) but
  structurally an editing row, not a toggle. The shared
  `.scale-row, .rs-tile { border-left: 5px solid var(--c) }` rule keeps
  the bar consistent across both. RsTile only encapsulates the
  *toggle* pattern.
- **`.list-item` (3px) and `.result-head` (4px) left alone** —
  different thickness, different semantic. Not the same idiom.
- **Pre-existing typecheck errors in `RsHeroConstellation.tsx` and
  `RsToggleCard.tsx`** untouched. These pre-date this task (commits
  `2afcbeb` and `6c1aca0`) and are tracked separately.

## Verification

- `pnpm test -- --run` → 230 / 230 pass
- `pnpm exec vite build` → succeeds (dist artifacts produced)
- `pnpm exec eslint src/components/RsTile.tsx src/routes/CategoryOverview.tsx src/routes/MapSettings.tsx` → no errors
- `pnpm typecheck` → pre-existing errors only (RsHeroConstellation,
  RsToggleCard), none from this task's files
- Manual browser verification not run; the CSS rule is deterministic
  and the existing test (`toggling a tile flips enabledCategories…`)
  already covers the click-and-state-flip behavior.
