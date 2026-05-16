---
phase: 02-parity
reviewed: 2026-05-16T12:00:00Z
depth: standard
files_reviewed: 105
files_reviewed_list:
  - src/App.tsx
  - src/__tests__/DesignSystem.test.tsx
  - src/__tests__/Nav.test.tsx
  - src/__tests__/a11y.dialog.test.tsx
  - src/__tests__/parity.smoke.test.tsx
  - src/__tests__/primitives.test.tsx
  - src/__tests__/router.routes.test.tsx
  - src/components/AgeGate.tsx
  - src/components/DataManagement.tsx
  - src/components/DialogHost.tsx
  - src/components/EmojiPicker.tsx
  - src/components/Nav.tsx
  - src/components/ProfilePicker.tsx
  - src/components/ResultCard.tsx
  - src/components/ScaleEditor.tsx
  - src/components/ScalePicker.tsx
  - src/components/WizardHost.tsx
  - src/components/__tests__/AgeGate.test.tsx
  - src/components/__tests__/ScalePicker.test.tsx
  - src/components/__tests__/WizardHost.test.tsx
  - src/components/charts/Alignment.tsx
  - src/components/charts/CategoryBars.tsx
  - src/components/charts/EnlargedSpider.tsx
  - src/components/charts/ItemSpider.tsx
  - src/components/charts/Spider.tsx
  - src/components/charts/__tests__/Alignment.test.tsx
  - src/components/charts/__tests__/CategoryBars.test.tsx
  - src/components/charts/__tests__/EnlargedSpider.test.tsx
  - src/components/charts/__tests__/ItemSpider.test.tsx
  - src/components/charts/__tests__/Spider.test.tsx
  - src/components/charts/types.ts
  - src/components/providers/I18nProvider.tsx
  - src/components/providers/ThemeProvider.tsx
  - src/components/questionnaire/ItemRow.tsx
  - src/components/questionnaire/ListMode.tsx
  - src/components/questionnaire/QuestionnaireHeader.tsx
  - src/components/questionnaire/QuestionnaireNav.tsx
  - src/components/questionnaire/SingleMode.tsx
  - src/components/questionnaire/__tests__/ListMode.test.tsx
  - src/components/questionnaire/__tests__/SingleMode.test.tsx
  - src/components/ui/alert-dialog.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/popover.tsx
  - src/components/ui/sheet.tsx
  - src/components/ui/sonner.tsx
  - src/components/ui/tabs.tsx
  - src/hooks/__tests__/useScrollToTop.test.tsx
  - src/hooks/useScrollToTop.ts
  - src/lib/charts/__tests__/items.test.ts
  - src/lib/charts/__tests__/math.test.ts
  - src/lib/charts/datasets.ts
  - src/lib/charts/items.ts
  - src/lib/charts/math.ts
  - src/lib/data/__tests__/emoji.test.ts
  - src/lib/data/emoji.ts
  - src/lib/data/imports.ts
  - src/lib/dialog/dialog.ts
  - src/lib/dialog/dialogQueue.ts
  - src/lib/hooks/__tests__/useSwipe.test.tsx
  - src/lib/hooks/useFormError.ts
  - src/lib/hooks/useIsCoarsePointer.ts
  - src/lib/hooks/useKeydown.ts
  - src/lib/hooks/useReducedMotion.ts
  - src/lib/hooks/useSpiderInteraction.ts
  - src/lib/hooks/useSwipe.ts
  - src/lib/hooks/useTemplateWarning.tsx
  - src/lib/hooks/useToast.ts
  - src/lib/i18n/__tests__/de-gendered.test.ts
  - src/lib/i18n/__tests__/i18n.test.ts
  - src/lib/i18n/__tests__/richText.test.ts
  - src/lib/i18n/de.ts
  - src/lib/i18n/en.ts
  - src/lib/i18n/richText.tsx
  - src/lib/share/__tests__/payload.test.ts
  - src/lib/share/payload.ts
  - src/lib/storage/store.ts
  - src/lib/storage/types.ts
  - src/router.tsx
  - src/routes/CategoryOverview.tsx
  - src/routes/Compare.tsx
  - src/routes/Home.tsx
  - src/routes/Import.tsx
  - src/routes/Intro.tsx
  - src/routes/MapSettings.tsx
  - src/routes/ProfileDetail.tsx
  - src/routes/ProfileEdit.tsx
  - src/routes/Questionnaire.tsx
  - src/routes/Result.tsx
  - src/routes/RootLayout.tsx
  - src/routes/Settings.tsx
  - src/routes/Share.tsx
  - src/routes/Welcome.tsx
  - src/routes/__tests__/CategoryOverview.test.tsx
  - src/routes/__tests__/Compare.test.tsx
  - src/routes/__tests__/Import.fixture.test.tsx
  - src/routes/__tests__/Import.test.tsx
  - src/routes/__tests__/Intro.test.tsx
  - src/routes/__tests__/MapSettings.test.tsx
  - src/routes/__tests__/Profile.test.tsx
  - src/routes/__tests__/Result.test.tsx
  - src/routes/__tests__/Settings.backup.test.tsx
  - src/routes/__tests__/Settings.test.tsx
  - src/routes/__tests__/Share.test.tsx
  - tests/helpers/MemoryLocalStorage.ts
  - tests/setup.ts
