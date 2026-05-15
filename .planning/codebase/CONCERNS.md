# Codebase Concerns

**Analysis Date:** 2026-05-15

> These are areas a thoughtful contributor should understand before touching the relevant code — not a criticism of the project's approach. Relationshape is intentionally "boring and reliable": no build, no backend, no tests. That context shapes every tradeoff below.

---

## Tech Debt

**app.js monolith (~3 500 lines, 85 functions):**
- Issue: A single file mixes router, nav chrome, dialog system, intro/onboarding wizard, profile CRUD views, questionnaire flow (list + single-card modes with swipe), result view, share/import, compare, settings, map-settings, and all helper utilities (`h()`, `esc()`, `fmtDate()`, color helpers, constellation animation, SVG icon library, emoji picker).
- Files: `js/app.js` lines 1–3496
- Impact: Any change risks silently breaking an unrelated view. Searching for a specific behaviour requires scrolling past unrelated code. The route switch at `js/app.js:869–884` dispatches to 15 distinct view functions.
- Fix approach: Extract logical units into separate ES modules (`js/views/`, `js/ui/`, `js/helpers/`) as opportunities arise. Each view function is already self-contained — extraction is a copy-and-adjust, not a redesign. The no-build constraint is compatible with this: ES module imports work natively.
- Severity: **medium** — the codebase works reliably; the cost is contributor orientation time and merge conflicts when multiple views change in one PR.

**Two CSS files (~111 KB combined, 31 overlapping selectors):**
- Issue: `css/style.css` (1 538 lines, 62 KB) holds the foundational design system. `css/additions.css` (1 580 lines, 50 KB) was created for the "Celestial Map" design layer and now contains: wizard modal, how-to section, hamburger nav, language picker, enlarged spider modal, hero blobs, iridescent animations (8 `@keyframes`), and mobile/dark-mode overrides. 31 selectors appear in both files (`.avatar`, `.btn-primary`, `.card`, `.callout`, `.chip`, `.hero-features`, `.li-avatar`, `.list-item`, `.nav-links a`, `.nav-logo`, and more).
- Files: `css/style.css`, `css/additions.css`
- Impact: When debugging a visual property it is not obvious which file wins. The cascade order is `style.css` → `additions.css` (both linked in `index.html:18–19`), so `additions.css` overrides always win, but this is implicit. `.scale-btn.is-active` is defined three times across both files (`css/style.css:643`, `css/additions.css:735`, `css/additions.css:971`).
- Fix approach: Either merge into one file (safest — one truth), or formally make `additions.css` a pure extension layer by auditing the 31 overlapping selectors and deciding for each whether the `style.css` rule is dead.
- Severity: **low-medium** — no breakage today, but any new visual feature requires checking both files.

**`save()` in `storage.js` has no quota error handling:**
- Issue: `storage.js:29–31` calls `localStorage.setItem(KEY, JSON.stringify(data))` with no `try/catch`. The `load()` path at line 15 is wrapped in `try/catch`, but `save()` is not.
- Files: `js/storage.js:29`
- Impact: If the user accumulates enough profiles, results, and imports to exceed the browser's localStorage quota (~5–10 MB, browser-dependent), `save()` throws a `DOMException: QuotaExceededError`. This exception is unhandled, so the write silently fails from the user's perspective — the UI shows no error but the data is not persisted. The next page load will reload the pre-overflow snapshot, causing apparent data loss.
- Fix approach: Wrap `localStorage.setItem` in a try/catch in `save()`, catch `DOMException`, and surface a toast/alert to the user explaining that storage is full and they should export a backup.
- Severity: **high** — silent data loss is the worst possible failure mode for a personal data app.

---

## Known Bugs / Active Areas

**Emoji clipping on mobile (recurring):**
- Symptoms: Category emoji icons clip or render partially within their container on small screens. Two consecutive commits (`dc79803`, `598ebef`) addressed this in the `q-cat-icon` and list view `li-avatar` areas.
- Files: `css/style.css:573–576` (`.q-cat-icon` base), `css/style.css:345` (mobile `@media` override), `css/additions.css:679–695` (`:after` pseudo-element layer added on top)
- Trigger: Small viewport widths on iOS Safari / Android Chrome. The `q-cat-icon` has `overflow` controlled by multiple cascade layers; the `::after` pseudo-element overlay in `additions.css` can clip the emoji glyph if `line-height` and `font-size` interact unexpectedly with WebKit's emoji rasterisation.
- What to know if you touch this: The `::after` sheen overlay on `q-cat-icon` uses `position: absolute; inset: 0` — any padding or overflow change on the parent can cut off the emoji. Test on real iOS Safari at 375px width before merging.
- Severity: **medium** — cosmetic but recurring; has been fixed twice already.

