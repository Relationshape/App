<!-- refreshed: 2026-05-15 -->
# Codebase Structure

**Analysis Date:** 2026-05-15

## Directory Layout

```
relationshape/
├── index.html          # PWA shell — only HTML file; loads all modules
├── manifest.json       # PWA manifest (standalone display, SVG icons)
├── sw.js               # Service worker — cache-first offline shell
├── README.md           # Project documentation
├── css/
│   ├── style.css       # Base design system (tokens, layout, all components)
│   └── additions.css   # Later additions and overrides (wizard, misc fixes)
├── icons/
│   ├── favicon.svg     # Browser tab icon
│   ├── icon-192.svg    # PWA home screen icon (192×192)
│   └── icon-512.svg    # PWA splash icon (512×512)
├── js/
│   ├── app.js          # Entry module — router, all view functions, h() helper (3496 lines)
│   ├── data.js         # Static questionnaire schema — CATEGORIES, DEFAULT_SCALE, SPIDER_AXES (870 lines)
│   ├── storage.js      # localStorage wrapper — Store object (305 lines)
│   ├── crypto.js       # WebCrypto encrypt/decrypt — encryptResult, decryptResult (136 lines)
│   ├── charts.js       # SVG chart renderers — spider, bars, alignment (478 lines)
│   └── i18n.js         # Translations EN + DE — t(), setLang(), getLang() (778 lines)
└── .planning/
    └── codebase/       # GSD codebase map documents
```

## Directory Purposes

**`css/`:**
- Purpose: All visual styling; no CSS preprocessor, plain CSS with custom properties
- Key split: `style.css` is the base design system (design tokens, typography, layout, all component classes). `additions.css` contains the onboarding wizard styles and any incremental overrides added after the initial design pass — load order matters, `additions.css` always loads second.
- Key files: `css/style.css` (design token definitions under `:root`), `css/additions.css` (wizard overlay, misc patches)

**`icons/`:**
- Purpose: PWA icons only — referenced by `manifest.json` and `index.html`
- Contains: Three SVG files. All are SVG (not PNG/WebP), sized at 192×192 and 512×512. `favicon.svg` is linked via `<link rel="icon">`.
- Generated: No — hand-authored SVG
- Committed: Yes

