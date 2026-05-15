---
phase: 01-skeleton
plan: 07
subsystem: design-system
tags:
  - design
  - tailwind
  - tokens
  - fonts
  - animations
  - reduced-motion
  - celestial-map
  - wcag-2.1-sc-2.3.3
dependency_graph:
  requires:
    - 01-02 (toolchain scaffold — Vite + React 19 + Tailwind v4 + @fontsource-variable imports)
  provides:
    - "src/styles/theme.css :: Tailwind v4 @theme block with all v1.0 :root tokens (renamed per Pitfall 1) + dark/light/auto variants"
    - "src/styles/animations.css :: 8 @keyframes ported verbatim + comprehensive prefers-reduced-motion guard + body[data-prm='reduce'] preview hook"
    - "src/styles/fonts.css :: placeholder for hand-rolled @font-face fallbacks (Fontsource handles injection)"
    - "src/styles/globals.css :: aggregator imports theme.css + fonts.css + animations.css"
  affects:
    - "plan 01-08 (DesignSystem route) — consumes all @theme tokens + animation gallery + reduced-motion preview hook"
    - "plan 02-* and beyond (every Phase 2 view) — Tailwind utility surface produced by @theme tokens"
tech_stack:
  added:
    - "Tailwind v4 @theme directive (CSS-first design tokens — D-18)"
  patterns:
    - "Token rename: --bg → --color-bg, --glow → --shadow-glow, etc. (Pitfall 1) — values byte-identical to v1.0"
    - "Three-way theming via [data-theme='light' | 'dark' | 'auto'] + prefers-color-scheme media query"
    - "Universal reduced-motion guard + explicit animation: none on v1.0 target selectors (Pitfall 6)"
    - "Vitest ESM-safe __dirname via fileURLToPath(import.meta.url)"
key_files:
  created:
    - "src/styles/animations.css (126 lines)"
    - "src/styles/fonts.css (6 lines, placeholder)"
    - "src/styles/__tests__/theme-tokens.test.ts (210 lines, 11 assertions)"
    - "src/styles/__tests__/animations.test.ts (52 lines, 5 assertions)"
  modified:
    - "src/styles/theme.css (5 → 135 lines; Tailwind v4 @theme block populated)"
    - "src/styles/globals.css (3 → 7 lines; aggregates fonts.css + animations.css)"
    - "tsconfig.app.json (types: ['node'] added so node:fs / node:path / node:url type-check in tests)"
decisions:
  - "Used import.meta.url + fileURLToPath for __dirname in tests (project is ESM via type:module + module:ESNext) — plan template assumed CJS __dirname"
  - "Narrowed DESIGN-02 build verification to exclude dist/legacy/ — legacy passthrough (D-22) correctly preserves v1.0 Google Fonts content; v2.0 bundle emits zero refs"
  - "Added --color-green, --color-red, --glass-blur, --radius, --radius-lg to [data-theme='dark'] explicit block — plan template omitted them despite legacy :root block declaring them (Rule 1)"
metrics:
  duration: "~1h0m (single worktree session, 2026-05-15T14:38 → 2026-05-15T15:10)"
  completed_date: "2026-05-15T15:10Z"
  tasks_completed: 2
  tests_added: 16
  tests_passing: 16
  build_status: pass
---

# Phase 1 Plan 07: Celestial Map Design System Summary

Ported the v1.0 Celestial Map design tokens (DESIGN-01), self-hosted variable fonts (DESIGN-02), eight `@keyframes` animations (DESIGN-03), and a WCAG 2.1 SC 2.3.3 `prefers-reduced-motion: reduce` guard (DESIGN-04) into a Tailwind v4 CSS-first artifact set. Token values are byte-identical to `public/legacy/css/style.css`; keyframes are byte-identical to `public/legacy/css/additions.css`. Two Vitest grep + parity suites (16 assertions total) enforce no silent drift. Production build emits zero `fonts.googleapis.com` / `fonts.gstatic.com` references in the v2.0 bundle.

## Tasks Completed

### Task 7.1 — `theme.css` + `globals.css` + theme-tokens parity test
- **Commit:** `c19981d`
- **Files:** `src/styles/theme.css` (135 lines), `src/styles/globals.css` (7 lines), `src/styles/__tests__/theme-tokens.test.ts` (210 lines), `tsconfig.app.json` (1 line)
- **Outcome:** All 24 documented v1.0 tokens mapped to Tailwind v4 prefixed names (`--bg` → `--color-bg`, `--glow` → `--shadow-glow`, etc.); dark default, light override via `[data-theme='light']`, auto mode via `prefers-color-scheme`. The 11-assertion test covers structural presence (tailwindcss import, @theme block, both theme selectors, @media query, Google Fonts sanity, legacy untouched) + four hex value parity assertions that parse the legacy `:root`, legacy `@media light`, legacy `[data-theme="light"]`, and theme.css counterparts and require byte-identical values — silent drift is now impossible.