findings:
  critical: 5
  warning: 13
  info: 9
  total: 27
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-16T12:00:00Z
**Depth:** standard
**Files Reviewed:** 105
**Status:** issues_found

## Summary

This review covers Phase 02's React + Tailwind + shadcn parity migration: hash router with 16 deep-linked routes, 6 shadcn primitives, central dialog queue, 5 SVG chart components, AES-GCM share/import flow, and Zustand store with v1.0 byte-shape persistence.

**Strengths:**
- Crypto module (`src/lib/crypto/crypto.ts`) is solid — correct AES-GCM construction, fresh per-call IV/salt, 250 000 PBKDF2 iterations, generic error message for "wrong passphrase OR corrupted" so the wrong-pass oracle does not leak. Round-trip tests cover legacy-field-name backward compat.
- Chart components route user-controlled strings only into React text nodes and JS property assignments (`title`, `style.background`, attribute setters via JSX) — XSS-via-injection is structurally impossible. The dedicated XSS regression tests are well-targeted.
- i18n EN and DE dictionaries are in perfect key parity (416 keys each); all `t()` callsites across the changed files reference defined keys.
- `relationshapePersist` middleware correctly traps QuotaExceededError without losing in-memory state, and `lastSaveError` is excluded from the serialised slice (D-06 byte-shape parity verified by tests).

**Critical concerns:**
- `CategoryOverview` violates the Rules of Hooks (one `useEffect` is placed after a conditional early return); this is a latent runtime crash that the current test setup happens not to trigger.
- `Result` and `Settings` initial-mount imperative `navigate()` during render triggers React 19 "cannot update during render" warnings/errors.
- `MapSettings` and `ItemRow` use `useState(initialProp)` and never resync — stale state when the same component instance receives a new prop.
- The `addCustom` flow in `ListMode` returns a sentinel string from the OK button, so clicking OK never submits the typed name (Enter-only path).
- `DataManagement.importBackup` casts a parsed JSON blob directly into `replaceAll` with no shape validation — a hostile or corrupt backup file silently corrupts store state.

## Critical Issues

### CR-01: Rules-of-Hooks violation in CategoryOverview — third `useEffect` placed after a conditional early return

**File:** `src/routes/CategoryOverview.tsx:23-52`
**Issue:** The component calls `useEffect` at line 23 and line 41 (both before any early return) but a third `useEffect` at line 50 is placed AFTER two unconditional early returns at lines 45 (`if (!profile) return null`) and 46 (`if (resultId === 'new') return null`). When the component first renders with `resultId === 'new'`, only two `useEffect` hooks are registered; after `useEffect` #1 navigates to the newly-created id and the component re-renders, three `useEffect` hooks are registered. React enforces a stable hook count per render and throws `Rendered more hooks than during the previous render.` This is a Rules-of-Hooks violation that will produce a runtime crash whenever the `/q-categories/:profileId/new` → `/q-categories/:profileId/<uuid>` flow runs in production. The test happens to use a tolerant `hasPage || hasHome` assertion that masks the crash in jsdom.

