---
phase: 01-skeleton
plan: 05
subsystem: data, i18n
tags: [typescript, as-const, translations, type-derivation, port, data-module, i18n, en, de]

requires:
  - phase: 01-skeleton
    provides: "Wave 1 toolchain (tsconfig with strict mode + noUncheckedIndexedAccess, vitest, vite, path alias @/* → src/*)"

provides:
  - "Content-frozen TS port of v1.0 data.js (CATEGORIES, DEFAULT_SCALE, SPIDER_AXES, CATEGORY_GROUPS, FILE_FORMAT) with `as const` on every export — CORE-05"
  - "Derived type unions (CategoryId, ScaleStep, SpiderAxisId, Lang, MutableScaleStep) via typeof X[number] — D-13/D-21"
  - "Custom typed i18n module (EN, DE, t, getLang, setLang, getLocalizedDefaultScale, DEFAULT_SCALE_DE, availableLangs) — CORE-06 / D-12"
  - "Compile-time enforcement that DE has every EN translation key via Record<TranslationKey, string> — D-13"
  - "342-key EN/DE translation maps verbatim from v1.0 (single source of truth for TranslationKey)"

affects: [storage, store, useLang, useTheme, profile, questionnaire, result, share, settings, design-system]

tech-stack:
  added: [] # nothing new — uses Wave 1 toolchain
  patterns:
    - "as const with `typeof X[number]['field']` for compile-time ID unions"
    - "Record<TranslationKey, string> compile-checked DE map"
    - "Module-level lang state mirrors v1.0; persistence deferred to Zustand store (plan 06)"
    - "Detection chain: localStorage settings.lang → navigator.language → 'en' (D-14)"

key-files:
  created:
    - src/lib/data/data.ts
    - src/lib/data/types.ts
    - src/lib/data/index.ts
    - src/lib/data/__tests__/data.test.ts
    - src/lib/i18n/en.ts
    - src/lib/i18n/de.ts
    - src/lib/i18n/i18n.ts
    - src/lib/i18n/index.ts
    - src/lib/i18n/__tests__/i18n.test.ts
  modified: []

key-decisions:
  - "EN translation key count is 342 (verified against v1.0); RESEARCH.md's 304 estimate was wrong. Test asserts 342, the actual source-of-truth count."
  - "Persistence to localStorage NOT performed inside setLang — moved to Zustand store action (plan 06) so every persistence path goes through the same custom middleware (D-06). Mirrors single-persistence-path invariant."
  - "DEFAULT_SCALE_DE lives in src/lib/i18n/i18n.ts (not data.ts) — data.ts is English source of truth; localisation lives in i18n/."
  - "isLang() type guard centralises 'en' | 'de' runtime validation in both detectLanguage and setLang."

patterns-established:
  - "Content-frozen const exports with `as const` — Pattern reused by future ported data modules"
  - "Test pattern: shape sanity (no-duplicate-IDs, field-presence, color-format, length-parity) for ported content modules"
  - "Test pattern: key-set parity check between locale maps + key-count regression test"
  - "Verbatim port discipline: legacy source quoted EXACTLY, only quote-style and `as const` differ"

requirements-completed: [CORE-05, CORE-06]

duration: ~12 min
completed: 2026-05-15
---

# Phase 1 Plan 05: data.ts + i18n.ts Port Summary

**Content-frozen TS port of v1.0 data.js (5 exports, 875 lines) and i18n.js (342-key EN+DE translation maps + custom 120-line t/getLang/setLang/getLocalizedDefaultScale runtime), with `Record<TranslationKey, string>` compile-time parity enforcement.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-15T15:00:00Z (approx)
- **Completed:** 2026-05-15T15:11:51Z
- **Tasks:** 2 / 2
- **Files created:** 9
- **Files modified:** 0

## Accomplishments

- **CORE-05 satisfied:** `src/lib/data/data.ts` (875 lines, 6 `as const` exports) mirrors v1.0 `data.js` content byte-for-byte. 30 categories with bilingual `items` / `deItems`, 7-step DEFAULT_SCALE, 12 SPIDER_AXES, 5 CATEGORY_GROUPS, FILE_FORMAT envelope (magic `RSHAPE1` / version `1`).
- **CORE-06 satisfied:** `src/lib/i18n/en.ts` (443 lines) + `de.ts` (457 lines) hold 342 verbatim translation keys each, with section-header comments preserved for readable diffs against v1.0. DE is typed `Record<TranslationKey, string>` so any future omission is a TS compile error (D-13).
- **D-12 satisfied:** Custom 120-line `t()` port — no `react-i18next` dependency. Detection chain mirrors v1.0 exactly: localStorage `settings.lang` → `navigator.language` prefix → `'en'` (D-14).
- **D-13/D-21 satisfied:** Type unions (`CategoryId`, `ScaleStep`, `SpiderAxisId`, `Lang`, `MutableScaleStep`) derived at compile time via `(typeof CATEGORIES)[number]['id']` and friends; no hand-maintained literal unions.
- **16 Vitest tests pass:** 7 data shape assertions (CORE-05) + 9 i18n assertions including 342-key parity (CORE-06).

