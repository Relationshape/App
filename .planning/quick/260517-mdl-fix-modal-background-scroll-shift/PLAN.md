---
slug: mdl-fix-modal-background-scroll-shift
created: 2026-05-17
type: quick
---

# Fix modal-induced background layout shift

## Problem
Opening any modal (e.g. on `/#/welcome` via the feature buttons) causes the
background to visibly "scroll"/shift. User suspected improper shadcn usage.

## Investigation
- `DialogHost` (`src/components/DialogHost.tsx`) is the imperative dialog
  consumer. It already uses shadcn `Dialog`/`DialogContent`, which wraps
  `radix-ui` `DialogPrimitive`. Usage is **correct**.
- Radix's `Dialog` is modal by default and uses `react-remove-scroll` to lock
  body scroll on open. When the lock kicks in, the page's vertical scrollbar
  disappears, the viewport gains ~15px width, and:
  - `#nav` (`position: fixed; left: 50%; transform: translateX(-50%)`) re-centers
    against the wider viewport → visible jump.
  - Page content reflows wider → "background scrolls" perception.
- `src/styles/legacy-components.css:6` has `html { overflow-x: hidden; }` but
  no `scrollbar-gutter` rule, so the gutter collapses when the scrollbar is hidden.

## Fix
Add `scrollbar-gutter: stable` to the `html` rule in
`src/styles/legacy-components.css`. This reserves space for the vertical
scrollbar at all times, so Radix's scroll-lock no longer changes the viewport
width — fixed/centered elements stay put, no horizontal reflow.

## Files
- `src/styles/legacy-components.css` (1 line)

## Verification
- Open `/#/welcome`, click any of the four feature tiles.
- Background nav + content must not shift horizontally when the modal opens
  or closes.
- Same behaviour expected on any other route that triggers a dialog.
