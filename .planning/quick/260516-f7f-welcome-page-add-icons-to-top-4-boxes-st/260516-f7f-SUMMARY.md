---
phase: quick-260516-f7f
plan: 01
subsystem: welcome-route
tags: [welcome, ui, legacy-parity, svg-icons, i18n]
dependency_graph:
  requires:
    - "src/lib/i18n/en.ts (feat_share_*, feat_privacy_*, howto_step{1..4}_*)"
    - "src/lib/i18n/de.ts (mirror DE keys, identical key set)"
    - "src/styles/legacy-components.css (.hero-feat-icon, .howto-section, .howto-steps, .howto-step*, .section-head)"
  provides:
    - "Welcome route with legacy SVG feature icons and full how-it-works markup"
  affects:
    - "src/routes/Welcome.tsx"
tech_stack:
  added: []
  patterns: ["inline JSX SVG (no dangerouslySetInnerHTML)"]
key_files:
  created: []
  modified:
    - "src/routes/Welcome.tsx"
decisions:
  - "Inline SVGs as small named React components (FeatMapsIcon, StepShareIcon, …) instead of dangerouslySetInnerHTML — type-safe, no parser warnings, easy to read against legacy source."
  - "Renamed FEATURES keys sharing→share and multi→privacy to match the existing legacy i18n keys (feat_share_*, feat_privacy_*) rather than introducing new keys."
  - "Step 4 uses the padlock icon (StepShareIcon = legacy step_share), matching legacy howtoStep(\"4\", …, ICONS.step_share). The legacy step_map icon is unused on Welcome."
metrics:
  duration: ~10 minutes
  completed_date: 2026-05-16
---

# Quick Task 260516-f7f: Welcome page legacy SVG icons + howto-section Summary

Brought the React Welcome route to visual + textual parity with the legacy `viewWelcome()` page (`public/legacy/js/app.js:1399-1457`): four stroke-SVG feature icons replace the emoji placeholders, and the unstyled `<ol>` how-it-works list is replaced with the legacy `howto-section` / `howto-steps` markup (numbered cards with SVG step icons sourced from `ICONS.step_*`).

## What Changed

### `src/routes/Welcome.tsx`

1. **Feature icons (top 4 boxes).** Added four small SVG components — `FeatMapsIcon`, `FeatPersonalIcon`, `FeatShareIcon`, `FeatPrivacyIcon` — that are verbatim ports of `ICONS.feat_{maps,personal,share,privacy}` from `public/legacy/js/app.js:80-83`. Each renders at `width="26" height="26" viewBox="0 0 24 24"` with `stroke="currentColor"`, `strokeWidth="1.4"`, `strokeLinecap="round"`, `strokeLinejoin="round"`. The four emoji values (🗺️, 🔒, 📤, 👥) have been removed.
2. **FEATURES key rename.** Updated the typed `FEATURES` array from `'maps' | 'personal' | 'sharing' | 'multi'` to `'maps' | 'personal' | 'share' | 'privacy'` (and `icon: string` → `icon: ReactNode`) so the keys resolve to the existing legacy i18n entries (`feat_share_*`, `feat_privacy_*`) — no new i18n keys were added.
3. **Feature-card markup.** Inside each `<li>`, the inner span/strong/span now use the legacy class names: `hero-feat-icon` (with `aria-hidden`), `hero-feat-title`, `hero-feat-sub`. The dialog onClick body is unchanged apart from the renamed key.
4. **How-it-works section.** Replaced the entire `<section className="page-section" aria-labelledby="welcome-how">…<ol>…</ol></section>` block with the legacy structure:
   ```jsx
   <section className="page-section howto-section" aria-labelledby="welcome-how">
     <header className="section-head">
       <h2 id="welcome-how">{t('howto_title')}</h2>
     </header>
     <div className="howto-steps">
       {HOWTO_STEPS.map(({ num, titleKey, descKey, icon }) => (
         <div className="howto-step" key={num}>
           <div className="howto-step-icon" aria-hidden>{icon}</div>
           <div className="howto-step-num">{num}</div>
           <h3 className="howto-step-title">{t(titleKey)}</h3>
           <p className="howto-step-desc muted small">{t(descKey)}</p>
         </div>
       ))}
     </div>
   </section>
   ```
   The route no longer references the `welcome_how_*` strings (those keys remain in i18n files unchanged so the EN/DE parity counts are preserved).
