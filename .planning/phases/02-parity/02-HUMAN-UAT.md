---
status: partial
phase: 02-parity
source: [02-VERIFICATION.md]
started: 2026-05-16T15:30:00Z
updated: 2026-05-16T15:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Visual parity check — every route at v1.0 Celestial Map aesthetic
expected: Welcome / Home / Profile / Questionnaire / Result / Share / Compare / Settings routes render with v1.0 visual parity — correct tokens, fonts, dark/light themes, animations. Compare side-by-side with `/legacy/`.
result: [pending]

### 2. Touch swipe in SingleMode on a coarse-pointer device
expected: Mobile browser or trackpad gesture left/right advances/reverses the single-card questionnaire view.
result: [pending]

### 3. AgeGate + WizardHost first-load flow
expected: Fresh browser shows AgeGate → confirm age → WizardHost 7 steps → app. Second load skips both.
result: [pending]

### 4. File upload import of a v1.0-produced bundle
expected: User clicks upload button on Import screen, selects a `.rshape.txt` file produced by v1.0, enters passphrase, and the import appears in Compare.
result: [pending]

### 5. EnlargedSpider modal — focus return to trigger
expected: After closing the enlarged spider chart dialog (ESC or close button), keyboard focus returns to the element that opened it.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
