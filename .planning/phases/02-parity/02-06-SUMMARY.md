---
phase: "02"
plan: "02-06"
subsystem: "share-import-compare"
tags: [crypto, share, import, compare, aes-gcm, fixture-regression]
dependency_graph:
  requires: [02-05-PLAN.md]
  provides: [Share.tsx, Import.tsx, Compare.tsx, payload.ts]
  affects: [router.tsx, _placeholders.tsx, en.ts, de.ts]
tech_stack:
  added: [payload.ts, Share.tsx, Import.tsx, Compare.tsx]
  patterns: [WebCrypto round-trip, payload envelope, imperative dialog, URL-driven compare]
key_files:
  created:
    - src/lib/share/payload.ts
    - src/lib/share/__tests__/payload.test.ts
    - src/routes/Share.tsx
    - src/routes/Import.tsx
    - src/routes/Compare.tsx
    - src/routes/__tests__/Share.test.tsx
    - src/routes/__tests__/Import.test.tsx
    - src/routes/__tests__/Import.fixture.test.tsx
    - src/routes/__tests__/Compare.test.tsx
  modified:
    - src/lib/i18n/en.ts
    - src/lib/i18n/de.ts
    - src/router.tsx
    - src/routes/_placeholders.tsx
    - src/__tests__/router.routes.test.tsx
decisions:
  - Share uses single passphrase input (no confirm) per plan spec — simpler UX than v1.0
  - sharedAt field added to SharePayload for v1.0 byte-shape parity (SHARE-04)
  - exactOptionalPropertyTypes: use conditional spread pattern throughout payload.ts
  - Compare useMemo uses idsParam string (not truncated array) as dep to satisfy eslint rules
  - unlock_failed i18n key pre-existed with value "Wrong password or corrupted data." — reused
metrics:
  duration: "~65 minutes"
  completed: "2026-05-16"
  tasks_completed: 7
  tasks_total: 7
  files_created: 9
  files_modified: 5
---

# Phase 2 Plan 6: Share / Import / Compare — encrypted bundle round-trip + v1.0 fixture regression

## One-liner

AES-GCM encrypted share flow with passphrase, Blob download, file-or-paste import with generic error dialog, v1.0 fixture regression SHARE-04, and URL-driven 4-dataset Compare composing plan-5 chart components.

## Objective

Replace the Share / Import / Compare placeholders with real routes. Share encrypts a payload via Phase 1's `encryptResult` and presents the armored bundle for copy + `.rshape.txt` download. Import accepts paste OR file upload, decrypts, validates `payload.type === "relationshape-result"`, persists to the imports pool via `saveImport`, and navigates to Compare. SHARE-04 regression: load `tests/fixtures/v1-bundle.rshape.txt` with its known passphrase, decrypt, deep-equal against `EXPECTED_PAYLOAD`. Compare reads `?ids=`, enforces ≤4 datasets, maps `imp:` prefix to import pool, and composes plan-5 chart components.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 02-06-01 | payload.ts + unit tests | c4b70d2 | src/lib/share/payload.ts, src/lib/share/__tests__/payload.test.ts |
| 02-06-02 | i18n keys (EN + DE) | c18200d | src/lib/i18n/en.ts, src/lib/i18n/de.ts |
| 02-06-03 | Share.tsx | 6a62f67 | src/routes/Share.tsx |
| 02-06-04 | Import.tsx | 5807e86 | src/routes/Import.tsx |
| 02-06-05 | Compare.tsx | 8066676 | src/routes/Compare.tsx |
| 02-06-06 | Router wiring + test updates | 9c27fae | src/router.tsx, _placeholders.tsx, router.routes.test.tsx |
| 02-06-07 | Test suite (all 4 test files) | 37d4439 | Share.test.tsx, Import.test.tsx, Import.fixture.test.tsx, Compare.test.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] exactOptionalPropertyTypes strict typing in payload.ts**
- **Found during:** Task 1 typecheck
- **Issue:** `buildSharePayload` and `payloadToImport` used direct optional property assignments that TS rejected with `exactOptionalPropertyTypes: true`
- **Fix:** Used conditional spread/assignment pattern (`if (p.pronouns !== undefined) imp.pronouns = p.pronouns`)
- **Files modified:** src/lib/share/payload.ts
- **Commit:** c4b70d2

