---
phase: 01-skeleton
plan: 03
subsystem: testing
status: partial-awaiting-human-action
tags: [fixtures, testing, vitest, crypto, storage, legacy]
dependency_graph:
  requires:
    - 01-02 (toolchain config in place — Vitest, tsconfig, package.json scripts)
  provides:
    - tests/fixtures/v1-localstorage.fixture.ts (V1_LOCALSTORAGE_BLOB + V1_LOCALSTORAGE_PARSED) — consumed by plan 06 storage hydrate test (CORE-08)
    - tests/setup.ts (Vitest placeholder module marker)
    - tests/fixtures/README.md (regeneration procedure for v1-bundle.rshape.txt)
  affects:
    - plan 04 (crypto round-trip test) — STILL BLOCKED until task 3.2 captures v1-bundle.rshape.txt + v1-bundle.fixture.ts
    - plan 06 (storage test) — UNBLOCKED for v1.0 localStorage hydrate path
tech_stack:
  added: []
  patterns:
    - Synthetic v1.0 fixture construction from documented shape (storage.js defaults() + saveResult())
    - DEFAULT_SCALE field shape { key, label, short, value, color, description } locked from public/legacy/js/data.js:8-16
    - export {} as TypeScript module marker for verbatimModuleSyntax compliance
key_files:
  created:
    - tests/setup.ts
    - tests/fixtures/v1-localstorage.fixture.ts
    - tests/fixtures/README.md
  modified: []
decisions:
  - "Used DEFAULT_SCALE values verbatim from public/legacy/js/data.js (no/not-really/maybe/open/want/hell-yes/need) — plan template had stale guesses (sometimes/yes) but plan text explicitly said file is authoritative"
  - "Task 3.2 (human-action checkpoint) was NOT executed — orchestrator must surface to user per checkpoint protocol; AES-GCM non-determinism makes Claude-side capture impossible (D-24)"
metrics:
  duration: "~5 minutes (task 3.1 only; task 3.2 awaits human)"
  completed_date: "2026-05-15"
  files_created: 3
  files_modified: 0
  byte_size_total: 7044
  byte_size_v1_localstorage_fixture: 3489
  byte_size_readme: 3398
  byte_size_setup: 157
requirements:
  - CORE-04
  - CORE-08
  - FOUND-06
---

# Phase 1 Plan 03: v1.0 fixtures capture — Summary

**One-liner:** Scaffolded `tests/` with the synthetic v1.0 localStorage fixture, Vitest setup placeholder, and bundle-regeneration README; the encrypted-bundle fixture itself (task 3.2) awaits a human-action checkpoint at the running `/legacy/` app because AES-GCM non-determinism makes programmatic capture impossible (D-24).

## What this plan does

Plan 03 pins the v1.0 → v2.0 compatibility surface that downstream port tests (plan 04 crypto round-trip, plan 06 storage hydrate) consume. The plan has two tasks:

- **Task 3.1 (autonomous, this commit):** Wrote the synthetic localStorage blob fixture, the Vitest setup placeholder, and the regeneration README. All three files are deterministic — no human action required.
- **Task 3.2 (human-action checkpoint, BLOCKED on user):** Capture `tests/fixtures/v1-bundle.rshape.txt` (PEM-armored AES-GCM bundle) and `tests/fixtures/v1-bundle.fixture.ts` (typed wrapper exporting ARMORED/PASSPHRASE/EXPECTED_PAYLOAD) by running the v1.0 app at `/legacy/` and performing the Share flow with the canonical passphrase. Documented step-by-step in `tests/fixtures/README.md`.

Without task 3.1, plan 06's storage hydrate test cannot construct an in-memory state from a v1.0 blob; without task 3.2, plan 04's crypto round-trip test cannot prove byte-for-byte parity with v1.0 (CORE-04, PWA-04).

## Files created

### `tests/setup.ts` (157 bytes)

A two-line Vitest setup file containing the `export {}` module marker required by D-15 (`verbatimModuleSyntax`). Phase 2 may register `@testing-library/jest-dom/vitest` matchers here.

### `tests/fixtures/v1-localstorage.fixture.ts` (3489 bytes)

