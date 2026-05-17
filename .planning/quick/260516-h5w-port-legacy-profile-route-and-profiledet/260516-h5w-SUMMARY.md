---
quick_id: 260516-h5w
status: complete
description: Port legacy /profile route + bring ProfileDetail/ResultCard to legacy parity
mode: quick
completed: 2026-05-16
commits:
  - hash: 14dc611
    title: "feat(260516-h5w): add fmtDate/countAnswers helpers + Profile pill links to /"
  - hash: 3b43f81
    title: "feat(260516-h5w): rewrite ResultCard as legacy .list-item row + Home templates section"
files_changed:
  created:
    - src/lib/format/date.ts
    - src/components/RsMenuButton.tsx
  modified:
    - src/components/ProfilePicker.tsx
    - src/components/Nav.tsx
    - src/components/LangToggle.tsx
    - src/styles/legacy-components.css
    - public/legacy/index.html
    - src/components/ResultCard.tsx
    - src/routes/ProfileDetail.tsx
    - src/routes/Home.tsx
    - src/routes/__tests__/Profile.test.tsx
    - src/__tests__/Nav.test.tsx
verification:
  typecheck_unrelated_only: true
  full_test_suite: "230 / 230 pass"
  profile_test_file: "9 / 9 pass (7 original + 2 new)"
  nav_test_file: "3 / 3 pass (after caret retarget)"
---

# Quick task 260516-h5w — Summary

## What changed

### Task 1 — fmtDate/countAnswers helpers + Profile pill navigates to `/`

- **Created `src/lib/format/date.ts`** with two named exports:
  - `fmtDate(ts)` — localized "Mon DD, YYYY" formatter (legacy app.js:35).
  - `countAnswers(result)` — counts answered cells across all categories,
    correctly walking `__custom` and skipping `__hidden` (legacy app.js:1611-1620).
- **Folded in mid-polish baseline** the user had been working on (RsMenuButton,
  floating-pill Nav, v1.0-style LangToggle dropdown, .nav-link CSS adapter
  rules, "OLD" prefix on legacy index.html). These were uncommitted in the
  parent repo; brought into the worktree as the working baseline before
  building Task 1 on top.
- **ProfilePicker** now uses a split-trigger structure:
  - The pill itself is a `RsMenuLink to="/"` with `data-testid="profile-picker"`
    (legacy parity for `navLink("#/", ICONS.nav_profiles, …)` at app.js:956).
  - A small adjacent caret button (`data-testid="profile-picker-caret"`) is
    the Popover trigger so the quick-switch menu remains reachable.
- Test IDs preserved: `profile-picker` (now on the link), `profile-picker-menu`,
  `profile-picker-item-{id}`, `profile-picker-create`. Added: `profile-picker-caret`.

### Task 2 — Legacy `.list-item` ResultCard + Home templates section

- **`ResultCard` rewrite.** From a single `<Link className="card">` to the
  legacy `.list-item` row with avatar + body + four-button `.li-actions`:
  Continue (btn-primary → `/q-categories/:profileId/:resultId`),
  View (btn → `/result/:id`),
  Share (btn → `/share/:id`),
  Delete (btn-danger-ghost 🗑 → confirm dialog → `deleteResult`).
  Body line now matches legacy: `Updated {fmtDate(updatedAt)} · {countAnswers} answers`.
  Markup uses plain `<button class="btn …">` so the existing `legacy-components.css`
  rules (`.list-item`, `.li-avatar`, `.li-body`, `.li-actions`, `.btn-danger-ghost`,
  `.btn-primary`) apply directly. Mirrors `app.js:1591-1608` exactly.
- **`ProfileDetail`.** Replaced the shadcn primary `<Button asChild>` "new map"
  with a plain `<button className="list-add">` so it picks up the legacy
  full-width dashed callout styling. Switched the i18n key to `btn_new_map`
  (the legacy text). Profile-head Edit + Delete buttons unchanged.
- **`Home`.** Added a Templates section below the Imports section. It renders
  iff at least one template import exists in the store (uses `isTemplateImport`
  from `src/lib/data/imports.ts`). Imports/Templates lists are disjoint;
  visible/template imports both sort by `importedAt` desc.
- **Tests.**
  - `Profile.test.tsx`: +2 cases. (1) ProfileDetail row exposes
    `result-continue/view/share/delete-{id}` buttons. (2) Home renders the
    templates section with a `home-template-{id}` link while keeping the
    existing imports section excluding templates. 9/9 pass.
  - `Nav.test.tsx`: two existing tests clicked `[data-testid="profile-picker"]`
    expecting it to open the popover; that element is now the navigation link.
    Updated both tests to click `[data-testid="profile-picker-caret"]` instead.
    3/3 pass.

## Routing decision (recorded)