**2. [Rule 2 - Missing] sharedAt field for v1.0 byte-shape parity**
- **Found during:** Task 1, reading v1.0 source (public/legacy/js/app.js:3301) and fixture
- **Issue:** The v1.0 payload includes `sharedAt: Date.now()` but the plan's `SharePayload` interface omitted it; EXPECTED_PAYLOAD in the fixture includes `sharedAt`
- **Fix:** Added optional `sharedAt?: number` to `SharePayload` and set it in `buildSharePayload`
- **Files modified:** src/lib/share/payload.ts
- **Commit:** c4b70d2

**3. [Rule 1 - Bug] eslint react-hooks/use-memo restriction on expression dependencies**
- **Found during:** Task 5 lint
- **Issue:** `useMemo(... , [truncated.join(','), ...])` rejected by eslint — method call not allowed as dependency
- **Fix:** Extracted `idsParam = params.get('ids') ?? ''` and used it as the dependency string
- **Files modified:** src/routes/Compare.tsx
- **Commit:** 8066676

**4. [Rule 1 - Bug] URL.createObjectURL stub broke URL constructor in jsdom**
- **Found during:** Task 7 test run — `URL is not a constructor`
- **Issue:** `vi.stubGlobal('URL', { createObjectURL: vi.fn() })` replaced the entire URL class including constructor
- **Fix:** Used `vi.spyOn(URL, 'createObjectURL')` and `vi.spyOn(URL, 'revokeObjectURL')` to stub only static methods
- **Files modified:** src/routes/__tests__/Share.test.tsx
- **Commit:** 37d4439

**5. [Rule 1 - Bug] unlock_failed i18n value mismatch**
- **Found during:** Task 7 test authoring
- **Issue:** Plan table said `"Wrong passphrase or corrupted bundle."` but `en.ts` already had `unlock_failed: 'Wrong password or corrupted data.'` from v1.0 parity
- **Fix:** Updated test to assert against the actual v1.0-ported string value
- **Files modified:** src/routes/__tests__/Import.test.tsx
- **Commit:** 37d4439

## Verification

- [x] `pnpm run typecheck` exits 0
- [x] `pnpm run test` exits 0 — 191 tests, 38 files (7 new files added)
- [x] `pnpm run build` exits 0 — 186 KB gzip (< 200 KB budget)
- [x] Share route encrypts with passphrase + shows textarea + copy + download
- [x] Import route decrypts paste/file, validates payload, saves to imports pool
- [x] SHARE-04 fixture regression: v1-bundle.rshape.txt decrypts to EXPECTED_PAYLOAD shape
- [x] Compare slices to ≤4 datasets, shows truncation toast, resolves `imp:` prefix
- [x] T-02-20: wrong passphrase → single generic `unlock_failed` dialog (no cause differentiation)
- [x] T-02-21: `parseImportPayload` validates type/name/answers/scale (tests cover each throw)
- [x] T-02-23: passphrase inputs have `type="password"` + `autoComplete="off"`

## Known Stubs

None. All routes wire real data.

## Threat Flags

None found beyond the plan's declared threat model (T-02-20 through T-02-24). No new network endpoints, auth paths, or file access patterns introduced beyond what's specified.

## Self-Check

**Created files exist:**
- src/lib/share/payload.ts — created
- src/routes/Share.tsx — created
- src/routes/Import.tsx — created
- src/routes/Compare.tsx — created
- src/routes/__tests__/Share.test.tsx — created
- src/routes/__tests__/Import.test.tsx — created
- src/routes/__tests__/Import.fixture.test.tsx — created
- src/routes/__tests__/Compare.test.tsx — created

**Commits exist:**
- c4b70d2, c18200d, 6a62f67, 5807e86, 8066676, 9c27fae, 37d4439

## Self-Check: PASSED