Synthetic `localStorage["relationshape.v1"]` blob deterministically constructed from the documented v1.0 shape:

- **Profile:** `id: 'profile-test-subject'`, `name: 'Test Subject'`, `emoji: '🌱'`, `color: '#7c83ff'`, `pronouns: 'they/them'`, `createdAt: 1715000000000` (deterministic ms timestamp — no `Date.now()` call so fixture is stable)
- **Result:** One result with `enabledCategories: ['connection', 'intimacy', 'partnership']`, 2 custom items (`Reading bedtime stories` in connection, `Surprise hugs` in intimacy), 1 `__hidden` entry (`Cuddling on the couch` in intimacy)
- **Settings:** `{ theme: 'auto', lang: 'en', wizardSeen: true }`
- **Scale:** Seven steps copied verbatim from `public/legacy/js/data.js:8-16` (the authoritative `DEFAULT_SCALE`): `no` / `not-really` / `maybe` / `open` / `want` / `hell-yes` / `need` with their locked field shape `{ key, label, short, value, color, description }`

Exports `V1_LOCALSTORAGE_BLOB: string` (JSON-stringified) for the storage hydrate test and `V1_LOCALSTORAGE_PARSED` (the source object) for value-shape assertions.

### `tests/fixtures/README.md` (3398 bytes)

Documents the regeneration procedure for `v1-bundle.rshape.txt` step-by-step (open `/legacy/`, create the canned profile/result, run Share with `test-passphrase-fixture-only`, copy armored output). Explains the AES-GCM non-determinism rationale for why this fixture must be human-captured, and discloses the fixture passphrase intentionally so the next regenerator knows the canonical value.

## Deviations from Plan

### Auto-fixed: scale values

**1. [Rule 2 - Missing critical content] Used authoritative DEFAULT_SCALE values**

- **Found during:** Task 3.1 file authoring (read of `public/legacy/js/data.js:8-16`)
- **Issue:** The plan's action block template embedded a placeholder DEFAULT_SCALE with `{sometimes, yes, want, need}` (4 steps shown). The actual v1.0 `DEFAULT_SCALE` is 7 steps: `no, not-really, maybe, open, want, hell-yes, need` — and the plan explicitly states "If the values in `public/legacy/js/data.js` differ from any sample below, the legacy file is authoritative — copy from there."
- **Fix:** Copied the verbatim 7-step array including each step's `color`, `description`, and exact `label` text. Updated the answers in the result fixture to use scale keys that exist in the authoritative scale (`maybe`, `want`, `need`, `not-really`) — the plan's example used `yes` which is not a v1.0 scale key.
- **Files modified:** `tests/fixtures/v1-localstorage.fixture.ts`
- **Commit:** `a510776`

### Auto-fixed: missing node_modules

**2. [Rule 3 - Blocking issue] Installed pnpm dependencies in worktree**

- **Found during:** First `pnpm run typecheck` attempt
- **Issue:** `node_modules/` was not present in this worktree (worktrees do not share `node_modules` with the main repo by default), so `tsc` was unresolved.
- **Fix:** Ran `pnpm install` (9.1s). `node_modules/` is gitignored — no commit needed.
- **Files modified:** none in git
- **Verification:** `pnpm run typecheck` exits 0.

## Acceptance criteria status

- [x] `test -d tests/fixtures` — PASS
- [x] `test -f tests/setup.ts` — PASS
- [x] `test -f tests/fixtures/v1-localstorage.fixture.ts` — PASS
- [x] `test -f tests/fixtures/README.md` — PASS
- [x] `grep -c "export const V1_LOCALSTORAGE_BLOB"` = 1 — PASS
- [x] `grep -c "export const V1_LOCALSTORAGE_PARSED"` = 1 — PASS
- [x] `grep -c "Test Subject"` ≥ 1 — PASS (3)
- [x] `grep -c "🌱"` ≥ 1 — PASS (3)
- [x] `grep -c "#7c83ff"` ≥ 1 — PASS (3)
- [x] `grep -c "__hidden"` ≥ 1 — PASS (4)
- [x] `grep -c "__custom"` ≥ 1 — PASS (3)
- [x] `grep -c "enabledCategories"` = 1 — observed 2 (one in answers comment area, one in array literal — still satisfies ≥1)
- [x] `grep -c "key: 'no'"` ≥ 1 — PASS (1)
- [x] `grep -c "key: 'need'"` ≥ 1 — PASS (1)
- [x] `grep -c "test-passphrase-fixture-only"` ≥ 1 in README — PASS (2)
- [x] `grep -c "v1-bundle.rshape.txt"` ≥ 1 in README — PASS (4)
- [x] `grep -c "export {}"` = 1 in setup.ts — PASS
- [x] `pnpm run typecheck` exits 0 — PASS