### Task 7.2 — `animations.css` + `fonts.css` placeholder + animations test
- **Commit:** `4bc1cf4`
- **Files:** `src/styles/animations.css` (126 lines), `src/styles/fonts.css` (6 lines), `src/styles/__tests__/animations.test.ts` (52 lines)
- **Outcome:** All 8 v1.0 `@keyframes` blocks (`heroBlobPulse`, `holoOrbDrift`, `holoBtnSpin`, `holoIconSpin`, `holoUnderlineSlide`, `iridShift`, `bgPulse`, `silkShift`) ported verbatim from `public/legacy/css/additions.css`. The reduced-motion block universally zeroes `animation-duration` + `animation-iteration-count` + `transition-duration` and adds explicit `animation: none !important` on 15 v1.0 target selectors (Pitfall 6). A paired `body[data-prm='reduce']` rule mirrors the `@media` block for the in-page DesignSystem preview hook (plan 08). The 5-assertion test enforces keyframe presence, the `@media (prefers-reduced-motion: reduce)` block, universal duration zeroing, `animation: none` count ≥ 2, and the data-prm preview selector.

## Verification Output

```bash
# wc -l
$ wc -l src/styles/theme.css src/styles/animations.css src/styles/fonts.css src/styles/globals.css
     135 src/styles/theme.css
     126 src/styles/animations.css
       6 src/styles/fonts.css
       7 src/styles/globals.css
     274 total

# Keyframe presence (8/8)
$ for kf in heroBlobPulse holoOrbDrift holoBtnSpin holoIconSpin holoUnderlineSlide iridShift bgPulse silkShift; do
    grep -c "@keyframes $kf" src/styles/animations.css; done
1 (×8)

# v2.0 bundle Google Fonts grep — DESIGN-02 final check
$ grep -r 'fonts.googleapis.com' dist/ --exclude-dir=legacy
(no matches)

$ grep -r 'fonts.gstatic.com' dist/ --exclude-dir=legacy
(no matches)

# Sample utility class invocation in src/routes/Placeholder.tsx (plan 02) — confirms @theme block
# is wired to Tailwind utility generation:
$ grep -E "bg-bg|text-text|font-sans|font-heading|text-muted" src/routes/Placeholder.tsx
    <main className="min-h-screen bg-bg text-text font-sans p-8">
      <h1 className="font-heading text-3xl">Relationshape v2.0 — Skeleton alive</h1>
      <p className="mt-2 text-muted">

# Tests
$ pnpm exec vitest run src/styles/__tests__/
 Test Files  2 passed (2)
      Tests  16 passed (16)

# Build
$ pnpm run build
✓ built in 232ms
PWA v1.3.0 — 16 precache entries (358.56 KiB)
WOFF2 files in dist/assets/: 6  (3 DM Sans + 3 Playfair Display subsets, self-hosted via Fontsource)
```

## Sample Utility Class Usage

`src/routes/Placeholder.tsx` (already present from plan 02) confirms the @theme block produces working Tailwind utilities consuming the v2.0 tokens:

```tsx
<main className="min-h-screen bg-bg text-text font-sans p-8">
  <h1 className="font-heading text-3xl">Relationshape v2.0 — Skeleton alive</h1>
  <p className="mt-2 text-muted">
    Tailwind v4 utilities resolve. The DesignSystem route lands in plan 08.
  </p>
</main>
```

`bg-bg` consumes `--color-bg`, `text-text` consumes `--color-text`, `font-sans` consumes `--font-sans`, `font-heading` consumes `--font-heading`, `text-muted` consumes `--color-muted`. Build emits a 27.86 kB CSS bundle (5.93 kB gzip) containing the resolved utilities.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Missing tokens in `[data-theme='dark']` explicit block**
- **Found during:** Task 7.1 verification — the new "dark-mode explicit `[data-theme='dark']` block matches legacy dark values" assertion failed.
- **Issue:** Plan-provided theme.css template populated `@theme { ... }` correctly but omitted `--color-green`, `--color-red`, `--glass-blur`, `--radius`, and `--radius-lg` from the `[data-theme='dark']` explicit override block. Legacy `:root, :root[data-theme="dark"], :root[data-theme="auto"] { ... }` declares all of them, so the hex value parity assertion correctly flagged the gap.
- **Fix:** Added the five missing tokens to the dark explicit block with byte-identical v1.0 values.
- **Files modified:** `src/styles/theme.css`
- **Commit:** `c19981d`

**2. [Rule 3 — Blocking] `node:*` type imports failed under `tsconfig.app.json`**
- **Found during:** Task 7.1 typecheck on the new theme-tokens test.
- **Issue:** Plan-provided test imports `node:fs`, `node:path`, `node:url`. `tsconfig.app.json` did not opt into `@types/node`, so TS2591 (`Cannot find name 'node:fs'`) blocked compilation.
- **Fix:** Added `"types": ["node"]` to `tsconfig.app.json compilerOptions`. `@types/node` is already in `devDependencies`. Effect is scoped to the `src` + `tests` compile graph; no behavioural change to runtime code.
- **Files modified:** `tsconfig.app.json`
- **Commit:** `c19981d`

