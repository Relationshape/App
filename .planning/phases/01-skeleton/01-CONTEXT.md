# Phase 1: Skeleton - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up the v2.0 toolchain (Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui + vite-plugin-pwa + Vitest + Testing Library), port the four pure (non-UI) v1.0 modules to TypeScript with backward-compatible runtime behaviour, and reproduce the Celestial Map aesthetic as a Tailwind-based design system with self-hosted fonts and reduced-motion-guarded animations — exposed via a `<DesignSystem />` reference route at `/design-system`.

**In scope:**
- Project scaffolding, build/test scripts, lint/format/typecheck pipeline
- TypeScript port of `Store`, `crypto`, `data`, `i18n` with v1.0 fixture-backed parity tests
- Quota-error fix (CORE-02) and in-memory cache (CORE-03) baked into the ported `Store`
- Tailwind theme reproducing every `:root` token from `css/style.css`; self-hosted DM Sans + Playfair Display
- Eight `@keyframes` reproduced; full `prefers-reduced-motion: reduce` guard
- `<DesignSystem />` reference route for eyeball parity against v1.0
- Vite serves the legacy app at `/legacy/` for cross-checking

**Out of scope (deferred to Phase 2):**
- Any actual user-facing view (welcome, home, profile, questionnaire, result, share, import, compare, settings)
- React Router routes other than `/` (placeholder) and `/design-system`
- Toast / dialog primitives integrated into a real flow
- App shell / nav component beyond the design-system route
</domain>

<decisions>
## Implementation Decisions

### Router and URL scheme

- **D-01:** **React Router v7** is the routing library. Bundle ~14 KB gzipped, mainstream ecosystem, smallest contributor friction. Resolves the "TanStack Router or React Router v7 (TBD in FOUND phase)" item from `PROJECT.md` Key Decisions.
- **D-02:** **Hash routing** is preserved (`#/profile/abc`, `#/q/:profileId/:resultId`, etc.). v1.0 deep links resolve verbatim — no redirect shim, no SPA fallback complexity. Use `createHashRouter` + `<RouterProvider />` (data-router API) so future loaders / actions are an option without re-platforming.
- **D-03:** Phase 1 wires only two routes: `/` (placeholder showing the Vite + React skeleton is alive) and `/design-system` (DESIGN-06). The full route table from SHELL-01 is a Phase 2 concern.

### State reactivity (how `Store` connects to React)

- **D-04:** **Zustand** is the state primitive. The ported `Store` exposes its read methods (`getProfile`, `getResult`, `getImports`, `getSettings`, `getScale`, etc.) and write actions (`saveResult`, `createProfile`, `setTheme`, `setLang`, `replaceAll`, etc.) on a single Zustand store. ~1 KB gzipped; selector-based subscriptions; well-trodden in 2026 React. Replaces the v1.0 singleton import pattern (`import { Store } from "./storage.js"`).
- **D-05:** The in-memory cache (CORE-03) lives **inside the Zustand store state** itself — that is the cache. Read selectors return slices of state without re-parsing `localStorage`. The store's persistence middleware (custom, not `zustand/middleware/persist` — see D-06) writes the full canonical blob to `localStorage["relationshape.v1"]` on every action.
- **D-06:** **Do not use `zustand/middleware/persist`** because its `version` / migration model doesn't match v1.0's stored shape and the key must remain `relationshape.v1` byte-for-byte. Instead, write a small custom middleware (`relationshapePersist`) that:
  - On store init: loads `localStorage["relationshape.v1"]`, runs `migrateScale` if needed, hydrates state.
  - On any action: serializes the canonical slice (`{ profiles, results, imports, settings, scale }`) and calls `localStorage.setItem(KEY, JSON.stringify(...))` inside a try/catch.
  - On `QuotaExceededError`: leaves the in-memory state intact but dispatches a `lastSaveError` field that the UI subscribes to and surfaces as a toast (CORE-02).

### Quota error handling (CORE-02)

- **D-07:** `Store.save()` does not throw on quota overflow. Instead, the persistence middleware sets a `lastSaveError` field on store state with shape `{ kind: 'QUOTA_EXCEEDED' | 'UNKNOWN', message: string, at: number } | null`. The UI subscribes via a selector and shows a toast; calling code can also branch on the return value of an action.

