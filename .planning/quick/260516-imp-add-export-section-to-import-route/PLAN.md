---
id: 260516-imp
status: complete
created: 2026-05-16
---

# Add Export section to /import route

The new React `/#/import` route had only the Import form; legacy `/legacy/#/import`
also renders a "Eigene Daten teilen / sicherer Export" section listing each
profile's saved results with a Share button. Port that section.

## Tasks

1. Read `profiles` and `results` from the store in `src/routes/Import.tsx`.
2. Group results by profile (skip profiles with no results).
3. Append a `section-divider`, the `import_section2_title` heading, the
   `import_section2_text` muted copy, and either an `export-results-list`
   (profile head row + result rows with Share button → `/share/:id`) or the
   `import_no_results` muted fallback.
4. Reuse existing legacy CSS classes (already in `src/styles/legacy-components.css`).
5. Reuse existing i18n keys `import_section2_title`, `import_section2_text`,
   `import_no_results`, `btn_share` (already in `de.ts` / `en.ts`).