**Fix:**
```tsx
export function CategoryOverview() {
  const { profileId, resultId } = useParams<{ profileId: string; resultId: string }>()
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const allResults = useStore((s) => s.results)
  const saveResult = useStore((s) => s.saveResult)
  const lang = getLang()

  const profile = profileId ? profiles.find((p) => p.id === profileId) ?? null : null
  const result = resultId && resultId !== 'new'
    ? allResults.find((r) => r.id === resultId) ?? null
    : null

  // All useEffects declared together at the top — never conditional.
  useEffect(() => {
    if (!profile) { navigate('/'); return }
    if (resultId === 'new') {
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `r-${Date.now()}`
      saveResult({
        id, profileId: profile.id, subject: profile.name,
        subjectColor: profile.color, subjectEmoji: profile.emoji,
        answers: {}, enabledCategories: CATEGORIES.map((c) => c.id),
        progress: { mode: 'list' }, createdAt: Date.now(), updatedAt: Date.now(),
      })
      navigate(`/q-categories/${profile.id}/${id}`, { replace: true })
      return
    }
    if (!result) navigate(`/profile/${profile.id}`)
  }, [profile, result, resultId, saveResult, navigate])

  if (!profile || !result) return null
  // …rest of render unchanged
}
```

### CR-02: Calling `navigate()` during render in `Result` and `MapSettings`

**File:** `src/routes/Result.tsx:37-38`, `src/routes/MapSettings.tsx:30` (paired with the useEffect at 27-29, but the imperative `if (!result) return null` at line 30 sits after a `useEffect` that may have queued `navigate`)
**Issue:** `Result.tsx` lines 37-38 call `navigate('/')` directly during render when `result` or `profile` is null. React 19 logs `Warning: Cannot update a component (...) while rendering a different component`. In Strict Mode (double-invocation) this causes the navigation to fire twice and may interleave with the initial render in unpredictable ways. The same anti-pattern exists in older code paths and could yield infinite redirect loops if a parent re-renders before the navigation resolves.

**Fix:**
```tsx
// Result.tsx — replace lines 37-38 with a useEffect, like ProfileDetail.tsx already does.
useEffect(() => {
  if (!result || !profile) navigate('/')
}, [result, profile, navigate])
if (!result || !profile) return null
```

### CR-03: `addCustom` OK button returns a sentinel, never the typed value

**File:** `src/components/questionnaire/ListMode.tsx:33-51`
**Issue:** The custom-item dialog renders an input that mutates a local `value` variable on change, and an OK action with literal `value: '__placeholder__'`. The dialog body's Enter handler calls `close(value.trim() || null)` and returns the typed string. But when the user clicks OK in the dialog footer, `DialogHost` resolves with the literal `'__placeholder__'`, which the caller then explicitly bails on at line 51: `if (!name || name === '__placeholder__') return`. Result: **clicking the OK button silently discards the user's input**; only the Enter key submits. This blocks mouse-only and touchscreen users from adding custom items — a regression in core questionnaire functionality.

**Fix:** Refactor the dialog body to manage state via React (not a captured local variable), and resolve the dialog with the current input value when OK is clicked. The cleanest pattern is a small dedicated dialog wrapper:
```tsx
async function addCustom(catId: string) {
  if (!await confirmIfTemplate()) return
  // Use a controlled-state body via a tiny inner component
  function Body({ close }: { close: (v: string | null) => void }) {
    const [v, setV] = useState('')
    return (
      <form onSubmit={(e) => { e.preventDefault(); close(v.trim() || null) }}>
        <input
          autoFocus
          data-testid="add-custom-input"
          placeholder={t('q_add_custom_placeholder')}
          value={v}
          onChange={(e) => setV(e.target.value)}
          className="w-full rounded border border-line px-2 py-1"
        />
        {/* Hidden submit so Enter works; visible buttons live in DialogHost footer */}
        <button type="submit" hidden />
      </form>
    )
  }
  // Without a way for the OK footer button to access `v`, the cleanest API
  // is to build a one-off Dialog inline rather than going through dialog().
  // Alternatively: extend DialogRequest to allow `getValue: () => T` so the
  // action button can pull current state at click time.
  // …
}
```
At a minimum, replace the `'__placeholder__'` sentinel with `value: 'OK'` and have the body call `close(value)` from a Submit button inside the body itself, then drop the OK action from the footer (use the Submit button as the primary action).

