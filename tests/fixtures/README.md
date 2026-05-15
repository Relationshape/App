# Test Fixtures

These fixtures pin the v1.0 → v2.0 compatibility contract. They are committed to git so future test runs can re-execute without re-capturing.

## Files

- `v1-bundle.rshape.txt` — PEM-armored AES-GCM 256 encrypted bundle produced by v1.0's Share flow with a known passphrase. Captured manually (see below). Consumed by `src/lib/crypto/__tests__/crypto.test.ts` (plan 04).
- `v1-bundle.fixture.ts` — Typed wrapper exporting `{ ARMORED, PASSPHRASE, EXPECTED_PAYLOAD }`. `ARMORED` embeds the contents of `v1-bundle.rshape.txt` inline OR reads it via `node:fs.readFileSync` at module load.
- `v1-localstorage.fixture.ts` — Synthetic v1.0 `localStorage["relationshape.v1"]` blob constructed from the documented shape in `public/legacy/js/storage.js`. Consumed by `src/lib/storage/__tests__/storage.test.ts` (plan 06).

## Regeneration procedure (v1-bundle.rshape.txt)

The encrypted bundle MUST be captured from the running v1.0 app — AES-GCM uses random salts + IVs so the armored output is non-deterministic.

1. Run `pnpm run dev` from the repo root. Vite serves the legacy app at `http://localhost:5173/legacy/index.html`.
2. Open that URL in a private/incognito browser window (so existing localStorage data does not interfere).
3. Create a profile with: name = `Test Subject`, emoji = `🌱`, accent color = `#7c83ff`, pronouns = `they/them`.
4. From the profile, create one result. In the category overview, enable at least 3 categories (e.g. `connection`, `intimacy`, `partnership`).
5. Answer at least one item in each enabled category. Add 2 custom items (one in any category) and mark 1 item as hidden via the v1.0 hide-item affordance.
6. From the result view, open the Share flow.
7. Enter passphrase: `test-passphrase-fixture-only`
8. Confirm. Copy the entire armored output (including BEGIN/END lines and the `v1` version line).
9. Save the copied text to `tests/fixtures/v1-bundle.rshape.txt`. Do NOT edit — preserve all whitespace exactly.
10. Update `EXPECTED_PAYLOAD` in `v1-bundle.fixture.ts` to match the exact payload structure the share flow assembled. Easiest: add `console.log(JSON.stringify(payload, null, 2))` in `public/legacy/js/app.js` near the Share submit handler, capture the output, paste it into `EXPECTED_PAYLOAD`, then remove the console.log.

## Why we capture manually

AES-GCM bundles are non-deterministic — every encryption uses a new random 16-byte salt and 12-byte IV (`public/legacy/js/crypto.js:56-57`). A v2.0-generated bundle would NOT round-trip to a v1.0-generated one byte-for-byte. The test asserts that v2.0 can DECRYPT a v1.0 bundle (CORE-04, PWA-04) — which requires a real v1.0 bundle pinned in the fixture.

## Why localStorage is synthetic

Unlike the bundle, the localStorage blob shape is fully deterministic — `JSON.stringify(defaults())` per `public/legacy/js/storage.js:33`. Claude can construct a representative blob from the documented shape; no human action required. The plan 06 test asserts the new app's Zustand state matches the parsed blob.

## Fixture passphrase disclosure

The passphrase `test-passphrase-fixture-only` is INTENTIONALLY committed to git in this README and in `v1-bundle.fixture.ts`. The fixture bundle contains synthetic data (a profile called "Test Subject" with no PII); the passphrase has no security value outside the fixture. Do NOT reuse this passphrase for real bundles.
