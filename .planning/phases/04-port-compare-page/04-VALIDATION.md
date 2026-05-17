---
phase: 04
slug: port-compare-page
status: draft
nyquist_compliant: false
wave_0_complete: false
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

Populated by planner — see individual PLAN.md `<automated>` blocks.

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing Vitest + RTL + jsdom infrastructure covers all phase requirements. No Wave 0 install required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Result page visual parity vs Screenshot 1 | D-01, D-02 | Screenshot comparison is not automated | Open `/result/<id>`, verify header (Back / avatar / title with subtitle / Map settings / Continue editing / Share), Compare-with section, cat-card grid; no inline Spider/drilldown |
| Compare page visual parity vs Screenshot 2 | D-04, D-05 | Screenshot comparison is not automated | Open `/compare?ids=a,b`, verify chips, datasets ≥2, cat-grid with `Add more categories` (when own-result selected), `.is-empty` opacity rule |
| Deep-link `:catId` opens CategoryModal | D-01 | Modal open behavior across RAF + router | Navigate to `/result/<id>/<catId>`, modal opens on mount |
| Import… tile navigates to /import | D-03 | Visual flow | Click Import… tile on Result page → URL becomes `/import` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