### Animations & reduced-motion (DESIGN-03, DESIGN-04)

- **D-08:** All eight `@keyframes` (`heroBlobPulse`, `holoOrbDrift`, `holoBtnSpin`, `holoIconSpin`, `holoUnderlineSlide`, `iridShift`, `bgPulse`, `silkShift`) are reproduced as **CSS keyframes in a global stylesheet** (`src/styles/animations.css`) — not Tailwind animation utilities. They're multi-property and reused across many surfaces; component-scoped CSS or utility-soup loses readability.
- **D-09:** Component-level transitions (hover, focus, modal enter/exit) use Tailwind utilities with `motion-safe:` / `motion-reduce:` variants.
- **D-10:** Under `prefers-reduced-motion: reduce`, all eight keyframes are **disabled entirely** — a single global `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; } }` rule plus per-keyframe `animation: none` overrides. Hero-section opacity and any layout-relevant transitions degrade to instant. WCAG 2.1 SC 2.3.3 compliant. Matches v1.0's partial intent.
- **D-11:** The `<DesignSystem />` reference route renders every animation inline so the reduced-motion behaviour can be eyeballed by toggling the DevTools "Emulate CSS prefers-reduced-motion: reduce" flag.

### i18n port (CORE-06)

- **D-12:** **Custom TS port of v1.0's `t()`** — not `react-i18next`. ~50 lines of TS reproducing the lookup chain (current lang → English fallback → raw key), the `{var}` interpolation syntax, and `getLocalizedDefaultScale`. Zero new runtime deps. EN + DE translation maps live as typed `const` objects so TypeScript catches missing keys at compile time.
- **D-13:** A derived `TranslationKey` union (`keyof typeof EN`) is exported. Both `EN` and `DE` are constrained to `Record<TranslationKey, string>` — every key in EN must exist in DE, enforced by the type checker. This eliminates the v1.0 "missing translation falls back to raw key" failure mode for any key present at build time.
- **D-14:** Language detection mirrors v1.0: `navigator.language` prefix match on first visit, overridable via UI, persisted in the Zustand store's settings slice (which writes to `localStorage`).

### TypeScript & lint baseline (FOUND-05)

- **D-15:** **Full strict mode.** `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`. Aligns Phase 1 type discipline with the rest of the migration.
- **D-16:** ESLint flat config (`eslint.config.js`) with `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`. Prettier handles formatting (`.prettierrc` with project defaults: single quotes, no semi → match v1.0 style for the legacy files we still touch).
- **D-17:** `package.json` scripts: `dev`, `build`, `preview`, `test` (Vitest), `test:ui` (Vitest UI), `typecheck` (`tsc --noEmit`), `lint`, `format`.

### Tailwind v4 design tokens (DESIGN-01, FOUND-02)

- **D-18:** **CSS-first `@theme` block** is the source of truth for design tokens — Tailwind v4's idiomatic path. `src/styles/theme.css` declares `@theme { --color-bg, --color-surface, --color-primary, --color-accent, --radius, --shadow, ... }`, mirroring every `:root` token from `css/style.css`. `tailwind.config.ts` is kept as a **thin shim** for `content` paths and plugin registration (satisfies FOUND-02's `tailwind.config.ts` wording — it exists and is the build entry — without forcing v3-style JS-config token definitions on a v4 project).
- **D-19:** Dark default / light override pattern from v1.0 is preserved by scoping tokens with `[data-theme="dark"]` / `[data-theme="light"]` selectors inside the same theme stylesheet. Theme is applied via `data-theme` on `<html>` by a `useTheme()` hook reading from the Zustand store. Three-way toggle: `auto` / `light` / `dark`. `auto` mode follows `prefers-color-scheme`.

### Self-hosted fonts (DESIGN-02)

