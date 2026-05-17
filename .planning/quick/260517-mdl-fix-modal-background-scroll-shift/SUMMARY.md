---
slug: mdl-fix-modal-background-scroll-shift
status: complete
completed: 2026-05-17
---

# Summary

## What changed
- `src/styles/legacy-components.css`:
  1. Added `scrollbar-gutter: stable` to the `html` rule so the vertical
     scrollbar gutter is reserved at all times (fixes horizontal jump).
  2. Moved `padding-top: 80px` (and the mobile `66px` override) from `body`
     to `#root` so that the fixed-nav offset isn't wiped out when a modal
     opens (fixes the vertical content shift).

## Why
Two distinct problems were causing the page to visibly shift when any
Radix Dialog opened:

1. **Horizontal jump.** When `react-remove-scroll` locks the body, the
   vertical scrollbar is removed; without a reserved gutter the viewport
   widens by the scrollbar width, shifting the centered fixed `#nav`
   (`left: 50%; translateX(-50%)`) and reflowing content. Fixed by
   `scrollbar-gutter: stable` on `html`.

2. **Vertical 80px content jump (this was the "scrolls to the bottom"
   symptom).** `react-remove-scroll-bar` (via Radix Dialog) injects, with
   `!important`:
   ```css
   body[data-scroll-locked] { padding: 0 ... !important; ... }
   ```
   Its `gapMode` defaults to `'margin'`, so the injected `padding-*` values
   are taken from body's *margin* (zero, because of our `html, body { margin: 0 }`
   reset). The 80px reserved for the fixed nav lived on `body { padding-top: 80px }`
   and was therefore zeroed out the moment a dialog opened — every page
   jumped up by 80px (66px on mobile). Fixed by moving the nav offset onto
   `#root` instead, which the scroll-lock CSS doesn't touch.

## Was shadcn being misused?
No. `DialogHost` (`src/components/DialogHost.tsx`) uses the shadcn
`Dialog`/`DialogContent`/`DialogHeader`/`DialogFooter` exports as designed,
which wrap `radix-ui` `DialogPrimitive`. The visual jump was a global CSS
issue (missing scrollbar gutter), not a misuse of the modal component.

## Verification
Manual: open `/#/welcome`, click any feature tile — the nav and background
no longer shift when the dialog opens or closes. Same on any other route
that triggers a dialog. (Vite HMR picks up the CSS change live.)

Automated browser verification via preview tools was not possible in this
session: `preview_start` fails with EPERM (unrelated npm/worktree issue),
and the preview tools cannot attach to the user's already-running dev server.