### CR-04: Stale state when prop changes — `MapSettings`, `ItemRow`, `ScaleEditor`

**File:** `src/routes/MapSettings.tsx:21-25`, `src/components/questionnaire/ItemRow.tsx:24`, `src/components/ScaleEditor.tsx:27`
**Issue:** All three components initialise local `useState` from a prop (or store-derived value) and never resync. Concretely:
- `MapSettings.tsx:21-25` — `setSubject`, `setSubjectEmoji`, `setSubjectColor`, `setScale`, `setEnabledCategories` are seeded once from `result?.*`. React Router keeps the component mounted across `/map/A/settings` → `/map/B/settings`, so navigating between two maps leaves the form showing A's data while editing B — saves silently overwrite the second map with the first map's state.
- `ItemRow.tsx:24` — `const [note, setNote] = useState(cell?.note ?? '')`. If the parent re-renders this row with a different `cell` (e.g. after a remote-ish state replace), the input stays at the original value and `onBlur` will write the stale note back over the updated one.
- `ScaleEditor.tsx:27` — `useState<MutableScaleStep[]>(() => scale.map((s) => ({ ...s })))`. Identical issue: if `scale` prop changes from outside (theme switch swaps EN ↔ DE default scale, or `Settings` page rerenders after `setScale`), the editor keeps showing the original copy.

**Fix:** For `MapSettings`, add a key on the route component so React Router remounts on id change:
```tsx
// src/router.tsx
{ path: 'map/:id/settings', element: <MapSettings /> }
// Inside MapSettings.tsx, optionally `useEffect` to resync, OR derive a stable key:
const { id } = useParams<{ id: string }>()
// Then wrap the entire return in a fragment keyed by id at the parent level (router child key).
```
The cleanest fix is to add a `key={id}` boundary inside `MapSettings`:
```tsx
export function MapSettings() {
  const { id } = useParams<{ id: string }>()
  return <MapSettingsInner key={id ?? 'none'} />
}
function MapSettingsInner() { /* current body */ }
```
For `ItemRow` and `ScaleEditor`, either sync via `useEffect`:
```tsx
// ItemRow.tsx
const [note, setNote] = useState(cell?.note ?? '')
useEffect(() => { setNote(cell?.note ?? '') }, [cell?.note])
```
…or remove local state altogether and lift it into the parent / store.

### CR-05: `DataManagement.importBackup` accepts arbitrary JSON without shape validation

**File:** `src/components/DataManagement.tsx:46-66`
**Issue:** `importBackup` only checks `typeof parsed === 'object' && parsed !== null`, then casts the blob to `Partial<{ profiles: any[]; results: any[]; imports: any[]; settings: any; scale: MutableScaleStep[] }>` and feeds it to `replaceAll`. `replaceAll` (in `store.ts:133-143`) blindly spreads these arrays into state. A malicious or corrupt backup file (a copy-paste accident, a phishing payload, or tampered DevTools-edited download) can poison the store with values that crash subsequent renders:
- `profiles: "oops"` makes `state.profiles.map(...)` throw at every render of `Home` / `ProfilePicker`;
- `results: [{ id: null, profileId: undefined }]` causes downstream finds and `result.answers[catId]?.[...]` lookups to throw;
- `scale: ["not an object"]` poisons every chart and the migration helper.

