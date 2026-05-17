---
phase: 04
slug: port-compare-page
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-17
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 + React Testing Library 16.3.2 + jsdom 29.1.1 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | D-03 | — | N/A | unit | `npm test -- --run src/components/__tests__/RsCompareTile.test.tsx` | ✅ (created in 04-01-02) | ⬜ |
| 04-01-02 | 01 | 1 | D-03 | — | N/A | unit | `npm test -- --run src/components/__tests__/RsCompareTile.test.tsx` | ✅ | ⬜ |
| 04-02-01 | 02 | 1 | D-05, D-06 | — | N/A | unit | `npm test -- --run src/components/__tests__/RsCategoryCard.test.tsx` | ✅ (created in 04-02-02) | ⬜ |
| 04-02-02 | 02 | 1 | D-05, D-06 | — | N/A | unit | `npm test -- --run src/components/__tests__/RsCategoryCard.test.tsx` | ✅ | ⬜ |
| 04-02-03 | 02 | 1 | D-06 | — | N/A | unit | `npm test -- --run src/components/__tests__/RsCategoryCard.test.tsx` | ✅ | ⬜ |
| 04-03-01 | 03 | 2 | D-03 | — | N/A | integration | `npm test -- --run src/components/__tests__/CompareWithSomeone.test.tsx` | ✅ (created in 04-03-02) | ⬜ |
| 04-03-02 | 03 | 2 | D-03 | — | N/A | integration | `npm test -- --run src/components/__tests__/CompareWithSomeone.test.tsx` | ✅ | ⬜ |
| 04-04-01 | 04 | 3 | D-01, D-02, D-05, D-06, D-08, D-09 | — | XSS escape on result.subject (RESULT-07) | integration | `npm test -- --run src/routes/__tests__/Result.test.tsx` | ✅ (updated in 04-04-02) | ⬜ |
| 04-04-02 | 04 | 3 | D-01, D-02, D-05, D-06, D-08, D-09 | — | XSS escape on result.subject (RESULT-07) | integration | `npm test -- --run src/routes/__tests__/Result.test.tsx` | ✅ | ⬜ |
| 04-05-01 | 05 | 2 | D-04, D-05, D-06, D-07 | — | N/A | integration | `npm test -- --run src/routes/__tests__/Compare.test.tsx` | ✅ (updated in 04-05-02) | ⬜ |
| 04-05-02 | 05 | 2 | D-04, D-05, D-06, D-07 | — | N/A | integration | `npm test -- --run src/routes/__tests__/Compare.test.tsx` | ✅ | ⬜ |

**File Exists notes:** Each component task (04-01-01, 04-02-01, 04-03-01) creates the source file; the immediately-following test task (04-01-02, 04-02-02, 04-03-02) creates the test file. For Plans 04 and 05, the existing `Result.test.tsx` and `Compare.test.tsx` are modified in place by the second task. All test infrastructure (Vitest, RTL, jsdom) is pre-existing — no Wave 0 install required.

**Task 04-02-03** (Fabi-mode SummaryCells port) is added per checker feedback Blocker #4; existing test file `RsCategoryCard.test.tsx` is extended in the same task.

---

## Wave 0 Requirements

Existing Vitest + RTL + jsdom infrastructure covers all phase requirements. No Wave 0 install required. `wave_0_complete: true`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Result page visual parity vs Screenshot 1 | D-01, D-02 | Screenshot comparison is not automated | Open `/result/<id>`, verify header (Back / avatar / title with subtitle / Map settings / Continue editing / Share), Compare-with section, cat-card grid; no inline Spider/drilldown |
| Compare page visual parity vs Screenshot 2 | D-04, D-05 | Screenshot comparison is not automated | Open `/compare?ids=a,b`, verify chips, datasets ≥2, cat-grid with `Add more categories` (when own-result selected), `.is-empty` opacity rule |
| Deep-link `:catId` opens CategoryModal | D-01 | Modal open behavior across RAF + router | Navigate to `/result/<id>/<catId>`, modal opens on mount |
| Import… tile navigates to /import | D-03 | Visual flow | Click Import… tile on Result page → URL becomes `/import` |
| D-09 store invariant | D-09 | Diff is a phase-level check, not per-task | After phase complete, run `git diff --stat src/lib/storage/` against the phase base — must be empty |
| D-08 i18n key presence | D-08 | Counts the 10 required keys remain in en.ts/de.ts | `grep -E "compare_with\|compare_own_maps\|compare_imports_title\|result_last_edited\|btn_import_map\|btn_add_categories\|no_compare\|updated\|imported_on\|answers" src/lib/i18n/en.ts \| wc -l` returns ≥ 10; same for de.ts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
