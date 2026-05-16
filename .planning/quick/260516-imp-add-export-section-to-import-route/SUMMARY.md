---
id: 260516-imp
status: complete
completed: 2026-05-16
---

# Summary

Ported the Export section from `public/legacy/js/app.js:3441-3447` to the React
`Import` route. Reads `profiles` + `results` from the Zustand store, groups
results by profile, and renders profile heads + result rows with a Share
button that navigates to `/share/:id`. Falls back to the `import_no_results`
muted line when no results exist.

## Files touched

- `src/routes/Import.tsx` — added export listing below the import form.

## Verification

- `npx tsc --noEmit` — clean.
- `npx vitest run src/routes/__tests__/Import.test.tsx src/routes/__tests__/Import.fixture.test.tsx` — 6/6 pass.
- Preview server (`preview_start`) failed due to a stale-cwd EPERM in npm; the
  user's existing Vite dev server on :5173 picks up the change via HMR.