## Task Commits

1. **Task 5.1: Port data.js → src/lib/data/{data,types,index}.ts + tests** — `8606073` (feat)
2. **Task 5.2: Port i18n.js → src/lib/i18n/{en,de,i18n,index}.ts + tests** — `4766bf9` (feat)

## Files Created/Modified

- `src/lib/data/data.ts` (875 lines) — Verbatim port of `public/legacy/js/data.js`; 5 named exports with `as const`
- `src/lib/data/types.ts` — `CategoryId`, `ScaleStep`, `SpiderAxisId`, `Lang`, `MutableScaleStep`; derived types
- `src/lib/data/index.ts` — Barrel re-export of values + types
- `src/lib/data/__tests__/data.test.ts` — 7 shape-sanity assertions (CORE-05)
- `src/lib/i18n/en.ts` (443 lines) — 342 EN translation keys + `TranslationKey = keyof typeof EN`
- `src/lib/i18n/de.ts` (457 lines) — 342 DE translation keys typed `Record<TranslationKey, string>`
- `src/lib/i18n/i18n.ts` (149 lines) — `detectLanguage`, `getLang`, `setLang`, `t`, `availableLangs`, `getLocalizedDefaultScale`, `DEFAULT_SCALE_DE`
- `src/lib/i18n/index.ts` — Barrel re-export
- `src/lib/i18n/__tests__/i18n.test.ts` — 9 assertions (key parity, key count, EN/DE resolution, {var} interpolation incl. numeric coercion, localised scale, runtime guard)

## Verification

```
$ wc -l src/lib/data/data.ts src/lib/i18n/en.ts src/lib/i18n/de.ts src/lib/i18n/i18n.ts
  875 src/lib/data/data.ts
  443 src/lib/i18n/en.ts
  457 src/lib/i18n/de.ts
  149 src/lib/i18n/i18n.ts

$ node -e '... (parse legacy i18n.js TRANSLATIONS) ...'
EN keys: 342  |  DE keys: 342  |  Missing in DE: []  |  Missing in EN: []

$ pnpm run typecheck
  (exit 0)

$ pnpm run lint
  (exit 0 — pre-existing button.tsx fast-refresh warning is not from this plan)

$ pnpm run test
  Test Files  2 passed (2)
  Tests       16 passed (16)
```

## Decisions Made

