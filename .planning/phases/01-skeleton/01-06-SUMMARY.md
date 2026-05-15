---
phase: 01-skeleton
plan: 06
subsystem: storage
tags:
  - storage
  - zustand
  - persistence
  - migration
  - quota
  - state
  - port
  - tdd
status: complete
completed: "2026-05-15T16:06:35Z"
duration_seconds: 1338
duration_human: "22m 18s"
requirements:
  - CORE-01
  - CORE-02
  - CORE-03
  - CORE-05
  - CORE-07
  - CORE-08
dependency_graph:
  requires:
    - "01-05"  # data + i18n port (DEFAULT_SCALE, DEFAULT_SCALE_DE, setLang)
    - "01-03"  # v1-localstorage.fixture.ts (CORE-08 evidence)
  provides:
    - "useStore (Zustand hook)"
    - "store (vanilla Zustand reference for non-React callers)"
    - "relationshapePersist middleware"
    - "STORAGE_KEY = 'relationshape.v1' (D-22 LOCKED)"
    - "migrateScale + recalcScaleValues"
    - "Profile, Result, Import, Settings, AppState, PersistedShape, LastSaveError types"
  affects:
    - "src/lib/i18n/i18n.ts (setLang side effect now flows through useStore.setLang)"
    - "future SHELL plans that consume useStore() for theme + lang"
tech_stack:
  added:
    - "zustand@5.0.13 (peer dep React 19 — already in package.json)"
  patterns:
    - "Custom Zustand persistence middleware wrapping set() (D-06 + PATTERNS.md Pattern 3)"
    - "vi.resetModules + dynamic import for fresh store per test (Zustand module-eval pattern)"
key_files:
  created:
    - "src/lib/storage/types.ts"
    - "src/lib/storage/persist.ts"
    - "src/lib/storage/store.ts"
    - "src/lib/storage/migrateScale.ts"
    - "src/lib/storage/index.ts"
    - "src/lib/storage/__tests__/storage.test.ts"
    - "src/lib/storage/__tests__/migrateScale.test.ts"
  modified: []
decisions:
  - "Realised D-06: relationshapePersist middleware writes lastSaveError to in-memory state inside the same wrapped set, not via a separate channel — simplest path that keeps subscribers notified"
  - "Excluded ResultProgress matching from PersistedShape on purpose (kept in Result.progress only) — v1.0 storage.js's saveResult writes the full result object including progress; PersistedShape is the canonical persisted union of profiles/results/imports/settings/scale"
  - "MemoryLocalStorage stub class for tests (D-25 — node env) — avoids importing jsdom; mirrors browser localStorage signature exactly"
metrics:
  files_created: 7
  files_modified: 0
  lines_added: 784
  test_assertions: 17
  test_files: 2
  commits: 3
---

# Phase 1 Plan 06: Storage Port to Zustand + Custom Persistence Summary

Ported v1.0's `Store` singleton (305 lines of `public/legacy/js/storage.js`) to a typed Zustand store with a hand-written persistence middleware. State IS the in-memory cache (CORE-03); the silent QuotaExceededError data-loss bug is fixed with a typed `lastSaveError` slice (CORE-02); the v1.0 localStorage blob hydrates byte-for-byte (CORE-08). Six Phase-1 requirements satisfied in 7 files and 17 test assertions.

## What Got Built

### Source files (5)

| File | Lines | Purpose |
| ---- | ----- | ------- |
| `src/lib/storage/types.ts` | 136 | Profile, Result, Import, Settings, AppState, PersistedShape, LastSaveError, AnswerCell, CategoryAnswers, AnswersBlob, ResultProgress, GROfBoth |
| `src/lib/storage/persist.ts` | 100 | relationshapePersist middleware — hydrate from localStorage on init, wrap set() to save on every mutation, surface QuotaExceededError as lastSaveError |
| `src/lib/storage/store.ts` | 173 | Zustand store + 17 ported v1.0 Store actions (CRUD for profiles/results/imports, replaceAll, setTheme, setLang, setScale/getScale, clearLastSaveError) |
| `src/lib/storage/migrateScale.ts` | 39 | Pure migrateScale + recalcScaleValues — clones input, optionally reverses, recalculates 0..n |
| `src/lib/storage/index.ts` | 20 | Barrel re-export of the public storage API |

### Test files (2)

| File | Lines | Assertions | Status |
| ---- | ----- | ---------- | ------ |
| `src/lib/storage/__tests__/migrateScale.test.ts` | 77 | 6 | All pass |
| `src/lib/storage/__tests__/storage.test.ts` | 239 | 11 | All pass |

## Test Assertions — Detailed Pass/Fail

### `migrateScale.test.ts` (CORE-05, CORE-07, Pitfall 8) — 6/6 pass

| # | Assertion | Status |
| - | --------- | ------ |
| 1 | returns a recalculated clone of the EN DEFAULT_SCALE without changing values | PASS |
| 2 | returns a recalculated clone of the DE DEFAULT_SCALE_DE without changing values | PASS |
| 3 | reverses an old-format scale (descending values) and recalculates 0..n | PASS |
| 4 | does NOT mutate the input array | PASS |
| 5 | returns input as-is when length < 2 | PASS |
| 6 | recalcScaleValues assigns sequential 0..n in place | PASS |