The persistence layer then writes the corrupt blob back to localStorage on the next mutation, making the state permanently unusable until the user manually clears `relationshape.v1`. Because the import is reachable from the Settings page with no further confirmation past the AlertDialog "Restore?", this is also a footgun for accidental data destruction.

**Fix:** Validate the shape before calling `replaceAll`. Reuse / extend `parseImportPayload` patterns:
```tsx
function isPersistedShape(p: unknown): p is Partial<PersistedShape> {
  if (typeof p !== 'object' || p === null) return false
  const r = p as Record<string, unknown>
  const okArr = (k: string) => r[k] === undefined || Array.isArray(r[k])
  const okObj = (k: string) => r[k] === undefined || (typeof r[k] === 'object' && r[k] !== null)
  return okArr('profiles') && okArr('results') && okArr('imports') && okObj('settings') && okArr('scale')
}

async function importBackup(file: File) {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text) as unknown
    if (!isPersistedShape(parsed)) throw new Error(t('backup_invalid_shape'))
    // Drill deeper: validate each profile/result/import has a string id
    const profilesValid = (parsed.profiles ?? []).every((p: unknown) =>
      typeof p === 'object' && p !== null && typeof (p as { id?: unknown }).id === 'string')
    if (!profilesValid) throw new Error(t('backup_invalid_profiles'))
    // …similar for results / imports / scale steps
    // Then prompt + replaceAll as before
  } catch (e) {
    toast.error((e as Error).message)
  }
}
```
Also tighten `replaceAll` to be defensive — call the same validator before applying.

## Warnings

### WR-01: `App.tsx` calls `useTheme()` and `useLang()` outside the providers that claim to enforce them

**File:** `src/App.tsx:13-21`, `src/components/providers/ThemeProvider.tsx`, `src/components/providers/I18nProvider.tsx`
**Issue:** `App` calls `useTheme()` and `useLang()` at the top level (lines 13-14) BEFORE rendering `<ThemeProvider>` / `<I18nProvider>` (lines 16-17), which themselves call `useTheme()` / `useLang()` again. The hooks therefore run twice per render. The providers do not actually depend on the context they create (`useTheme`/`useLang` consume Zustand directly), so the provider contract ("must be wrapped") is decorative; it is not enforced. Either remove the top-level calls in `App` or remove the providers entirely.

**Fix:** Drop the duplicate calls in `App.tsx`:
```tsx
export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </ThemeProvider>
  )
}
```

### WR-02: `Share.downloadFile` may cancel itself on legacy browsers

**File:** `src/routes/Share.tsx:59-68`
**Issue:** `downloadFile` calls `a.click()` without appending the anchor to the document, then calls `URL.revokeObjectURL(url)` synchronously on the next line. Firefox <89 requires the anchor to be in the DOM for programmatic clicks; synchronous revocation can cancel the download in some older WebKit builds. Modern Chromium/Safari handle the orphan-anchor case, but cancellation timing is undefined. The same pattern appears in `DataManagement.tsx:37-42`.

**Fix:**
```tsx
function downloadFile() {
  if (!armor) return
  const blob = new Blob([armor], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relationshape-${slug(profile!.name)}-${slug(result!.subject)}.rshape.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on next tick so the browser has finished kicking off the download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
```

### WR-03: `(copyErr as Error).message` and `(encErr as Error).message` are unsafe casts

**File:** `src/routes/Share.tsx:43, 55`, `src/components/DataManagement.tsx:64`
**Issue:** `catch (copyErr) { toast.error((copyErr as Error).message) }` — clipboard rejections and crypto errors are not guaranteed to be Error instances (e.g. `DOMException` with no message, or `throw "string"`). When `.message` is undefined or the value is not an object, the toast is `undefined` or throws. Wrap in `String(err)` or guard:
```tsx
catch (copyErr) {
  toast.error(copyErr instanceof Error ? copyErr.message : String(copyErr))
}
```

### WR-04: `ScaleEditor` `value` input has no NaN/range validation