- **D-20:** **Variable WOFF2** for both DM Sans (300–700, optical sizing 9–40) and Playfair Display (400–900, italic variants). Single file per family per axis-pair. Files in `public/fonts/`. `@font-face` declarations in `src/styles/fonts.css`. `font-display: swap` to match v1.0 perceived behaviour. Production build contains zero references to `fonts.googleapis.com` or `fonts.gstatic.com` (verified by a build-output grep in Phase 1's verification step).

### Project structure & build

- **D-21:** New TS source under `src/`. Path alias `@/*` → `src/*` (shadcn default). Crypto fixture(s) under `tests/fixtures/`. Self-hosted fonts under `public/fonts/`.
- **D-22:** **Legacy coexistence at `/legacy/`.** Move v1.0's `index.html`, `js/`, `css/`, `sw.js`, `manifest.json`, `icons/` into `public/legacy/` (preserving paths). Vite serves `public/` as the static root, so `/legacy/index.html`, `/legacy/js/app.js`, `/legacy/css/style.css` all resolve. The legacy SW registers at `/legacy/sw.js` with implicit scope `/legacy/` — does not conflict with the new app's SW (scope `/`). `localStorage["relationshape.v1"]` is shared by both (same origin), which is the desired behaviour during migration.
- **D-23:** **vite-plugin-pwa** `registerType: 'autoUpdate'`, Workbox precaches the build manifest, navigation fallback to `/index.html`. `devOptions.enabled = false` (no SW in dev) for fast iteration; `devOptions.navigateFallback = '/index.html'` only matters in prod. Add `globIgnores: ['legacy/**']` so vite-plugin-pwa does **not** try to precache the legacy app — it's a separate concern with its own SW.

### Crypto fixture sourcing (CORE-04)

- **D-24:** A v1.0-produced fixture bundle is captured **once, manually** before Phase 1 execution and committed to `tests/fixtures/v1-bundle.rshape.txt` together with the known-good passphrase recorded in a sibling `v1-bundle.fixture.ts` exporting `{ ARMORED, PASSPHRASE, EXPECTED_PAYLOAD }`. The Vitest round-trip test:
  1. Decrypts `ARMORED` with `PASSPHRASE` → asserts deep-equal to `EXPECTED_PAYLOAD`.
  2. Re-encrypts `EXPECTED_PAYLOAD` with a fresh passphrase → decrypts → asserts round-trip parity.
  3. Asserts byte-shape of the AES-GCM envelope: `kdf.iters === 250000`, `kdf.hash === 'SHA-256'`, `salt.length === 16`, `iv.length === 12`, `magic === 'RSHAPE'`, `v === 'v1'`.
- **D-25:** Vitest test environment is **`node`** for crypto / storage / i18n / data — Node 22+ exposes `globalThis.crypto.subtle` natively. **`jsdom`** is the env for the `<App />` smoke render only. Configured per-file via `// @vitest-environment` directive or per-glob in `vitest.config.ts`.

### shadcn/ui initialisation (FOUND-03)

- **D-26:** `npx shadcn@latest init` with: TypeScript yes, style `new-york`, base color `slate` (placeholder — design tokens override it via `theme.css`), CSS variables yes, RSC no (this is a SPA, not Next.js), `tailwind.config.ts` location at root, components alias `@/components`, utils alias `@/lib/utils`, ui alias `@/components/ui`. No components added in Phase 1 — Phase 2 adds them on demand (Dialog, Sonner, Tabs, Sheet, Slider, etc.).

### `<DesignSystem />` reference route (DESIGN-06)

- **D-27:** Single-page scroll at `/design-system` with five sections, each rendered with real markup (not screenshots): **(1) Theme toggle + language toggle in header**, **(2) Colour palette grid** (every token from `theme.css`), **(3) Typography scale** (DM Sans body sizes + Playfair Display heading sizes), **(4) Animation gallery** (all 8 keyframes shown live, each labeled, each with a "disable for reduced-motion" preview), **(5) Surface samples** (glass, card, button variants).
- **D-28:** No new shadcn primitives required for the design-system page itself — it's plain HTML + Tailwind. shadcn `Button` is the only thing added (for the theme toggle) — satisfies the FOUND-03 acceptance criterion that "adding a `Button` via `npx shadcn@latest add` succeeds".

### Claude's Discretion

The user's strategic picks (D-01, D-04, D-08–D-10, D-12) anchor the architecture. The remaining decisions (D-02, D-03, D-05–D-07, D-11, D-13–D-28) are implementation details Claude resolved using prior context, codebase patterns, and the v1.0 baseline. Downstream researcher/planner should treat these as the working defaults but may revisit any item that conflicts with an evidence-backed concern surfaced during research (e.g., if the SW scope assumption in D-22 doesn't hold in practice).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level intent
- `.planning/PROJECT.md` — Milestone v2.0 scope, locked tech-stack decisions, privacy guarantee, data/bundle compatibility constraints, Key Decisions table
- `.planning/REQUIREMENTS.md` §FOUND/§CORE/§DESIGN — All 21 Phase-1 requirements with explicit acceptance text
- `.planning/ROADMAP.md` §"Phase 1: Skeleton" — Goal statement and 8 success criteria the verifier will check against

