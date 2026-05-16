---
quick_id: 260516-tile
status: complete
description: Lift cat-toggle / cat-overview-tile into shared RsTile component with visible active/inactive state
mode: quick
created: 2026-05-16
completed: 2026-05-16
---

# Quick Task 260516-tile — Extract RsTile component

## Problem

`data-testid="cat-tile-connection"` flips `aria-pressed` correctly but the
visual selected-vs-unselected difference is too subtle on the category
overview page — selected only changes the border color from `border-line`
to `border-(--c)`, which is barely perceptible against the dark
`var(--glass)` surface.

The map-settings sister grid (`.cat-toggle`) already has the right idiom:
`opacity-100` when on, `opacity-[0.55]` when off, *plus* the colored border.
The category overview tile is missing the opacity dimming.

Three places render the same "tile with colored left bar" idiom with
copy-pasted JSX:
- `CategoryOverview.tsx` — `.cat-overview-tile` (category toggle on
  questionnaire setup, 12 tiles, no opacity dim)
- `MapSettings.tsx` — `.cat-toggle` (category toggle on per-map settings,
  opacity dim already correct)
- `ScaleEditor.tsx` — `.scale-row` (data-editing row, **not** a toggle —
  not in scope for the component)

## Approach

1. **Create `src/components/RsTile.tsx`** — single Rs* component
   encapsulating the toggle pattern:
   - Renders as `<button type="button" aria-pressed>` with `--c` set inline
   - 5px colored left bar (via shared CSS rule)
   - Active: full opacity, `border-(--c)`
   - Inactive: opacity `.55`, neutral `border-line`
   - Slots: `icon`, `title`, `trailing` (e.g. ✓ / count), plus `children`
     (for extras like progress bar)
   - Pass-through: `onClick`, `data-testid`, `aria-label`, `className`
2. **Add `.rs-tile*` styles** to `src/styles/legacy-components.css`,
   adjacent to the existing left-bar shared rule.
3. **Replace cat-overview-tile usage** in `CategoryOverview.tsx` with
   `<RsTile>`. This fixes the visible-state bug.
4. **Replace cat-toggle usage** in `MapSettings.tsx` with `<RsTile>`.
5. **Remove dead CSS** — `.cat-toggle` and `.cat-overview-tile` per-tile
   layout rules become unused after the JSX migration; remove them and
   drop them from the shared `border-left: 5px` rule. `.scale-row` stays.
6. **Verify** — typecheck, lint, full test suite, build.

## Scope boundary

- ✅ Cat tile button toggles (the two places listed)
- ❌ `.scale-row` — structurally an editing-row, not a toggle; out of scope.
  The shared CSS left-bar rule continues to cover it.
- ❌ `.list-item` (3px) and `.result-head` (4px) — different thickness,
  different semantic (list entry / header). Not the same idiom.

## Files

- created:
  - `src/components/RsTile.tsx`
  - `.planning/quick/260516-tile-…/260516-tile-PLAN.md`
- modified:
  - `src/routes/CategoryOverview.tsx`
  - `src/routes/MapSettings.tsx`
  - `src/styles/legacy-components.css`

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test -- --run`
- `pnpm build`
- Manual: cat-tile-* on category-overview-page visibly dims when
  aria-pressed=false, full opacity when aria-pressed=true.
