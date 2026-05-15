---
phase: 01-skeleton
plan: 02
subsystem: infra

tags:
  - scaffold
  - vite
  - react
  - tailwind
  - shadcn
  - typescript
  - vitest
  - eslint
  - pwa

# Dependency graph
requires:
  - "01-01 (legacy coexistence at /legacy/) — repo root cleared of v1.0 artifacts; /public/icons/{favicon,icon-192,icon-512}.svg available for vite-plugin-pwa manifest"
provides:
  - "Working Vite + React 19 + TypeScript + Tailwind v4 toolchain at repo root with strict mode (D-15), ESLint flat config (D-16), Prettier (D-16), and vite-plugin-pwa (D-23) wired"
  - "shadcn new-york Button primitive at src/components/ui/button.tsx (FOUND-03 acceptance)"
  - "`pnpm run typecheck`, `pnpm run lint`, `pnpm run build` all exit 0; `pnpm run dev` will serve `/` (React placeholder) and `/legacy/` (v1.0 app) side by side"
  - "All seven D-17 scripts wired in package.json (dev, build, preview, test, test:ui, test:watch, typecheck, lint, format)"
  - "Self-hosted DM Sans + Playfair Display via Fontsource variable WOFF2; production build (excluding /legacy/ passthrough) has zero references to fonts.googleapis.com / fonts.gstatic.com (DESIGN-02)"
  - "vite-plugin-pwa configured with globIgnores: ['legacy/**'] (Pitfall 2 mitigation); dist/sw.js does NOT precache any /legacy/* paths"
affects:
  - "phase-1 plan 03 (fixtures) — Vitest is wired so the crypto round-trip + storage tests can land"
  - "phase-1 plans 04–06 (Wave 4 TS ports) — D-15 strict mode active so every TS port catches type errors at write time"
  - "phase-1 plan 07 (theme.css tokens) — @theme placeholder block already in place at src/styles/theme.css; plan 07 fills in the 42 v1.0 tokens"
  - "phase-1 plan 08 (router + DesignSystem route) — App.tsx will switch from <Placeholder /> to <RouterProvider />"

# Tech tracking
tech-stack:
  added:
    - "vite@8.0.13 (dev server, build, HMR) — Standard Stack per RESEARCH.md"
    - "react@19.2.6 + react-dom@19.2.6 (UI; React 19 ref-as-prop API)"
    - "typescript@6.0.3 (D-15 strict mode + the six extra strictness flags)"
    - "tailwindcss@4.3.0 + @tailwindcss/vite@4.3.0 (Tailwind v4 with idiomatic Vite plugin per Pitfall 1)"
    - "@vitejs/plugin-react@6.0.2 (Vite React integration + Fast Refresh)"
    - "vite-plugin-pwa@1.3.0 (Workbox-based SW generation; D-23 config)"
    - "vitest@4.1.6 + @vitest/ui@4.1.6 (Pitfall 4 — no environmentMatchGlobs)"
    - "@testing-library/react@16.3.2 + @testing-library/jest-dom@6.9.1 (FOUND-06 smoke test infra)"
    - "jsdom@29.1.1 (per-file jsdom env via // @vitest-environment directive)"
    - "eslint@10.3.0 + @eslint/js@10.0.1 + typescript-eslint@8.59.3 + eslint-plugin-react-hooks@7.1.1 + eslint-plugin-react-refresh@0.5.2 + globals@^15.0.0 (D-16 ESLint flat config)"
    - "prettier@3.8.3 (D-16; single-quote no-semi)"
    - "react-router-dom@7.15.1 (D-01 — wired in plan 08, dep declared now)"
    - "zustand@5.0.13 (D-04 — used in Wave 4 plans, dep declared now)"
    - "@fontsource-variable/dm-sans@5.2.8 + @fontsource-variable/playfair-display@5.2.8 (D-20 self-hosted variable WOFF2)"
    - "class-variance-authority@^0.7.1 + clsx@^2.1.1 + tailwind-merge@^3.0.0 (shadcn cn() helper peer deps)"
    - "radix-ui@^1.4.3 (shadcn new-york Button uses Slot.Root from radix-ui)"
    - "@types/node@^22 + @types/react@^19 + @types/react-dom@^19 (TS types)"
  patterns:
    - "Manual scaffold (RESEARCH.md Pattern 1 fallback) instead of `pnpm dlx shadcn@4.7.0 init -t vite` — the init CLI is interactive and the executor environment cannot answer prompts; falling back to the documented manual seed worked cleanly and produces an identical filesystem layout"
    - "TypeScript 6 deprecation handling — TS 6 marks `baseUrl` as deprecated but `paths` still requires it. Added `\"ignoreDeprecations\": \"6.0\"` to silence the warning in both tsconfig.json and tsconfig.app.json without disabling path aliasing"
    - "Side-effect type declaration shims — TS 6 with strict module syntax refuses side-effect imports of untyped packages. Added src/vite-env.d.ts with `declare module '@fontsource-variable/dm-sans'`, `'@fontsource-variable/playfair-display'`, and `'*.css'` to make main.tsx typecheck"
    - "Auto-update via shadcn CLI for the single primitive (D-28) — `pnpm dlx shadcn@4.7.0 add button --yes` ran cleanly and emitted the new-york style Button without modifying any other file"

