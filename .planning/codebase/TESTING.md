# Testing Patterns

**Analysis Date:** 2026-05-15

## Current State: No Automated Test Suite

This repo has **zero automated tests**. Verified:
- No `package.json` (no npm, no test runner dependencies)
- No `jest.config.*`, `vitest.config.*`, `mocha.*`, or equivalent
- No `tests/`, `__tests__/`, or `spec/` directories
- No `*.test.js` or `*.spec.js` files anywhere in the project
- No `.github/` directory — no CI pipeline of any kind

Testing is entirely **manual and browser-based**.

## How Testing Currently Works

Per `README.md`, development and testing is done by serving the project root with any static file server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080 in a browser
```

Because the app is a no-build ES module PWA, this works without a build step. All behavior verification is done by clicking through the app manually in a browser.

## Implications

**Regressions are caught only by human eyes.** There is no safety net for:

- **Logic regressions in `js/charts.js`** — SVG output changes silently. Spider/radar chart rendering (`renderSpider`, `renderItemSpider`, `renderAlignment`, `renderCategoryBars`) has no snapshot or pixel tests.
- **Crypto round-trips in `js/crypto.js`** — An encrypted bundle from an older version must still decrypt correctly. This invariant is manually verified, not enforced.
- **Storage migration logic in `js/storage.js`** — `migrateScale()` silently reverses old-format scales and recalculates values. A regression here corrupts user data with no warning.
- **i18n completeness in `js/i18n.js`** — Missing translation keys fall back to the raw key string (e.g. `"btn_save"` renders literally). No automated check verifies that `en` and `de` dictionaries have parity.
- **Route dispatch in `js/app.js`** — The `route()` switch has many branches; a typo in a route segment would silently fall through to `viewHome()`.

## What Could Realistically Be Tested

The codebase's pure-function modules are good candidates for unit testing without a DOM environment.

**`js/crypto.js` — highest priority, most testable:**
- `encryptResult(payload, passphrase)` / `decryptResult(armored, passphrase)` — round-trip test: encrypt then decrypt should recover original payload
- `parseArmor()` (unexported but testable via `decryptResult`) — accepts PEM-armored, bare base64, and raw JSON; malformed input should throw with specific messages
- Requires Web Crypto API — Node 18+ supports `globalThis.crypto.subtle` natively, so tests can run in Node with no mocking

**`js/storage.js` — good coverage value:**
- `migrateScale()` — unit test reversing an old-format scale
- `Store.nextResultVersion()` / `Store.nextImportVersion()` — versioning logic, easily unit-testable
- Requires a `localStorage` mock (e.g. `jest-localstorage-mock` or a simple in-memory stub)

**`js/i18n.js` — low effort, high value:**
- `t(key)` fallback chain: key in current lang, fallback to EN, fallback to raw key
- `t(key, vars)` variable substitution (e.g. `{n}` replaced correctly)
- Parity check: every key in `de` dictionary also exists in `en`, and vice versa

**`js/data.js` — schema validation:**
- Every category has required fields (`id`, `items`, `emoji`, etc.)
- No duplicate category IDs or item keys

**`js/charts.js` — harder, higher effort:**
- `categoryAverage()` is an exported pure function — unit testable with mock `answers` and `scale` data
- `renderSpider()` / `renderItemSpider()` return SVG DOM nodes — snapshot testing possible but requires a DOM (jsdom or a browser-based runner like Playwright component tests)

## Suggested Test Stack (if tests are introduced)

Given the no-build constraint, the path of least resistance:

**Option A — Vitest (recommended):**
```bash
npm init -y
npm install -D vitest
```
Vitest works natively with ES modules (`"type": "module"` in `package.json`), has a built-in jsdom environment for DOM tests, and requires zero config for basic use. Crypto tests run in the Node environment which has `globalThis.crypto`.

**Option B — Node test runner (no dependencies):**
Node 22 has a built-in test runner (`node:test`) that supports ES modules. Useful for pure-function tests (crypto, i18n, data) with no DOM requirement.

Either option would leave the production app entirely build-free — test tooling lives only in devDependencies and is never bundled.

## No CI Configuration

There is no `.github/workflows/` directory. If a test suite is added, a minimal GitHub Actions workflow running `npm test` on push/PR would provide the first regression gate.

---

*Testing analysis: 2026-05-15*
