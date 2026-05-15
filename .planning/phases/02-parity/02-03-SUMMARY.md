---
plan: 02-03
phase: 02
subsystem: profile-lifecycle
tags: [profile, welcome, home, emoji-picker, intro, i18n, rich-text, routes]
dependency_graph:
  requires: [02-02-PLAN.md]
  provides: [Welcome, Home, ProfileEdit, ProfileDetail, Intro, EmojiPicker, ResultCard, EMOJI_BANK, RICH_TEXT_KEYS, isTemplateImport, importLabel]
  affects: [router.tsx, _placeholders.tsx, en.ts, de.ts, types.ts, vitest.config.ts]
tech_stack:
  added: []
  patterns: [zustand-array-selector-then-derive, pool-forks-vitest-isolation, rich-text-allow-list, useEffect-navigate-guard]
key_files:
  created:
    - src/lib/data/emoji.ts
    - src/lib/data/__tests__/emoji.test.ts
    - src/components/EmojiPicker.tsx
    - src/lib/i18n/richText.tsx
    - src/lib/i18n/__tests__/richText.test.ts
    - src/lib/data/imports.ts
    - src/routes/Welcome.tsx
    - src/routes/Home.tsx
    - src/routes/ProfileEdit.tsx
    - src/routes/ProfileDetail.tsx
    - src/routes/Intro.tsx
    - src/components/ResultCard.tsx
    - src/routes/__tests__/Profile.test.tsx
    - src/routes/__tests__/Intro.test.tsx
  modified:
    - src/lib/i18n/en.ts
    - src/lib/i18n/de.ts
    - src/lib/i18n/__tests__/i18n.test.ts
    - src/lib/storage/types.ts
    - src/router.tsx
    - src/routes/_placeholders.tsx
    - vitest.config.ts
  deleted:
    - src/routes/Placeholder.tsx
decisions:
  - "ProfileDetail/ProfileEdit: select full array from Zustand then derive in component body to avoid unstable useSyncExternalStore snapshot references (React 19 getSnapshot cache warning)"
  - "ProfileDetail: useEffect for navigate-on-not-found to avoid setState-in-render error"
  - "vitest.config.ts: pool=forks to prevent vi.stubGlobal/vi.resetModules conflicts between parallel jsdom tests"
  - "richText.tsx: .tsx extension required for JSX (not .ts)"
  - "isTemplateImport: v1.0-exact logic (exportMode=template OR restricted+!unlocked); added exportMode/answersUnlocked to Import type"
  - "emoji.ts: replaced \\x00-\\x7F fallback regex with charCodeAt(0)>127 to fix no-control-regex lint rule"
metrics:
  duration: "21 min"
  completed: "2026-05-16"
  tasks: 8
  files: 21
  tests_added: 17
  tests_total: 115
---

# Phase 2 Plan 03: Profile lifecycle Summary

## One-liner

Profile lifecycle fully implemented: Welcome hero+features+CTA, Home grid+import list, ProfileEdit controlled form with shadcn Popover EmojiPicker (76-entry EMOJI_BANK), ProfileDetail header+ResultCard list, Intro/About prose with RICH_TEXT_KEYS allow-list, and 18 new i18n keys appended to EN+DE maps.

## What Was Built

**EMOJI_BANK + isLikelyEmoji (Task 01):**
- `src/lib/data/emoji.ts`: 76 entries ported verbatim from `public/legacy/js/app.js:97-105`
- `isLikelyEmoji`: Unicode property regex with 12-char length guard; fallback uses `charCodeAt`
- Vitest spec: count ≥ 70, no duplicates, accept 🌷/💖/🦋, reject abc/empty/long strings

**EmojiPicker + i18n keys (Task 02):**
- `src/components/EmojiPicker.tsx`: shadcn Popover hosting 76-grid + free-input with isLikelyEmoji validation
- en.ts + de.ts: 18 new keys added (emoji_picker_label, profile_notes_label, new_map_btn, confirm_delete_profile_title, confirm_delete_result_title, confirm_delete_result, welcome_how_1..4, feat_sharing_*, feat_multi_*)

**RICH_TEXT_KEYS allow-list (Task 03):**
- `src/lib/i18n/richText.tsx`: typed `satisfies readonly TranslationKey[]` compile gate
- `isRichTextKey` type predicate; `TranslatedText` component routes to `dangerouslySetInnerHTML` only for allow-listed keys (D-12)

**imports.ts helpers (Task 04):**
- `isTemplateImport`: exact v1.0 logic (exportMode=template OR restricted+!unlocked)
- `importLabel`: `who · subj` format with optional-field guards
- `src/lib/storage/types.ts`: added `exportMode`, `answersUnlocked`, `templateWarningDisabled` to `Import` type (Rule 2 - needed for correct filter logic)

**i18n key expansion + richText test (Task 05):**
- i18n key count: 348 → 366 (18 new plan-03 keys)
- `i18n.test.ts`: updated expected count to 366
- `richText.test.ts`: 2 tests assert every RICH_TEXT_KEY is non-empty in EN+DE

**5 route components + ResultCard (Task 06):**
- `Welcome.tsx`: hero blob, FEATURES loop (4 feature dialogs), startNowFlow (dialog-or-navigate), how-to list
- `Home.tsx`: profile cards grid using `useStore`, visible imports filtered via `isTemplateImport`
- `ProfileEdit.tsx`: controlled form (name/pronouns/emoji/color/notes), PALETTE colour picker, EmojiPicker integration
- `ProfileDetail.tsx`: profile header with edit/delete, results list via ResultCard, useEffect navigate guard
- `Intro.tsx`: flat prose from i18n, credits section via `TranslatedText` component
- `ResultCard.tsx`: linked card with avatar + subject + version badge