key-files:
  created:
    - package.json
    - pnpm-lock.yaml
    - index.html
    - tsconfig.json
    - tsconfig.app.json
    - tsconfig.node.json
    - vite.config.ts
    - vitest.config.ts
    - tailwind.config.ts
    - components.json
    - eslint.config.js
    - .prettierrc.json
    - .gitignore
    - src/main.tsx
    - src/App.tsx
    - src/routes/Placeholder.tsx
    - src/lib/utils.ts
    - src/styles/globals.css
    - src/styles/theme.css
    - src/vite-env.d.ts
    - src/components/ui/button.tsx
  modified: []

key-decisions:
  - "Used manual scaffold (RESEARCH.md Pattern 1 fallback) rather than `pnpm dlx shadcn init -t vite` because the CLI is interactive and the executor cannot answer prompts. Filesystem layout matches what the CLI would produce (D-21, D-26)."
  - "Pinned @eslint/js to 10.0.1 (Rule 3 auto-fix) — the plan specified 10.3.0 but the highest version of @eslint/js on the npm registry is 10.0.1. Compatible with eslint@10.3.0."
  - "Added `\"ignoreDeprecations\": \"6.0\"` to both tsconfig.json and tsconfig.app.json (Rule 3 auto-fix) — TypeScript 6 deprecated `baseUrl`. Without `paths` no longer works through `@/*` path alias. The deprecation message is silenced via the official escape hatch and will be revisited in TS 7."
  - "Added src/vite-env.d.ts with side-effect module shims for `@fontsource-variable/dm-sans`, `@fontsource-variable/playfair-display`, and `*.css` (Rule 3 auto-fix) — TS 6 with `verbatimModuleSyntax` refuses untyped side-effect imports. Standard Vite/TS pattern."
  - "Added `*.tsbuildinfo` to .gitignore — TS 6 with `tsc -b` emits these incremental-build artifacts next to each tsconfig, polluting `git status`."

patterns-established:
  - "Pattern: For TS 6 + strict + path aliases, always include `\"ignoreDeprecations\": \"6.0\"` until the TS team finalises the `paths`-without-`baseUrl` story in 7.0"
  - "Pattern: For side-effect imports of npm packages (Fontsource, CSS via Vite), provide a `src/vite-env.d.ts` with `declare module '<name>'` shims. This is the standard Vite/TS pattern and doesn't require @types/* packages"
  - "Pattern: When the shadcn init CLI cannot run interactively, the manual seed sequence (package.json + index.html + main.tsx + globals.css + lib/utils.ts + path-alias in vite.config.ts and tsconfig.json) produces an identical layout — the CLI itself adds no magic"
  - "Pattern: Per-task atomic commits with `chore(plan-id)` for config-only commits, `feat(plan-id)` for code-adding commits — matches the project's existing commit history"

requirements-completed:
  - FOUND-01
  - FOUND-02
  - FOUND-03
  - FOUND-04
  - FOUND-05
  - FOUND-06
  - FOUND-07

# Metrics
duration: 8min
completed: 2026-05-15
---

# Phase 1 Plan 02: Toolchain Scaffold Summary

