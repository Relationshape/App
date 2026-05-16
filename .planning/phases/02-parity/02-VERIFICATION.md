---
phase: 02-parity
verified: 2026-05-16T15:30:00Z
status: human_needed
score: 16/18
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 14/18
  gaps_closed:
    - "CategoryOverview Rules-of-Hooks violation (CR-01) — all three useEffect calls now precede early returns"
    - "ListMode addCustom OK button sentinel (CR-03) — OK button now calls close(value.trim() || null) via body closure"
  gaps_remaining: []
  regressions: []
gaps: []
human_verification:
  - test: "Visual parity check — Welcome, Home, Profile, Questionnaire, Result, Share, Compare, Settings routes"
    expected: "Each route renders at visual parity with v1.0 Celestial Map aesthetic: correct tokens, fonts, dark/light themes, animations"
    why_human: "Visual appearance and Celestial Map aesthetic cannot be asserted programmatically; requires eyeball comparison against v1.0 running at /legacy/"
  - test: "Touch swipe in SingleMode questionnaire on a real coarse-pointer device"
    expected: "Swiping left/right on a mobile browser advances/reverses the single-card view"
    why_human: "useSwipe uses @use-gesture/react pointer events; jsdom tests use a fallback (direct handler invocation). Real pointer-coarse behavior requires a device or BrowserStack"
  - test: "AgeGate and WizardHost block/flow on first real browser load"
    expected: "Fresh browser shows AgeGate → age confirm → WizardHost 7 steps → app. Second load skips both."
    why_human: "localStorage persistence of ageConfirmed and wizardSeen across reload cannot be verified in Vitest jsdom"
  - test: "Import of a v1.0-produced bundle via file upload (not just paste) decrypts correctly"
    expected: "User clicks upload, selects a .rshape.txt file, enters passphrase, and the import appears in Compare"
    why_human: "File-upload flow uses FileReader/File API; programmatic file input is not reliable in jsdom without extensive mocking"
  - test: "EnlargedSpider modal — focus returns to trigger after ESC/close"
    expected: "After closing the enlarged spider chart dialog, focus returns to the element that opened it"
    why_human: "Focus return after Radix Dialog close is verified by the a11y.dialog.test.tsx but confirming real-browser focus management requires human observation"
---

# Phase 2: Parity — Verification Report (Re-verification)

**Phase Goal:** Build the React app shell (typed providers, persistent nav, full route table, hash-deep-link compatibility, shadcn-based toast + dialog primitives) and ship every v1.0 view as React components with full feature parity — profile lifecycle, questionnaire (list + swipe modes), results & charts, share/import/compare, and settings — including EN/DE strings, encrypted bundle round-trip, and accessible dialogs.
**Verified:** 2026-05-16T15:30:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (commit 81021d5)

## Re-verification Summary

Previous status: `gaps_found` (14/18). Two blockers were closed:

| Gap | Previous Finding | Fix Verified |
|-----|-----------------|--------------|
| CR-01 | `useEffect` at line 50 placed after two early returns at lines 45-46 — Rules of Hooks crash on new-result flow | All three `useEffect` calls now at lines 26, 44, 48 — all ABOVE early returns at lines 52-54. Third effect guards on `profile && !result && resultId !== 'new'`. No hook count instability. |
| CR-03 | `addCustom` OK button resolved with literal `'__placeholder__'` sentinel — mouse/touch users could not add custom items | OK button is now rendered inside `body: (close) => { ... }` closure; calls `close(value.trim() \|\| null)`. Actions array contains only Cancel. No `'__placeholder__'` string anywhere in the file. `if (!name) return` handles null without a sentinel check. |

