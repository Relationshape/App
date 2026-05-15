---
phase: 02
slug: parity
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-15
populated: 2026-05-15
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `02-RESEARCH.md` § Validation Architecture (lines 1396–1488).
> The Per-Task Verification Map below is populated row-by-row from the 7 PLAN.md files.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 + Testing Library 16.3.2 (both already installed Phase 1) |
| **Config file** | `vitest.config.ts` (already configured; `environment: 'node'` default, component specs use `// @vitest-environment jsdom` directive) |
| **Quick run command** | `pnpm run test -- <file-glob>` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~12–15 s (Phase 1 baseline 5.91 s for 59 tests; Phase 2 adds ~30 spec files / ~120 tests) |
| **Phase gate command** | `pnpm run verify` (typecheck + lint + test + build + Phase 1 grep guard) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm run test -- <plan's spec glob>` — the affected plan's tests only (≤ 10 s)
- **After every plan wave:** Run `pnpm run test` — full Vitest suite (~12–15 s)
- **Before `/gsd-verify-work`:** `pnpm run verify` must be green (chained typecheck + lint + test + build + grep guard)
- **Max feedback latency:** 15 s (full suite)

---

## Per-Task Verification Map

One row per task with an `<automated>` verifier or grep-gate. Plan tasks without an `<automated>` block (pure config / lint-only / file-existence tasks) are not listed here — their acceptance criteria are still gated on `pnpm run typecheck` + `pnpm run lint`.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-03 | 01 | 1 | SHELL-05 | T-02-02 | Scroll PUSH only; no DOM injection (V5) | unit | `pnpm run test -- src/hooks/__tests__/useScrollToTop.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-01-06 | 01 | 1 | SHELL-03 (desktop) | T-02-01 | React text-node escaping for profile names in Nav (V5) | component | `pnpm run test -- src/__tests__/Nav.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-01-07 | 01 | 1 | SHELL-01, SHELL-02, SHELL-04 | T-02-01 | All 15 D-24 routes resolve; provider tree throws on unwrapped consumers | integration | `pnpm run test -- src/__tests__/router.routes.test.tsx src/__tests__/App.smoke.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-02-03 | 02 | 2 | SHELL-06 partial | T-02-06 | `useSwipe` axis-locked drag fires onLeft/onRight at threshold; touch-action: pan-y prevents Android scroll-vs-swipe (Pitfall 1) | unit | `pnpm run test -- src/lib/hooks/__tests__/useSwipe.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-02-04 | 02 | 2 | PROFILE-06 (type) | T-02-08 | Settings.ageConfirmed additive; no breaking change to Phase 1 store contract | regression | `pnpm run test -- src/lib/storage/__tests__/` | ✅ Phase 1 | ⬜ pending |
| 02-02-06 | 02 | 2 | PROFILE-06, PROFILE-05 | T-02-05, T-02-06 | AgeGate migrates legacy rs-age-confirmed (Pitfall 13); wizard persists wizardSeen | component | `pnpm run test -- src/components/__tests__/AgeGate.test.tsx src/components/__tests__/WizardHost.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-02-07 | 02 | 2 | SHELL-03 | T-02-06 | Sheet drawer closes on route change (Pitfall 10); Popover replaces details placeholder | component | `pnpm run test -- src/__tests__/Nav.test.tsx` | ✅ from 02-01 | ⬜ pending |
| 02-02-08 | 02 | 2 | SHELL-06 | T-02-04, T-02-06, T-02-07 | DialogHost serialises stacked dialogs (Pitfall 3); lastSaveError → toast wired in RootLayout | component | `pnpm run test -- src/__tests__/primitives.test.tsx src/__tests__/router.routes.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-03-01 | 03 | 3 | PROFILE-03 (EMOJI_BANK) | T-02-08 | EMOJI_BANK ≥ 70 entries copied verbatim from v1.0 (Pitfall 14); isLikelyEmoji guard for free-input | unit | `pnpm run test -- src/lib/data/__tests__/emoji.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-03-05 | 03 | 3 | PROFILE-07 (RICH_TEXT_KEYS) | T-02-09 | RICH_TEXT_KEYS typed satisfies readonly TranslationKey[]; only allow-listed keys flow through dangerouslySetInnerHTML | unit | `pnpm run test -- src/lib/i18n/__tests__/` | ✅ Phase 1 + new richText.test.ts | ⬜ pending |
| 02-03-07 | 03 | 3 | SHELL-01 (regression) | T-02-08 | Real Welcome/Home/ProfileEdit/ProfileDetail/Intro components replace placeholders; profile name renders via React text node | integration | `pnpm run test -- src/__tests__/router.routes.test.tsx` | ✅ from 02-01 | ⬜ pending |
| 02-03-08 | 03 | 3 | PROFILE-01..04, PROFILE-07 | T-02-08, T-02-10 | Profile CRUD round-trip through Zustand; XSS payload in profile name renders inert | component | `pnpm run test -- src/routes/__tests__/Profile.test.tsx src/routes/__tests__/Intro.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-04-02 | 04 | 4 | RESULT-02..05 (pure math) | T-02-14 | Pure helpers — no module side effects; no Store.getScale() callsites (verified by grep gate) | unit | `pnpm run test -- src/lib/charts/__tests__/math.test.ts src/lib/charts/__tests__/items.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-04-04 | 04 | 4 | QUEST-04 | T-02-15 | ScalePicker role=slider + aria-valuemin/max/now; touch-action: manipulation (Pitfall 2) | component | `pnpm run test -- src/components/__tests__/ScalePicker.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-04-09 | 04 | 4 | QUEST-01..05, QUEST-07, QUEST-08 | T-02-12, T-02-13 | Custom-items duplicate guard (Pitfall 4); template warning called before every mutation; DE gendered forms preserved | integration + component + unit | `pnpm run test -- src/routes/__tests__/CategoryOverview.test.tsx src/components/questionnaire/__tests__/ListMode.test.tsx src/components/questionnaire/__tests__/SingleMode.test.tsx src/lib/i18n/__tests__/de-gendered.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-05-03 | 05 | 5 | RESULT-02, RESULT-07 | T-02-16 | Spider emits SVG via JSX only; no dangerouslySetInnerHTML; malicious profile name renders as `&lt;script&gt;` — never `<script` | snapshot + component | `pnpm run test -- src/components/charts/__tests__/Spider.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-05-04 | 05 | 5 | RESULT-04, RESULT-07 | T-02-16 | ItemSpider emits SVG via JSX only; malicious custom item name renders as inert text | snapshot + component | `pnpm run test -- src/components/charts/__tests__/ItemSpider.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-05-05 | 05 | 5 | RESULT-03, RESULT-07 | T-02-16 | CategoryBars title attribute React-escaped; no onerror substring in output | snapshot + component | `pnpm run test -- src/components/charts/__tests__/CategoryBars.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-05-06 | 05 | 5 | RESULT-05, RESULT-07 | T-02-16 | Alignment uses static CATEGORY titles + categoryAverage values; XSS payload in dataset.name proven inert | snapshot + component | `pnpm run test -- src/components/charts/__tests__/Alignment.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-05-07 | 05 | 5 | RESULT-06 | T-02-18 | EnlargedSpider opens via shadcn Dialog; focus return on close (Radix-provided) | component | `pnpm run test -- src/components/charts/__tests__/EnlargedSpider.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-05-08 | 05 | 5 | RESULT-01, RESULT-07, QUEST-06 | T-02-16, T-02-17, T-02-18 | Result header + drill-down state; deep-link `/result/:id/:catId` sets activeAxis; XSS payload in result.subject renders inert | integration + component | `pnpm run test -- src/routes/__tests__/Result.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-06-01 | 06 | 6 | SHARE-01..04 (payload shape) | T-02-21 | parseImportPayload validates type/name/answers/scale; payloadToImport preserves srcVersion (SHARE-04 wire shape) | unit | `pnpm run test -- src/lib/share/__tests__/payload.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-06-06 | 06 | 6 | SHELL-01 (regression) | T-02-24 | Share/Import/Compare real components replace placeholders; routes resolve | integration | `pnpm run test -- src/__tests__/router.routes.test.tsx` | ✅ from 02-01 | ⬜ pending |
| 02-06-07 | 06 | 6 | SHARE-01..05 | T-02-20, T-02-21, T-02-22, T-02-23, T-02-24 | Wrong-pass/corrupted bundle return generic error (V6); file accept=".txt,.rshape,.json"; passphrase input password+autocomplete=off; Compare truncates to 4 | component + integration + regression | `pnpm run test -- src/routes/__tests__/Share.test.tsx src/routes/__tests__/Import.test.tsx src/routes/__tests__/Import.fixture.test.tsx src/routes/__tests__/Compare.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-07-06 | 07 | 7 | SHELL-01 (regression) | (no new threat) | Settings + MapSettings real components replace placeholders; `_placeholders.tsx` deleted | integration | `pnpm run test -- src/__tests__/router.routes.test.tsx` | ✅ from 02-01 | ⬜ pending |
| 02-07-07 | 07 | 7 | SETTINGS-01..05, SHARE-06 | T-02-25, T-02-26, T-02-27, T-02-28 | Backup import gated by AlertDialog confirm; clear-all gated by "Type DELETE"; scale-step removal with data gated by confirm; Radix focus trap + ARIA on every Dialog/AlertDialog | component + integration | `pnpm run test -- src/routes/__tests__/Settings.test.tsx src/routes/__tests__/Settings.backup.test.tsx src/routes/__tests__/MapSettings.test.tsx src/__tests__/a11y.dialog.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 02-07-08 | 07 | 7 | All Phase 2 reqs (golden path) | All Phase 2 threats | End-to-end: create profile → answer → result → share → import → compare → backup → clear (one it() block) | integration smoke | `pnpm run test -- src/__tests__/parity.smoke.test.tsx` | ❌ Wave 0 | ⬜ pending |