**Scale dot mobile sizing (recent churn):**
- Symptoms: Scale snap-dots were too large on small screens, requiring a size reduction (commit `dc79803`). The `.scale-dot` base size is `9px × 9px` (`css/style.css:637`). Mobile overrides exist in `css/additions.css` via `@media (max-width: 380px)` and `@media (max-width: 400px)` breakpoints.
- Files: `css/style.css:637`, `css/additions.css:475`, `css/additions.css:538`
- What to know if you touch this: Scale dot sizing interacts with `.scale-btn` padding and the pointer-target size for touch — shrinking the dot can make the tap target too small on coarse-pointer devices. The questionnaire swipe handler uses `(pointer: coarse)` detection at `js/app.js:2059`.
- Severity: **low** — functional, recently stabilised, but worth regression-testing on physical devices.

---

## Security Considerations

**Google Fonts external dependency vs. "no network after first load" claim:**
- Risk: `index.html:15–17` includes `<link rel="preconnect" href="https://fonts.googleapis.com">` and loads `DM Sans` + `Playfair Display` from `fonts.googleapis.com` at runtime. The README (`README.md:73`) and the about/privacy text (`js/i18n.js:312`) state "The app never makes a network request after the first load." This is slightly inaccurate: on every first load (new browser, incognito, cache cleared), two Google Fonts requests go out — one to `fonts.googleapis.com` for the CSS, one or more to `fonts.gstatic.com` for the font binaries.
- Files: `index.html:15–17`, `sw.js:3–18`, `README.md:73`
- Current mitigation: The service worker (`sw.js:36`) only caches same-origin responses (`new URL(request.url).origin === location.origin`), so Google Fonts responses are never stored in the SW cache. The browser's HTTP cache may retain them across loads on the same browser/profile.
- Impact: Privacy-sensitive users in incognito mode or with aggressive cache-clearing will trigger Google Fonts network calls on every load. Google's font CDN sees the user's IP and browser fingerprint.
- Recommendations: Either (a) self-host the two font families (download WOFF2, add them to `sw.js:ASSETS`) and remove the Google Fonts links, or (b) update the privacy claim to say "after fonts are first loaded" or add a note about the font CDN dependency. Option (a) is the correct fix for a privacy-first PWA.
- Severity: **medium** — the app's core privacy guarantee (no data leaves the device) holds; this is a documentation/CDN gap, not a data-leakage bug. But it matters to users who specifically choose the app for privacy.

**Crypto: PBKDF2 parameters are correct:**
- `js/crypto.js:15`: `PBKDF2_ITERS = 250_000` matches the README claim. AES-GCM 256-bit. Salt is 16 random bytes per encryption (`crypto.js:56`). IV is 12 random bytes per encryption (`crypto.js:57`). AES-GCM authentication tag is implicitly validated on decrypt — a wrong passphrase throws an error caught at `crypto.js:81–83`. No known crypto correctness issues.
- Files: `js/crypto.js:15–85`
- What to know if you touch this: The `deriveKey` flag is `extractable: false` (good — key material cannot be exported). The catch block at line 81 swallows all `SubtleCrypto.decrypt` errors under one message — acceptable for UX but means a corrupted bundle and a wrong passphrase produce identical error messages.
- Severity: **low** — crypto implementation is sound.

**`replaceAll` in `storage.js` accepts arbitrary JSON snapshots:**
- Issue: `storage.js:281–291` (`Store.replaceAll`) performs a shape check but does not validate the contents of `profiles`, `results`, or `imports` arrays before writing them to localStorage. A crafted backup file could inject unexpected object shapes that later cause `undefined` dereferences in view rendering.
- Files: `js/storage.js:281–291`
- Impact: Low in practice — only the device owner can import a backup file. Not a remote attack surface.
- Severity: **low** — local threat only.

---

## Performance Bottlenecks

**Eight concurrent CSS animations on every page:**
- Problem: `additions.css` defines 8 `@keyframes` (`heroBlobPulse`, `holoOrbDrift`, `holoBtnSpin`, `holoIconSpin`, `holoUnderlineSlide`, `iridShift`, `bgPulse`, `silkShift`). Many are applied via `animation: X infinite` on `body::before`, `body::after`, `.btn-primary::before`, `.rs-modal-card::before`, `.card::after`, `.li-avatar::before`, `.scale-pill.is-active::after`, `.card-add`. These run continuously on every page, not just the welcome screen.
- Files: `css/additions.css:828–970`, `css/additions.css:1367–1410`, `css/additions.css:1398–1580`
- Cause: The "Celestial Map" design layer uses persistent silk-shimmer and blob-pulse effects sitewide.
- Impact: On low-end Android devices and battery-saver mode, continuous GPU compositing for 8+ simultaneous animations can cause jank on scroll and degrade battery life.
- Improvement path: Wrap non-essential animations in `@media (prefers-reduced-motion: no-preference)` and use `@media (prefers-reduced-motion: reduce)` to disable or simplify them. Only the `body::before` hero blobs are currently guarded (`css/additions.css:827`).
- Severity: **medium** — affects low-end/accessibility users; `prefers-reduced-motion` is a standard mitigation that is largely absent.