**`js/`:**
- Purpose: All application logic as ES modules; no bundler, served as-is
- No subdirectories — all six modules at flat depth
- Import graph: `app.js` imports from all others; `charts.js` imports from `data.js`, `storage.js`, `i18n.js`; `storage.js` imports from `data.js` and `i18n.js`; `data.js` and `i18n.js` have no imports

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents for AI-assisted development
- Generated: Yes (by GSD mapping commands)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.html`: The only HTML file. Defines `<nav id="nav">` and `<main id="app">` mount points. Loads `css/style.css`, `css/additions.css`, and `js/app.js` (as `type="module"`). Registers `sw.js` on `window.load`.
- `js/app.js:836`: `DOMContentLoaded` bootstrap sequence — `applyTheme → bindGlobalNav → route → checkAgeGate`
- `js/app.js:853`: `route()` — the hash-router dispatch function

**Router and Navigation:**
- `js/app.js:36`: `navigate(hash)` — all in-app navigation goes through this
- `js/app.js:835`: `window.addEventListener("hashchange", route)` — event binding
- `js/app.js:861–884`: `switch(segs[0])` — full route-to-view dispatch table

**View Functions (all in `js/app.js`):**
- `js/app.js:987`: `viewHome()` — profiles list and imports
- `js/app.js:1014`: `viewWelcome()` — landing/onboarding page
- `js/app.js:1125`: `viewProfileEdit(id)` — create or edit a profile
- `js/app.js:1172`: `viewProfile(id)` — profile detail with result list
- `js/app.js:1230`: `viewCategoryOverview(profileId, resultId)` — pick categories before questionnaire
- `js/app.js:1698`: `viewQuestionnaire(profileId, resultId)` — dispatches to list or single mode
- `js/app.js:1750`: `viewQuestionnaireList(profile, result)` — category-grouped answer list
- `js/app.js:2047`: `viewQuestionnaireSingle(profile, result)` — one-item-at-a-time swipe mode
- `js/app.js:2366`: `viewResult(resultId, openCatId?)` — result overview with charts
- `js/app.js:2875`: `viewShare(resultId)` — encrypt and export a result
- `js/app.js:2952`: `viewImport()` — decrypt/import received bundle + backup export
- `js/app.js:3033`: `viewCompare(ids)` — side-by-side chart comparison
- `js/app.js:3127`: `viewSettings()` — global scale editor, theme, data management
- `js/app.js:3338`: `viewMapSettings(resultId)` — per-map identity, scale, category config
- `js/app.js:3474`: `viewIntro()` — about/about page

**Core Logic:**
- `js/app.js:17`: `h(tag, attrs, ...children)` — hyperscript DOM builder
- `js/app.js:379`: `dialog({title, body, fields, actions})` — reusable modal system
- `js/app.js:728`: `buildWizardSteps()` / `runWizard(steps)` — first-visit onboarding wizard
- `js/storage.js:57`: `Store` — all localStorage reads and writes
- `js/data.js:20`: `CATEGORIES` — questionnaire category definitions
- `js/data.js:8`: `DEFAULT_SCALE` — default 7-step answer scale
- `js/crypto.js:55`: `encryptResult(payload, passphrase)` — AES-GCM 256 encrypt to ASCII armor
- `js/crypto.js:72`: `decryptResult(armored, passphrase)` — decrypt and parse a bundle

**Configuration:**
- `sw.js:2`: `CACHE = "rshape-v9"` — bump this string to invalidate the service worker cache on deploy
- `sw.js:3`: `ASSETS` array — exhaustive list of files to pre-cache; must be updated when new JS/CSS files are added

**Testing:**
- Not applicable — no test files or test runner present

## Naming Conventions

**Files:**
- All lowercase, no separators: `app.js`, `data.js`, `storage.js`, `crypto.js`, `charts.js`, `i18n.js`
- CSS: `style.css`, `additions.css` (descriptive, no prefix)
- Icons: `favicon.svg`, `icon-192.svg`, `icon-512.svg`

**JavaScript identifiers:**
- Functions: camelCase — `viewHome`, `viewProfileEdit`, `bindGlobalNav`, `encryptResult`, `renderSpider`
- View functions: always prefixed `view` — `viewHome`, `viewProfile`, `viewResult`, `viewShare`, `viewImport`, `viewCompare`, `viewSettings`, `viewIntro`, `viewMapSettings`, `viewCategoryOverview`, `viewQuestionnaire`, `viewQuestionnaireList`, `viewQuestionnaireSingle`
- Constants / exported values: SCREAMING_SNAKE_CASE — `CATEGORIES`, `DEFAULT_SCALE`, `SPIDER_AXES`, `CATEGORY_GROUPS`, `ICONS`, `EMOJI_BANK`
- Store methods: camelCase, verb-first — `getProfile`, `createProfile`, `updateProfile`, `deleteProfile`, `saveResult`, `getResultScale`, `setResultScale`
- Local variables: camelCase — `profileId`, `resultId`, `enabledCats`, `catIndex`

**CSS class names:**
- kebab-case throughout — `btn`, `btn-primary`, `btn-ghost`, `page`, `page-section`, `section-head`, `nav-links`, `nav-brand`, `result-head`, `cat-grid`, `scale-editor`, `share-out`, `export-profile-head`
- Component modifier pattern: `btn btn-primary`, `cat-toggle is-on`, `nav-open`
- BEM-lite: `scale-row` / `scale-row-color` / `scale-row-label` / `scale-row-actions`

**Routes (hash segments):**
- kebab-case — `#/`, `#/welcome`, `#/profile/:id`, `#/profile/:id/edit`, `#/profile/new`, `#/q/:profileId/:resultId`, `#/q-categories/:profileId/:resultId`, `#/result/:id`, `#/result/:id/:catId`, `#/share/:id`, `#/import`, `#/compare`, `#/settings`, `#/map/:id/settings`, `#/intro`, `#/about`

## Where to Add New Code

**New view/page:**
- Add a `function viewMyFeature(...)` in `js/app.js` following the `viewX` naming convention
- Add a route case in `js/app.js:861–884` inside the `switch(segs[0])` block
- Add a nav link in `bindGlobalNav()` at `js/app.js:955–961` if it needs a nav entry
- Add translation keys in both `en` and `de` objects in `js/i18n.js`

**New questionnaire category:**
- Add an entry to the `CATEGORIES` array in `js/data.js:20`
- Include `id`, `title`, `de`, `icon`, `color`, `blurb`, `deBlurb`, `items`, `deItems`
- Optionally add `id` to `SPIDER_AXES` (`js/data.js:851`) if it should appear on the overview radar
- Optionally add to a `CATEGORY_GROUPS` group (`js/data.js:780+`) for the category picker grouping

**New chart type:**
- Add an export function in `js/charts.js` following the `render*` naming pattern
- Import and call from `js/app.js`

**New translation key:**
- Add to both `en` and `de` blocks in `js/i18n.js:6`
- Use via `t("my_key")` in any JS file that imports `{ t }` from `./i18n.js`

**New persistent data field:**
- Add read/write methods to the `Store` object in `js/storage.js:57`
- The `defaults()` function at `js/storage.js:33` must include the new field's default value

**New CSS component:**
- Add to `css/style.css` for foundational components; add to `css/additions.css` for overlay-style or feature-specific styles

**New static asset (icon, font, etc.):**
- Place in the appropriate top-level directory
- Add the path to the `ASSETS` array in `sw.js:3` to ensure offline caching

## Special Directories

**`.git/`:**
- Purpose: Git version control
- Generated: Yes
- Committed: N/A

**`.planning/`:**
- Purpose: GSD planning documents — codebase maps, phase plans
- Generated: Yes (GSD commands)
- Committed: Yes

---

*Structure analysis: 2026-05-15*