> **Status legend:** ⬜ pending (test scaffold not yet present), 🟡 in-progress (test exists but failing), ✅ green, ⛔ blocked.

---

## Wave 0 Requirements (spec scaffolds owned by each plan)

Each plan owns the spec files for its requirements. Wave-0 dependency means the test scaffold must exist before the task can be marked complete.

**Plan 01 — App shell:**
- [ ] `tests/helpers/MemoryLocalStorage.ts` — shared test helper (task 02-01-01)
- [ ] `src/__tests__/router.routes.test.tsx` — SHELL-01 / SHELL-02 — every D-24 row renders its placeholder
- [ ] `src/__tests__/Nav.test.tsx` — SHELL-03 (desktop scaffold)
- [ ] `src/hooks/__tests__/useScrollToTop.test.tsx` — SHELL-05

**Plan 02 — Primitives:**
- [ ] `src/__tests__/primitives.test.tsx` — SHELL-06 — toast renders, dialog opens / focuses / closes
- [ ] `src/components/__tests__/AgeGate.test.tsx` — PROFILE-06
- [ ] `src/components/__tests__/WizardHost.test.tsx` — PROFILE-05
- [ ] `src/lib/hooks/__tests__/useSwipe.test.tsx` — QUEST-03 enabler

**Plan 03 — Profile lifecycle:**
- [ ] `src/routes/__tests__/Profile.test.tsx` — PROFILE-01..04 — Zustand round-trip
- [ ] `src/routes/__tests__/Intro.test.tsx` — PROFILE-07
- [ ] `src/lib/data/__tests__/emoji.test.ts` — EMOJI_BANK count + isLikelyEmoji
- [ ] `src/lib/i18n/__tests__/richText.test.ts` — RICH_TEXT_KEYS allow-list resolves in EN+DE