**`localStorage` is parsed on every Store call:**
- Problem: Every `Store.*` method calls `load()` which calls `JSON.parse(localStorage.getItem(KEY))`. On the questionnaire view, answer saves trigger `saveResult()` which calls `load()` + `save()` — two full parse/stringify cycles of the entire data blob per keypress.
- Files: `js/storage.js:15–31`, `js/storage.js:94–107`
- Cause: Simplicity over caching — there is no in-memory cache of the parsed state.
- Impact: Negligible for small datasets. With dozens of profiles and hundreds of answered items, `JSON.stringify` of the entire blob on every keystroke could introduce perceptible lag on low-end phones.
- Improvement path: Add a module-level in-memory cache (`let _cache = null`) that is invalidated only on `save()`. Low risk, significant read-path speedup.
- Severity: **low** — acceptable for current data volumes; worth knowing if the data model grows.

---

## Fragile Areas

**Service worker update strategy — manual cache version bump:**
- Files: `sw.js:2`
- Why fragile: The cache name is the string literal `"rshape-v9"`. Bumping to deploy a fix requires editing `sw.js` to change this string. If a deployment ships updated JS/CSS files without bumping the cache name, existing installed PWA clients will continue serving stale assets until the user force-refreshes or the browser evicts the cache. The worker does call `self.skipWaiting()` on install (`sw.js:21`) and `self.clients.claim()` on activate (`sw.js:24`), which shortens the stale window — new workers activate immediately without waiting for all tabs to close. However, the stale-while-serving pattern means a user who opens the app offline after a cache-name bump will get the new SW but may see a blank screen if `./index.html` falls back to the old (deleted) cache key.
- Safe modification: Always increment the `CACHE` string when deploying any change to assets listed in `ASSETS`. Consider deriving the version from a build timestamp or git SHA if the project ever adopts a deployment pipeline.
- Severity: **medium** — the `skipWaiting` + `clients.claim` pattern mitigates most cases; the risk is mainly "contributor forgets to bump the version string."

**`route()` calls `bindSpiderInteractivity($app)` unconditionally on every navigation:**
- Files: `js/app.js:890`
- Why fragile: `bindSpiderInteractivity` re-binds pointer event listeners on every route change regardless of whether a spider chart is on screen. If future charts JS adds cleanup logic, stale listeners could accumulate.
- Safe modification: Guard with a presence check, or ensure `bindSpiderInteractivity` is idempotent (verify in `js/charts.js`).
- Severity: **low** — currently fine; flag if charts.js interaction logic grows.

**Swipe gesture handling in questionnaire:**
- Files: `js/app.js:754–760` (wizard swipe), `js/app.js:2299` (questionnaire single-card swipe)
- Why fragile: Swipe direction was incorrect in commit `8f56d6e` and fixed. The code uses raw `touchstart`/`touchend` delta with a 40px threshold. On some Android devices, scroll-initiated touches are indistinguishable from horizontal swipes until `touchend`, which can cause accidental card advances during vertical scrolling.
- Safe modification: Use `{ passive: true }` on `touchstart` (already present at `js/app.js:755`) and consider checking `Math.abs(dy) < Math.abs(dx)` before treating as a horizontal swipe.
- Severity: **low** — functional; has been fixed once already.

---

## Missing Critical Features

**No automated tests:**
- Problem: There are zero test files in the repository. The highest-stakes code paths — `encryptResult`/`decryptResult` round-trip, `Store.replaceAll` backup restore, share bundle parsing (`parseArmor`/`parseEnvelopeJson`), and scale migration (`migrateScale`) — have no regression coverage.
- Files: `js/crypto.js`, `js/storage.js:281–291`, `js/storage.js:50–55`
- Risk: A refactor of any of these functions can silently break existing encrypted bundles or corrupt stored data. There is no CI gate.
- Priority: **High** for crypto/storage. The no-build constraint is compatible with native browser test runners (e.g., a simple `test.html` that imports the ES modules and runs assertions). A few targeted unit tests for `encryptResult`/`decryptResult`, `migrateScale`, and `parseArmor` would cover the highest-risk surface area without adding tooling.

**`prefers-reduced-motion` is largely unimplemented:**
- Problem: Only `heroBlobPulse` on the hero section is conditionally disabled. The other 7 `@keyframes` animations run regardless of the user's motion preference.
- Files: `css/additions.css:827`
- Blocks: Accessibility compliance (WCAG 2.1 SC 2.3.3).
- Priority: **Medium**.

---

## Deliberate Tradeoffs (Not Bugs)

**No build pipeline:**
- Every JS file ships unminified and uncompressed over HTTP (mitigated by the SW caching after first load). There is no tree-shaking, no bundler, no toolchain to rot. This is a deliberate choice that keeps the project maintainable by non-JS-specialist contributors. The tradeoff: adding any npm dependency requires manual copy of a UMD/ESM dist file; the total uncompressed JS payload is ~200 KB (fine for a PWA that is SW-cached after first load).
- Files: All `js/*.js` — no `package.json`, no `node_modules/`
- Severity: **not a concern** — document as context for new contributors.

---

*Concerns audit: 2026-05-15*