Did NOT add a `/profile` route to `src/router.tsx`. The legacy `Profile` nav
entry points at `#/` (Home), which the new app already serves. Making the
"Profile" pill navigate to `/` matches legacy exactly and avoids duplicating
Home as a new route. (Reflected in the plan's Investigation summary.)

## Deviations from plan

### Auto-fixed issues

**1. [Rule 1 — Bug] Updated `Nav.test.tsx` to target the new caret affordance**

- **Found during:** Task 2 full-suite verification.
- **Issue:** Two pre-existing Nav tests clicked
  `[data-testid="profile-picker"]` expecting it to open the popover. After
  Task 1, that element is a `NavLink to="/"` (legacy parity). Clicking a link
  doesn't open the popover anymore — the new caret button does.
- **Fix:** Retargeted both tests to click
  `[data-testid="profile-picker-caret"]` (the Popover trigger). Behavior
  asserted is identical (`no_profiles_yet` text appears, `profile-picker-create`
  appears) — only the affordance changed.
- **Files modified:** `src/__tests__/Nav.test.tsx`
- **Commit:** `3b43f81`

### Mid-work baseline carried in (not new functionality, but recorded for clarity)

The constraint required treating the user's uncommitted work in the parent
repo as the worktree baseline. The fresh worktree did not contain those
files, so they were copied in verbatim before Task 1 changes were applied:

- `src/components/RsMenuButton.tsx` (new shared `RsMenuLink` / `RsMenuButton`).
- `src/components/Nav.tsx` (floating-pill rewrite using `RsMenuLink`).
- `src/components/LangToggle.tsx` (v1.0-style dropdown picker).
- `src/styles/legacy-components.css` (`.nav-link` adapter rules at the tail).
- `public/legacy/index.html` (title prefix "OLD" for parity work).

These rode into Task 1's commit because Task 1 directly edits ProfilePicker
(which depends on `RsMenuLink` + `cleanLabel` from Nav) — committing only the
ProfilePicker delta would have broken the build.

## What to test manually

1. Run `bun run dev`, open the app at `/#/`.
2. Click the "Profile" pill in the floating nav. URL becomes `#/` and Home
   renders. Click the small `▾` caret next to it — the quick-switch popover
   opens with the existing profiles list and the "Create profile" link.
3. Visit `#/profile/{id}` for a profile with at least one result. Confirm:
   - Result row renders horizontally as a `.list-item` with avatar + body +
     a four-button `.li-actions` row on the right.
   - Body line reads `Updated {date} · {N} answers`.
   - Continue → `/q-categories/{profileId}/{resultId}`.
   - View → `/result/{id}`.
   - Share → `/share/{id}`.
   - Delete (🗑) → confirm dialog → result is removed on confirm.
   - "Add new map" button at the bottom is the legacy full-width dashed
     callout (`.list-add`), not the shadcn primary.
4. With at least one template import in the store, visit `#/`. A "Templates"
   section appears below "Imports" with each template as a link.

## Out of scope (per plan, intentionally untouched)

- New `/profile` list route — declined; legacy maps Profile → `/`.
- Profile-detail header buttons (Edit / Delete already present).
- Settings / Compare / Result / Share / Import routes.
- Restricted-import unlock flow on the Templates section (legacy
  `openUseAsTemplateModal` / `unlockRestrictedImport` — minimal port keeps
  templates as plain links to `/compare?ids=imp:{id}`, mirroring the
  Imports-section pattern; future task can add the modal).
- Pre-existing typecheck warnings in `RsHeroConstellation.tsx` / `RsToggleCard.tsx`
  and lint errors in `Compare.tsx` / `Import.fixture.test.tsx` /
  `richText.tsx` (all pre-existing in `main`; not introduced here).

## Post-merge reconciliation (orchestrator)

A parallel agent was working on the floating-pill nav and language picker
concurrently with this task. At the time this task's executor created its
worktree from `2eebb35`, the parent repo's working tree contained the parallel
agent's in-progress edits (uncommitted). The executor faithfully copied that
state into the worktree as "user mid-work baseline" — including a Nav using
`LangToggle` and a dropdown-picker LangToggle.

Meanwhile, the parallel agent finalized differently and committed to `main`:
`0935d65` (`feat(nav): use RsLangDropdown in navbar; keep LangToggle segmented
in Settings`) and `b1bdd7a` (`feat(settings): legacy parity for theme + lang
+ data buttons`). By worktree-merge time, `main` had the *finalized* parallel
work, while the worktree branch had a *snapshot of an earlier intermediate
state* of the same files.

On merge, two files conflicted between the two agents' versions:

- **`src/components/Nav.tsx`**: kept main's `RsLangDropdown` import + JSX
  (the parallel agent's finalized choice). All other Nav changes from this
  task's executor (floating-pill structure, `cleanLabel`, `RsMenuLink` items,
  SVG icons) preserved.
- **`src/components/LangToggle.tsx`**: kept main's segmented theme-picker
  version (parallel agent's finalized choice). The dropdown-picker variant
  the executor inherited was discarded.

Neither rollback was an "executor mistake" — both agents acted on what their
respective contexts said was the right baseline. The conflict was an artifact
of two agents racing on overlapping files; the resolution simply takes the
later/committed truth on main as the source of record. Final merge commit:
`a0bc1be`. Verified `bun run test` 230/230 pass; typecheck pre-existing
errors only (RsHeroConstellation, RsToggleCard).

## Self-Check: PASSED

Verified at SUMMARY-write time:

- Files exist: `src/lib/format/date.ts`, `src/components/RsMenuButton.tsx`,
  `src/components/ResultCard.tsx`, `src/routes/ProfileDetail.tsx`,
  `src/routes/Home.tsx`, `src/routes/__tests__/Profile.test.tsx`,
  `src/__tests__/Nav.test.tsx`, `src/components/ProfilePicker.tsx`,
  `src/components/Nav.tsx`, `src/components/LangToggle.tsx`,
  `src/styles/legacy-components.css`, `public/legacy/index.html`.
- Commits in git log: `14dc611` (Task 1) and `3b43f81` (Task 2).
- `bun run test`: 230/230 pass.
- `bun run typecheck`: only pre-existing unrelated errors remain
  (RsHeroConstellation, RsToggleCard).
