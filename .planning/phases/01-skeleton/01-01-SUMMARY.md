---
phase: 01-skeleton
plan: 01
subsystem: infra

tags:
  - legacy
  - filesystem
  - pwa
  - skeleton
  - git-mv

# Dependency graph
requires: []
provides:
  - "v1.0 app relocated under public/legacy/ so URL prefix /legacy/* serves it verbatim (D-22)"
  - "Repo root cleared of v1.0 artifacts (index.html, manifest.json, sw.js, js/, css/, icons/) — Wave 2 scaffold can write fresh entry without collision"
  - "Three PWA icon SVGs duplicated under public/icons/ for the new vite-plugin-pwa manifest to reference at root scope (/icons/*.svg)"
affects:
  - "phase-1 plan 02 (scaffold) — depends on a clean repo root for shadcn-vite init"
  - "phase-1 plan 06 (vite-plugin-pwa) — references /icons/icon-{192,512}.svg in the new manifest"
  - "phase-1 plan 09 (SW scope verification) — expects exactly one SW per scope (/legacy/ vs /)"
  - "phase-3 (PWA-07 legacy retirement) — removes public/legacy/ at cutover"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "git mv for file relocation — preserves rename detection and history continuity"
    - "Vite public/ passthrough — /legacy/* URLs resolve from public/legacy/* without bundler involvement"
    - "Intentional asset duplication for dual-PWA coexistence — same SVG content lives at both public/legacy/icons/ and public/icons/ during the migration window"

key-files:
  created:
    - public/icons/favicon.svg
    - public/icons/icon-192.svg
    - public/icons/icon-512.svg
  modified:
    - public/legacy/index.html (renamed from index.html, content unchanged)
    - public/legacy/manifest.json (renamed from manifest.json, content unchanged)
    - public/legacy/sw.js (renamed from sw.js, content unchanged)
    - public/legacy/js/app.js (renamed from js/app.js, content unchanged — 3917 lines preserved)
    - public/legacy/js/storage.js (renamed from js/storage.js, content unchanged)
    - public/legacy/js/crypto.js (renamed from js/crypto.js, content unchanged)
    - public/legacy/js/data.js (renamed from js/data.js, content unchanged)
    - public/legacy/js/i18n.js (renamed from js/i18n.js, content unchanged)
    - public/legacy/js/charts.js (renamed from js/charts.js, content unchanged)
    - public/legacy/css/style.css (renamed from css/style.css, content unchanged)
    - public/legacy/css/additions.css (renamed from css/additions.css, content unchanged)
    - public/legacy/icons/favicon.svg (renamed from icons/favicon.svg, content unchanged)
    - public/legacy/icons/icon-192.svg (renamed from icons/icon-192.svg, content unchanged)
    - public/legacy/icons/icon-512.svg (renamed from icons/icon-512.svg, content unchanged)

key-decisions:
  - "Used git mv for every relocation (NOT plain mv) so git tracks renames as R-status entries with 100% similarity, preserving blame/history for the entire v1.0 monolith"
  - "Copied (not moved) the three icon SVGs into public/icons/ — originals stay under public/legacy/icons/ so legacy manifest.json keeps resolving them; new vite-plugin-pwa manifest in plan 02 will reference the root-scope copies"
  - "No file content modified — legacy bundle's relative paths (./js/app.js, ./css/*.css, ./sw.js, ./manifest.json, ./icons/*.svg) all resolve correctly under the new /legacy/ URL prefix because they were relative to the directory the HTML lives in"

patterns-established:
  - "Pattern: When relocating files git tracks, always use git mv — not mv — so the operation registers as a rename with 100% similarity in the diff (zero insertions/deletions)"
  - "Pattern: When migrating a PWA, icon assets must exist at BOTH the legacy scope AND the new manifest scope during the coexistence window; duplication is correct, not redundant"
  - "Pattern: Vite's public/ directory serves children verbatim at the site root — public/legacy/index.html → /legacy/index.html with no bundler involvement"

requirements-completed:
  - CORE-07

# Metrics
duration: 3min
completed: 2026-05-15
---

# Phase 1 Plan 01: Legacy Coexistence at /legacy/ Summary

**Relocated the entire v1.0 vanilla-JS PWA into `public/legacy/` via 14 byte-identical `git mv` operations and duplicated the three PWA icons under `public/icons/` so the new app's manifest can reference them at root scope.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-15T14:39:30Z (approx — pre-Task 1.1)
- **Completed:** 2026-05-15T14:42:29Z
- **Tasks:** 2
- **Files modified:** 17 (14 renames + 3 new copies)

