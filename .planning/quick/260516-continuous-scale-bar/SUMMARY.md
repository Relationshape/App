---
quick_id: 260516-okg
slug: continuous-scale-bar
date: 2026-05-16
status: complete
---

# Summary: Continuous gradient scale bar

## What changed
Restored the v1.0 continuous click-to-place scale bar in place of the discrete
7-button snap-dot picker. Both List and Single questionnaire modes now show
the same bar — a full gradient track with crosshair cursor, clickable ref-ticks
under it, a continuous marker that lands at the exact click/drag position, and
a reset button that clears the answer (visible when a value is set).

## Files

| File | Change |
| --- | --- |
| [src/lib/storage/types.ts](src/lib/storage/types.ts:20) | `AnswerCell` gained optional `scaleFrac?: number` (0..1). Snapped `scale` key stays for back-compat with chart/aggregation code. |
| [src/components/ScalePicker.tsx](src/components/ScalePicker.tsx) | Full rewrite — continuous gradient bar, pointer drag, ref-tick snap, keyboard nudge, reset button. Same exported name + signature as the discrete version + new optional `valueFrac` prop. |
| [src/components/questionnaire/ItemRow.tsx](src/components/questionnaire/ItemRow.tsx) | `setScaleKey` now writes `(scale, scaleFrac)`; passes `valueFrac` + `onClear` to `ScalePicker`. |
| [src/components/questionnaire/SingleMode.tsx](src/components/questionnaire/SingleMode.tsx) | Same change for single-card mode. Reset removes the entire `AnswerCell` so the next render falls back to "no value". |
| [src/components/__tests__/ScalePicker.test.tsx](src/components/__tests__/ScalePicker.test.tsx) | Updated `onChange` matchers to `(key, frac)`. Added two new tests: reset-button click + marker positioning from `valueFrac`. |

## Verification
- `npx vitest run src/components` — 46/46 pass (incl. 7 ScalePicker tests, 5 SingleMode tests, 5 ListMode tests).
- `npx vitest run src/lib/charts src/lib/storage src/lib/format src/lib/i18n` — 39/39 pass.
- `./node_modules/.bin/vite build` — clean production build (550 ms).
- Pre-existing tsc errors in `RsHeroConstellation.tsx` / `RsToggleCard.tsx` are unrelated and untouched.
- Visual: dev server confirmed serving the new component at http://localhost:5176/.

## Design notes
- The bar uses the already-shipped `.rs-click-scale*` CSS in `src/styles/legacy-components.css:1144-1210` — no new styling needed.
- Reset uses the `q_slider_reset` i18n key (`↺ Reset` / `↺ Zurücksetzen`), reused from the legacy slider.
- Keyboard parity with the previous picker preserved: ArrowLeft/Right nudge by one full index, Home/End jump to extremes, Backspace/Delete clear. Drag is mouse/touch only — fine-grained keyboard nudging stayed at full steps to avoid breaking the existing keyboard expectation.
- Tick buttons keep `data-testid="scale-step-{key}"` so existing tests continue to find them.
- Continuous `scaleFrac` was already plumbed through `src/lib/charts/math.ts` (via bracket-access `e['scaleFrac']`); now the writer wires it up too. Spider / bar charts already average correctly when both fields are present.