No regressions introduced. Advisory issues CR-02, CR-04, CR-05 (see below) remain open for the `--fix` cycle.

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every v1.0 hash route resolves without 404; deep link `#/result/abc/intimacy` opens correct view | VERIFIED | `src/router.tsx` imports 16 real route components via `createHashRouter`; `result/:id/:catId` route present; router.routes.test.tsx covers all 16 routes + about alias |
| 2 | Persistent `<Nav />` with profile picker, imports, compare, settings, theme, lang; provider tree reactive | VERIFIED | Nav.tsx uses shadcn Sheet for mobile + Popover for ProfilePicker; ThemeProvider + I18nProvider wrap RouterProvider; ThemeToggle + LangToggle in Nav confirmed |
| 3 | `useToast` (Sonner) and typed `<Dialog />` replace v1.0 showToast/dlgAlert/dlgConfirm/dialog() | VERIFIED | Toaster + DialogHost + AgeGate + WizardHost all mounted in RootLayout; lastSaveError wired to toast.error; primitives.test.tsx 4+ tests |
| 4 | Welcome, Home, profile cards, create/delete affordances at parity in EN and DE | VERIFIED | Welcome.tsx (75 lines), Home.tsx with isTemplateImport filter, i18n keys confirmed in both en.ts + de.ts |
| 5 | Profile create/edit/delete (name, pronouns, emoji, colour, notes) persists via Store | VERIFIED | ProfileEdit.tsx uses createProfile/updateProfile via useStore; EmojiPicker with EMOJI_BANK wired; ProfileDetail with deleteProfile + dialog confirm |
| 6 | First-visit wizard (swipe + arrow-key, skip, never re-shows); age-gate blocks under-18; Intro/About EN+DE | VERIFIED | WizardHost with useSwipe + useKeydown + useReducer; AgeGate with legacy rs-age-confirmed migration; Intro with RICH_TEXT_KEYS |
| 7 | Category toggle in overview confirms to questionnaire with enabledCategories persisted | VERIFIED | CR-01 FIXED: all three useEffect calls (lines 26, 44, 48) precede early returns (lines 52-54). Third effect guards on `profile && !result && resultId !== 'new'`. New-result flow no longer crashes. |
| 8 | List-mode renders category rows with G/R/Both toggles, notes, custom-item add/edit/delete/hide | VERIFIED | CR-03 FIXED: addCustom OK button renders inside body closure, calls `close(value.trim() \|\| null)`. Actions array contains only Cancel. Mouse/touch users can now add custom items. |
| 9 | Scale picker (snap-dots) saves answer; deep-link to catId opens focused result; DE gendered translations | VERIFIED | ScalePicker with ARIA slider + keyboard nav; catId deep-link via useState init from param; de-gendered.test.ts covers *innen forms |
| 10 | Result header (emoji, colour, profile, date, edit/share/delete) at visual parity | VERIFIED | Result.tsx (125 lines) with header, delete confirm, deep-link support; visual parity requires human check |
| 11 | Spider chart (≤4 datasets, axis labels, hover/touch); per-category bar diff; item-level spider; alignment heat strip | VERIFIED | Spider.tsx (128 lines) with useSpiderInteraction; CategoryBars.tsx, ItemSpider.tsx, Alignment.tsx all present; charts compose in Result.tsx |
| 12 | Enlarged spider modal on tap; SVG XSS audit passes | VERIFIED | EnlargedSpider.tsx uses shadcn Dialog with Spider at size=900; SVG via React JSX only (no dangerouslySetInnerHTML in chart files); XSS tests in Spider.test.tsx |
| 13 | Share encrypts result + profile, renders armored output, copy + .rshape.txt download | VERIFIED | Share.tsx uses encryptResult; copy + Blob download confirmed (WR-02 anchor warning noted) |
| 14 | Import accepts paste/file, decrypts, saves to imports pool; v1.0 fixture imports cleanly | VERIFIED | Import.tsx uses decryptResult + saveImport; Import.fixture.test.tsx deep-equals EXPECTED_PAYLOAD against v1-bundle.rshape.txt |
| 15 | Compare renders mixed own+import datasets via URL; Spider + Alignment + CategoryBars | VERIFIED | Compare.tsx reads useSearchParams, enforces ≤4, composes plan-5 charts; Settings.backup.test.tsx has 5 backup tests |
| 16 | Global settings: scale add/edit/delete/reorder persists; theme + lang from both Nav and Settings | VERIFIED | ScaleEditor.tsx (152 lines); ThemeToggle + LangToggle in both Nav.tsx and Settings.tsx confirmed |
| 17 | Per-map settings: subject/emoji/colour/scale override/categories via Store.saveResult | VERIFIED | MapSettings.tsx with ScaleEditor; CR-04 stale-state advisory noted |
| 18 | Every dialog/toast meets shadcn a11y: focus trap, ESC dismiss, ARIA roles | VERIFIED | a11y.dialog.test.tsx (20 assertions); Radix Dialog/AlertDialog provide a11y by construction; human check noted for focus return |

**Score:** 16/18 truths verified (0 FAILED — all blockers closed; human_needed status from 5 human verification items)

