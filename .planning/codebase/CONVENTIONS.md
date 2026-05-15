# Coding Conventions

**Analysis Date:** 2026-05-15

## Module System

**ES Modules, no build step.** Every `.js` file uses native `import`/`export` syntax and is loaded directly by the browser via `<script type="module">`. There is no bundler, no transpiler, no `node_modules`. Code must run as-is in modern browsers — do not use features that require polyfilling or compilation.

**Imports are relative paths with `.js` extension** (required by native ESM):
```js
import { CATEGORIES, DEFAULT_SCALE } from "./data.js";
import { Store } from "./storage.js";
import { t, getLang } from "./i18n.js";
```

**Exports are named** (no default exports observed). Module entry point is `js/app.js`, loaded from `index.html`.

**Browser targets:** Modern evergreen browsers only (Chrome, Firefox, Safari, Edge). The codebase uses `crypto.subtle`, `navigator.language`, optional chaining, nullish coalescing, and `TextEncoder`/`TextDecoder` without any fallback shims — only `crypto.randomUUID` has a simple fallback in `js/storage.js`.

## Naming Patterns

**JavaScript — camelCase throughout:**
- Functions: `applyTheme`, `resultLabel`, `viewHome`, `fmtDate`, `parseHex`
- Variables: `activeIdx`, `trackGrad`, `baseKey`
- Module-level constants: SCREAMING_SNAKE_CASE (`ICONS`, `EMOJI_BANK`, `PBKDF2_ITERS`, `VERSION`, `HEADER`, `FOOTER`, `KEY`)
- Object keys in data structures: camelCase (`profileId`, `createdAt`, `updatedAt`)

**CSS — kebab-case class names, no BEM:**
Classes are flat kebab-case: `nav-brand`, `nav-links`, `nav-logo`, `rs-slider`, `rs-slider-tick`, `btn-primary`, `btn-ghost`, `wizard-overlay`, `emoji-picker`, `emoji-grid`. There is no BEM `__element` or `--modifier` convention; modifiers are expressed as additional classes (`.is-active`, `.is-compact`, `.has-value`, `.no-value`, `.show`).

**State modifier classes use `is-` prefix:** `.is-active`, `.is-compact`

## View Functions

All pages are rendered by `viewX()` functions in `js/app.js`. The pattern is:
- Named `view{RouteName}` (e.g. `viewHome`, `viewProfile`, `viewQuestionnaire`, `viewResult`)
- Called directly by the `route()` dispatcher; they mutate `$app.innerHTML = ""` then append DOM nodes
- Return value is sometimes a DOM node (called with `$app.append(viewWelcome())`), sometimes nothing (function mutates `$app` directly)
- Do NOT return HTML strings — all DOM building uses the `h()` helper

Full list: `viewHome`, `viewWelcome`, `viewProfileEdit`, `viewProfile`, `viewCategoryOverview`, `viewQuestionnaire`, `viewQuestionnaireList`, `viewQuestionnaireSingle`, `viewResult`, `viewShare`, `viewImport`, `viewCompare`, `viewSettings`, `viewMapSettings`, `viewIntro` — all in `js/app.js`.

## DOM Building — `h()` Hyperscript Helper

All DOM elements are created with the `h()` helper defined at the top of `js/app.js` (lines 17–31). Never use `document.createElement` directly for view construction.

**Signature:** `h(tag, attrs = {}, ...children)`

**Attribute conventions:**
- `class` → sets `el.className`
- `html` → sets `el.innerHTML` (use sparingly; only for trusted SVG strings)
- `onX` (e.g. `onClick`, `onChange`) → attaches event listener via `addEventListener`
- Boolean `true` → renders as empty attribute (e.g. `disabled: true`)
- `null` / `false` → attribute skipped entirely

**Children:** Strings become text nodes; DOM nodes are appended directly; arrays are flattened; `null`/`false` are skipped.

```js
// Typical usage
h("button", {
  class: "btn btn-primary",
  type: "button",
  onClick: () => handleClick(),
}, t("btn_save"))

h("div", { class: "profile-card" },
  h("span", { class: "emoji" }, profile.emoji),
  h("h3", {}, profile.name))
```

## Routing

Hash-based SPA routing. The `route()` function in `js/app.js` (line 853) reads `location.hash`, splits on `/`, and dispatches to `viewX()` functions via a `switch`. Navigation is done with the `navigate(hash)` helper (line 36), which normalises the hash and either sets `location.hash` or calls `route()` directly when the hash is unchanged.

URL pattern: `#/route/segment1/segment2?key=val`

## Internationalization — `t()` Function

All user-facing strings use `t("key")` from `js/i18n.js`. Never hardcode UI strings.

**`t()` signature:** `t(key, vars = {})`
- Looks up key in current language dictionary (`en` or `de`)
- Falls back to English if key missing in current language
- Falls back to the raw key string if not found anywhere
- Supports `{placeholder}` variable substitution: `t("seeded_toast", { name: "Alice" })`

```js
// Correct
h("h2", {}, t("profiles_title"))
t("imported_versioned_toast", { n: version })

// Wrong — hardcoded strings
h("h2", {}, "Your profiles")
```

**Translation key naming:** `snake_case`, namespaced by section (`nav_`, `btn_`, `profile_`, `q_`, `wizard_`, `share_`, `import_`, `settings_`, etc.). Keys live in the `TRANSLATIONS` object in `js/i18n.js`.