**3. [Rule 3 — Blocking] Plan-provided test used CJS `__dirname` in an ESM project**
- **Found during:** Pre-flight reading of `tsconfig.app.json` (`module: ESNext` + root `package.json` `type: module`).
- **Issue:** Plan-provided test code uses bare `__dirname`. In a true ESM project this is `ReferenceError: __dirname is not defined`.
- **Fix:** Derived `__dirname` via `dirname(fileURLToPath(import.meta.url))` at the top of both new test files. Semantics are identical; runtime is ESM-correct.
- **Files modified:** `src/styles/__tests__/theme-tokens.test.ts`, `src/styles/__tests__/animations.test.ts`
- **Commits:** `c19981d` (theme) + `4bc1cf4` (animations)

**4. [Rule 3 — Blocking] Plan acceptance check `! grep -r 'fonts.googleapis.com' dist/` over-matches legacy passthrough**
- **Found during:** Task 7.2 build verification.
- **Issue:** D-22 (Phase 1) explicitly preserves the v1.0 app under `dist/legacy/` with original content, INCLUDING its Google Fonts `<link>`. A bare `grep -r dist/` therefore finds three hits inside `dist/legacy/index.html` even though the v2.0 bundle is clean.
- **Fix:** Ran the narrowed substantive check `grep -r 'fonts.googleapis.com' dist/ --exclude-dir=legacy` (and the same for `fonts.gstatic.com`); both return zero matches. This is the correct DESIGN-02 / T-07-01 mitigation: the v2.0 bundle is the artifact users will load; the legacy passthrough is a separate compatibility surface served at `/legacy/`. No source change required — only the verification command was adjusted.
- **Files modified:** none.
- **Commit:** verification-only; documented here.

### Authentication / Architectural Pauses

None. Plan was fully autonomous.

## Threat Model Compliance

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-07-01 (DESIGN-02 violation — Google Fonts in bundle) | `grep -r 'fonts.googleapis.com\|fonts.gstatic.com' dist/ --exclude-dir=legacy` returns nothing; six WOFF2 files self-hosted under `dist/assets/` (Fontsource side-effect imports) | **mitigated** |
| T-07-02 (8 simultaneous infinite animations cause jank on low-end devices) | Reduced-motion guard disables all 8 universally + explicitly per selector (Pitfall 6); `body[data-prm='reduce']` preview hook lets reviewers eyeball without OS toggle | **mitigated** |
| T-07-03 (Token value drift during port) | 11-assertion parity test reads BOTH legacy style.css AND theme.css and requires byte-identical values across dark `:root`, legacy `@media light`, `[data-theme='light']`, `[data-theme='dark']` blocks | **mitigated** |
| T-07-04 (Future reduced-motion gap when Phase 2 adds new animation) | Phase 1 establishes universal baseline (`animation-duration: 0.001ms !important` on `*`) so any future animation is auto-stopped under reduced motion. Per-keyframe explicit list extension is a Phase-2 review concern | **accept (as planned)** |
| T-07-05 (Malicious @import fetches arbitrary CSS) | Only `@import 'tailwindcss'` exists in theme.css (Tailwind v4 directive — bundler resolves locally). No URL @imports | **accept (as planned)** |

## Known Stubs

`src/styles/fonts.css` is intentionally near-empty (6 lines of comment). DESIGN-02 is satisfied entirely by the `@fontsource-variable/*` side-effect imports in `src/main.tsx` (already present from plan 02). The file exists for the `@import` chain in `globals.css` and as a documented home for hand-rolled `@font-face` fallbacks if RESEARCH.md assumption A2 ever needs to invert. This is by design and called out in PLAN.md frontmatter `artifacts:` and PATTERNS.md.

## Pointer to Next Plan

`.planning/phases/01-skeleton/01-08-PLAN.md` (Wave 6) — App shell + `/design-system` reference route + theme & language toggle components. Will consume:
- The `@theme` tokens here for the colour-palette section
- The animations.css gallery for the live keyframe section
- The `body[data-prm='reduce']` preview hook for the reduced-motion toggle button

## Self-Check: PASSED

**Files exist:**
- `src/styles/theme.css` — FOUND
- `src/styles/globals.css` — FOUND
- `src/styles/animations.css` — FOUND
- `src/styles/fonts.css` — FOUND
- `src/styles/__tests__/theme-tokens.test.ts` — FOUND
- `src/styles/__tests__/animations.test.ts` — FOUND

**Commits exist:**
- `c19981d` (Task 7.1) — FOUND in `git log`
- `4bc1cf4` (Task 7.2) — FOUND in `git log`

**Tests pass:** 16 passed (16). **Build:** PASS. **Typecheck:** PASS. **Lint:** 0 errors. **DESIGN-02 dist check:** clean.