### v1.0 codebase (must achieve parity with)
- `.planning/codebase/STACK.md` — v1.0 browser-API surface, no-build constraints, font CDN gap
- `.planning/codebase/ARCHITECTURE.md` — Layer responsibilities, the Store/data/crypto/i18n contracts being ported
- `.planning/codebase/STRUCTURE.md` — File layout, naming conventions, where v1.0 entry points live
- `.planning/codebase/CONVENTIONS.md` — JS/CSS naming, `h()` and `Store` patterns being replaced, i18n key conventions
- `.planning/codebase/CONCERNS.md` §Tech Debt and §Security — Specifically: `Store.save()` quota bug (drives CORE-02), Google Fonts gap (drives DESIGN-02), missing reduced-motion guards (drives DESIGN-04), no-test gap (drives FOUND-06)
- `.planning/codebase/TESTING.md` — Current zero-test baseline and the high-priority test surfaces (crypto round-trip, scale migration, i18n parity) that Phase 1 must seed

### v1.0 source files being ported
- `js/storage.js` — `Store` API (305 lines) → target shape for TypeScript port (D-04, D-05)
- `js/crypto.js` — `encryptResult` / `decryptResult` / `parseArmor` (136 lines) — byte-for-byte compat target (D-24)
- `js/data.js` — `CATEGORIES`, `DEFAULT_SCALE`, `SPIDER_AXES`, `CATEGORY_GROUPS`, `FILE_FORMAT` (870 lines) — content-frozen, just typed
- `js/i18n.js` — `TRANSLATIONS`, `t()`, `getLocalizedDefaultScale`, `DEFAULT_SCALE_DE` (778 lines) → drives D-12–D-14
- `css/style.css` `:root` block — every design token enumerated (drives D-18)
- `css/additions.css` `@keyframes` blocks — eight animations (drives D-08, D-10)
- `index.html` — Google Fonts links being replaced (D-20)
- `sw.js` — Legacy SW being replaced by vite-plugin-pwa (D-23)

### External documentation researcher should consult
- React Router v7 docs — `createHashRouter` API, data-router migration notes
- Tailwind CSS v4 docs — `@theme` directive, CSS-first config, dark-mode variant configuration
- shadcn/ui CLI docs — `init` flags, new-york style, RSC opt-out
- Zustand docs — `create`, selectors, custom middleware (no `persist` — see D-06)
- vite-plugin-pwa docs — `registerType`, `workbox.globIgnores`, `devOptions`
- Vitest docs — `environment` config, `// @vitest-environment` directive

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

**Pure logic ready to TypeScript-ify (minimal behavioural change required):**
- `js/storage.js:57` — `Store` object with 30+ methods. The whole surface ports 1:1 to a Zustand store's actions; field names, ID generators, and the `migrateScale` helper stay verbatim.
- `js/crypto.js:55` — `encryptResult(payload, passphrase)`. Pure WebCrypto; ports to TS without changing a single byte of behaviour. Add type signatures `(payload: ResultPayload, passphrase: string) => Promise<string>`.
- `js/data.js:20` — `CATEGORIES` array. Drop into a `const` with `as const` and derive types. No content edits.
- `js/i18n.js:6` — `TRANSLATIONS` map. Split into `en.ts` and `de.ts` exporting typed maps. `t()` becomes a 50-line TS function.

**Crypto envelope constants (do not change):**
- `js/crypto.js:15` — `PBKDF2_ITERS = 250_000`, `VERSION = "v1"`, `HEADER = "-----BEGIN RELATIONSHAPE-----"`, `FOOTER = "-----END RELATIONSHAPE-----"`.

**Design tokens already enumerated:**
- `css/style.css:1-100` `:root` block — every variable Phase 1 needs to model in `@theme`.

### Established Patterns