**Language detection:** Auto-detected from `navigator.language`, overridable via settings and persisted in `localStorage`. Supported: `en`, `de`.

**Localized scale:** `getLocalizedDefaultScale()` in `js/i18n.js` returns `DEFAULT_SCALE_DE` for German, English default otherwise.

## State Management

No global store object with a formal API. State is ad-hoc module-level variables in `js/app.js`. Persistent data lives exclusively in `localStorage` through `Store` from `js/storage.js`.

**Storage key:** `"relationshape.v1"` (single JSON blob containing `profiles`, `results`, `imports`, `settings`, `scale`).

**`Store` pattern (`js/storage.js`):** Exported singleton object with methods. Every method calls the internal `load()` function (which parses localStorage) and, if mutating, calls `save(data)`. There is no in-memory cache — every read re-parses from localStorage. This is intentional for simplicity.

**Theme state:** Stored in `localStorage` via `Store.setTheme()` / `Store.getTheme()`, applied via `data-theme` attribute on `<html>`. Values: `"auto"`, `"light"`, `"dark"`.

## Error Handling

**`js/storage.js`:** `load()` wraps `JSON.parse(localStorage.getItem(...))` in `try/catch` — on any error it silently returns `defaults()`. `save()` does NOT wrap `localStorage.setItem()` in a try/catch; if localStorage is full or unavailable the write will throw uncaught.

**`js/crypto.js`:** `decryptResult()` wraps only the `crypto.subtle.decrypt()` call in a try/catch, rethrowing as a human-readable `Error("Wrong passphrase or corrupted bundle.")`. All other WebCrypto calls (key derivation, encryption) are unawaited promise chains that will reject as unhandled if they fail.

**Dialog action handlers (`js/app.js` line 452):** Actions inside `dialog()` wrap `handler()` calls in `try/catch` and display errors via `showToast(err.message || "Error")`.

**General pattern:** Errors surface as toast notifications via `showToast()`. There is no centralised error boundary; async operations that fail outside a dialog will produce unhandled promise rejections.

## UI Feedback Helpers

Three helpers in `js/app.js` for user feedback:
- `showToast(msg)` — transient bottom toast, auto-hides after 1.9 s
- `dlgAlert(message, title)` — async modal with OK button
- `dlgConfirm(message, opts)` — async modal returning boolean
- `dialog({ title, body, fields, actions })` — general-purpose async modal primitive

## CSS Architecture

**Two CSS files loaded in order:**
1. `css/style.css` — base styles, design tokens, layout, components (~1538 lines)
2. `css/additions.css` — additions and overrides, primarily newer components (~1580 lines)

This split is a tech-debt smell — `additions.css` has grown to match `style.css` in size and contains overlapping component definitions. New styles should be added to `additions.css` until a consolidation pass is done.

**Design tokens via CSS custom properties on `:root`:**
```css
/* Core palette */
--bg, --bg-2, --surface, --surface-2, --surface-3
--text, --muted, --line

/* Brand */
--primary, --primary-strong, --accent

/* Status */
--green, --red

/* Typography */
--font-sans, --font-heading

/* Elevation */
--shadow, --shadow-sm

/* Glass surfaces */
--glass, --glass-border, --glass-blur

/* Glow */
--glow, --glow-sm

/* Radii */
--radius, --radius-lg
```

**Theme switching:** Dark mode is the default (tokens set on `:root`). Light mode overrides are applied via `@media (prefers-color-scheme: light)` for `auto` mode, and via `[data-theme="light"]` / `[data-theme="dark"]` attributes set by `applyTheme()` in `js/app.js`. Three-way toggle: `auto`, `light`, `dark`.

**Fonts:** "DM Sans" (body) and "Playfair Display" (headings), loaded from Google Fonts in `index.html`.

## SVG Icons

All navigation and feature icons are inline SVG strings stored in the `ICONS` constant object at the top of `js/app.js` (lines 71–94). Icons are injected via `html: ICONS.nav_profiles` in `h()` calls (uses `innerHTML`). Category and step icons use emoji characters directly in translations.

Navigation icons render at `13×13`, feature highlight icons at `26×26`, how-to step icons at `22×22` — all with `viewBox="0 0 24 24"`.

## Constants and Configuration

**`js/data.js`:** Exports `CATEGORIES`, `DEFAULT_SCALE`, `SPIDER_AXES`, `CATEGORY_GROUPS` — the questionnaire data schema.

**`js/app.js`:** Top-level constants are `$app` / `$nav` (DOM refs), `ICONS` (SVG strings), `EMOJI_BANK` (array).

**`js/crypto.js`:** `PBKDF2_ITERS = 250_000`, `VERSION = "v1"`, armored bundle header/footer strings.

**`js/storage.js`:** `KEY = "relationshape.v1"` (localStorage key), `PALETTE` (profile color array), `EMOJI` (profile emoji array).

## Escape and Safety

HTML escaping uses the `esc()` helper in `js/app.js` (line 32) — a manual character replacement for `&`, `<`, `>`, `"`, `'`. Use `esc()` whenever inserting user-supplied text into HTML strings. The `h()` helper uses `textContent` for string children (safe), but `html:` attribute uses `innerHTML` — only use `html:` for trusted strings (e.g. the `ICONS` constants).

---

*Convention analysis: 2026-05-15*
