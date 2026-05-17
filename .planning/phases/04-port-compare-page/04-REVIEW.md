---
phase: 04-port-compare-page
reviewed: 2026-05-17T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/components/RsCompareTile.tsx
  - src/components/RsCategoryCard.tsx
  - src/components/RsSummaryCells.tsx
  - src/components/CompareWithSomeone.tsx
  - src/routes/Compare.tsx
  - src/routes/Result.tsx
  - src/components/__tests__/RsCompareTile.test.tsx
  - src/components/__tests__/RsCategoryCard.test.tsx
  - src/components/__tests__/RsSummaryCells.test.tsx
  - src/components/__tests__/CompareWithSomeone.test.tsx
  - src/routes/__tests__/Compare.test.tsx
  - src/routes/__tests__/Result.test.tsx
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-05-17
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Phase 04 ports the Compare page and refactors Result into legacy parity, introducing four new shared primitives (`RsCompareTile`, `RsCategoryCard`, `RsSummaryCells`, `CompareWithSomeone`). Code is well-structured, well-commented, and well-tested.

One blocker: `Result.tsx` calls `navigate()` synchronously during render to redirect on missing entities, which produces React "cannot update a component while rendering" warnings and can produce a flash of `null` before the redirect commits. Several quality warnings around effect-dependency suppression, empty-array conditionals, and string interpolation with missing values. Tests look thorough and properly isolate units, though the `CompareWithSomeone.test.tsx` mock-vs-real `useStore` selector signature does not exercise the production code path through Zustand.

## Critical Issues

### CR-01: `navigate()` called during render in `Result.tsx`

**File:** `src/routes/Result.tsx:53-60`
**Issue:** When `result` or `profile` is missing, `Result()` synchronously invokes `navigate('/')` during the render phase, then returns `null`. React forbids triggering a navigation/state update on another component while a different component is rendering — this produces a console warning ("Cannot update a component while rendering a different component") and, depending on router internals, may schedule the navigation after a render commit, briefly painting a blank screen. The deep-link `useEffect` (lines 45-51) also runs before this redirect because hooks must precede early returns; that effect is harmless when `result` is null but indicates the redirect path is structurally fragile.
**Fix:**
```tsx
useEffect(() => {
  if (!result || !profile) navigate('/')
}, [result, profile, navigate])

if (!result || !profile) return null
```
Move `navigate` into an effect, then keep the early return. This eliminates the render-phase side effect and converges the two redirect branches.

## Warnings

### WR-01: `useEffect`/`useMemo` exhaustive-deps suppressions hide real reactive inputs

**File:** `src/routes/Compare.tsx:33-36, 70, 78-79, 95-96`
**Issue:** Four locations disable `react-hooks/exhaustive-deps` and use `effectiveIds.join(',')` or `rawIds.length` as a deps proxy. The proxy works today, but if someone adds a stable-id reorder semantics, or `toast`/`t` change identity (e.g., due to locale switch), stale closures will fire. The toast effect at line 33-36 also reads `t()` and `toast`, neither of which is in deps.
**Fix:** Compute the proxy value into a memoized primitive and depend on that explicitly, e.g.:
```tsx
const effectiveIdsKey = effectiveIds.join(',')
const datasets = useMemo(() => /* ... */, [effectiveIdsKey, results, imports, profiles])
```
For the toast effect, capture `t` and `toast` via refs or include them in deps. Removing the eslint-disable forces future maintainers to think about each dep.

### WR-02: Empty `enabledCategories` array still shows "Add more categories" button

**File:** `src/routes/Result.tsx:127-134`
**Issue:** Guard `result.enabledCategories ? <Button>… </Button> : null` treats an empty array `[]` as truthy and renders the button. If a result happens to be saved with `enabledCategories: []` (e.g., user deselected everything via the picker), the by-category section is empty *and* shows an Add button — odd UX. Worse, the picker is then opened with `existingIds={result.enabledCategories ?? CATEGORIES.map(c => c.id)}` → `existingIds={[]}`, which likely renders an empty pre-selection rather than the default "all".
**Fix:** Use `(result.enabledCategories?.length ?? 0) > 0` for the conditional. Decide whether `[]` should fall through to "no filter" semantics in the picker too.

### WR-03: `CompareWithSomeone.test.tsx` `useStore` mock has wrong selector signature