- **342-key baseline, not 304** — The plan's acceptance criterion stated 304 keys (RESEARCH.md estimate). Direct evaluation of `public/legacy/js/i18n.js` `TRANSLATIONS.en` returns 342 keys. CORE-06 requires key-for-key parity with v1.0, so the truth is the source file, not the documented estimate. Test asserts 342; documented as a deviation below.
- **Persistence deferred** — v1.0's `setLang` writes to `localStorage.settings.lang` directly. The TS port intentionally omits this side effect; the Zustand store action in plan 06 will own both module-level `_lang` update and persistence. This preserves D-06's single-persistence-path invariant and matches the PATTERNS.md note.
- **DEFAULT_SCALE_DE in `i18n/`, not `data/`** — Honours the design principle that `data.ts` is the English source of truth for the upstream CC BY-NC 4.0 questionnaire; localisations live with the localisation module.
- **Test probe key swap** — Plan suggested `welcome_title` to assert EN ≠ DE. Actual v1.0 has identical `welcome_title` ("Relationshapes") in both locales (it's the brand name). Swapped to `nav_about` (EN "About" / DE "Über"), which is unambiguously different.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Plan key-count baseline (304) was wrong — actual v1.0 baseline is 342**
- **Found during:** Task 5.2 (i18n port) — pre-port count verification
- **Issue:** Plan and RESEARCH.md document the v1.0 EN translation map as having 304 keys. Programmatic evaluation of `TRANSLATIONS.en` from `public/legacy/js/i18n.js` returns 342 keys. CORE-06 requires key-for-key parity; preserving the actual count is required, not the documented one.
- **Fix:** Test asserts `Object.keys(EN).length === 342` (matches actual v1.0). en.ts contains all 342 keys verbatim; de.ts contains the corresponding 342 keys. Key-set parity test confirms `Object.keys(EN).sort() === Object.keys(DE).sort()`.
- **Files modified:** `src/lib/i18n/en.ts`, `src/lib/i18n/de.ts`, `src/lib/i18n/__tests__/i18n.test.ts`
- **Verification:** `pnpm run test` passes; node parity probe (`Missing in DE: []` / `Missing in EN: []`) confirms.
- **Committed in:** `4766bf9` (Task 5.2 commit)

**2. [Rule 1 — Bug] Plan test probe assumed `welcome_title` differs between EN and DE; in v1.0 it does not**
- **Found during:** Task 5.2 (i18n port)
- **Issue:** Plan's `t() resolves a DE key…` test was `expect(deVal).not.toBe(enVal)` against key `welcome_title`. Actual v1.0 has `welcome_title: "Relationshapes"` in both EN and DE (brand name). Test would have failed.
- **Fix:** Swapped probe key to `nav_about` (EN "About" / DE "Über"), which differs between locales. Test now also asserts the exact expected EN+DE strings for stronger coverage.
- **Files modified:** `src/lib/i18n/__tests__/i18n.test.ts`
- **Verification:** Test passes; assertion verifies both unequal-locales semantics and exact string match.
- **Committed in:** `4766bf9` (Task 5.2 commit)

**3. [Rule 3 — Blocking] Unused `LANGS` constant flagged by `@typescript-eslint/no-unused-vars`**
- **Found during:** Task 5.2 (post-implementation lint)
- **Issue:** I introduced `const LANGS = ['en', 'de'] as const` solely to derive `type AvailableLang = (typeof LANGS)[number]`. ESLint flagged `LANGS` as assigned-but-only-used-as-a-type. `pnpm run lint` failed.
- **Fix:** Removed the constant; `isLang()` now returns `value is Lang` directly (the existing `Lang` import already covers `'en' | 'de'`).
- **Files modified:** `src/lib/i18n/i18n.ts`
- **Verification:** `pnpm run lint` exits 0 (one pre-existing button.tsx warning is unrelated).
- **Committed in:** `4766bf9` (Task 5.2 commit)

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking)
**Impact on plan:** No scope creep. All three fixes preserve plan intent — CORE-05/CORE-06 parity is achieved against the actual v1.0 source rather than the documented estimate; the test still verifies localised resolution, just via a key that actually differs; lint blocker resolved without API change.

## Issues Encountered

- None beyond the three deviations above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Plans 06 and 07 (parallel Wave 4 plans — `storage.ts` + `crypto.ts` ports) can now import:

- `CATEGORIES`, `DEFAULT_SCALE`, `SPIDER_AXES`, `CATEGORY_GROUPS`, `FILE_FORMAT` from `@/lib/data` (or `@/lib/data/data` directly)
- `CategoryId`, `ScaleStep`, `SpiderAxisId`, `Lang`, `MutableScaleStep` types from `@/lib/data`
- `EN`, `DE`, `TranslationKey`, `t`, `getLang`, `setLang`, `availableLangs`, `getLocalizedDefaultScale`, `DEFAULT_SCALE_DE` from `@/lib/i18n`

Plan 06 (storage / Zustand store) will:
- Use `DEFAULT_SCALE` for the initial scale slice
- Use `Lang` type for `settings.lang`
- Wire `i18n.setLang()` into the language store action so module-level `_lang` stays in sync with the Zustand `settings.lang` slice
- Use `getLocalizedDefaultScale` from `migrateScale` when migrating un-modified English defaults to DE in DE mode

Plan 07 (crypto port) does not depend on this plan but shares the Wave 1 toolchain.

## Self-Check: PASSED

- File existence: 9 / 9 created files verified via `test -f` (all `src/lib/data/*` and `src/lib/i18n/*` exist on disk).
- Commit hashes: `8606073` and `4766bf9` both present in `git log` on `worktree-agent-a1684cd213eec07ea`.
- Tests: 16 / 16 passing (`pnpm run test`).
- Typecheck: passes (`pnpm run typecheck` exit 0).
- Lint: passes (`pnpm run lint` exit 0; one pre-existing unrelated warning from button.tsx).
- Key parity: 342 EN keys === 342 DE keys (runtime + compile-time enforced).

---
*Phase: 01-skeleton*
*Completed: 2026-05-15*