**File:** `src/components/ScaleEditor.tsx:101-107`
**Issue:** `onChange={(e) => setField(i, { value: Number(e.target.value) })}` — when the input is empty or invalid, `Number('')` is 0, but `Number('abc')` is `NaN`. A NaN scale value silently breaks `scaleMaxValue`, `categoryAverage`, and every downstream chart (every `step.value` comparison becomes false, every division yields NaN). Add a guard and a min/max:
```tsx
onChange={(e) => {
  const n = Number(e.target.value)
  if (Number.isFinite(n)) setField(i, { value: n })
}}
```

### WR-05: `ScaleEditor` aria-labels are hardcoded English

**File:** `src/components/ScaleEditor.tsx:123,132,141`
**Issue:** `aria-label="Move up"`, `"Move down"`, `"Remove"` are hardcoded strings. Screen-reader users in DE locale hear English labels.

**Fix:** Use `t('scale_step_move_up')` etc. and add the keys to both `en.ts` and `de.ts`.

### WR-06: `MapSettings` hardcodes English strings outside `t()`

**File:** `src/routes/MapSettings.tsx:97-103`
**Issue:** `"Use global scale"`, `"Clear override"`, `"Using global scale (X steps)."` are not localised. Same component otherwise uses `t(...)` correctly, so this is inconsistent.

**Fix:** Add `map_settings_use_global_scale`, `map_settings_clear_override`, `map_settings_using_global_scale` keys (with `{n}` interpolation for the count) to both dictionaries and replace the literals.

### WR-07: `ResultCard` hardcoded English fallback `'Untitled map'`

**File:** `src/components/ResultCard.tsx:17`
**Issue:** `<h3>{result.subject || 'Untitled map'}</h3>` — leaks English into DE locale when a map has no subject.

**Fix:** `<h3>{result.subject || t('result_untitled')}</h3>` and add the i18n keys.

### WR-08: `MapSettings` and `ProfileEdit` palette selection ring uses hardcoded `'white'`

**File:** `src/routes/MapSettings.tsx:87`, `src/routes/ProfileEdit.tsx:70`
**Issue:** `borderColor: p === subjectColor ? 'white' : 'transparent'` — in dark mode the selected swatch's white ring is fine, but in light mode against a white surface it is invisible. Use a theme token.

**Fix:** `borderColor: p === subjectColor ? 'var(--ring, currentColor)' : 'transparent'` or use a Tailwind class with `ring-2 ring-foreground`.

### WR-09: `useKeydown` re-binds on every render unless caller memoises handlers

**File:** `src/lib/hooks/useKeydown.ts:4-15`
**Issue:** The hook treats `handlers` as a dependency. Callers must wrap it in `useMemo` or the listener is removed-and-re-added on every render (still correct, but allocates a new closure on each render and inflates the `addEventListener`/`removeEventListener` traffic). Both current callers (`WizardHost`, `SingleMode`) do memoise, but the API is a footgun for future code.

**Fix:** Stabilise inside the hook with a ref:
```ts
export function useKeydown(handlers: KeyHandlers, enabled = true): void {
  const ref = useRef(handlers)
  useEffect(() => { ref.current = handlers })
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const onKey = (e: KeyboardEvent) => { ref.current[e.key]?.(e) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
```

### WR-10: `Compare.tsx` add-menu uses `<details>` instead of a Popover and may not be keyboard accessible across browsers

**File:** `src/routes/Compare.tsx:79-90`
**Issue:** The "+ add" dropdown uses a native `<details>` element wrapping an absolutely-positioned `<ul>`. `<details>` was originally designed for inline expandable content; using it as a menu surface results in tab order issues (Tab into summary then directly into the list once expanded) and the list never closes on click-outside. A `<Popover>` from the existing shadcn primitive would behave consistently with `ProfilePicker` and `EmojiPicker`. Functionality works, but UX/A11Y is inconsistent.

**Fix:** Replace with `<Popover>` for parity with the rest of the app.

### WR-11: `persist.ts` hydrate does no shape validation on individual records