**File:** `src/components/__tests__/CompareWithSomeone.test.tsx:25-28`
**Issue:** The mock implements `useStore` as `(sel) => sel({ profiles, results, imports })` with no overload for the non-selector / actions invocation form. If `CompareWithSomeone` ever evolves to call `useStore.getState()` or `useStore(s => s.someAction)` where `someAction` is undefined, the test will silently return `undefined` rather than failing loudly. Also, `aliceProfile()` is defined as a profile with `createdAt: 1` but no `updatedAt`, while `Profile`/`Result` types in storage may require additional fields — type-safety is bypassed via `unknown[]`.
**Fix:** Cast `mockProfiles`/`mockResults`/`mockImports` to their proper types (`Profile[]`, `Result[]`, `Import[]`) and let TS surface drift. Or use a partial-store fixture helper shared with other tests so the shape evolves in one place.

### WR-04: `CompareWithSomeone.tsx` import title produces dangling arrow when subject is empty

**File:** `src/components/CompareWithSomeone.tsx:50, 75`
**Issue:** Both title strings use `` `${name ?? '?'} → ${subject ?? ''}` ``. When `subject` is missing or empty, the result is `"Alice → "` (or `"Imported Person → "`), which displays an arrow pointing to nothing — confusing in screen readers via the `ariaLabel={title}` reuse on line 61/86. Same pattern at line 50 for own-results.
**Fix:** Only append `→ subject` when `subject` is non-empty:
```tsx
const title = o.subject ? `${ownerProfile?.name ?? '?'} → ${o.subject}` : (ownerProfile?.name ?? '?')
```
Apply the same to the import branch.

### WR-05: Result.tsx deep-link `useEffect` does not re-close modal when `catId` clears

**File:** `src/routes/Result.tsx:45-51`
**Issue:** The effect opens the modal when `catId` becomes truthy, but the deps `[catId]` mean transitioning from `/result/:id/:catId` → `/result/:id` (catId becomes undefined) does *not* trigger a close — the modal stays open until the user dismisses it. Inversely, navigating between two catIds correctly re-opens because each new value runs the effect, but the previous modal closes only via `onOpenChange` after `setModalCat(newCat)` replaces it — that part is fine. The user-visible bug is the back-button case: in-app navigation to remove `:catId` from the URL leaves the modal stuck open.
**Fix:**
```tsx
useEffect(() => {
  if (!catId) { setModalCat(null); return }
  const cat = CATEGORIES.find(c => c.id === catId)
  if (!cat) return
  const raf = requestAnimationFrame(() => setModalCat(cat))
  return () => cancelAnimationFrame(raf)
}, [catId])
```

## Info

### IN-01: `RsSummaryCells.tsx` key uses `${ds.id}-${i}` — index is redundant if ids unique

**File:** `src/components/RsSummaryCells.tsx:24, 34`
**Issue:** Including the array index in the key means a reorder will remount cells rather than letting React keep DOM nodes mapped to a stable id. If `ds.id` is guaranteed unique within `datasets` (it is, by the chart system's contract), the index is unnecessary noise.
**Fix:** `key={ds.id}` alone. Keep the `-${i}` only if duplicate ids are a real possibility (worth a guarding comment).

### IN-02: `RsSummaryCells.tsx` magic fallback color `#7c3aed`

**File:** `src/components/RsSummaryCells.tsx:30`
**Issue:** The purple `#7c3aed` fallback appears literally in `RsSummaryCells.tsx`, `RsCompareTile.tsx` tests, `CompareWithSomeone.tsx` (lines 48, 73, 92), and `Compare.tsx` test fixtures. This brand color should live in a constant.
**Fix:** Export `DEFAULT_BRAND_COLOR = '#7c3aed'` from a shared module (e.g. `src/lib/data/colors.ts`) and import it everywhere.

### IN-03: `RsCategoryCard.tsx` cast pattern is awkward

**File:** `src/components/RsCategoryCard.tsx:50-57, 82`
**Issue:** The triple cast `(v as { scale?: unknown })?.scale` and `style = { ['--c' as 'color']: cat.color } as CSSProperties` indicates the underlying types aren't strict enough. Same `--c` cast repeats in `RsCompareTile.tsx:36` and `Compare.tsx:150`, `Result.tsx:70`. A small typed helper would centralize the hack.
**Fix:** Add a helper `cssVars(vars: Record<`--${string}`, string>): CSSProperties` and call it: `style={cssVars({ '--c': cat.color })}`.

### IN-04: `Compare.tsx` `setParams({ ids: next.join(',') })` with empty `next` sets `?ids=`

**File:** `src/routes/Compare.tsx:102-106`
**Issue:** Toggling off the last selected chip sets `?ids=` (empty value) which the component immediately re-defaults to "first 2 options" (line 57-59). This snaps selection back to defaults — likely unexpected and the URL no longer reflects state. Legacy may behave the same; flagging for product awareness.
**Fix:** Optionally `if (next.length === 0) setParams({}, { replace: true })` to remove the param entirely, or short-circuit the toggle when it would leave zero selected.

---

_Reviewed: 2026-05-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