**Plan 04 — Questionnaire:**
- [ ] `src/lib/charts/__tests__/math.test.ts` — pure math (RESULT-02..05 enabler)
- [ ] `src/lib/charts/__tests__/items.test.ts` — flatItemsForResult, enabledItemsForCat
- [ ] `src/routes/__tests__/CategoryOverview.test.tsx` — QUEST-01
- [ ] `src/components/questionnaire/__tests__/ListMode.test.tsx` — QUEST-02, QUEST-05, QUEST-07
- [ ] `src/components/questionnaire/__tests__/SingleMode.test.tsx` — QUEST-03, QUEST-04 partial
- [ ] `src/components/__tests__/ScalePicker.test.tsx` — QUEST-04
- [ ] `src/lib/i18n/__tests__/de-gendered.test.ts` — QUEST-08

**Plan 05 — Results & charts:**
- [ ] `src/components/charts/__tests__/Spider.test.tsx` — RESULT-02 + RESULT-07 (XSS escape snapshot)
- [ ] `src/components/charts/__tests__/ItemSpider.test.tsx` — RESULT-04 + RESULT-07
- [ ] `src/components/charts/__tests__/CategoryBars.test.tsx` — RESULT-03 + RESULT-07
- [ ] `src/components/charts/__tests__/Alignment.test.tsx` — RESULT-05 + RESULT-07
- [ ] `src/components/charts/__tests__/EnlargedSpider.test.tsx` — RESULT-06
- [ ] `src/routes/__tests__/Result.test.tsx` — RESULT-01 + QUEST-06 deep-link + RESULT-07 regression

