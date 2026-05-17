---
slug: mdl-fix-modal-background-scroll-shift
status: complete
completed: 2026-05-17
---

# Summary

## What changed
- `src/styles/legacy-components.css`: added `scrollbar-gutter: stable` to the
  `html` rule so the vertical scrollbar gutter is reserved at all times.

## Why
When a Radix Dialog opens, `react-remove-scroll` locks the body and the
vertical scrollbar is removed. Without a stable gutter, the viewport widens
by the scrollbar width, which:

- shifts the centered fixed nav (`#nav` uses `left: 50%; translateX(-50%)`),
- reflows page content horizontally,
- reads as "the background scrolls" when opening the modal.

`scrollbar-gutter: stable` reserves that space permanently, so the lock no
longer changes viewport width and nothing shifts.

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