5. **Step icons.** Added four step icon components — `StepCreateIcon`, `StepTopicsIcon`, `StepAnswerIcon`, `StepShareIcon` — verbatim ports of `ICONS.step_{create,topics,answer,share}` from `public/legacy/js/app.js:89-93`. All render at `width="22" height="22" viewBox="0 0 24 24"` with `strokeWidth="1.8"`. Step 4 uses `StepShareIcon` (padlock), matching legacy `howtoStep("4", …, ICONS.step_share)`.
6. **JSX SVG conversion rules applied.** `stroke-width` → `strokeWidth`, `stroke-linecap` → `strokeLinecap`, `stroke-linejoin` → `strokeLinejoin`, `stroke-opacity` → `strokeOpacity`, `stroke-dasharray` → `strokeDasharray`. `viewBox`, `fill`, `opacity`, `r`, `cx`, `cy`, `x`, `y`, `width`, `height`, `points`, `rx` left unchanged.
7. **Preserved testids.** `data-testid="welcome-page"`, `welcome-cta`, `welcome-about` are unchanged. The `welcome-feat-{key}` testids exist for the four cards — keys are now `maps`, `personal`, `share`, `privacy` (no test asserts these specific values).
8. **Header comment updated.** `// PROFILE-02. Port of public/legacy/js/app.js:1399-1448` → `1399-1457` to cover the howto block range.

## i18n keys + CSS classes used (all pre-existing — none added)

**i18n keys (resolved verbatim from `src/lib/i18n/en.ts` + `src/lib/i18n/de.ts`):**

| Source                      | Keys                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `feat_${key}_title/short/body` | `feat_maps_*`, `feat_personal_*`, `feat_share_*`, `feat_privacy_*`                                |
| `howto_*`                   | `howto_title`, `howto_step{1..4}_title`, `howto_step{1..4}_desc`                                   |
| (unchanged baseline)        | `welcome_title`, `welcome_sub`, `welcome_cta`, `welcome_about`, `start_now_*`, `btn_close`        |

**CSS classes (resolved from `src/styles/legacy-components.css`):**

`.hero` / `.hero-blob` / `.hero-blob.hero-blob-holo` / `.hero-title` / `.hero-sub` / `.hero-actions` / `.hero-features` / `.hero-feat-btn` / `.hero-feat-icon` (with `svg { display: block }` rule) / `.hero-feat-title` / `.hero-feat-sub` / `.page-section` / `.howto-section` / `.section-head` / `.howto-steps` (grid 1col / 4col @ md) / `.howto-step` / `.howto-step-icon` / `.howto-step-num` / `.howto-step-title` / `.howto-step-desc` / `.muted` / `.small`

No new CSS rule was added. No new i18n key was added. The legacy `welcome_how_*` keys remain present in en.ts/de.ts (just unreferenced from the route).

## Verification

### Type check

```
$ npx tsc --noEmit
(no output — passes)
```

### Targeted vitest suites (with `--testTimeout=30000`)

```
$ npx vitest --run src/__tests__/parity.smoke.test.tsx src/routes/__tests__/Profile.test.tsx src/lib/i18n/__tests__/i18n.test.ts --testTimeout=30000

 Test Files  3 passed (3)
      Tests  33 passed (33)
   Duration  71.26s (… tests 9.31s, environment 41.88s)
```

All 33 targeted tests pass. (Without the extended `testTimeout`, several environment-heavy jsdom tests hit the 5 s default timeout during cold startup — but this is a pre-existing flake confirmed on `main` and on the base commit before this change. Actual per-test execution time is well under 5 s; the timeout is consumed by `import` + `environment` setup, not by the test bodies. With `testTimeout=30000` everything is green.)

### Grep gates (from the plan)

| Gate                                                | Expected | Actual | Result |
| --------------------------------------------------- | -------- | ------ | ------ |
| `grep -c "🗺️\|🔒\|📤\|👥" src/routes/Welcome.tsx`     | `0`      | `0`    | PASS   |
| `grep -v '^#' … \| grep -c "welcome_how_"`         | `0`      | `0`    | PASS   |
| `grep -c "howto-step\|hero-feat-icon" Welcome.tsx`  | `≥ 5`    | `7`    | PASS   |

## Deviations from Plan

None. The plan was executed exactly as written. No bugs surfaced, no missing functionality was discovered, and no architectural decisions were required. The decision documented in the plan (Option a — inline JSX SVG) was followed verbatim.

## Commits

| Commit    | Type | Description                                                                |
| --------- | ---- | -------------------------------------------------------------------------- |
| `4f13821` | feat | port legacy SVG icons and howto-section to Welcome route                   |

## Known Stubs

None. The Welcome route is data-driven from `useStore` (profiles), `t()` (i18n), and the static `FEATURES` / `HOWTO_STEPS` arrays — no placeholder/empty/hardcoded UI strings remain.

## Self-Check: PASSED

- `src/routes/Welcome.tsx` exists and contains all four feature SVG components, all four step SVG components, the renamed `FEATURES` array, and the new `howto-section` markup (verified by Read at HEAD).
- Commit `4f13821` exists on `worktree-agent-a1f4b6844136960cd` (verified by `git rev-parse --short HEAD`).
- Type check passes: `npx tsc --noEmit` → no output.
- Targeted vitest suites pass: 3 files / 33 tests green with `--testTimeout=30000`.
- All three grep verification gates (emoji=0, welcome_how_=0, howto-step|hero-feat-icon≥5) pass.