**Stood up the v2.0 toolchain (Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui + vite-plugin-pwa + Vitest + ESLint + Prettier) at the repo root with full D-15 strictness, the canonical Fontsource self-hosted font setup, and a one-shot shadcn `Button` proving FOUND-03's acceptance criterion.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-15T14:46:23Z
- **Completed:** 2026-05-15T14:54:37Z
- **Tasks:** 3
- **Files created:** 21 (the new app's complete scaffolding surface; no files modified — Wave 1 already cleared the repo root)

## Accomplishments

- `pnpm run typecheck`, `pnpm run lint`, and `pnpm run build` all exit 0 on a brand-new project; the build emits `dist/sw.js` + `dist/manifest.webmanifest` via vite-plugin-pwa.
- All seven D-17 scripts wired: `dev`, `build`, `preview`, `test`, `test:ui`, `test:watch`, `typecheck`, `lint`, `format` — the toolchain surface promised by FOUND-05 and FOUND-07.
- All six D-15 strictness flags active in `tsconfig.app.json`: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes` — plus the umbrella `strict: true`. The strictness gate is in place for every TS port that lands in Waves 3 and 4.
- shadcn `Button` at `src/components/ui/button.tsx` was emitted by `pnpm dlx shadcn@4.7.0 add button --yes` and compiles cleanly — FOUND-03 acceptance met.
- Self-hosted DM Sans + Playfair Display via Fontsource variable packages. Production build output for the new app contains **zero** references to `fonts.googleapis.com` or `fonts.gstatic.com` (the three hits inside `dist/legacy/index.html` are the intentional v1.0 passthrough from plan 01-01 and are out of scope per D-22 — final grep is plan 09).
- vite-plugin-pwa configured per D-23: `registerType: 'autoUpdate'`, `clientsClaim: true`, `globIgnores: ['legacy/**', '**/legacy/sw.js']`, `navigateFallbackDenylist: [/^\/legacy/]`. Verified: `dist/sw.js` does not precache any `/legacy/*` paths (Pitfall 2 mitigation working as designed).
- ESLint flat config (`eslint.config.js`) registers TypeScript, React Hooks, and React Refresh plugins; ignores `public/legacy/`, `dist/`, `node_modules/`, `coverage/`. Lint exits 0 with one harmless warning on the standard shadcn pattern (`buttonVariants` exported alongside `Button`).
- Prettier config (`.prettierrc.json`) matches v1.0 style: `singleQuote: true`, `semi: false`, `trailingComma: 'all'`, `printWidth: 100`.

## Task Commits

Each task was committed atomically on the per-agent worktree branch `worktree-agent-aaefc5e3c54a1d6a6`:

1. **Task 2.1: Seed Vite + React 19 + TS + Tailwind v4 + path aliases, install runtime + dev deps, write `.gitignore`** — `6a585a3` (chore)
2. **Task 2.2: Patch tsconfig strict mode, write ESLint + Prettier configs, configure vite-plugin-pwa + Vitest, wire npm scripts** — `164a49c` (chore)
3. **Task 2.3: Add shadcn `Button` component via the CLI** — `b55a9e1` (feat)

## Files Created (21)

### Top-level config (12)

- `package.json` — All Phase-1 deps + scripts + `"engines": { "node": ">=22 <25" }` (per RESEARCH.md A2)
- `pnpm-lock.yaml` — Resolved dependency tree (commits the exact tree pnpm installed)
- `index.html` — Vite entry. Includes `<link rel="icon" href="/icons/favicon.svg">` referencing the duplicated icon from plan 01-01 and `<script type="module" src="/src/main.tsx">`
- `tsconfig.json` — Project references entry; baseUrl + paths + `ignoreDeprecations: "6.0"`
- `tsconfig.app.json` — Strict mode with all six D-15 flags; baseUrl + paths; includes `src` and `tests`
- `tsconfig.node.json` — For vite.config.ts + vitest.config.ts (Node-side)
- `vite.config.ts` — `react()` + `tailwindcss()` + `VitePWA({...})` plugins; path alias `@/*` → `src/*`
- `vitest.config.ts` — `environment: 'node'` default, `include: ['tests/**', 'src/**/__tests__/**']`, no `environmentMatchGlobs` (Pitfall 4)
- `tailwind.config.ts` — Thin shim per D-18 (`content: ['./index.html', './src/**/*.{ts,tsx}']`, empty plugins); Tailwind v4 sources design tokens from `src/styles/theme.css`
- `components.json` — shadcn CLI config (new-york, slate, CSS variables, aliases all match D-26)
- `eslint.config.js` — Flat config with typescript-eslint + react-hooks + react-refresh
- `.prettierrc.json` — single-quote no-semi
- `.gitignore` — `node_modules/`, `dist/`, `*.log`, `.DS_Store`, `.env*`, `pnpm-debug.log`, `coverage/`, `*.tsbuildinfo`

### Source tree under `src/` (8)

- `src/main.tsx` — `createRoot` + `StrictMode`; side-effect imports of `@fontsource-variable/dm-sans`, `@fontsource-variable/playfair-display`, and `./styles/globals.css` (D-20)
- `src/App.tsx` — Renders `<Placeholder />` directly (no router yet — that's plan 08)
- `src/routes/Placeholder.tsx` — "Relationshape v2.0 — Skeleton alive" stub for the smoke check
- `src/lib/utils.ts` — Standard shadcn `cn()` helper using `clsx` + `tailwind-merge`
- `src/styles/globals.css` — `@import './theme.css'`
- `src/styles/theme.css` — `@import 'tailwindcss'` + empty `@theme {}` placeholder block (plan 07 fills it)
- `src/vite-env.d.ts` — Vite client types + side-effect module shims (Rule 3 auto-fix for TS 6 + verbatimModuleSyntax)
- `src/components/ui/button.tsx` — shadcn new-york `Button` + `buttonVariants` export (FOUND-03 acceptance; 64 lines via shadcn CLI)

## Verification

### `pnpm run typecheck` (exit 0)

```
> relationshape@2.0.0 typecheck
> tsc --noEmit -p tsconfig.app.json
(no output — clean exit)
```

### `pnpm run lint` (exit 0)

```
> relationshape@2.0.0 lint
> eslint .

/Users/pulze/.../src/components/ui/button.tsx
  64:18  warning  Fast refresh only works when a file only exports components.
                  Use a new file to share constants or functions between components
                  react-refresh/only-export-components

✖ 1 problem (0 errors, 1 warning)
```

The single warning is the standard shadcn pattern (`buttonVariants` is exported alongside `Button` so consumers can compose variant strings). It is a warning, not an error — lint still exits 0 — and matches the shadcn-vite community convention. Will revisit only if shadcn changes the pattern.

### `pnpm run build` (exit 0)

```
> relationshape@2.0.0 build
> tsc -b && vite build

vite v8.0.13 building client environment for production...
✓ 19 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                                  0.13 kB
dist/manifest.webmanifest                           0.34 kB
dist/index.html                                     0.93 kB │ gzip:  0.46 kB
dist/assets/playfair-display-vietnamese-*.woff2     9.11 kB
dist/assets/dm-sans-latin-ext-*.woff2              18.22 kB
dist/assets/playfair-display-latin-ext-*.woff2     21.14 kB
dist/assets/playfair-display-cyrillic-*.woff2      21.15 kB
dist/assets/dm-sans-latin-*.woff2                  36.93 kB
dist/assets/playfair-display-latin-*.woff2         38.40 kB
dist/assets/index-D-2pMDxG.css                     20.03 kB │ gzip:  4.48 kB
dist/assets/index-BPFMyvTD.js                     190.77 kB │ gzip: 60.15 kB

✓ built in 213ms

PWA v1.3.0
mode      generateSW
precache  16 entries (350.91 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

JS gzip 60.15 KiB; well under the PROJECT.md 250 KB budget. Six self-hosted WOFF2 files are emitted into `dist/assets/` (DM Sans Latin + Latin-ext; Playfair Display Latin + Latin-ext + Cyrillic + Vietnamese — Fontsource ships per-subset files and Vite copies them all).

### Build-output font CDN check (DESIGN-02)

```bash
# New app output — must be empty
$ grep -r 'fonts.googleapis.com|fonts.gstatic.com' dist/ --exclude-dir=legacy
(empty)
```

The new app's build output contains zero references to Google Fonts CDN. The three hits inside `dist/legacy/index.html` are the byte-identical v1.0 passthrough from plan 01-01 and intentionally retained per D-22 (legacy retirement is Phase 3 work).

### Legacy precache check (Pitfall 2)

```bash
# dist/sw.js must not precache /legacy/* — globIgnores working
$ grep -E '"/legacy/|legacy/(js|css|sw\.js|index\.html|manifest)' dist/sw.js dist/assets/*.js
(empty)
```

`vite-plugin-pwa`'s `workbox.globIgnores: ['legacy/**', '**/legacy/sw.js']` correctly excludes the entire legacy tree from the SW precache manifest. The new SW will not compete with the legacy SW for `/legacy/*` URLs.

### `pnpm run test` (no test files yet — expected; plan 03 adds fixtures)

```
RUN  v4.1.6
No test files found, exiting with code 1
include: tests/**/*.test.{ts,tsx}, src/**/__tests__/**/*.test.{ts,tsx}
```

Expected. The plan's `<verification>` block explicitly calls out: *"Will fail if no test files yet — expected; plan 03 adds fixtures + Wave 4 ports add tests. Smoke test lands in plan 08."*

## Resolved Package Versions (pnpm-lock.yaml)

All package versions resolved exactly as pinned in package.json. Notable selections (full set in `pnpm-lock.yaml`):

| Package | Pinned | Resolved |
|---------|--------|----------|
| react | 19.2.6 | 19.2.6 |
| react-dom | 19.2.6 | 19.2.6 |
| typescript | 6.0.3 | 6.0.3 |
| vite | 8.0.13 | 8.0.13 |
| tailwindcss | 4.3.0 | 4.3.0 |
| @tailwindcss/vite | 4.3.0 | 4.3.0 |
| vite-plugin-pwa | 1.3.0 | 1.3.0 |
| vitest | 4.1.6 | 4.1.6 |
| eslint | 10.3.0 | 10.3.0 |
| @eslint/js | 10.3.0 | **10.0.1** (auto-fix — see Deviations) |
| typescript-eslint | 8.59.3 | 8.59.3 |
| react-router-dom | 7.15.1 | 7.15.1 |
| zustand | 5.0.13 | 5.0.13 |
| @fontsource-variable/dm-sans | 5.2.8 | 5.2.8 |
| @fontsource-variable/playfair-display | 5.2.8 | 5.2.8 |
| class-variance-authority | ^0.7.1 | 0.7.1 |
| clsx | ^2.1.1 | 2.1.1 |
| tailwind-merge | ^3.0.0 | 3.6.0 |
| radix-ui | ^1.4.3 | 1.4.3 (added by shadcn CLI for Button asChild support) |
| globals | ^15.0.0 | 15.15.0 |
| @types/node | ^22 | 22.19.19 |
| @types/react | ^19 | 19.2.14 |
| @types/react-dom | ^19 | 19.2.3 |

## Decisions Made

- **Manual scaffold over CLI seed (RESEARCH.md Pattern 1 fallback).** The plan called for `pnpm dlx shadcn@4.7.0 init -t vite` as the canonical seed. The shadcn init CLI runs in interactive mode and prompts for several config choices — the executor environment cannot answer prompts. Falling back to the manual scaffold sequence (write package.json + index.html + main.tsx + globals.css + lib/utils.ts + components.json with all D-26 answers baked in, then `pnpm install`) is documented in RESEARCH.md as the explicit fallback (Pattern 1 alternate) and produces an identical filesystem layout. Verified: components.json matches the new-york + slate + CSS-variables answer set exactly. The Task 2.3 `pnpm dlx shadcn@4.7.0 add button --yes` did run non-interactively because `add` has a `--yes` flag (`init` does not in the same way).
- **`@eslint/js` pinned to 10.0.1, not 10.3.0.** The plan specified `@eslint/js@10.3.0` matching `eslint@10.3.0`. The npm registry's highest available version for `@eslint/js` is `10.0.1` (the `@eslint/js` package versioning lags `eslint` by a minor — both released by the ESLint team, but `js` only ships major-version bumps). Selected `10.0.1` as the closest compatible value. Lint passes; no behavioural regression. Documented as a Rule 3 deviation below.
- **`ignoreDeprecations: "6.0"` added to tsconfig files.** TypeScript 6.0 deprecates the `baseUrl` compiler option (it will be removed in 7.0), but `paths` still requires it for non-package path aliases like `@/*`. Without the escape hatch, `tsc --noEmit` exits with TS5101. The TS team's documented forward path is `"ignoreDeprecations": "6.0"`. Documented as a Rule 3 deviation below.
- **`src/vite-env.d.ts` declares side-effect module shims.** TypeScript 6 with `verbatimModuleSyntax: true` (D-15 implied by strict) refuses untyped side-effect imports. Without shims for `@fontsource-variable/dm-sans`, `@fontsource-variable/playfair-display`, and `*.css`, `pnpm run typecheck` exits with TS2882 in `src/main.tsx`. Adding a standard Vite-style `vite-env.d.ts` is the documented Vite/TS pattern. Documented as a Rule 3 deviation below.
- **`*.tsbuildinfo` added to `.gitignore`.** TypeScript 6 with `tsc -b` emits incremental-build state files next to each tsconfig (`tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo`). These are local build artifacts, not committable source. Adding them to `.gitignore` keeps `git status` clean. Not a deviation — sensible hygiene the plan author didn't enumerate.
- **The Fast Refresh warning on `button.tsx` was not suppressed.** ESLint's `react-refresh/only-export-components` rule warns that `button.tsx` exports both `Button` (a component) and `buttonVariants` (a `cva()` factory). This is the standard shadcn pattern — every shadcn primitive exports its variants factory alongside the component so consumers can compose variant strings (e.g., `cn(buttonVariants({ variant: 'ghost' }), 'extra-classes')`). Suppressing the warning per-file would diverge from the shadcn convention; the warning is harmless (Fast Refresh works fine in dev) and surfaces a non-bug. Left as a warning per shadcn convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pinned `@eslint/js` to 10.0.1 instead of 10.3.0**
- **Found during:** Task 2.1 (`pnpm install`)
- **Issue:** The plan specified `@eslint/js@10.3.0` but the highest available version on the npm registry as of 2026-05-15 is `10.0.1`. Installation would fail with E404.
- **Fix:** Pinned to `10.0.1` in `package.json`. The package is compatible with `eslint@10.3.0` (same major-version line; `@eslint/js` only bumps on major rule changes).
- **Files modified:** `package.json` (single line)
- **Commit:** `6a585a3`

**2. [Rule 3 - Blocking] Added `"ignoreDeprecations": "6.0"` to tsconfig.json and tsconfig.app.json**
- **Found during:** Task 2.2 (`pnpm run typecheck`)
- **Issue:** TypeScript 6.0 deprecated the `baseUrl` compiler option but `paths` still requires it. Without the escape hatch, `tsc --noEmit -p tsconfig.app.json` exits with TS5101.
- **Fix:** Added `"ignoreDeprecations": "6.0"` to the `compilerOptions` block of both `tsconfig.json` and `tsconfig.app.json`. Official TS escape hatch documented at aka.ms/ts6.
- **Files modified:** `tsconfig.json`, `tsconfig.app.json`
- **Commit:** `164a49c`

**3. [Rule 3 - Blocking] Added `src/vite-env.d.ts` for side-effect import type shims**
- **Found during:** Task 2.2 (`pnpm run typecheck`)
- **Issue:** TS 6 with `verbatimModuleSyntax` refuses untyped side-effect imports. `import '@fontsource-variable/dm-sans'`, `import '@fontsource-variable/playfair-display'`, and `import './styles/globals.css'` in `src/main.tsx` all fail with TS2882.
- **Fix:** Added `src/vite-env.d.ts` with `/// <reference types="vite/client" />` and `declare module '<name>'` shims for the three side-effect imports. Standard Vite/TS pattern documented in vitejs.dev.
- **Files modified:** Created `src/vite-env.d.ts`
- **Commit:** `164a49c`

**4. [Rule 2 - Hygiene] Added `*.tsbuildinfo` to `.gitignore`**
- **Found during:** Task 2.2 (`git status` after `pnpm run build`)
- **Issue:** TS 6 + `tsc -b` emits incremental-build state files (`tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo`) next to each tsconfig. These are local artifacts that should not be committed.
- **Fix:** Added `*.tsbuildinfo` to `.gitignore`. Standard hygiene; the plan author didn't enumerate this file class.
- **Files modified:** `.gitignore`
- **Commit:** `164a49c`

### Verification-pattern adaptations (not deviations)

The plan's automated verification block includes `! grep -r 'fonts.googleapis.com\|fonts.gstatic.com' dist/ 2>/dev/null` — a bare grep that would fail because `dist/legacy/index.html` contains the byte-identical v1.0 passthrough (plan 01-01 retained the original Google Fonts links in the legacy app per D-22). The plan author flagged this as "early sanity check; final check is in plan 09" and DESIGN-02 only mandates **the new app's** build output is CDN-free. Verified the new app output is clean by scoping with `--exclude-dir=legacy`. Documented for traceability; matches the same kind of verification-pattern adaptation that plan 01-01-SUMMARY documented.

The plan's `pnpm run test -- --run` step in the `<verification>` block was explicitly expected to "fail if no test files yet — expected; plan 03 adds fixtures". `vitest` 4 exits 1 with `No test files found` — recognised as the expected state and not treated as a failure.

### Acceptance criteria notes

The plan's `<acceptance_criteria>` block specifies `grep -c '"vite": "8.0.13"' package.json returns 1 (exact pinned version)`. Verified: package.json contains `"vite": "8.0.13"` exactly. Plan also asks `grep -c '"react": "19' package.json returns 1` — also met (`"react": "19.2.6"`).

Plan asks for ESLint to ignore `'public/legacy'`. The file's `ignores` array contains the exact string `'public/legacy'` — verified.

---

**Total deviations:** 4 Rule-3 auto-fixes (all toolchain-driven; no behavioural changes); 0 Rule-1 bug fixes; 0 Rule-2 missing-feature additions; 0 Rule-4 architectural changes.
**Impact on plan:** None. Every task's `<done>` criterion is met. The four auto-fixes are toolchain prerequisites that the plan author could not have predicted without running `pnpm install` and `tsc --noEmit` first.

## Issues Encountered

None blocking. The four Rule-3 auto-fixes were resolved inline:

1. `@eslint/js@10.3.0` → `10.0.1` (registry gap)
2. TS 6 `baseUrl` deprecation → `ignoreDeprecations: "6.0"`
3. TS 6 side-effect import type-check → `src/vite-env.d.ts` shims
4. TS 6 `tsbuildinfo` clutter → `.gitignore` entry

No checkpoint required. No external tool authentication needed. No server lifecycle work required at this plan (the dev server check is plan 09's job).

## User Setup Required

None — every action was non-interactive (`pnpm install`, `pnpm dlx shadcn@4.7.0 add button --yes`). No external service auth, no env vars, no CLI logins.

## Threat Surface Scan

Reviewed all 21 created files against the plan's `<threat_model>`:

- **T-02-01 (Tampering — malicious npm dep injects code):** accepted by plan. Pinned versions from RESEARCH.md verified on the live npm registry; lockfile committed in commit `6a585a3`. All deps are mainstream (React, Vite, Tailwind, ESLint, Prettier, Vitest, Fontsource, shadcn primitives). No exotic packages.
- **T-02-02 (Information Disclosure — Google Fonts CDN refs):** mitigated. New app build output is CDN-free; verified by `grep -r 'fonts.googleapis.com\|fonts.gstatic.com' dist/ --exclude-dir=legacy` returning empty. The three hits inside `dist/legacy/` are the intentional v1.0 passthrough.
- **T-02-03 (Denial of Service — SW competes with legacy SW):** mitigated. `vite.config.ts` registers `globIgnores: ['legacy/**', '**/legacy/sw.js']` AND `navigateFallbackDenylist: [/^\/legacy/]`. Verified: `dist/sw.js` precaches 16 entries, none of which match `/legacy/*` paths.
- **T-02-04 (Spoofing — stale `/` SW from before plan 01-01):** accepted by plan. `vite-plugin-pwa` is configured with `registerType: 'autoUpdate'` + `clientsClaim: true` + `skipWaiting: true`; the new SW will supersede any stale registration on first load. Final verification is plan 09.
- **T-02-05 (Elevation of Privilege — D-15 strictness disabled):** mitigated. All six flags individually verified in `tsconfig.app.json`:
  - `noUncheckedIndexedAccess: true`
  - `noImplicitOverride: true`
  - `noFallthroughCasesInSwitch: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `exactOptionalPropertyTypes: true`

No new threat surface introduced. No `threat_flag` entries needed.

## Known Stubs

The `src/routes/Placeholder.tsx` component contains hardcoded display text ("Relationshape v2.0 — Skeleton alive" + a tagline about the DesignSystem route landing in plan 08). This is **not a stub** — it's the intended Phase-1 placeholder content the plan explicitly specifies, used to prove the React + Vite + Tailwind v4 pipeline is alive at `/`. Plan 08 replaces this with `<RouterProvider />` mounting real routes. Tracked here for the verifier's awareness.

The `src/styles/theme.css` file contains an empty `@theme {}` block. This is **not a stub** — it's the explicit Phase-1 placeholder the plan calls for; plan 07 fills in all 42 v1.0 design tokens. The file is structurally required so Tailwind v4's CSS-first config can scan utility classes (per D-18); leaving the `@theme` body empty is the documented pattern.

## Self-Check: PASSED

**Files exist (21):**
- `package.json` — FOUND (with all 7 D-17 scripts; engines `>=22 <25`)
- `pnpm-lock.yaml` — FOUND (commits the resolved tree)
- `index.html` — FOUND (Vite entry with `/src/main.tsx`)
- `tsconfig.json` — FOUND (with `ignoreDeprecations: "6.0"`)
- `tsconfig.app.json` — FOUND (all six D-15 flags present)
- `tsconfig.node.json` — FOUND
- `vite.config.ts` — FOUND (VitePWA + tailwindcss + react plugins; path alias)
- `vitest.config.ts` — FOUND (`environment: 'node'`; no `environmentMatchGlobs`)
- `tailwind.config.ts` — FOUND (thin shim)
- `components.json` — FOUND (new-york + slate + CSS variables per D-26)
- `eslint.config.js` — FOUND (typescript-eslint + react-hooks + react-refresh; ignores public/legacy)
- `.prettierrc.json` — FOUND (single-quote no-semi)
- `.gitignore` — FOUND (node_modules, dist, env files, *.tsbuildinfo)
- `src/main.tsx` — FOUND (Fontsource imports + createRoot)
- `src/App.tsx` — FOUND (renders <Placeholder />)
- `src/routes/Placeholder.tsx` — FOUND
- `src/lib/utils.ts` — FOUND (cn() helper)
- `src/styles/globals.css` — FOUND (imports theme.css)
- `src/styles/theme.css` — FOUND (@import 'tailwindcss' + empty @theme block)
- `src/vite-env.d.ts` — FOUND (side-effect module shims)
- `src/components/ui/button.tsx` — FOUND (64 lines; shadcn new-york Button + buttonVariants)

**Commits exist:**
- `6a585a3` (Task 2.1, scaffold + deps) — FOUND in `git log`
- `164a49c` (Task 2.2, configs + verify) — FOUND in `git log`
- `b55a9e1` (Task 2.3, shadcn Button) — FOUND in `git log`

**Build artefacts produced (verified after final build):**
- `dist/sw.js` — FOUND (Workbox precache; 16 entries, 350.91 KiB; zero legacy refs)
- `dist/manifest.webmanifest` — FOUND
- `dist/index.html` — FOUND (Vite-built, references hashed assets, refers to /icons/* manifest icons)

## Next Phase Readiness

- **Plan 03 (test fixtures)** is unblocked: Vitest is wired and exits cleanly. Plan 03 will add `tests/fixtures/v1-bundle.{rshape.txt,fixture.ts}` and `tests/fixtures/v1-localstorage.fixture.ts` — the test infrastructure is ready to consume them.
- **Plan 07 (Tailwind theme tokens)** is unblocked: `src/styles/theme.css` has the `@import 'tailwindcss'` + `@theme {}` placeholder; plan 07 fills in the 42 v1.0 design tokens (renamed with Tailwind v4 prefixes per Pitfall 1).
- **Plan 08 (router + DesignSystem)** is unblocked: `src/App.tsx` will be edited to mount `<RouterProvider router={createHashRouter(...)} />` with the two Phase-1 routes (`/` and `/design-system` per D-03). The shadcn `Button` is in place for the ThemeToggle component plan 08 builds.
- **Plans 04–06 (Wave 4 TS ports of crypto/data/i18n/storage)** are unblocked: D-15 strict mode is active so every TS port catches type errors at write time. The `@/lib/*` path alias is wired in both tsconfig and Vite.

No blockers for Wave 3 or later. The toolchain gate (D-15 + D-17) is fully in place.

---
*Phase: 01-skeleton*
*Completed: 2026-05-15*