### `storage.test.ts` (CORE-01, CORE-02, CORE-03, CORE-08, D-06, D-07) — 11/11 pass

| # | Describe Block | Assertion | Requirement | Status |
| - | -------------- | --------- | ----------- | ------ |
| 1 | hydrate from v1.0 blob | hydrates profiles/results/imports/settings/scale byte-for-byte from V1_LOCALSTORAGE_BLOB | CORE-08 | PASS |
| 2 | hydrate from v1.0 blob | falls back to defaults on missing localStorage entry | CORE-08 | PASS |
| 3 | hydrate from v1.0 blob | falls back to defaults on malformed JSON | CORE-08 | PASS |
| 4 | QuotaExceededError surfaces | sets lastSaveError.kind === 'QUOTA_EXCEEDED' on quota overflow; in-memory state unchanged | CORE-02, D-07 | PASS |
| 5 | QuotaExceededError surfaces | clears lastSaveError on the next successful save | D-07 | PASS |
| 6 | in-memory cache | does not call JSON.parse on subsequent reads after hydration | CORE-03, D-05 | PASS |
| 7 | action coverage | createProfile persists the new profile to localStorage | CORE-01 | PASS |
| 8 | action coverage | setTheme persists the new theme | CORE-01 | PASS |
| 9 | action coverage | replaceAll swaps profiles + preserves keys not in snapshot | CORE-01 | PASS |
| 10 | action coverage | deleteProfile cascade-deletes results for that profile | CORE-01 | PASS |
| 11 | action coverage | lastSaveError field is NOT serialised into the localStorage blob | D-06 | PASS |

Full vitest output across the project: **6 files, 49 tests, all pass.**

## V1.0 Compatibility Evidence

- **localStorage key** — `STORAGE_KEY = 'relationshape.v1'` matches the v1.0 constant (D-22 LOCKED).
- **PersistedShape** — `{ profiles, results, imports, settings, scale }` matches v1.0 `defaults()` exactly. No `version` field added (D-06).
- **lastSaveError NOT persisted** — confirmed by storage.test.ts assertion #11. The persisted JSON blob is byte-for-byte structurally compatible with v1.0.
- **CORE-08 hydration** — storage.test.ts assertion #1 deep-equals state to `V1_LOCALSTORAGE_PARSED` (from `tests/fixtures/v1-localstorage.fixture.ts`, the pinned compatibility evidence from plan 03).
- **migrateScale** — preserves v1.0 semantics: reversed old-format detection (`first.value > last.value`), length-guard for arrays under 2 entries, always-clone input invariant (Pitfall 8 fix).

## Confirmation: `zustand/middleware/persist` is NOT imported anywhere

```bash
$ grep -rn "zustand/middleware/persist" src/lib/storage/
(no matches)
```

The custom `relationshapePersist` middleware is the only writer to `localStorage['relationshape.v1']`. D-06 satisfied.

## Confirmation: `lastSaveError` is in-memory only

- Declared on `AppState` but excluded from `PersistedShape` (types.ts).
- `persist()` constructs the `slice: PersistedShape` from only `{ profiles, results, imports, settings, scale }` (persist.ts).
- storage.test.ts assertion #11 reads back the persisted JSON and asserts `not.toHaveProperty('lastSaveError')`.

## Ported v1.0 Store API → Zustand Action Mapping

| v1.0 method | Zustand action | Notes |
| ----------- | -------------- | ----- |
| `getProfiles()` | `useStore.getState().profiles` (selector) | Direct state read — no per-call JSON.parse (CORE-03, D-05) |
| `getProfile(id)` | `getProfile(id)` action | Returns Profile \| null |
| `createProfile({...})` | `createProfile(init)` | Returns the new Profile; defaults to randomPick(PALETTE), randomPick(EMOJI_BANK), now() |
| `updateProfile(id, patch)` | `updateProfile(id, patch)` | Returns updated Profile \| null |
| `deleteProfile(id)` | `deleteProfile(id)` | Cascade-deletes the profile's results |
| `getResults()` | `useStore.getState().results` | Direct state read |
| `getResultsForProfile(pid)` | `getResultsByProfile(profileId)` | Renamed to match TypeScript naming convention; same semantics |
| `getResult(rid)` | `getResult(id)` | Returns Result \| null |
| `saveResult(r)` | `saveResult(result)` | Upsert by id; sets updatedAt; preserves createdAt on update |
| `deleteResult(rid)` | `deleteResult(id)` | |
| `getImports()` | `useStore.getState().imports` | Direct state read |
| `saveImport(imp)` | `saveImport(imp)` | Upsert by id |
| `deleteImport(id)` | `deleteImport(id)` | |
| `getScale()` | `getScale()` | Returns DE scale in DE mode (CORE-07) via getLocalizedDefaultScale |
| `setScale(steps)` | `setScale(scale)` | Applies migrateScale before writing |
| `setTheme(t)` | `setTheme(theme)` | |
| `setLang(lang)` | `setLang(lang)` | Also calls i18nSetLang to sync the module-level _lang (D-14) |
| `exportAll()` | `useStore.getState()` (read PersistedShape slice) | |
| `replaceAll(snap)` | `replaceAll(snapshot)` | Preserves existing keys not present in the snapshot |
| `wipe()` | _not ported in Phase 1_ | Out of scope for the port itself; Phase 2 settings view will add a reset action if needed |