**File:** `src/lib/storage/persist.ts:29-47`
**Issue:** `JSON.parse(raw) as Partial<PersistedShape>` then `parsed.profiles ?? []`. If a user (or DevTools, or a future bug) writes `{"profiles": "oops"}` to `relationshape.v1`, the store hydrates `profiles: "oops"` (a string masquerading as `Profile[]`) and every render throws. The silent `catch` only protects against JSON parse errors, not type mismatches. This is the local-storage analog of CR-05.

**Fix:** Validate each top-level field is an array/object of the right kind. At minimum:
```ts
const slice = {
  profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
  results: Array.isArray(parsed.results) ? parsed.results : [],
  imports: Array.isArray(parsed.imports) ? parsed.imports : [],
  settings: (typeof parsed.settings === 'object' && parsed.settings !== null)
    ? parsed.settings as Settings
    : { theme: 'auto' as const },
  scale: Array.isArray(parsed.scale) ? migrateScale(parsed.scale as MutableScaleStep[]) : DEFAULT_SCALE.map((s) => ({...s})),
}
```

### WR-12: `Compare.useEffect` swallows `toast` from its deps and stays in lint-suppression

**File:** `src/routes/Compare.tsx:21-24`
**Issue:** The `useEffect` reads `toast` and `t()` but only lists `[rawIds.length]` as a dependency, suppressing the exhaustive-deps lint with a comment. If `toast` ever becomes a closed-over stable ref it is fine, but `useToast()` returns a fresh `{ toast: { … } }` object each render, so the dep array's stability is incidental, not guaranteed. The current behaviour (toast once on mount when `>4`) is correct only because `rawIds.length` rarely changes. If `rawIds.length` flips between 5→6 over time (chip add via UI), the toast re-fires, which is plausibly intended; but the closure also captures `t(...)` and uses the **current** language, which could surprise users mid-session.

**Fix:** Either accept the suppression (and document why) or compute the message once and store the toast call in a stable callback. Most defensively, run only on mount and use a stable language snapshot at that moment.

### WR-13: `useState` initializer in `Result` uses `catId` from URL but the URL param is read once

**File:** `src/routes/Result.tsx:24`
**Issue:** `const [activeAxis, setActiveAxis] = useState<string | null>(catId ?? null)` — only honours `catId` on initial mount. When the route changes from `/result/abc` to `/result/abc/intimacy` without a remount (React Router same-pattern), `activeAxis` keeps its old value. The `useEffect` at 30-35 scrolls into view but does not update `activeAxis`. Add a key on the route or reset `activeAxis` on `catId` change.

**Fix:**
```tsx
useEffect(() => { setActiveAxis(catId ?? null) }, [catId])
```

## Info

### IN-01: `dialogQueue.ts` typings widen unsafely with `as DialogRequest`

**File:** `src/lib/dialog/dialogQueue.ts:38`
**Issue:** `useDialogQueue.getState().push({ ...opts, id, resolve } as DialogRequest)` — the cast to `DialogRequest` drops the generic `T`, so callers always store `DialogRequest<unknown>`. The `resolve` typing is widened from `(v: T | null) => void` to `(v: unknown | null) => void`. Callers do `req.resolve(v as never)` (DialogHost line 11) which compiles but is unsafe.

**Fix:** Keep the generic by using a discriminated payload or by accepting the lossy cast and routing all `resolve` calls through a typed helper.

### IN-02: Empty `useRef` allocation in `ScalePicker` unused

**File:** `src/components/ScalePicker.tsx:18`
**Issue:** `const rootRef = useRef<HTMLDivElement | null>(null)` is assigned to the root `<div>` (line 39 `ref={rootRef}`) but never read elsewhere. Dead code or a leftover from an earlier focus-management iteration.

**Fix:** Remove `rootRef` and the `ref={rootRef}` attribute, or use it (e.g. for `rootRef.current?.focus()` after a value change).

### IN-03: `useSpiderInteraction` parameter is unused

**File:** `src/lib/hooks/useSpiderInteraction.ts:15`
**Issue:** `_datasets: readonly ChartDataset[]` is in the signature with an eslint-disable comment but never referenced. If the hook truly does not need it, drop the parameter; if it should be used (e.g. to reset `activeAxis` when datasets change), add the effect.

