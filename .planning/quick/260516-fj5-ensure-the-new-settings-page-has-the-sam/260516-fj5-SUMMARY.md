---
phase: quick-260516-fj5
plan: 01
subsystem: settings
tags: [settings, legacy-parity, fabi-mode, rs-component, ui]
requires: []
provides:
  - "RsToggleCard reusable toggle-card primitive (src/components/RsToggleCard.tsx)"
  - "Settings page with legacy section-head wrappers, legacy ordering, and Anzeigemodi → Fabi-Modus toggle"
  - "Test coverage for Display modes section + Fabi toggle round-trip (visual + persistence)"
affects:
  - "src/routes/Compare.tsx (existing consumer of s.settings.fabiMode — now has a UI to set it)"
tech_stack:
  added: []
  patterns:
    - "Rs* prefix for new custom shared components (per user convention)"
    - "Controlled toggle via checked/onCheckedChange props"
    - "ARIA: role=switch + aria-checked + aria-labelledby for screen-reader parity"
key_files:
  created:
    - src/components/RsToggleCard.tsx
  modified:
    - src/routes/Settings.tsx
    - src/routes/__tests__/Settings.test.tsx
decisions:
  - "Reuse legacy .onboard-toggle / .onboard-switch CSS rules instead of introducing a shadcn Switch primitive — keeps visual parity with legacy and avoids adding a new dependency."
  - "State lives in the parent (Settings.tsx reads s.settings.fabiMode and calls setSettings({ fabiMode })). RsToggleCard is purely presentational with a controlled API — keeps it reusable for future display-mode toggles."
metrics:
  duration_seconds: 2797
  completed: "2026-05-16T10:08:42Z"
  tasks_completed: 3
  files_changed: 3
---

# Quick 260516-fj5: Settings page legacy parity (section-head + Fabi-Modus) — Summary

Restored visual parity between the new React Settings page and the legacy app by wrapping section headings in `<header className="section-head">` (so `.section-head h2` typography applies), reordering sections to match the legacy screenshot (Theme → Lang → Anzeigemodi → Scale → Data), and adding the missing Anzeigemodi → Fabi-Modus toggle card. Extracted the toggle card as a reusable `RsToggleCard` Rs-prefixed primitive.

## What Shipped

| File | Change | Purpose |
|------|--------|---------|
| `src/components/RsToggleCard.tsx` | created (44 LOC) | Reusable toggle-card primitive matching the legacy `.onboard-toggle` markup. Controlled `checked` + `onCheckedChange` API; ARIA `role="switch"`. |
| `src/routes/Settings.tsx` | rewritten | Added `<header className="section-head">` wrapper around every `<h2>`; reordered sections; added new Anzeigemodi section with `RsToggleCard` wired to `s.settings.fabiMode` via `setSettings`; moved the scale subtitle inside its section-head wrapper. |
| `src/routes/__tests__/Settings.test.tsx` | extended (+30 LOC) | Augmented the "renders sections" assertion + added two new tests for visual class flip and localStorage persistence. |

## Commits

| Task | Type | Hash | Message |
|------|------|------|---------|
| 1 | feat | `6c1aca0` | feat(quick-260516-fj5): add RsToggleCard reusable toggle-card primitive |
| 2 | feat | `b696fbf` | feat(quick-260516-fj5): restore legacy parity on Settings page (section-head + Anzeigemodi → Fabi-Modus) |
| 3 | test | `c438aeb` | test(quick-260516-fj5): cover Display modes section + Fabi toggle round-trip |

## Verification Results

- `npx tsc --noEmit` — exit 0, no errors.
- `npx vitest run src/routes/__tests__/Settings.test.tsx --testTimeout=30000 --hookTimeout=30000` — **7 / 7 tests passing** (5 pre-existing + 2 new).
- Grep counts on `src/routes/Settings.tsx`: 11 occurrences of the expected patterns (section-head wrappers x4, RsToggleCard usage x2, both new testids, setSettings call) — well above the 5-minimum.
- Grep counts on `src/components/RsToggleCard.tsx`: 9 occurrences (export, onCheckedChange usage, onboard-toggle class, onboard-switch class) — well above the 4-minimum.

## Test Output

```
RUN  v4.1.6 .claude/worktrees/agent-a2df110ca770ac94c
 Test Files  1 passed (1)
      Tests  7 passed (7)
   Duration  24.65s (transform 3.65s, setup 157ms, import 905ms, tests 7.29s, environment 10.07s)
```

Pre-existing tests preserved:
1. renders scale-editor, theme toggle, lang toggle, data management sections (augmented with two new assertions)
2. add-step button appends a new row; scale-editor shows one more row
3. ↑ button on second row moves a step up (row order changes)
4. delete on a step with no answers removes it immediately
5. delete on a step with existing answers requires confirm dialog (gated by AlertDialog)

New tests added:
6. clicking the Fabi-mode toggle flips its visual on/off state (is-on + .onboard-switch.on)
7. clicking the Fabi-mode toggle persists settings.fabiMode = true to localStorage

## Deviations from Plan

None — the plan was executed exactly as written.

Notes on execution environment (not deviations):
- Vitest needed `--testTimeout=30000 --hookTimeout=30000` to run reliably inside the worktree's overlay filesystem (the default 5 s test timeout was too tight given ~10 s for the jsdom environment setup on first mount + 3.6 s transform cost). This is a worktree-execution speed quirk, not a code or test issue. The same tests ran in 7.29 s of actual test time once the environment was warm.
- One transient "Failed to start forks worker" timeout occurred on the first vitest invocation; a retry succeeded. No code change required.

## Out-of-Scope (Deferred)

- Task 4 (visual checkpoint at `http://localhost:5173/#/settings`) was intentionally excluded from this executor's scope per the task scope — the orchestrator will surface visual verification to the user after merge.

## Self-Check: PASSED

Files verified to exist on disk:
- FOUND: `src/components/RsToggleCard.tsx`
- FOUND: `src/routes/Settings.tsx` (modified)
- FOUND: `src/routes/__tests__/Settings.test.tsx` (modified)

Commits verified in git log:
- FOUND: `6c1aca0` (Task 1)
- FOUND: `b696fbf` (Task 2)
- FOUND: `c438aeb` (Task 3)