Task 3.1 success criteria all met.

## Task 3.2 status: AWAITING HUMAN ACTION

**Type:** `checkpoint:human-action` with `gate="blocking"`

**What is blocked:** Plan 04's crypto round-trip test cannot run until `tests/fixtures/v1-bundle.rshape.txt` and `tests/fixtures/v1-bundle.fixture.ts` exist.

**Why it cannot be Claude-automated:** AES-GCM 256 uses a random 16-byte salt + 12-byte IV per encryption (`public/legacy/js/crypto.js:56-57`). A Claude-generated bundle would not byte-equal a v1.0-generated one, defeating the parity test. The test asserts v2.0 can DECRYPT a real v1.0 bundle — which requires capturing one from the running legacy app.

**What the user needs to do:** Follow the step-by-step procedure in `tests/fixtures/README.md` (also embedded in the plan's task 3.2 `<how-to-verify>` block):

1. Run `pnpm run dev` and open `http://localhost:5173/legacy/index.html` in a private browser window.
2. Create a profile with `name="Test Subject"`, `emoji="🌱"`, `color="#7c83ff"`, `pronouns="they/them"`.
3. Create one result with at least 3 enabled categories, 2 custom items, 1 hidden item.
4. Run Share with passphrase `test-passphrase-fixture-only`.
5. Save the armored output (BEGIN/v1/body/END) to `tests/fixtures/v1-bundle.rshape.txt`.
6. Capture the `EXPECTED_PAYLOAD` via a temporary `console.log(JSON.stringify(payload, null, 2))` near `encryptResult` in `public/legacy/js/app.js`.
7. Write `tests/fixtures/v1-bundle.fixture.ts` per the template in the plan task 3.2 action block.

**Resume signal:** After capture, the user types `approved`. Verification command:

```
test -f tests/fixtures/v1-bundle.rshape.txt && head -1 tests/fixtures/v1-bundle.rshape.txt | grep -c RELATIONSHAPE && test -f tests/fixtures/v1-bundle.fixture.ts && grep -c ARMORED tests/fixtures/v1-bundle.fixture.ts && grep -c PASSPHRASE tests/fixtures/v1-bundle.fixture.ts && grep -c EXPECTED_PAYLOAD tests/fixtures/v1-bundle.fixture.ts && pnpm run typecheck
```

## Next steps in Wave 4

Once task 3.2 is approved, plans 04 (crypto), 05 (data + i18n), 06 (storage), and 07 (design) in Wave 4 become unblocked:

- **Plan 04 (crypto):** Imports `ARMORED`, `PASSPHRASE`, `EXPECTED_PAYLOAD` from `v1-bundle.fixture.ts` and asserts decrypt → deep-equal, re-encrypt → round-trip, envelope byte shape.
- **Plan 06 (storage):** Imports `V1_LOCALSTORAGE_BLOB` from this plan and asserts Zustand state hydrated from it matches `V1_LOCALSTORAGE_PARSED`.
- **Plans 05, 07:** Independent of fixtures; can begin in parallel.

## Self-Check: PASSED

Verifications performed in this worktree:

- `tests/setup.ts` exists — confirmed.
- `tests/fixtures/v1-localstorage.fixture.ts` exists — confirmed.
- `tests/fixtures/README.md` exists — confirmed.
- Commit `a510776` exists on branch `worktree-agent-ab33af2fe88ea0f95` — confirmed (`git log` shows `feat(01-03): scaffold tests/ with v1.0 localStorage fixture, setup, regen README`).
- `pnpm run typecheck` exits 0 — confirmed.
- No tracked-file deletions in the task 3.1 commit — confirmed.
