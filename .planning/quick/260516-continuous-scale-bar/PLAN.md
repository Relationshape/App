---
quick_id: 260516-okg
slug: continuous-scale-bar
date: 2026-05-16
status: in-progress
---

# Quick Task: Continuous gradient scale bar (legacy parity)

## Why
The questions page (List + Single mode) currently uses a discrete 7-button
snap-dot picker. v1.0 had a continuous gradient bar — click anywhere on the
bar to place a value at that exact fraction, with a crosshair cursor and a
reset button. Restore that UX. Continuous values were already plumbed through
charts as `scaleFrac` (read via bracket-access in `lib/charts/math.ts`), but
the writer side was never wired up in v2.

## Scope

### 1. Data
- Extend `AnswerCell` (`src/lib/storage/types.ts`) with `scaleFrac?: number`
  in `[0, 1]`. Backwards-compatible — old cells without it still work.
- Keep `scale: string` (snapped key) on every write so chart code that reads
  `cell.scale` (`ItemSpider`, `CategoryBars`, `format/date.ts`,
  `Settings.tsx`, etc.) keeps functioning. The writer stores BOTH.

### 2. Component
- Replace internals of `src/components/ScalePicker.tsx` with a continuous
  gradient bar (port of `public/legacy/js/app.js:262-346 scaleClickEl`).
- Use the already-existing `rs-click-scale*` CSS classes in
  `src/styles/legacy-components.css:1144-1210` (track, bg, grad, marker,
  ref-tick, ref-label, crosshair cursor).
- Behavior:
  - Pointer down + drag anywhere on the track → places marker at exact
    fraction; calls `onChange(snappedKey, frac)`.
  - Clicking a reference tick → snaps to that tick (`onChange(key, exactFrac)`).
  - Keyboard: ArrowLeft/Right nudges by one index (preserves existing test
    expectation), Home/End jump to ends, Backspace/Delete clears.
  - Reset/Zurücksetzen button shows when a value is set, calls `onClear`.
    Reuses i18n key `q_slider_reset` (already exists EN + DE).
- API (same shape, additive):
  - `value: string | null` — discrete key (kept for back-compat)
  - `valueFrac?: number | null` — preferred continuous position when set
  - `onChange: (key: string, frac: number) => void`
  - `onClear?: () => void`
  - `compact?: boolean`

### 3. Call sites
- `ItemRow.tsx`: change `setScaleKey(key)` → `setScaleKey(key, frac)`;
  persist `{ scale: key, scaleFrac: frac }`. Pass `valueFrac={cell?.scaleFrac}`.
- `SingleMode.tsx`: same change to `setAnswer(key, frac)`.

### 4. Tests
- Keep `data-testid="scale-step-{key}"` on each reference tick so existing
  ScalePicker / SingleMode / ListMode tests still find them.
- Keep `role="slider"` on root.
- Keep button-count = `scale.length` when `value=null` (no reset button).
- Update `onChange` mock expectations if needed: tests assert
  `onChange.toHaveBeenCalledWith('open')` — with the new signature it becomes
  `('open', anyFraction)`. Update via `expect.any(Number)` or
  `toHaveBeenCalledWith('open', expect.any(Number))`.

## Non-goals
- Per-item scale override (D-33) stays a future task.
- G/R giving/receiving fractional split — keep `gr` toggle as-is.
- Migration of old answers — `scaleFrac` is purely additive.

## Files touched
- `src/lib/storage/types.ts`
- `src/components/ScalePicker.tsx`
- `src/components/questionnaire/ItemRow.tsx`
- `src/components/questionnaire/SingleMode.tsx`
- `src/components/__tests__/ScalePicker.test.tsx` (update `onChange` matcher)

## Acceptance criteria
- Bar shows full gradient through all scale colors.
- Cursor is crosshair when hovering the track.
- Click anywhere on track → marker lands at that exact point; key snaps to
  nearest stop.
- Drag updates marker live.
- Tick labels remain under the bar (No, Not really, …, Need).
- Reset button visible when value set; clears the answer.
- `pnpm run typecheck` + `pnpm run test -- --run` pass.
- Smoke check in browser: clicking mid-bar in both List and Single mode
  persists a fractional value (visible in marker position after reload).