## Accomplishments

- Repo root cleared of every v1.0 artifact (`index.html`, `manifest.json`, `sw.js`, `js/`, `css/`, `icons/`) so the Wave 2 scaffold plan can drop a fresh Vite `index.html` at the root without collision.
- All 14 v1.0 source files relocated under `public/legacy/` preserving the exact subdirectory layout (`js/`, `css/`, `icons/`) so the legacy bundle's relative path references all resolve correctly at the new `/legacy/` URL prefix.
- Three PWA icon SVGs (`favicon.svg`, `icon-192.svg`, `icon-512.svg`) duplicated under `public/icons/` for the new vite-plugin-pwa manifest at root scope; originals retained at `public/legacy/icons/` for the legacy manifest. Identical bytes on both sides (verified via `diff`).
- Git records all 14 relocations as renames (R-status, 100% similarity) — history is preserved; future `git blame` on any moved file walks back through the v1.0 monolith intact.

## Task Commits

Each task was committed atomically:

1. **Task 1.1: Move v1.0 source files into `public/legacy/`** — `cb93b01` (chore)
2. **Task 1.2: Copy PWA icon SVGs into `public/icons/`** — `7537f63` (chore)

**Plan metadata:** (this SUMMARY commit, hash recorded after commit)

## Files Created/Modified

### Created (Task 1.2)

- `public/icons/favicon.svg` — Favicon for the new app's `<link rel="icon">` and `manifest.webmanifest`. Byte-identical to `public/legacy/icons/favicon.svg`.
- `public/icons/icon-192.svg` — 192×192 PWA icon for the new vite-plugin-pwa manifest at root scope.
- `public/icons/icon-512.svg` — 512×512 PWA icon for the new vite-plugin-pwa manifest at root scope.

### Renamed via `git mv` (Task 1.1) — content unchanged