**Router wiring + placeholder cleanup (Task 07):**
- `router.tsx`: import 5 real route components (Home/Welcome/ProfileEdit/ProfileDetail/Intro)
- `_placeholders.tsx`: removed 5 replaced placeholders; kept CategoryOverview..MapSettings
- `Placeholder.tsx`: deleted (superseded)
- `router.routes.test.tsx`: updated 5 route assertions to `data-testid` (real components), pre-seeded profile data for `/profile/:id` test in flat persist format

**Profile.test.tsx + Intro.test.tsx (Task 08):**
- `Profile.test.tsx`: 7 tests covering Home cards, template import filter, ProfileEdit create/update round-trips through Zustand, ProfileDetail header+results, Welcome CTA navigation, T-02-08 XSS escape
- `Intro.test.tsx`: 2 tests for /intro and /about alias

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] richText.tsx needed .tsx extension (not .ts)**
- **Found during:** Task 03
- **Issue:** JSX in richText.ts caused TypeScript errors (`'>' expected`)
- **Fix:** Renamed to `richText.tsx`
- **Files modified:** `src/lib/i18n/richText.tsx`
- **Commit:** 24c603f

**2. [Rule 1 - Bug] emoji.ts: `\x00-\x7F` in regex triggered `no-control-regex` lint error**
- **Found during:** Task 06 (lint check on new files)
- **Issue:** ESLint `no-control-regex` rule flags `\x00` in fallback regex
- **Fix:** Replaced with `value.charCodeAt(0) > 127` (equivalent, lint-clean)
- **Files modified:** `src/lib/data/emoji.ts`
- **Commit:** f0724d1

**3. [Rule 1 - Bug] ProfileDetail useSyncExternalStore infinite loop (React 19)**
- **Found during:** Task 07 (router.routes.test for /profile/:id)
- **Issue:** `useStore((s) => s.profiles.find(p => p.id === id))` creates new object reference every render — React 19's `useSyncExternalStore` getSnapshot requires stable references
- **Fix:** Select `s.profiles` array (stable Zustand reference), derive `find` in component body
- **Files modified:** `src/routes/ProfileDetail.tsx`, `src/routes/ProfileEdit.tsx`
- **Commit:** 6da76fe

**4. [Rule 2 - Critical] Import type missing exportMode/answersUnlocked fields**
- **Found during:** Task 04 (implementing isTemplateImport)
- **Issue:** v1.0's isTemplateImport checks `imp.exportMode` and `imp.answersUnlocked` but these fields weren't in the `Import` type
- **Fix:** Added `exportMode`, `answersUnlocked`, `templateWarningDisabled` to types.ts
- **Files modified:** `src/lib/storage/types.ts`
- **Commit:** 9184be8

**5. [Rule 3 - Blocking] Parallel jsdom tests interfere via vi.stubGlobal/vi.resetModules**
- **Found during:** Task 08 (full test suite run)
- **Issue:** 30 tests failed when all 20 test files ran in parallel; each passing individually
- **Fix:** Added `pool: 'forks'` to vitest.config.ts (prevents module-level state conflicts)
- **Files modified:** `vitest.config.ts`
- **Commit:** c3c16ba

**6. [Rule 1 - Bug] ProfileDetail: synchronous navigate() caused "setState in render" error**
- **Found during:** Task 07 (router.routes.test for /profile/:id)
- **Issue:** `if (!profile) { navigate('/'); return null }` called navigate during render phase
- **Fix:** Moved to `useEffect(() => { if (!profile) navigate('/') }, [profile, navigate])`
- **Files modified:** `src/routes/ProfileDetail.tsx`
- **Commit:** 6da76fe

## Known Stubs

None. All route components are wired to real Zustand data. No placeholder content remains in the 5 new routes.

## Threat Flags

No new threat surface beyond the plan's documented threat model (T-02-08 through T-02-11):
- T-02-08 (XSS): Profile names/pronouns render via React text nodes only — Profile.test.tsx asserts `<script>alert(1)</script>` as payload renders safely
- T-02-09 (RICH_TEXT_KEYS gate): `satisfies readonly TranslationKey[]` enforces compile-time correctness — richText.test.ts asserts all keys resolve non-empty
- T-02-10 (no external network): All data via Zustand → localStorage; deleteProfile cascades to results (existing)
- T-02-11 (Repudiation): Wired by plan 02-02 RootLayout; no new wiring needed

## Self-Check: PASSED

All 14 created files confirmed present. Placeholder.tsx confirmed deleted. All 8 task commits found in git log:
- b0afa02 (task 01): EMOJI_BANK 76 entries
- 27d611a (task 02): EmojiPicker + i18n keys
- 24c603f (task 03): RICH_TEXT_KEYS
- 9184be8 (task 04): imports helpers + type extensions
- 55fef00 (task 05): i18n count update + richText test
- f0724d1 (task 06): 5 route components + ResultCard
- 6da76fe (task 07): router wiring + placeholder cleanup
- c3c16ba (task 08): Profile.test.tsx + Intro.test.tsx + pool:forks

Full test suite: 20 test files, 115 tests, 0 failures. TypeScript build clean. Production build succeeds (165.67 KB gzip).
