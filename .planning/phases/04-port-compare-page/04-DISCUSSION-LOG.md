# Phase 04 — Discussion log

**Date:** 2026-05-17
**Mode:** Non-interactive (user invoked `/gsd-discuss-phase 4` with two reference screenshots; the runtime "work without stopping for clarifying questions" directive applied — gray areas were decided from screenshots + legacy code rather than via AskUserQuestion).

## Inputs

- Two screenshots attached to the invocation:
  1. **Result-detail Compare landing** — header card with `N answers · last edited <date>` subtitle and Back / Map settings / Continue editing / Share actions; "Compare with someone" section with "Overlay your own maps" + "Compare with imported results" sub-sections (tile grids); "By category" cat-card grid.
  2. **Compare overlay (`#/compare`)** — pill chips with dot swatch; Fabi-mode tip callout; "Alignment overview" panel with "Not enough data yet." empty state; "Category details" grid with "Add more categories" button.
- Existing `CONTEXT.md` (descriptive only, no locked decisions) — superseded.
- Legacy source: `public/legacy/js/app.js:2770-2821, 3212-3279, 3453-3544` and `public/legacy/css/{style,additions}.css`.
- Current React state: `src/routes/Result.tsx`, `src/routes/Compare.tsx`, `src/components/RsCategoryPicker.tsx`, `src/components/RsTile.tsx`, `src/styles/legacy-components.css`.

## Gray areas identified

| # | Area | Resolution source |
|---|---|---|
| 1 | Result page restructure (drop inline drilldown, adopt cat-card grid) | Screenshot 1 has no inline Spider / drilldown — landing is header → Compare-with → cat-grid |
| 2 | Result header subtitle + action set | Screenshot 1 explicitly shows the subtitle and four actions (no Delete) |
| 3 | "Compare with someone" picker shape (two sections + Import… tile) | Screenshot 1 + legacy `compareTargetPicker` |
| 4 | Compare page remaining gaps (Add-more-categories, enabledCategories union) | Legacy `viewCompare:3539, 3489-3498`; existing TODO in `Compare.tsx:171` |
| 5 | Reduced-opacity threshold for cat cards | Legacy `style.css:796` and `categoryCards:2856` — binary `=== 0`, not threshold |
| 6 | Whether to share a cat-card component between Result and Compare | Two surfaces with identical needs → extract `RsCategoryCard` to avoid drift |
| 7 | Hash-route compatibility with `imp:` IDs | Already handled in current Compare.tsx 57-66 — keep |
| 8 | i18n key coverage | Listed for planner to verify; legacy keys are source of truth |
| 9 | Storage / Zustand changes | None — reads only |
| 10 | Scope guard (backend sync, sub-route, redesign, etc.) | Deferred to roadmap / out of scope |

## Decisions captured

See `04-CONTEXT.md` `<decisions>` section. Summary:
1. Restructure Result page to drop inline drill-down and match legacy: header → (Fabi-only) Spider → Compare-with-someone → cat-grid.
2. Adopt legacy header layout: subtitle with answers count + last-edited date; Back / Map settings / Continue editing / Share actions; drop in-header Delete.
3. Build `CompareWithSomeone` section + `RsCompareTile` matching legacy `.compare-pickers-split` / `.compare-tile` (own + imports + Import… tile).
4. Finish Compare page: Add-more-categories button, enabledCategories union filter, swap to `RsCategoryCard`.
5. Use legacy `.cat-card.is-empty { opacity: .58 }` rule, hiding entirely in read-only context.
6. Extract shared `RsCategoryCard` used by both pages.
7. Keep current `#/compare?ids=` scheme.
8. Planner verifies i18n keys, adds any missing.
9. No store API changes.
10. Defer Spider summary cells, post-Delete-removal UX surface, animation polish, accessibility nav.

## Deferred ideas

- Spider summary cells inside cat-cards (Fabi-mode) — port-if-cheap, else follow-up.
- Surface for Delete-result once header button is removed — likely Map settings; planner verifies.
- Animated chip selection — visual polish.
- Keyboard nav on compare tiles — accessibility backlog (legacy lacks it).

## Claude's discretion

- Picked `CompareWithSomeone.tsx` as the section component name (vs inline JSX) and `RsCompareTile.tsx` for the per-tile component (per `Rs*` prefix global memory rule).
- Picked `RsCategoryCard.tsx` (vs `CategoryCard.tsx`) for the shared cat-card extraction — same Rs* rationale. Planner can choose the final name if they have stronger context.
- Treated the "reduced opacity for too few answers" phrasing in the old CONTEXT.md as informal — followed the precise legacy rule (binary on `filledCount === 0`).

## Not asked (already settled)

- Hash routing pattern — already in use.
- Zustand selector style — established in phase 02.
- Reuse of existing chart primitives — locked in phase 02 CONTEXT.
- `Rs*` prefix convention — global memory rule.

## Anti-patterns watched

- **No scope creep:** redesign suggestions, mobile-specific layouts, sync work all rejected and deferred.
- **No duplication:** extract `RsCategoryCard` rather than copy ad-hoc tile JSX between Result and Compare.
- **No new dependencies:** all needed primitives already exist.