- `public/legacy/index.html` ← `index.html` — Legacy v1.0 entry point. Still contains `<script type="module" src="js/app.js">` (relative path resolves to `/legacy/js/app.js`) and `navigator.serviceWorker.register("./sw.js")` (registers `/legacy/sw.js` with implicit scope `/legacy/`).
- `public/legacy/manifest.json` ← `manifest.json` — Legacy PWA manifest (not the new app's manifest — that one is generated by vite-plugin-pwa in a later plan).
- `public/legacy/sw.js` ← `sw.js` — Legacy service worker; `CACHE = "rshape-v9"` string preserved exactly.
- `public/legacy/js/app.js` ← `js/app.js` — 3917-line v1.0 monolith (router + view rendering); preserved byte-for-byte.
- `public/legacy/js/storage.js` ← `js/storage.js`
- `public/legacy/js/crypto.js` ← `js/crypto.js`
- `public/legacy/js/data.js` ← `js/data.js`
- `public/legacy/js/i18n.js` ← `js/i18n.js`
- `public/legacy/js/charts.js` ← `js/charts.js`
- `public/legacy/css/style.css` ← `css/style.css` — Legacy design tokens (`:root` block read by Wave 4 plan 07's theme-parity test).
- `public/legacy/css/additions.css` ← `css/additions.css` — Source of the eight `@keyframes` reproduced in Wave 4.
- `public/legacy/icons/favicon.svg` ← `icons/favicon.svg`
- `public/legacy/icons/icon-192.svg` ← `icons/icon-192.svg`
- `public/legacy/icons/icon-512.svg` ← `icons/icon-512.svg`

## Decisions Made

- **`git mv` over plain `mv`** — Plain `mv` followed by `git add` would produce a delete + add pair in the index, losing rename detection. `git mv` produces R-status entries with 100% similarity scores; the rename commit message records what moved where without bloating the diff. Verified post-commit via `git status --porcelain` showing 14 R-prefixed entries and zero D-prefixed entries.
- **Copy (not move) for the three icons** — The legacy app's `manifest.json` and the legacy SW's precache list both reference `./icons/icon-192.svg` etc. (relative to `public/legacy/`). Moving the icons would break the legacy app. The new app's vite-plugin-pwa manifest (plan 02) will reference root-scope paths (`/icons/icon-192.svg`). Both apps need the bytes during the coexistence window, so duplication is correct.
- **No content edits anywhere** — `public/legacy/index.html` still uses `src="js/app.js"` (no `./` prefix). Relative resolution is identical to `./js/app.js` — both forms point at `/legacy/js/app.js` post-move. Editing the file to add a `./` prefix would be (a) unnecessary and (b) a violation of the "byte-identical legacy bundle" invariant the plan calls out under CORE-07.

## Deviations from Plan

### Notes (not deviations — verification-only adaptation)

The plan's Task 1.1 `<verify>` block includes `grep -q 'src="./js/app.js"' public/legacy/index.html`. The actual v1.0 `index.html` uses the bare relative form `src="js/app.js"` (no `./` prefix). Both forms are URL-equivalent — they resolve to the same `/legacy/js/app.js` post-move — so the verification's intent (the legacy bootstrap script reference is preserved) is met. The acceptance criterion's spirit was checked with `grep -c 'src="js/app.js"'` returning `1`, which is the genuine pattern in the file. No code change was made; the discrepancy is in the plan's grep pattern, not in the v1.0 source. Documented here for traceability.

This is not a Rule 1 deviation (no bug introduced, no file content changed). The plan author wrote the grep against an idealized form; the actual file uses the equivalent terser form. Future plans referencing the legacy index should match against the actual pattern `src="js/app.js"`.

### Auto-fixed Issues

None — no Rule 1/2/3 fixes were needed. The plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed; 1 verification-pattern adaptation (documented above).
**Impact on plan:** None. Both tasks completed exactly as specified, with content byte-identical to pre-move and git rename detection intact.

## Issues Encountered

None. The two `mkdir -p` + `git mv` + `cp` sequences ran cleanly. No quota issues, no SCM conflicts, no test infrastructure required (this is a pure-filesystem plan).

## User Setup Required

None — no external service configuration required.

## Threat Surface Scan

Reviewed the moved/created files against the plan's `<threat_model>`:

- T-01-01 (Tampering during move): mitigated — `git mv` is atomic on POSIX; rename commit shows 100% similarity for every file; `wc -l public/legacy/js/app.js` = 3917 (>=3000); `grep -c 'rshape-v9' public/legacy/sw.js` = 1.
- T-01-02 (Repudiation via plain `mv`): mitigated — used `git mv` throughout; `git status --porcelain` shows 14 R entries, zero D entries.
- T-01-03 (Legacy SW 404 during cutover): accepted by plan; not actionable in this plan. Browsers gracefully unregister stale SWs on 404; Wave 6 plan 09 will verify exactly one SW per scope.
- T-01-04 (Information Disclosure): n/a — no secrets, no env vars in the moved files (confirmed by absence of `process.env`, API keys, or tokens in the v1.0 source per RESEARCH.md).

No new threat surface was introduced by this plan. No new `threat_flag` entries needed.

## Self-Check: PASSED

**Files exist:**
- `public/icons/favicon.svg` — FOUND
- `public/icons/icon-192.svg` — FOUND
- `public/icons/icon-512.svg` — FOUND
- `public/legacy/index.html` — FOUND
- `public/legacy/manifest.json` — FOUND
- `public/legacy/sw.js` — FOUND
- `public/legacy/js/app.js` — FOUND (3917 lines)
- `public/legacy/js/{storage,crypto,data,i18n,charts}.js` — all FOUND
- `public/legacy/css/{style,additions}.css` — both FOUND
- `public/legacy/icons/{favicon,icon-192,icon-512}.svg` — all FOUND

**Repo root cleared (must not exist):**
- `index.html` — confirmed absent
- `manifest.json` — confirmed absent
- `sw.js` — confirmed absent
- `js/`, `css/`, `icons/` — all confirmed absent

**Commits exist:**
- `cb93b01` (Task 1.1, move) — FOUND in `git log`
- `7537f63` (Task 1.2, copy) — FOUND in `git log`

## Next Phase Readiness

- **Plan 02 (scaffold)** is unblocked: repo root has no v1.0 collision artifacts, `public/icons/*.svg` exists for vite-plugin-pwa to reference, `public/legacy/` is in place so the dev server can serve the legacy app at `/legacy/` alongside the new app at `/` once Vite is wired.
- No blockers identified for Wave 2.
- Note for Plan 09 (Wave 6, SW scope verification): the legacy SW will register at `/legacy/sw.js` with implicit scope `/legacy/`. The new SW (from vite-plugin-pwa, plan 06) will register at `/sw.js` with scope `/`. The two scopes do not overlap, so both can coexist. Plan 09's check should call `navigator.serviceWorker.getRegistrations()` and assert exactly two registrations with the expected scopes.

---
*Phase: 01-skeleton*
*Completed: 2026-05-15*