**Plan 06 — Share / Import / Compare:**
- [ ] `src/lib/share/__tests__/payload.test.ts` — SharePayload + parseImportPayload + payloadToImport
- [ ] `src/routes/__tests__/Share.test.tsx` — SHARE-01, SHARE-02
- [ ] `src/routes/__tests__/Import.test.tsx` — SHARE-03
- [ ] `src/routes/__tests__/Import.fixture.test.tsx` — SHARE-04 (reuses Phase 1's `tests/fixtures/v1-bundle.fixture.ts`)
- [ ] `src/routes/__tests__/Compare.test.tsx` — SHARE-05

**Plan 07 — Settings + integration smoke:**
- [ ] `src/routes/__tests__/Settings.test.tsx` — SETTINGS-01, SETTINGS-02
- [ ] `src/routes/__tests__/Settings.backup.test.tsx` — SHARE-06, SETTINGS-04
- [ ] `src/routes/__tests__/MapSettings.test.tsx` — SETTINGS-03
- [ ] `src/__tests__/a11y.dialog.test.tsx` — SETTINGS-05
- [ ] `src/__tests__/parity.smoke.test.tsx` — phase-final golden-path integration

**No framework install needed** — Vitest, Testing Library, jsdom are already in `package.json` from Phase 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| v1.0 → v2.0 visual parity for the eight `@keyframes` animations on the real elements (button, icon, underline, hero, etc.) | DESIGN-04 / SHELL-03 | jsdom doesn't render CSS animations; OS-level reduced-motion comparison required | Open the dev server in Chrome + Safari; flip OS `prefers-reduced-motion: reduce`; visually confirm motion stops/simplifies; side-by-side against `public/legacy/index.html#/` for parity. Capture screenshots in PR. |
| Android touch swipe in single-card mode does not trigger page scroll on a horizontal swipe | QUEST-03 | Touch behaviour on real Android Chrome cannot be exercised in jsdom; `@use-gesture` + `touch-action: pan-y` only verified live | Open dev preview on a real Android device (or emulator with touch input); navigate to `/q/<profileId>/<resultId>` in single-card mode; horizontal swipe should advance card without scrolling the page; vertical swipe should scroll normally. |
| iOS double-tap zoom does NOT fire on scale-picker snap-dots | QUEST-04 | Mobile Safari double-tap-zoom suppression requires real device; jsdom can't reproduce | On iPhone Safari, hit a snap-dot twice in 300 ms; viewport must not zoom. `touch-action: manipulation` is set in ScalePicker.tsx per plan 4. |
| Screen-reader announcement order for `<Dialog />` open / close on VoiceOver + NVDA | SETTINGS-05 | Radix gives correct ARIA roles for free but the announcement order is reader-specific | Open any Dialog; confirm title is announced first, then body, then primary action. Repeat on macOS VoiceOver and Windows NVDA. |
| Bundle-size budget < 200KB gzip | n/a (working target) | Manual `du -sh dist/assets` after each plan's verify step; CI enforcement deferred to v2.1 (QUAL-03) | After every plan: `pnpm run build && du -sh dist/assets`. Record value in plan SUMMARY. |
| Lighthouse PWA score baseline (informational, not blocking — full PWA audit is Phase 3) | n/a (Phase 3) | Full audit runs against the deployed build with SW + manifest; Phase 2 has neither | Skipped here; Phase 3 owns the gate. |

---

## Validation Sign-Off

- [ ] Every task in `PLAN.md` files has either `<automated>` verifier OR explicit Wave-0 dependency listed
- [ ] Sampling continuity: no 3 consecutive tasks in any plan lack automated verify
- [ ] Wave 0 covers all MISSING references above
- [ ] No watch-mode flags (`--watch`, `--ui`) appear in any plan task's commands — all CI-style invocations
- [ ] Feedback latency target met: full suite < 15 s after Phase 2 closes
- [ ] `nyquist_compliant: true` set in frontmatter (set above)
- [ ] `wave_0_complete: true` set once every Wave-0 spec file from the list above exists on disk

**Approval:** ready for execution