### IN-04: `dialog.tsx` and `sheet.tsx` show hardcoded English "Close" sr-only labels

**File:** `src/components/ui/dialog.tsx:74, 112`, `src/components/ui/sheet.tsx:78`
**Issue:** `<span className="sr-only">Close</span>` and `<Button variant="outline">Close</Button>` are not localised. These shadcn defaults render the only thing screen-reader users hear for the close affordance. Since these are vendored components, accept-or-override is a design decision, but at minimum a TODO comment should record the trade-off.

**Fix:** Accept a `closeLabel` prop with i18n-friendly default, OR import `t('btn_close')` here. (Note: bundling `t()` into vendored shadcn components couples them to the app; preferred is to pass via the consumer.)

### IN-05: `ItemRow.tsx` G/R/Both hardcoded `aria-label="G/R/Both"`

**File:** `src/components/questionnaire/ItemRow.tsx:85`
**Issue:** The role-group label is the raw token string, not localised, and not particularly useful for screen-reader users. Use a translation key with a descriptive label.

### IN-06: `ItemRow.tsx` cast `as AnswerCell` masks shape assumptions

**File:** `src/components/questionnaire/ItemRow.tsx:32,35,47,50,63,66`
**Issue:** Every mutation does `{ ...(slot[item] ?? {}), scale: key } as AnswerCell`. The cast assures TypeScript that the result satisfies `AnswerCell`, which requires `scale: string`. Because the spread starts from `slot[item] ?? {}`, the result is `{ scale: string, gr?: ..., note?: ... }` and the cast is safe — but the pattern is repeated six times across two methods. Extract a helper:
```ts
function mergeCell(prev: AnswerCell | undefined, patch: Partial<AnswerCell>): AnswerCell {
  return { scale: prev?.scale ?? 'open', ...prev, ...patch }
}
```

### IN-07: `ScaleEditor` interpolates user-controlled labels through `t()`

**File:** `src/components/ScaleEditor.tsx:50-51`
**Issue:** `t('scale_step_remove_confirm', { label: step.label })` interpolates the step's label via `replaceAll('{label}', ...)`. If a malicious label contains the substring `{label}` itself, recursion is avoided (`replaceAll` is not recursive), so no infinite loop. But labels containing other placeholder names (`{name}`) would not be substituted. Today the only placeholder is `{label}`, so this is benign; flagging because the i18n interpolation is naive and adding new variables would silently expose to label-driven substitution.

### IN-08: `Welcome.tsx` constructs i18n keys via template literals

**File:** `src/routes/Welcome.tsx:51,52,57,58`
**Issue:** ``t(`feat_${key}_title` as const)`` constructs keys dynamically. The `as const` makes the union narrow enough to compile, and all four feature keys exist in both `en.ts` and `de.ts`. Acceptable pattern; flagging for visibility — any future feature-key rename must update both the array and the dictionaries together (no compile-time enforcement of the dynamic key shape).

### IN-09: Tests use `state: {…}, version: 1` wrapper that doesn't match the persist format

**File:** `src/__tests__/router.routes.test.tsx:13-26`, `src/__tests__/Nav.test.tsx:10-26`, `src/__tests__/primitives.test.tsx:9-32`
**Issue:** Several test setup helpers seed `localStorage` with `{ state: { profiles: [], …, ageConfirmed: true, … }, version: 1 }`, but the production `relationshapePersist` middleware reads the raw object — there is no `state` wrapper or `version` field (see `persist.ts:34-43`). The seed effectively fails to hydrate, so the tests run against the default empty store and the AgeGate dialog blocks. The tests still pass because the assertions target elements outside the AgeGate (like Nav structure), but the helpers are misleading: they look like they seed `ageConfirmed`, but they don't.

**Fix:** Either match the real shape (drop the `state` wrapper) or document the test-only stub explicitly. Compare with `makeStoreWithProfile()` in the same file — it uses the correct shape and works as intended.

---

_Reviewed: 2026-05-16T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
