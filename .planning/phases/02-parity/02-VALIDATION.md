---
phase: 02
slug: parity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-15
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `02-RESEARCH.md` § Validation Architecture (lines 1396–1488).
> The Per-Task Verification Map is populated by the planner as it writes each PLAN.md.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 + Testing Library 16.3.2 (both already installed Phase 1) |
| **Config file** | `vitest.config.ts` (already configured; `environment: 'node'` default, component specs use `// @vitest-environment jsdom` directive) |
| **Quick run command** | `pnpm run test -- <file-glob>` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~12–15 s (Phase 1 baseline 5.91 s for 59 tests; Phase 2 adds ~25 spec files / ~80 tests) |
| **Phase gate command** | `pnpm run verify` (typecheck + lint + test + build + Phase 1 grep guard) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm run test -- <plan's spec glob>` — the affected plan's tests only (≤ 10 s)
- **After every plan wave:** Run `pnpm run test` — full Vitest suite (~12–15 s)
- **Before `/gsd-verify-work`:** `pnpm run verify` must be green (chained typecheck + lint + test + build + grep guard)
- **Max feedback latency:** 15 s (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _(populated by planner — one row per task in every PLAN.md)_ | | | | | | | | | ⬜ pending |

> **Planner instructions:** As you author each PLAN.md, append a row here for every task with an `<automated>` verifier. Use the **Phase Requirements → Test Map** in `02-RESEARCH.md` § Validation Architecture as the source of truth for which spec file owns which REQ-ID.

---

## Wave 0 Requirements

Spec files that MUST be scaffolded before plan-level test development begins. Each plan owns the spec files for its requirements; the planner should list these as scaffold tasks in the relevant plan (mostly plans 1 and 2):

**App shell + primitives (plans 1–2):**
- [ ] `src/__tests__/router.routes.test.tsx` — SHELL-01 / SHELL-02 — every D-24 row renders its placeholder
- [ ] `src/components/__tests__/Nav.test.tsx` — SHELL-03
- [ ] `src/hooks/__tests__/useScrollToTop.test.tsx` — SHELL-05
- [ ] `src/__tests__/primitives.test.tsx` — SHELL-06 — toast renders, dialog opens / focuses / closes
- [ ] `src/__tests__/a11y.dialog.test.tsx` — SETTINGS-05 — focus trap + return on close

**Profile lifecycle (plan 3):**
- [ ] `src/routes/__tests__/Profile.test.tsx` — PROFILE-01..04 — Zustand round-trip
- [ ] `src/components/__tests__/WizardHost.test.tsx` — PROFILE-05
- [ ] `src/components/__tests__/AgeGate.test.tsx` — PROFILE-06
- [ ] `src/routes/__tests__/Intro.test.tsx` — PROFILE-07

**Questionnaire (plan 4):**
- [ ] `src/routes/__tests__/CategoryOverview.test.tsx` — QUEST-01
- [ ] `src/components/questionnaire/__tests__/ListMode.test.tsx` — QUEST-02, QUEST-05, QUEST-07
- [ ] `src/components/questionnaire/__tests__/SingleMode.test.tsx` — QUEST-03, QUEST-04 partial
- [ ] `src/components/__tests__/ScalePicker.test.tsx` — QUEST-04
- [ ] `src/lib/i18n/__tests__/de-gendered.test.ts` — QUEST-08

**Results & charts (plan 5):**
- [ ] `src/lib/charts/__tests__/math.test.ts` — RESULT-02..05 pure math
- [ ] `src/components/charts/__tests__/Spider.test.tsx` — RESULT-02 + RESULT-07 (XSS escape snapshot)
- [ ] `src/components/charts/__tests__/ItemSpider.test.tsx` — RESULT-04 + RESULT-07
- [ ] `src/components/charts/__tests__/CategoryBars.test.tsx` — RESULT-03 + RESULT-07
- [ ] `src/components/charts/__tests__/Alignment.test.tsx` — RESULT-05 + RESULT-07
- [ ] `src/components/charts/__tests__/EnlargedSpider.test.tsx` — RESULT-06
- [ ] `src/routes/__tests__/Result.test.tsx` — RESULT-01 + QUEST-06 deep-link

**Share / import / compare (plan 6):**
- [ ] `src/routes/__tests__/Share.test.tsx` — SHARE-01, SHARE-02
- [ ] `src/routes/__tests__/Import.test.tsx` — SHARE-03
- [ ] `src/routes/__tests__/Import.fixture.test.tsx` — SHARE-04 (reuses Phase 1's `tests/fixtures/v1-bundle.fixture.ts`)
- [ ] `src/routes/__tests__/Compare.test.tsx` — SHARE-05

**Settings + integration smoke (plan 7):**
- [ ] `src/routes/__tests__/Settings.test.tsx` — SETTINGS-01, SETTINGS-02
- [ ] `src/routes/__tests__/Settings.backup.test.tsx` — SHARE-06, SETTINGS-04
- [ ] `src/routes/__tests__/MapSettings.test.tsx` — SETTINGS-03
- [ ] `src/__tests__/parity.smoke.test.tsx` — phase-final golden-path integration (create profile → answer → result → share → import → compare → backup → clear)

**No framework install needed** — Vitest, Testing Library, jsdom are already in `package.json` from Phase 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| v1.0 → v2.0 visual parity for the eight `@keyframes` animations on the real elements (button, icon, underline, hero, etc.) | DESIGN-04 / SHELL-03 | jsdom doesn't render CSS animations; OS-level reduced-motion comparison required | Open the dev server in Chrome + Safari; flip OS `prefers-reduced-motion: reduce`; visually confirm motion stops/simplifies; side-by-side against `public/legacy/index.html#/` for parity. Capture screenshots in PR. |
| Android touch swipe in single-card mode does not trigger page scroll on a horizontal swipe | QUEST-03 | Touch behaviour on real Android Chrome cannot be exercised in jsdom; `@use-gesture` + `touch-action: pan-y` only verified live | Open dev preview on a real Android device (or emulator with touch input); navigate to `/q/<profileId>/<resultId>` in single-card mode; horizontal swipe should advance card without scrolling the page; vertical swipe should scroll normally. |
| iOS double-tap zoom does NOT fire on scale-picker snap-dots | QUEST-04 | Mobile Safari double-tap-zoom suppression requires real device; jsdom can't reproduce | On iPhone Safari, hit a snap-dot twice in 300 ms; viewport must not zoom. Use `touch-action: manipulation` if needed. |
| Screen-reader announcement order for `<Dialog />` open / close on VoiceOver + NVDA | SETTINGS-05 | Radix gives correct ARIA roles for free but the announcement order is reader-specific | Open any Dialog; confirm title is announced first, then body, then primary action. Repeat on macOS VoiceOver and Windows NVDA. |
| Lighthouse PWA score baseline (informational, not blocking — full PWA audit is Phase 3) | n/a (Phase 3) | Full audit runs against the deployed build with SW + manifest; Phase 2 has neither | Skipped here; Phase 3 owns the gate. |

---

## Validation Sign-Off

- [ ] Every task in `PLAN.md` files has either `<automated>` verifier OR explicit Wave-0 dependency listed
- [ ] Sampling continuity: no 3 consecutive tasks in any plan lack automated verify
- [ ] Wave 0 covers all MISSING references above
- [ ] No watch-mode flags (`--watch`, `--ui`) appear in any plan task's commands — all CI-style invocations
- [ ] Feedback latency target met: full suite < 15 s after Phase 2 closes
- [ ] `nyquist_compliant: true` set in frontmatter once all checks above are green
- [ ] `wave_0_complete: true` set once every Wave-0 spec file from the list above exists on disk

**Approval:** pending