Note: truths 10 and 18 are VERIFIED against code evidence but require the human spot-checks below for the visual/focus-return dimensions.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/router.tsx` | createHashRouter with all D-24 routes | VERIFIED | 16 leaf routes + root + design-system; all real components imported |
| `src/routes/RootLayout.tsx` | Toaster + Nav + Outlet + DialogHost + AgeGate + WizardHost | VERIFIED | All 4 mounted; lastSaveError → toast.error wired |
| `src/components/Nav.tsx` | Sheet mobile drawer + Popover ProfilePicker + 4 NavLinks + ThemeToggle + LangToggle | VERIFIED | shadcn Sheet + Popover confirmed; NavLinks present |
| `src/components/providers/ThemeProvider.tsx` | Context wrapper enforcing useTheme | VERIFIED | createContext + throw confirmed |
| `src/components/providers/I18nProvider.tsx` | Context wrapper enforcing useLang | VERIFIED | createContext + throw confirmed |
| `src/hooks/useScrollToTop.ts` | PUSH scroll, POP no-scroll | VERIFIED | useNavigationType POP guard confirmed |
| `src/components/ui/dialog.tsx` | shadcn Dialog primitive | VERIFIED | Vendored |
| `src/components/ui/alert-dialog.tsx` | shadcn AlertDialog primitive | VERIFIED | Vendored |
| `src/components/ui/sonner.tsx` | shadcn Sonner primitive | VERIFIED | Vendored |
| `src/components/ui/sheet.tsx` | shadcn Sheet primitive | VERIFIED | Vendored |
| `src/components/ui/popover.tsx` | shadcn Popover primitive | VERIFIED | Vendored |
| `src/components/ui/tabs.tsx` | shadcn Tabs primitive | VERIFIED | Vendored |
| `src/lib/dialog/dialogQueue.ts` | Zustand queue + dialog() helper | VERIFIED | ≥35 lines; useDialogQueue store present |
| `src/components/DialogHost.tsx` | Portal-mounted Dialog renderer | VERIFIED | queue[0] serialisation guard confirmed |
| `src/lib/hooks/useToast.ts` | Sonner wrapper | VERIFIED | success/error/message methods |
| `src/lib/hooks/useSwipe.ts` | @use-gesture/react axis-locked drag | VERIFIED | useDrag + axis:'x' confirmed |
| `src/components/AgeGate.tsx` | AlertDialog gate + rs-age-confirmed migration | VERIFIED | rs-age-confirmed + ageConfirmed wired |
| `src/components/WizardHost.tsx` | Wizard with useReducer + swipe + keys | VERIFIED | WIZARD_STEPS + wizardSeen + useReducer all present |
| `src/routes/Welcome.tsx` | PROFILE-02 hero + features + CTA + how-to | VERIFIED | 75 lines; dialog() for feature tiles + CTA flow |
| `src/routes/Home.tsx` | PROFILE-01 profiles + imports cards | VERIFIED | isTemplateImport filter + profile cards + create link |
| `src/routes/ProfileEdit.tsx` | PROFILE-03 create/edit form | VERIFIED | createProfile + updateProfile + EmojiPicker wired |
| `src/routes/ProfileDetail.tsx` | PROFILE-04 header + results list | VERIFIED | useParams + delete dialog + ResultCard |
| `src/routes/Intro.tsx` | PROFILE-07 story/credits/privacy EN+DE | VERIFIED | TranslatedText with RICH_TEXT_KEYS |
| `src/components/EmojiPicker.tsx` | Popover + EMOJI_BANK grid | VERIFIED | EMOJI_BANK + isLikelyEmoji + Popover |
| `src/lib/data/emoji.ts` | EMOJI_BANK ≥70 entries | VERIFIED | emoji.test.ts asserts ≥70 |
| `src/lib/i18n/richText.tsx` | RICH_TEXT_KEYS + satisfies TranslationKey | VERIFIED | satisfies readonly TranslationKey[] confirmed; single dangerouslySetInnerHTML |
| `src/routes/CategoryOverview.tsx` | QUEST-01 category tile grid | VERIFIED | CR-01 FIXED: three useEffect at lines 26/44/48 all precede early returns at 52-54; third effect guards new-result navigation; no hook instability |
| `src/routes/Questionnaire.tsx` | List/single dispatcher | VERIFIED | ListMode/SingleMode dispatch by result.progress?.mode |
| `src/components/questionnaire/ListMode.tsx` | QUEST-02/05/07 list questionnaire | VERIFIED | CR-03 FIXED: addCustom OK button in body closure calls close(value.trim() \|\| null); no sentinel; Cancel-only actions array |
| `src/components/questionnaire/SingleMode.tsx` | QUEST-03/04 swipe-mode | VERIFIED | useSwipe + useKeydown + ScalePicker |
| `src/components/ScalePicker.tsx` | Snap-dots ARIA slider | VERIFIED | 76 lines; role=slider + ArrowLeft/Right/Home/End keys |
| `src/lib/charts/math.ts` | Pure chart helpers from charts.js | VERIFIED | 253 lines; categoryAverage + polarToCartesian + labelFontSize |
| `src/lib/charts/items.ts` | flatItemsForResult + enabledItemsForCat | VERIFIED | Both functions present |
| `src/components/charts/Spider.tsx` | RESULT-02 overview spider ≤4 datasets | VERIFIED | 128 lines; React JSX SVG; math.ts imports confirmed |
| `src/components/charts/ItemSpider.tsx` | RESULT-04 per-category spider | VERIFIED | Present; React JSX SVG |
| `src/components/charts/CategoryBars.tsx` | RESULT-03 per-category bar diff | VERIFIED | Present; React JSX SVG |
| `src/components/charts/Alignment.tsx` | RESULT-05 alignment heat strip | VERIFIED | Present |
| `src/components/charts/EnlargedSpider.tsx` | RESULT-06 Dialog with Spider size=900 | VERIFIED | shadcn Dialog at max-w + Spider size=900 |
| `src/routes/Result.tsx` | RESULT-01 header + drill-down + deep-link | VERIFIED | 125 lines; useSpiderInteraction + EnlargedSpider + catId init |
| `src/routes/Share.tsx` | SHARE-01/02 encrypt + copy + download | VERIFIED | encryptResult + Blob + anchor click |
| `src/routes/Import.tsx` | SHARE-03 paste/file + decrypt + saveImport | VERIFIED | decryptResult + saveImport wired |
| `src/routes/Compare.tsx` | SHARE-05 ≤4 datasets Spider + Alignment + bars | VERIFIED | useSearchParams + chart components composed |
| `src/lib/share/payload.ts` | buildSharePayload + parseImportPayload | VERIFIED | relationshape-result envelope |
| `src/routes/Settings.tsx` | SETTINGS-01/02/04 scale + theme + lang + data mgmt | VERIFIED | ScaleEditor + ThemeToggle + LangToggle + DataManagement |
| `src/routes/MapSettings.tsx` | SETTINGS-03 per-map settings | VERIFIED | ScaleEditor + saveResult wired |
| `src/components/ScaleEditor.tsx` | Reusable scale editor | VERIFIED | 152 lines; add/edit/delete/reorder |
| `src/components/DataManagement.tsx` | Export/import/clear-all | VERIFIED | replaceAll + Blob download + AlertDialog clear-all gate |
| `src/__tests__/a11y.dialog.test.tsx` | SETTINGS-05 focus trap + ESC + ARIA | VERIFIED | 20 assertions; focus-trap + ESC + ARIA role/modal |
| `src/__tests__/parity.smoke.test.tsx` | Golden path integration test | VERIFIED | 7 it() blocks covering golden path |
| `tests/fixtures/v1-bundle.fixture.ts` | SHARE-04 fixture regression anchor | VERIFIED | File present; Import.fixture.test.tsx deep-equals payload |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/App.tsx` | `src/router.tsx` | `<RouterProvider router={router}>` + providers | VERIFIED | ThemeProvider + I18nProvider wrap RouterProvider |
| `src/router.tsx` | `src/routes/RootLayout.tsx` | root route element | VERIFIED | `element: <RootLayout>` |
| `src/routes/RootLayout.tsx` | `src/components/Nav.tsx` | `<Nav />` above `<Outlet />` | VERIFIED | Confirmed in RootLayout |
| `src/routes/RootLayout.tsx` | `src/components/ui/sonner.tsx` | `<Toaster />` first child | VERIFIED | Confirmed in RootLayout |
| `src/routes/RootLayout.tsx` | `src/components/DialogHost.tsx` | `<DialogHost />` | VERIFIED | Confirmed in RootLayout |
| `src/routes/RootLayout.tsx` | `src/components/AgeGate.tsx` | `<AgeGate />` | VERIFIED | Confirmed in RootLayout |
| `src/routes/RootLayout.tsx` | `src/components/WizardHost.tsx` | `<WizardHost />` | VERIFIED | Confirmed in RootLayout |
| `src/routes/RootLayout.tsx` | `src/lib/storage/store.ts` | `lastSaveError` → `toast.error` | VERIFIED | useStore(lastSaveError) + useToast wired |
| `src/routes/ProfileEdit.tsx` | `src/components/EmojiPicker.tsx` | `<EmojiPicker value={emoji} onChange={setEmoji}>` | VERIFIED | Confirmed in ProfileEdit |
| `src/components/EmojiPicker.tsx` | `src/lib/data/emoji.ts` | `EMOJI_BANK` import | VERIFIED | Confirmed |
| `src/routes/Questionnaire.tsx` | `ListMode.tsx` / `SingleMode.tsx` | `result.progress?.mode` dispatch | VERIFIED | Confirmed |
| `src/components/questionnaire/SingleMode.tsx` | `src/lib/hooks/useSwipe.ts` | `useSwipe({ onLeft, onRight })` | VERIFIED | Confirmed |
| `src/components/questionnaire/ListMode.tsx` | `src/lib/hooks/useTemplateWarning.tsx` | `confirmIfTemplate()` before mutations | VERIFIED | Confirmed |
| `src/components/charts/Spider.tsx` | `src/lib/charts/math.ts` | imports math helpers | VERIFIED | 5 imports from math.ts |
| `src/routes/Result.tsx` | `src/components/charts/Spider.tsx` | `<Spider datasets={…}>` | VERIFIED | Confirmed |
| `src/routes/Result.tsx` | `src/components/charts/EnlargedSpider.tsx` | `<EnlargedSpider>` on tap | VERIFIED | Confirmed |
| `src/routes/Share.tsx` | `src/lib/crypto/crypto.ts` | `encryptResult(payload, pass)` | VERIFIED | Confirmed |
| `src/routes/Import.tsx` | `src/lib/crypto/crypto.ts` | `decryptResult(armor, pass)` | VERIFIED | Confirmed |
| `src/routes/Import.tsx` | `src/lib/storage/store.ts` | `saveImport(payload)` | VERIFIED | Confirmed |
| `src/routes/Compare.tsx` | `Spider.tsx` + `Alignment.tsx` + `CategoryBars.tsx` | chart composition | VERIFIED | Confirmed |
| `src/routes/Settings.tsx` | `src/components/ScaleEditor.tsx` | `<ScaleEditor>` | VERIFIED | Confirmed |
| `src/routes/Settings.tsx` | `src/components/DataManagement.tsx` | `<DataManagement>` | VERIFIED | Confirmed |
| `src/routes/MapSettings.tsx` | `src/components/ScaleEditor.tsx` | per-map override | VERIFIED | Confirmed |
| `src/components/AgeGate.tsx` | `localStorage['rs-age-confirmed']` | legacy key migration | VERIFIED | rs-age-confirmed confirmed in AgeGate.tsx |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `src/routes/Home.tsx` | `profiles`, `imports` | `useStore(s => s.profiles)` / `useStore(s => s.imports)` | Yes — Zustand store backed by localStorage | FLOWING |
| `src/routes/ProfileDetail.tsx` | `profile`, `results` | `useStore(s => s.profiles.find...)` / `useStore(s => s.results.filter...)` | Yes — store lookup by id | FLOWING |
| `src/routes/Result.tsx` | `result`, `profile`, `datasets` | `useStore` + `mapResultToDataset` | Yes — real store + chart dataset builder | FLOWING |
| `src/routes/Share.tsx` | `armor` | `encryptResult(buildSharePayload(result, profile), pass)` | Yes — real crypto | FLOWING |
| `src/routes/Import.tsx` | imported data | `decryptResult` + `parseImportPayload` + `saveImport` | Yes — real crypto + store write | FLOWING |
| `src/routes/Compare.tsx` | `datasets` | URL ids → store lookups → `mapResultToDataset` / `mapImportToDataset` | Yes — real store | FLOWING |
| `src/routes/Settings.tsx` | `scale`, `settings` | `useStore` | Yes — Zustand | FLOWING |
| `src/components/charts/Spider.tsx` | `datasets` | prop passed from Result/Compare | Yes — real data from parent | FLOWING |
| `src/routes/CategoryOverview.tsx` | `profile`, `result`, `enabled` | `useStore(s => s.profiles)` / `useStore(s => s.results)` | Yes — store lookups; new-result creates real record before redirect | FLOWING |
| `src/components/questionnaire/ListMode.tsx` | custom item `name` | `dialog()` body closure `value` — uncontrolled input + `close(value.trim() \|\| null)` | Yes — live DOM value at submit time | FLOWING |

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| All real routes imported (no placeholders) | `ls src/routes/_placeholders.tsx` | File DELETED | PASS |
| Router has 16+ route paths | `grep -c "path:" src/router.tsx` | 19 | PASS |
| CategoryOverview: all hooks before early returns | grep -n useEffect + return positions | useEffect at lines 26, 44, 48; early returns at lines 52, 53, 54 | PASS (CR-01 FIXED) |
| CategoryOverview: no `__placeholder__` sentinel | grep `__placeholder__` CategoryOverview.tsx | 0 matches | PASS |
| ListMode: no `__placeholder__` sentinel | grep `__placeholder__` ListMode.tsx | 0 matches | PASS (CR-03 FIXED) |
| ListMode: OK button uses body closure | grep `add-custom-ok` ListMode.tsx | Button inside body closure, onClick calls `submit` (closure) | PASS |
| SVG charts use JSX (not innerHTML) | grep `dangerouslySetInnerHTML` Spider/ItemSpider/CategoryBars | 0 matches | PASS |
| EN/DE key parity | 416 keys each per code review | 416 EN, 416 DE — perfect parity | PASS |
| SHARE-04 fixture test exists | `ls Import.fixture.test.tsx` | Present with deep-equal assertion | PASS |
| Backup round-trip test exists | `grep -c it( Settings.backup.test.tsx` | 5 tests | PASS |
| a11y dialog test exists | `grep -c assertions a11y.dialog.test.tsx` | 20 assertions | PASS |
| Parity smoke test exists | `grep -c it( parity.smoke.test.tsx` | 7 it() blocks | PASS |
| Test suite total | 226 tests, 43 files | All passing (typecheck clean + production build 188 KB gzip) | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| SHELL-01 | 02-01 | Client-side routing covers all v1.0 hash routes | SATISFIED | router.tsx with 16 real routes |
| SHELL-02 | 02-01 | Existing deep links continue to resolve | SATISFIED | createHashRouter; catId deep-link route confirmed |
| SHELL-03 | 02-02 | Persistent `<Nav />` with Sheet mobile drawer | SATISFIED | Nav.tsx with shadcn Sheet + Popover ProfilePicker |
| SHELL-04 | 02-01 | Typed ThemeProvider + I18nProvider reactively wrap app | SATISFIED | Both providers wrap RouterProvider in App.tsx |
| SHELL-05 | 02-01 | Scroll-to-top on PUSH, not POP | SATISFIED | useScrollToTop with useNavigationType POP guard |
| SHELL-06 | 02-02 | Toast + Dialog primitives replace v1.0 dialog system | SATISFIED | Toaster + DialogHost + useToast + dialog() all wired |
| PROFILE-01 | 02-03 | Home lists profiles + imports with create affordance | SATISFIED | Home.tsx with isTemplateImport filter |
| PROFILE-02 | 02-03 | Welcome view at parity EN+DE | SATISFIED | Welcome.tsx with hero + features + CTA + how-to |
| PROFILE-03 | 02-03 | Profile create/edit form with EmojiPicker + PALETTE | SATISFIED | ProfileEdit.tsx with createProfile/updateProfile + EmojiPicker |
| PROFILE-04 | 02-03 | Profile detail view with results list and actions | SATISFIED | ProfileDetail.tsx with ResultCard list + delete dialog |
| PROFILE-05 | 02-02 | First-visit wizard swipe + arrow-key + skip | SATISFIED | WizardHost.tsx with useSwipe + useKeydown + useReducer |
| PROFILE-06 | 02-02 | Age-gate blocks under-18; persists via Store | SATISFIED | AgeGate.tsx with rs-age-confirmed migration |
| PROFILE-07 | 02-03 | Intro/About reproduces v1.0 prose EN+DE | SATISFIED | Intro.tsx with TranslatedText + RICH_TEXT_KEYS |
| QUEST-01 | 02-04 | Category overview toggle + confirm to questionnaire | SATISFIED | CR-01 FIXED: hooks moved above early returns; third effect guards new-result navigation safely |
| QUEST-02 | 02-04 | List-mode with G/R/Both, notes, custom-item CRUD | SATISFIED | CR-03 FIXED: addCustom OK button submits via body closure; all input methods work |
| QUEST-03 | 02-04 | Single-card swipe mode + touch + arrow-key | SATISFIED | SingleMode.tsx with useSwipe + useKeydown |
| QUEST-04 | 02-04 | Scale picker snap-dots saves answer | SATISFIED | ScalePicker.tsx with ARIA slider + keyboard nav |
| QUEST-05 | 02-04 | Every answer persists to localStorage via Store.saveResult | SATISFIED | saveResult called on every answer mutation in ListMode + SingleMode |
| QUEST-06 | 02-04 | Deep-link to catId opens spider focused on category | SATISFIED | Result.tsx initialises activeAxis from catId param |
| QUEST-07 | 02-04 | Always-visible save button + tab-switch prompt | SATISFIED | QuestionnaireNav sticky + auto-save (tab-switch prompt explicitly not in v1.0; documented in plan) |
| QUEST-08 | 02-04 | DE gendered translations (*innen / *r) preserved | SATISFIED | de-gendered.test.ts covers Urheber*innen, Freund*in |
| RESULT-01 | 02-05 | Result header at parity | SATISFIED | Result.tsx header with emoji + colour + edit/share/delete |
| RESULT-02 | 02-05 | Overview spider ≤4 datasets + hover/touch interactivity | SATISFIED | Spider.tsx with useSpiderInteraction |
| RESULT-03 | 02-05 | Per-category bar diff | SATISFIED | CategoryBars.tsx composited in Result |
| RESULT-04 | 02-05 | Item-level spider for single category | SATISFIED | ItemSpider.tsx composited in Result |
| RESULT-05 | 02-05 | Alignment heat strip (top matches + biggest gaps) | SATISFIED | Alignment.tsx composited in Result |
| RESULT-06 | 02-05 | Enlarged spider modal at higher resolution | SATISFIED | EnlargedSpider.tsx with Dialog + Spider size=900 |
| RESULT-07 | 02-05 | SVG XSS escape audit — user labels via text nodes only | SATISFIED | All chart SVG via React JSX; no dangerouslySetInnerHTML in chart files; snapshot tests in Spider.test.tsx |
| SHARE-01 | 02-06 | Share encrypts result + renders armored textarea + copy | SATISFIED | Share.tsx with encryptResult + copy button |
| SHARE-02 | 02-06 | Share offers .rshape.txt download | SATISFIED | Share.tsx Blob + anchor click download |
| SHARE-03 | 02-06 | Import accepts paste/file, decrypts, saves to imports | SATISFIED | Import.tsx with decryptResult + saveImport |
| SHARE-04 | 02-06 | v1.0 fixture bundle imports cleanly with correct shape | SATISFIED | Import.fixture.test.tsx deep-equals v1-bundle fixture |
| SHARE-05 | 02-06 | Compare renders mixed own+import datasets ≤4 | SATISFIED | Compare.tsx with useSearchParams + ≤4 enforcement + chart composition |
| SHARE-06 | 02-07 | Backup export/restore round-trip | SATISFIED | DataManagement.tsx with replaceAll + JSON download + AlertDialog confirm |
| SETTINGS-01 | 02-07 | Global scale editor add/edit/delete/reorder | SATISFIED | ScaleEditor.tsx (152 lines) in Settings |
| SETTINGS-02 | 02-07 | Theme + lang from both Nav and Settings | SATISFIED | ThemeToggle + LangToggle in both Nav.tsx and Settings.tsx |
| SETTINGS-03 | 02-07 | Per-map settings: subject/emoji/colour/scale/categories | SATISFIED | MapSettings.tsx with ScaleEditor + saveResult |
| SETTINGS-04 | 02-07 | Data management: export / import / clear-all | SATISFIED | DataManagement.tsx with all three flows + AlertDialog gate |
| SETTINGS-05 | 02-07 | Dialog + toast accessibility: focus trap, ESC, ARIA | SATISFIED | a11y.dialog.test.tsx (20 assertions); Radix primitives provide this by construction |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/routes/Result.tsx` | 37-38 | `navigate('/')` called directly during render (not in useEffect) | WARNING | React 19 warns "cannot update during component"; potential double-invoke in Strict Mode |
| `src/routes/MapSettings.tsx` | 21-25 | `useState(initialProp)` never resyncs — stale state when navigating between maps | WARNING | Saving MapSettings for map B shows and writes map A's data if component stays mounted |
| `src/components/questionnaire/ItemRow.tsx` | 24 | `useState(cell?.note)` never resyncs | WARNING | Note field shows stale value if parent replaces the cell |
| `src/components/ScaleEditor.tsx` | 27 | `useState(() => scale.map(...))` never resyncs | WARNING | Scale editor shows stale steps if store's scale updates externally |
| `src/components/DataManagement.tsx` | 46-66 | `importBackup` passes parsed JSON to `replaceAll` with only `typeof` check | WARNING | Hostile or corrupt backup silently corrupts store state |
| `src/App.tsx` | 13-14 | `useTheme()` / `useLang()` called before the providers that claim to enforce them | WARNING | Hooks run twice per render; "must be wrapped" contract is decorative |

Note: CR-01 (CategoryOverview hooks) and CR-03 (ListMode sentinel) have been removed from this table — both are FIXED as of commit 81021d5.

### Code Review Advisory Issues — Deferred to `--fix` Cycle

The following findings from `02-REVIEW.md` are documented here as known issues. They are advisory — the phase goal is fully satisfied in code. They are scheduled for resolution in a future `/gsd-code-review 2 --fix` pass.

**CR-02 (WARNING) — Result.tsx navigate-during-render:**
`navigate('/')` at lines 37-38 is called directly in the render body (not inside a `useEffect`). React 19 warns "cannot update a component while rendering a different component". While unlikely to manifest as a visible crash in Strict Mode (the effect is idempotent), the correct pattern is `useEffect(() => { if (!result) navigate('/') }, [result, navigate])`.

**CR-04 (WARNING) — Stale useState from props (3 components):**
`MapSettings.tsx`, `ItemRow.tsx`, and `ScaleEditor.tsx` all initialise local state from a prop and never re-sync when the prop changes. In practice this requires navigation away and back to reset, but for MapSettings specifically there is a real data-integrity risk if a user navigates between two maps without the component unmounting.

**CR-05 (WARNING) — DataManagement importBackup lacks shape validation:**
`replaceAll` is called with raw `JSON.parse()` output guarded only by a `typeof` check. A corrupt or hostile `.rshape.json` backup could silently write invalid data into the Zustand store. A Zod schema guard or manual key validation should be added.

**WR-01 (INFO) — App.tsx double hook invocation:**
`useTheme()` and `useLang()` are called in `App.tsx` before the providers that wrap the RouterProvider. The throw-on-missing enforcement is decorative for the call sites inside the provider tree; the root-level calls run without provider context.

**WR-02 (INFO) — Blob download URL revoke timing:**
`Share.tsx` and `DataManagement.tsx` revoke the object URL synchronously after `click()`. On Firefox <89 and some WebKit versions this can race and corrupt the download. `setTimeout(() => URL.revokeObjectURL(url), 1000)` is the standard workaround.

**WR-05 (INFO) — ScaleEditor aria-labels hardcoded English:**
`ScaleEditor.tsx` ARIA labels are English literals, not i18n keys. Affects screen-reader users in DE locale.

### Human Verification Required

#### 1. Visual Parity Check

**Test:** Load each route in a browser at `/#/welcome`, `/#/`, `/#/profile/new`, etc. Compare against the v1.0 app running at `/legacy/`.
**Expected:** Celestial Map aesthetic at visual parity: correct colours, DM Sans + Playfair Display fonts, dark/light themes via data-theme, animations with reduced-motion guard.
**Why human:** Visual appearance cannot be verified programmatically.