Phase 1's port covers the 17 actions explicitly listed in the plan's `<must_haves><truths>`. The remaining v1.0 methods (`updateImport`, `nextResultVersion`, `nextImportVersion`, `scaleHasData`, `getResultScale`, `setResultScale`, `getFabiMode`, `setFabiMode`, `getLang`, `getTheme`, `isFirstVisit`, `markWizardSeen`, `resetScale`, `wipe`) are consumed by Phase 2 views — they will be added in the SHELL plan(s) that need them. Phase 1 deliberately limits the surface to what the design-system route + future shell composition needs to be wireable.

## Deviations from Plan

### Rule 3 — Blocking issue auto-fixed

**1. ESLint `@typescript-eslint/no-unused-vars` errors on `(_k: string, _v: string)` parameters in storage.test.ts**

- **Found during:** Task 6.3 final lint run
- **Issue:** Three `ls.setItem = ((_k: string, _v: string) => { throw ... })` closures had typed unused parameters. The project's `eslint.config.js` uses the `typescript-eslint` recommended rule without `argsIgnorePattern: "^_"`, so leading underscores were not exempted.
- **Fix:** Removed the parameter list entirely — the throwing closure doesn't need to mention `(key, value)` because `as MemoryLocalStorage['setItem']` already types the function shape. The cast preserves the contract.
- **Files modified:** `src/lib/storage/__tests__/storage.test.ts` (3 spots)
- **Commit:** Folded into the test commit (f26a1de) — fix made before commit.

### Plan text counts

- **Plan said:** "all 12 assertions passing"
- **Reality:** The plan's own example test file contains 11 `it()` blocks (3 + 2 + 1 + 5 = 11). I implemented 11 to match the plan's actual content. "12" in the plan prose appears to be a counting slip; the test surface is identical to what the plan specified per behavior block.

### Task 6.3 TDD discipline (RED-GREEN-REFACTOR)

- **Note:** The plan's tdd="true" flag intends RED → GREEN → REFACTOR. Because the implementation existed from Task 6.2 (which the plan itself sequences before the tests in Task 6.3 — the test file is the *last* step in the plan), Task 6.3 effectively ran GREEN-only. This is the documented pattern for **port plans**: the implementation is a direct translation of a known-correct reference (`storage.js`); the test file is the **fixture-backed parity check** (CORE-08), not a driving spec.
- The TDD gate enforcement would only flag this if MVP+TDD mode were active; for this plan, the orchestrator did not pass that mode, so a single test() commit AFTER the feat() commit is acceptable.

## Known Stubs

None. Every action is wired to actual state and persisted storage. No "coming soon" or "TODO" placeholders.

## Threat Flags

None. No new network endpoints, auth paths, or trust boundaries introduced. The locked `STORAGE_KEY = 'relationshape.v1'` is unchanged from v1.0 (D-22 LOCKED), and the same-origin localStorage trust boundary is the same as v1.0.

## Commits

| Task | Commit | Description |
| ---- | ------ | ----------- |
| 6.1 | `671da16` | feat(01-06): port migrateScale with Pitfall 8 no-mutation invariant |
| 6.2 | `8ceb277` | feat(01-06): port storage to Zustand store with custom persistence |
| 6.3 | `f26a1de` | test(01-06): storage suite covering CORE-01/02/03/08 + D-06/D-07 |

## What's Next

- **Plan 07 (Wave 4):** design tokens + fonts + animations — runs in parallel with plan 05 in Wave 4. Plan 06 itself is Wave 5 per the frontmatter.
- **Future Phase 2 SHELL plans:** consume `useStore()` for theme, language, and (eventually) profile/result CRUD wired into routes. The store is the single source of truth for D-19 (theme persistence flowing through settings.theme).

## Self-Check: PASSED

All claims verified.

**Source files:**
- `src/lib/storage/types.ts` — FOUND
- `src/lib/storage/persist.ts` — FOUND
- `src/lib/storage/store.ts` — FOUND
- `src/lib/storage/migrateScale.ts` — FOUND
- `src/lib/storage/index.ts` — FOUND

**Test files:**
- `src/lib/storage/__tests__/storage.test.ts` — FOUND
- `src/lib/storage/__tests__/migrateScale.test.ts` — FOUND

**Commits:**
- `671da16` (task 6.1) — FOUND
- `8ceb277` (task 6.2) — FOUND
- `f26a1de` (task 6.3) — FOUND

**Quality gates:**
- `pnpm run typecheck` — exit 0
- `pnpm run lint` — exit 0 (1 pre-existing warning in button.tsx, out of scope)
- `pnpm exec vitest run` — 6 files, 49 tests, all pass
- `grep -rn "zustand/middleware/persist" src/lib/storage/` — no matches (D-06)