- **Dark-default theming with `data-theme` override.** v1.0 sets tokens on `:root` then overrides under `@media (prefers-color-scheme: light)` and `[data-theme="..."]`. D-19 preserves this exactly — Tailwind's `dark:` variant is layered on top but the source of truth stays CSS vars.
- **Single localStorage key `relationshape.v1`** is **locked** by users' existing data (PROJECT.md constraint). Zustand custom middleware must write to this key only, with the canonical blob shape `{ profiles, results, imports, settings, scale }`.
- **`v1` bundle format** is **locked**. Magic = `"RSHAPE"`, `v = "v1"`, KDF/cipher fields unchanged. Test fixture is authoritative (D-24).
- **Hash-routing scope.** v1.0 nav uses relative hashes (`navigate("/welcome")` → sets `location.hash = "#/welcome"`). React Router's `createHashRouter` handles this exact shape with no remapping.

### Integration Points

- **Legacy app at `/legacy/`** (D-22): physical move of `index.html`, `js/`, `css/`, `sw.js`, `manifest.json`, `icons/` into `public/legacy/`. Verify SW scope after the move with `navigator.serviceWorker.getRegistrations()` in the browser console.
- **shadcn target dir**: `src/components/ui/` (D-26). The single Phase-1 `Button` lands here.
- **PWA manifest**: vite-plugin-pwa generates `manifest.webmanifest`. v1.0's `manifest.json` is moved under `/legacy/` and is not the production manifest anymore. **However** the icon SVGs in `icons/` should be **copied** (not just moved) into `public/icons/` so vite-plugin-pwa's manifest config can reference them at the root — Phase 1 verification confirms 192×192 + 512×512 SVG icons are produced.
- **Test fixture seeding** (D-24): the v1.0 fixture bundle is generated by opening the legacy app at `/legacy/`, creating one canned profile + one canned result, hitting Share with a known passphrase, copying the armored output into `tests/fixtures/v1-bundle.rshape.txt`. Document the procedure in a `tests/fixtures/README.md` so the fixture can be regenerated if v1.0 ever changes its envelope shape (it won't, but document it).

</code_context>

<specifics>
## Specific Ideas

- **Bundle-size budget** (`PROJECT.md` Constraints): ≤ ~250 KB initial JS gzip. Phase 1's stack adds React (~45 KB), React Router v7 (~14 KB), Zustand (~1 KB), shadcn `Button` (~1 KB) ≈ 61 KB baseline. Tailwind v4 emits CSS only. Plenty of headroom for Phase 2's full component set.
- **Reduced-motion eyeball test**: the `<DesignSystem />` page should make the reduced-motion guard visible — e.g., a "Toggle reduced-motion preview" button that adds a `data-prm="reduce"` attribute on `<body>` and a paired CSS rule `body[data-prm="reduce"] *` mirroring the `@media` block. Lets a reviewer verify without changing OS settings.
- **v1.0 fixture inputs** (when generating `v1-bundle.rshape.txt`): use a profile named `"Test Subject"`, emoji `"🌱"`, accent colour `#7c83ff`, one result with `enabledCategories` covering at least three categories, two custom items, one `__hidden` item. Provides coverage for `migrateScale` and the hidden-item semantics tests.

</specifics>

<deferred>
## Deferred Ideas

- **Bundle-size CI enforcement** (QUAL-03 in REQUIREMENTS.md v2.1+) — set up `size-limit` or equivalent. Defer to milestone v2.1; Phase 1 only needs a one-time manual check that we're under budget.
- **Broader Vitest coverage** (QUAL-01) — Phase 1 adds the minimum required smoke + crypto round-trip + scale-migration tests. Storage edge cases, armor-parse variants, and i18n parity-check tests are v2.1.
- **Playwright E2E** (QUAL-02) — out of scope for v2.0 entirely. Vitest + manual deploy walk (PWA-08) carry verification.
- **Animation simplify-instead-of-disable mode** — user picked "disable entirely" for reduced-motion (D-10). If accessibility feedback later prefers subtle motion to none, revisit in a Phase 2 or v2.1 polish pass.
- **Legacy retirement** — `public/legacy/` directory removal is **Phase 3** work (PWA-07). Phase 1 only adds it; do not remove until cutover.

</deferred>

---

*Phase: 1-Skeleton*
*Context gathered: 2026-05-15*
