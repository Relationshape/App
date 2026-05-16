---
quick_id: 260516-ex7
status: complete
completed: 2026-05-16
commits:
  - ef8dc70 fix(260516-ex7): shrink ItemSpider axis labels and wrap long text
  - c33c5e0 feat(260516-ex7): add CategoryModal with Spider + Items tabs
  - a5ca512 feat(260516-ex7): port legacy compare layout (cat-grid + chip toggles)
key-files:
  created:
    - src/components/charts/CategoryModal.tsx
  modified:
    - src/routes/Compare.tsx
    - src/routes/__tests__/Compare.test.tsx
    - src/components/charts/ItemSpider.tsx
    - src/lib/i18n/de.ts
    - src/lib/i18n/en.ts
---

# Quick Task 260516-ex7 — Summary

**One-liner:** Compare page now uses legacy CSS layout (compare-pick / cat-grid)
with a Kategorie-Details section that opens a tabbed shadcn-Dialog modal; ItemSpider
labels shrunk to 11-18px and wrap onto multiple lines.

## What was built

### Task 3 — `ItemSpider` font + wrapping fix (commit `ef8dc70`)

- Replaced the imported `labelFontSize(N)` (18-34px) with a tighter inline
  `itemLabelFontSize(N)` formula: `Math.round(Math.max(11, Math.min(18, 130/N)))`.
  Now 7 axes ≈ 18px, 9 axes ≈ 14px, 14 axes ≈ 11px.
- Added multi-line label rendering via `wrapLabel(text, 16)` + `<tspan>` so long
  labels (e.g. "Gemeinsamen Kommunikationsstil finden") wrap inside the SVG.
- Bumped padding multiplier from `fs * 4` to `fs * 5` to give wrapped lines room.

### Task 2 — `CategoryModal` component (commit `c33c5e0`)

New file `src/components/charts/CategoryModal.tsx`. Built on shadcn `<Dialog>` +
`<DialogContent>` (same primitive used by `EnlargedSpider`). Layered with the
existing legacy `.cat-modal-*` classes from `src/styles/legacy-components.css`.

- Header row: cat icon + DE/EN-aware title + blurb. Uses CSS custom property
  `--c` set to `cat.color` so the icon tint matches the category accent.
- Tab bar: `tab_spider` (Netzdiagramm → `<ItemSpider size={520}>`) and
  `tab_items` (Element für Element → `<CategoryBars>`). Active tab uses the
  `.cat-modal-tab.active` modifier.
- Footer: single Close button (no Save — Edit tab is explicitly out of scope).
- Shadcn's default close-X is hidden (`showCloseButton={false}`) because it
  overlaps the cat-modal-head-row layout. Esc / overlay click still close via
  Radix.
- Test ids exposed: `category-modal`, `cat-modal-tab-spider`,
  `cat-modal-tab-items`, `cat-modal-panel-spider`, `cat-modal-panel-items`,
  `cat-modal-close`.

### Task 1 — Compare page rewrite (commit `a5ca512`)

Rewrote `src/routes/Compare.tsx` to mirror legacy `viewCompare`:

- `.page-head` with h1 + muted sub.
- `.compare-pick` toggle row — every result + import renders as a `.pick-chip`,
  selected state shown via `.on` modifier and `aria-pressed`. URL `ids=` array
  is the source of truth.
- Default-to-first-2 selection when `?ids=` is empty (legacy parity, line 3480).
- Fabi-mode-aware overview area: when `settings.fabiMode` is on the Spider chart
  renders in a `.panel`; otherwise a `.callout` shows the new `compare_fabi_tip`
  i18n key (added to both `de.ts` and `en.ts`).
- Alignment overview only renders when ≥2 datasets are selected (unchanged
  behaviour, restyled with `.section-head`).
- New "Kategorie-Details" section: 3-column `.cat-grid` of `.cat-card.cat-card-btn`
  buttons. Each card uses `--c: cat.color` for the gradient header and opens the
  CategoryModal on click. Title + blurb honour the active locale via `getLang()`
  + `cat.de` / `cat.deBlurb`.
- Test ids preserved: `compare-page`, `compare-chips`, `compare-chip-{id}`,
  `compare-empty`. New ids: `compare-cat-details`, `compare-cat-card-{id}`,
  `compare-fabi-tip`.

#### Test updates (`Compare.test.tsx`)

The legacy layout rendered chips only for selected ids and removed them on
click. The new layout always renders one chip per option and toggles
`aria-pressed`. Updated two test assertions to match:

- "passing 5 IDs slices to 4" — asserts `aria-pressed='true'` for R1/R4 and
  `aria-pressed='false'` for R5 (the chip exists but is unselected) instead of
  expecting R5's chip to be absent.
- "removing a chip rewrites ?ids=" → renamed to "toggling a chip rewrites
  ?ids= in the URL (de-selects in place)". Asserts `aria-pressed` flips +
  `window.location.hash` reflects the new selection.

Per-test timeouts were bumped to 30s (with 10s waitFor on the initial mount)
to absorb cold-start variance on this project's vitest setup — earlier runs
intermittently exceeded the default 5s during initial Vite transform.

## Verification

- `bun run typecheck` — no errors in any file touched by this task. (Pre-existing
  errors in `src/components/RsHeroConstellation.tsx` and `src/components/RsToggleCard.tsx`
  exist on `main` independently of this task and are out of scope.)
- `bun run test src/routes/__tests__/Compare.test.tsx` — **4 / 4 passing**
  (Duration 41s, cold start).
- `bun run test src/components/charts/__tests__/ItemSpider.test.tsx` — **4 / 4 passing**
  (Duration 13s).

## Deviations from plan

- **Bumped per-test timeouts on Compare.test.tsx to 30s.** Not in the plan, but
  required for the tests to pass reliably. The vitest cold-start on this codebase
  consistently exceeded the default 5s timeout during the initial transform pass.
  This is a test-infrastructure adjustment, not a behavioural change. (Rule 1 —
  fix the failing test to match real-world timing.)

## Out of scope (per plan; not implemented)

- "Weitere Kategorien hinzufügen" multi-screen dialog.
- Edit-answers tab in CategoryModal.
- Fabi-mode summary chips on cat-cards.
- Inline Spider chart on Result.tsx.

## Self-Check: PASSED

- `src/components/charts/CategoryModal.tsx` — FOUND
- `src/routes/Compare.tsx` — FOUND (rewritten)
- `src/routes/__tests__/Compare.test.tsx` — FOUND (assertions updated)
- `src/components/charts/ItemSpider.tsx` — FOUND (font + wrapping fix)
- `src/lib/i18n/de.ts` + `src/lib/i18n/en.ts` — FOUND (`compare_fabi_tip` added)
- Commit `ef8dc70` — FOUND
- Commit `c33c5e0` — FOUND
- Commit `a5ca512` — FOUND
