---
phase: 1
slug: skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (node default; jsdom only for `<App />` smoke render) |
| **Config file** | `vitest.config.ts` (installed in Wave 1 scaffold) |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run typecheck && npm run lint && npm run test -- --run && npm run build` |
| **Estimated runtime** | ~10–25 s for `test --run`; ~45–90 s for full suite |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run` (or the scoped equivalent if the task touched a single file: `npm run test -- --run path/to/file.test.ts`)
- **After every plan wave:** Run the full suite command
- **Before `/gsd-verify-work`:** Full suite must be green AND post-build grep for `fonts.googleapis.com` / `fonts.gstatic.com` returns zero hits
- **Max feedback latency:** 90 s (full suite); 25 s (per-task)

---

## Per-Task Verification Map

> The planner fills this table when PLAN.md files are generated. Each task in each PLAN.md gets one row.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {N}-01-01 | 01 | 1 | REQ-{XX} | T-{N}-01 / — | {expected secure behavior or "N/A"} | unit | `{command}` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

The Wave 0 (planning prerequisites — must exist before any task runs) for Phase 1 is the test infrastructure itself, since the project currently has zero tests:

- [ ] `package.json` declares `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom` in devDependencies
- [ ] `vitest.config.ts` with `test.environment = 'node'` default
- [ ] `tests/fixtures/v1-bundle.rshape.txt` (legacy-app-produced fixture — manually captured per CONTEXT.md `<specifics>`)
- [ ] `tests/fixtures/v1-bundle.fixture.ts` exporting `{ ARMORED, PASSPHRASE, EXPECTED_PAYLOAD }`
- [ ] `tests/fixtures/v1-localstorage.fixture.ts` exporting a fixture `relationshape.v1` blob shape
- [ ] `tests/fixtures/README.md` documenting fixture regeneration procedure
- [ ] `src/__tests__/App.smoke.test.tsx` (placeholder — populated when `<App />` exists)
- [ ] `src/lib/crypto/__tests__/crypto.test.ts` — round-trip + envelope-shape assertions (Validation Architecture §"Encrypted bundle from v1.0 round-trips byte-for-byte")
- [ ] `src/lib/storage/__tests__/storage.test.ts` — localStorage parity + QuotaExceeded handling (CORE-02)
- [ ] `src/lib/storage/__tests__/migrateScale.test.ts` — scale migration parity (CORE-05)
- [ ] `src/lib/i18n/__tests__/i18n.test.ts` — EN+DE key-for-key resolution (CORE-06)
- [ ] `src/styles/__tests__/theme-tokens.test.ts` — parity check that every `:root` token from v1.0 `css/style.css` exists in `theme.css` (DESIGN-01)
- [ ] Post-build grep step (DESIGN-02): script asserting `dist/` contains no `fonts.googleapis.com` or `fonts.gstatic.com` references

---

## Manual-Only Verifications

Behaviors that cannot be unit-tested in a headless environment and require eyeball / DevTools confirmation:

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm run dev` serves React at `/` and legacy app at `/legacy/` | FOUND-01 | Live server + browser navigation; no headless test for "the legacy SW still works at a different scope" | Run `npm run dev`, open `http://localhost:5173/` (sees React skeleton), open `http://localhost:5173/legacy/` (sees v1.0 app); DevTools → Application → Service Workers shows two registrations with non-overlapping scopes (`/` and `/legacy/`) |
| `npx shadcn@latest add button` adds a working component | FOUND-03 | Tests the shadcn CLI flow itself (one-shot, not regression-tested) | Run `npx shadcn@4.7.0 add button` (pinned per RESEARCH.md A1); verify `src/components/ui/button.tsx` exists; render in `/design-system`; eyeball |
| Eight `@keyframes` visually match v1.0 reference | DESIGN-03 | Side-by-side animation comparison; no programmatic pixel-diff in this phase | Open `http://localhost:5173/design-system`; open `http://localhost:5173/legacy/` in adjacent tab; cycle through each of the 8 keyframes; confirm match |
| `prefers-reduced-motion: reduce` disables all 8 keyframes | DESIGN-04 | DevTools "Emulate CSS prefers-reduced-motion: reduce" flag is a runtime/device condition | DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`; observe all 8 keyframes on `/design-system` are static or simplified per D-10 |
| Theme toggle (auto / light / dark) is reactive across the tree | DESIGN-05 | UI interaction + visual confirmation across multiple sections of `/design-system` | Toggle theme in `/design-system` header; confirm every section's tokens change without page reload |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify command or are listed as Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (tests/fixtures/, Vitest scaffold)
- [ ] No watch-mode flags (always `--run`)
- [ ] Feedback latency < 90 s for full suite
- [ ] `nyquist_compliant: true` set in frontmatter once planner fills per-task map

**Approval:** pending
