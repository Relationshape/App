# Phase 1: Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 1-Skeleton
**Areas discussed:** Router & URL scheme, State reactivity, Reduced-motion handling, i18n library

---

## Router & URL scheme

| Option | Description | Selected |
|--------|-------------|----------|
| React Router v7 + hash | Industry-standard React router. Hash routes preserve v1.0 deep links verbatim — no redirects. ~14 KB gzipped. Lowest contributor friction. | ✓ |
| TanStack Router + hash | Compile-time type-safe routes; ~12 KB gzipped. Hash routes preserve v1.0 deep links. Smaller ecosystem, steeper learning curve. | |
| React Router v7 + path with hash→path shim | Cleaner URLs (`/profile/abc`). ~30-line shim redirects v1.0 hash links once on first hit. Requires SPA fallback. | |

**User's choice:** React Router v7 + hash routing (the recommended option).
**Notes:** Resolves the explicit "TanStack Router or React Router v7 (TBD in FOUND phase)" item from `PROJECT.md`. Hash routing keeps every existing deep-link working byte-for-byte and removes any need for a redirect shim or SPA-fallback edge case. See CONTEXT.md D-01, D-02, D-03.

---

## State reactivity (Store ↔ React)

| Option | Description | Selected |
|--------|-------------|----------|
| Singleton + custom hook | Pure TS `Store` object + ~30-line hook via `useSyncExternalStore`. Zero new deps. Matches v1.0 zero-deps philosophy. | |
| Zustand | ~1 KB batteries-included store. Popular React state library. Requires re-expressing Store methods as actions. | ✓ |
| Jotai | Atomic-state model fits TS well. ~3 KB. Granular re-renders. More refactor surface vs v1.0 Store shape. | |
| React Context + useSyncExternalStore | Zero deps. Requires careful memoization and context splits to avoid re-render storms. | |

**User's choice:** Zustand (chose the proven library path over the zero-deps singleton recommendation).
**Notes:** Zustand gets a single store with the ported `Store` API expressed as actions. Bundle cost is ~1 KB. The in-memory cache requirement (CORE-03) is satisfied for free — Zustand's state IS the cache. A custom persistence middleware (not `zustand/middleware/persist`) writes the canonical blob to `localStorage["relationshape.v1"]` to keep the key/shape byte-compatible with v1.0. See CONTEXT.md D-04, D-05, D-06, D-07.

---

## Reduced-motion handling for the 8 sitewide animations

| Option | Description | Selected |
|--------|-------------|----------|
| Disable entirely | Animations stop or fall back to opacity-only transitions under `prefers-reduced-motion: reduce`. WCAG-compliant. Matches v1.0's partial intent. | ✓ |
| Simplify to subtle variants | Animations continue at lower intensity (smaller distances, slower durations). Preserves brand presence; weaker accessibility win. | |
| Hybrid: essential simplified, decorative disabled | Hero blobs simplified; silk-shimmer / spin / orb effects disabled. | |

**User's choice:** Disable entirely under reduced-motion (the recommended option).
**Notes:** Implements via a global `@media (prefers-reduced-motion: reduce)` rule plus per-keyframe `animation: none` overrides. The `<DesignSystem />` reference route surfaces a "Toggle reduced-motion preview" affordance so the behaviour can be eyeballed without changing OS settings. See CONTEXT.md D-08, D-09, D-10, D-11.

---

## i18n library approach

| Option | Description | Selected |
|--------|-------------|----------|
| Custom TS port of v1.0 `t()` | ~50 lines of TS reproducing v1.0's `t()` exactly. Typed const objects — TypeScript catches missing keys at compile time. Zero new runtime deps. | ✓ |
| react-i18next | Industry-standard React i18n. ~13 KB gzipped. Supports plurals, namespaces, lazy loading — none of which v1.0 uses. | |
| Format.js / react-intl | ICU message format. ~25 KB gzipped. Overkill for current EN+DE scope. | |

**User's choice:** Custom TS port of v1.0's `t()` (the recommended option).
**Notes:** Preserves v1.0's zero-deps philosophy and saves ~13 KB gzipped. Typed `TranslationKey` union derived from the EN map; DE map constrained to `Record<TranslationKey, string>` so missing-key bugs are caught at compile time (a real improvement over v1.0's raw-key fallback). Language detection mirrors v1.0 exactly. See CONTEXT.md D-12, D-13, D-14.

---

## Claude's Discretion

The user's four strategic picks anchor the architecture. Claude resolved the following implementation details using prior context, codebase patterns, and the v1.0 baseline; downstream researcher/planner may revisit any item that conflicts with evidence-backed concerns surfaced during research:

- **D-03** Phase 1 routes: `/` placeholder + `/design-system` only; full route table is Phase 2.
- **D-05, D-06, D-07** Zustand integration shape, custom persistence middleware (not `zustand/middleware/persist`), `lastSaveError` field for the quota toast.
- **D-11** Reduced-motion preview affordance on the design-system page.
- **D-13, D-14** Typed translation maps via `as const`; language detection mirrors v1.0.
- **D-15, D-16, D-17** TS strictness profile, ESLint flat config, `package.json` scripts.
- **D-18, D-19** Tailwind v4 `@theme` as the token source of truth; `tailwind.config.ts` kept as a thin shim to satisfy FOUND-02 wording.
- **D-20** Variable WOFF2 self-hosted fonts with `font-display: swap`.
- **D-21** `src/` layout, `@/*` path alias, `tests/fixtures/` for crypto fixtures, `public/fonts/` for fonts.
- **D-22** Legacy coexistence: move v1.0 files into `public/legacy/`; rely on SW-scope segmentation (`/legacy/` vs `/`).
- **D-23** vite-plugin-pwa `autoUpdate` + `globIgnores: ['legacy/**']`; SW disabled in dev.
- **D-24** Crypto fixture sourcing: manual one-time capture from running v1.0, committed under `tests/fixtures/` with a documented regeneration procedure.
- **D-25** Vitest environment: `node` for crypto/storage/i18n/data, `jsdom` only for the `<App />` smoke render.
- **D-26** shadcn `init` flags: TS yes, `new-york` style, CSS variables yes, RSC no, the three aliases.
- **D-27, D-28** Design-system route layout: single scroll page, five sections, only adds shadcn `Button` in Phase 1.

## Deferred Ideas

- Bundle-size CI enforcement (size-limit / similar) — v2.1+ (QUAL-03).
- Broader Vitest unit coverage (storage edges, armor variants, i18n parity check) — v2.1 (QUAL-01).
- Playwright E2E — explicitly out of scope for v2.0.
- "Simplify instead of disable" reduced-motion mode — revisit only if user feedback prefers subtle motion to none.
- Legacy retirement (`public/legacy/` removal) — Phase 3 (PWA-07), not Phase 1.