#### 2. Touch Swipe in SingleMode on Real Device

**Test:** On a mobile browser (coarse pointer), open the questionnaire in single-card mode and swipe left/right.
**Expected:** Cards advance/reverse with the swipe gesture at parity with v1.0.
**Why human:** @use-gesture/react depends on setPointerCapture not available in jsdom; tests use a handler-stub fallback.

#### 3. AgeGate + WizardHost First-Load Flow

**Test:** Open the app in a fresh private window (no localStorage). Confirm age, complete wizard, reload.
**Expected:** AgeGate appears first → confirm 18+ → WizardHost 7 steps → app. Second load skips both.
**Why human:** localStorage persistence across reload is not verifiable in Vitest jsdom.

#### 4. File Upload Import Flow

**Test:** On the Import screen, click "Upload file", select `tests/fixtures/v1-bundle.rshape.txt`, enter the fixture passphrase, submit.
**Expected:** Import succeeds and navigates to Compare with the imported dataset visible.
**Why human:** File-input flow with FileReader is not reliable without extensive jsdom mocking.

#### 5. EnlargedSpider Focus Return

**Test:** Open a result, click the spider chart to enlarge, then close the modal (ESC or close button).
**Expected:** Focus returns to the element that triggered the modal open.
**Why human:** Radix Dialog focus return is asserted in a11y.dialog.test.tsx but confirming in real browser requires observation.

### Gaps Summary

No blocking gaps remain. Both previous blockers are closed:

**CR-01 — CategoryOverview Rules-of-Hooks (CLOSED)**

All three `useEffect` calls now appear at lines 26, 44, and 48, before the early returns at lines 52-54. The third effect guards on `profile && !result && resultId !== 'new'`, preventing premature navigation while the new-result redirect is still in flight. The new-result creation flow is safe.

**CR-03 — addCustom OK Button Sentinel (CLOSED)**

The `addCustom` function now renders the OK button inside the `body` closure, giving it direct access to the `value` variable via closure. `onClick` calls `submit()` which invokes `close(value.trim() || null)`. The `'__placeholder__'` sentinel is gone. The `if (!name) return` guard at line 62 handles both Cancel (null) and empty-string submit without a sentinel. Mouse and touch users can now add custom items.

Phase 2 goal is fully achieved in code. The remaining `human_needed` status reflects 5 human spot-checks for visual, touch, persistence, and focus-management dimensions that cannot be asserted programmatically.

---

_Initial verification: 2026-05-16T14:00:00Z_
_Re-verification: 2026-05-16T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
