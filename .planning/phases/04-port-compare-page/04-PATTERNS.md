# Phase 04: Port Compare page — Pattern Map

**Mapped:** 2026-05-17
**Files analyzed:** 5 (3 new, 2 modified)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/RsCompareTile.tsx` (NEW) | UI primitive (button-tile) | request-response (click → `navigate`) | `src/components/RsTile.tsx` (visual idiom) + legacy `app.js:3218-3228` (semantic shape) | role-match + exact-legacy |
| `src/components/CompareWithSomeone.tsx` (NEW) | Section component (single-use) | request-response (read-only over Zustand) | `src/routes/CategoryOverview.tsx` (RsCategoryPicker call-site shape) + legacy `app.js:3212-3279` (semantic shape) | role-match + exact-legacy |
| `src/components/RsCategoryCard.tsx` (NEW) | UI primitive (button-tile + dim/hide rule) | request-response (click → opens modal) | current `Compare.tsx:173-189` `<RsTile>` cat usage + legacy `app.js:2844-2876` `categoryCards` | exact-legacy |
| `src/routes/Result.tsx` (MODIFY) | Route shell | request-response | `src/routes/Compare.tsx` (modal mount, lang/cat helpers, dataset use) | exact role match |
| `src/routes/Compare.tsx` (MODIFY) | Route shell | request-response | `src/routes/CategoryOverview.tsx` (RsCategoryPicker callback+saveResult pattern) | partial role match (for the new picker integration only) |

---

## Pattern Assignments

### `src/components/RsCompareTile.tsx` (NEW — primitive)

**Closest in-repo analog (component file shape):** `src/components/RsTile.tsx`
**Closest semantic analog (legacy JSX shape):** `public/legacy/js/app.js:3218-3228` (`tile()` helper inside `compareTargetPicker`)

**Imports / file-header pattern** — copy from `RsTile.tsx:23-24` (use `CSSProperties` for the `--c` CSS var, no `cn` needed unless extra classes):

```tsx
// RsTile.tsx:23-24
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
```

**Props shape** — model after `RsTileToggleProps` (`RsTile.tsx:33-41`) but simplified to a navigation-tile (no `aria-pressed`, no `active`). Required surface:

```ts
interface RsCompareTileProps {
  color: string                    // → '--c' CSS var
  emoji: string                    // li-avatar content
  title: string                    // h3 in compare-tile-body
  sub?: string                     // muted small <p>; omitted for Import… tile
  onClick: () => void
  className?: string               // for `compare-tile-import` modifier
  testId?: string                  // for stable e2e/unit selectors
  ariaLabel?: string
}
```

**Markup pattern** — port verbatim from legacy `app.js:3218-3228`:

```js
// public/legacy/js/app.js:3218-3228
const tile = (cfg) => h("button", {
  class: "compare-tile",
  style: `--c:${cfg.color}`,
  onClick: () => navigate(`/compare?ids=${currentResultId},${cfg.id}`),
},
  h("div", { class: "li-avatar" }, cfg.emoji),
  h("div", { class: "compare-tile-body" },
    h("h3", {}, cfg.title),
    h("p", { class: "muted small" }, cfg.sub)),
  h("span", { class: "compare-tile-arrow" }, "→"),
);
```

**React equivalent (target):**

```tsx
<button
  type="button"
  className={cn('compare-tile', className)}
  style={{ ['--c' as 'color']: color } as CSSProperties}
  onClick={onClick}
  data-testid={testId}
  aria-label={ariaLabel}
>
  <div className="li-avatar">{emoji}</div>
  <div className="compare-tile-body">
    <h3>{title}</h3>
    {sub ? <p className="muted small">{sub}</p> : null}
  </div>
  <span className="compare-tile-arrow" aria-hidden>→</span>
</button>
```

**CSS already present** — `legacy-components.css:758-782` (`.compare-tile`, `.compare-tile-body`, `.compare-tile-arrow`) and `legacy-components.css:1583-1587` (`.compare-tile-import`). Do not add new CSS.

**`--c` CSS variable pattern** — copy from `RsTile.tsx:58, 82`:

```tsx
// RsTile.tsx:58
const style = { ['--c' as 'color']: color } as CSSProperties
// applied via style={style}
```

This idiom is repeated elsewhere (`Compare.tsx:123`, `Result.tsx:59`). Use it identically.

---

### `src/components/CompareWithSomeone.tsx` (NEW — section)

**Closest in-repo analog (call-site shape — Zustand reads + state + i18n):** `src/routes/CategoryOverview.tsx:16-46`
**Closest semantic analog (legacy structure):** `public/legacy/js/app.js:3212-3279` (`compareTargetPicker`)

**Imports pattern** — model after `CategoryOverview.tsx:1-14`:

```tsx
// CategoryOverview.tsx:6-14 (adapted)
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { RsCompareTile } from '@/components/RsCompareTile'
import { fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'
```

**Props shape** — section is single-use today; minimal surface:

```ts
interface CompareWithSomeoneProps {
  currentResultId: string   // excluded from "Overlay your own maps"
}
```

**Zustand selector pattern** — copy individually-keyed selectors from `Compare.tsx:35-38`:

```tsx
// Compare.tsx:35-38
const profiles = useStore((s) => s.profiles)
const results = useStore((s) => s.results)
const imports = useStore((s) => s.imports)
```

**Avoid:** `useStore(s => ({ a, b, c }))` — returns new object every render, infinite re-render in strict mode (see Risk #5 in 04-RESEARCH.md).

**Navigation pattern** — copy from `CategoryOverview.tsx:46, 79`:

```tsx
const navigate = useNavigate()
// ...
navigate(`/compare?ids=${currentResultId},${otherId}`)
navigate('/import')
```

**Section structure** — port from legacy `app.js:3212-3279`:

```js
// public/legacy/js/app.js:3215-3217  (empty state)
if (!others.length && !imports.length) {
  return h("p", { class: "muted" }, t("no_compare"));
}

// public/legacy/js/app.js:3230-3251  (own-maps section, conditional)
if (others.length) {
  sections.push(
    h("div", { class: "compare-section" },
      h("h3", { class: "compare-section-title" }, t("compare_own_maps")),
      h("div", { class: "compare-grid" },
        ...others.map(o => { /* tile(...) */ }),
      ),
    )
  );
}

// public/legacy/js/app.js:3252-3276  (imports section, ALWAYS rendered)
sections.push(
  h("div", { class: "compare-section" },
    h("h3", { class: "compare-section-title" }, t("compare_imports_title")),
    h("div", { class: "compare-grid" },
      ...imports.map(i => /* tile */),
      /* Import… tile (last) */
    ),
  )
);

return h("div", { class: "compare-pickers-split" }, ...sections);
```

**Tile-config translation (own-result)** — copy field selection from legacy `app.js:3237-3246`:

```js
// emoji = o.subjectEmoji || op?.emoji || "💞"
// color = o.subjectColor || op?.color
// title = `${op?.name || "?"} → ${o.subject}`
// sub   = `${t("updated")} ${fmtDate(o.updatedAt)}`
```

**Tile-config translation (import)** — copy from legacy `app.js:3257-3261`:

```js
// id    = "imp:" + i.id
// emoji = i.emoji || "📨"
// color = i.color || "#7c3aed"
// title = `${i.name} → ${i.subject}`
// sub   = `${t("imported_on")} ${fmtDate(i.importedAt)}`
```

**Import… tile** — copy from legacy `app.js:3263-3273`:

```js
h("button", { class: "compare-tile compare-tile-import", style: "--c:#7c3aed",
  onClick: () => navigate("/import") },
  h("div", { class: "li-avatar" }, "📥"),
  h("div", { class: "compare-tile-body" }, h("h3", {}, t("btn_import_map")), h("p", { class: "muted small" }, "")),
  h("span", { class: "compare-tile-arrow" }, "→"),
)
```

In React: render `<RsCompareTile className="compare-tile-import" color="#7c3aed" emoji="📥" title={t('btn_import_map')} onClick={() => navigate('/import')} />` (omit `sub`).

**i18n pattern** — copy from `Compare.tsx:18, 104-105`:

```tsx
import { t } from '@/lib/i18n/i18n'
// later: {t('compare_own_maps')} / {t('compare_imports_title')} / {t('no_compare')}
```

All ten keys verified present per 04-RESEARCH.md i18n audit (en.ts:202-208, de.ts:211-218). Never inline English strings.

**Empty-state rule** (locked in CONTEXT.md D-03):
- `others.length === 0 && imports.length === 0` → render `<p className="muted">{t('no_compare')}</p>` only.
- `others.length === 0 && imports.length > 0` → omit "Overlay your own maps" section, imports section still renders (with Import… tile).
- Imports section ALWAYS renders when at least one of (imports, others) is non-empty so that the Import… tile is reachable.

---

### `src/components/RsCategoryCard.tsx` (NEW — primitive)

**Closest in-repo analog (current ad-hoc usage being replaced):** `src/routes/Compare.tsx:173-189`
**Closest semantic analog (legacy logic):** `public/legacy/js/app.js:2839-2876` (`categoryCards`)

**Props shape** — locked in 04-RESEARCH.md "Cat-Card Component Extraction":

```ts
interface RsCategoryCardProps {
  cat: CategoryDef                       // for icon, color, title, blurb
  datasets: readonly ChartDataset[]      // for filledCount
  editableResult?: Result | null         // controls hide-vs-dim
  fabiMode?: boolean                     // toggles summary cells (port deferred)
  onClick: () => void
  testId?: string
}
```

Where `CategoryDef = (typeof CATEGORIES)[number]` — same alias used at `Compare.tsx:20` and `CategoryModal.tsx:18`.

**Imports pattern** — model after `RsTile.tsx:23-24` plus i18n/charts:

```tsx
import type { CSSProperties } from 'react'
import type { ChartDataset } from '@/components/charts/types'
import type { Result } from '@/lib/storage/types'
import type { CATEGORIES } from '@/lib/data/data'
import { getLang } from '@/lib/i18n/i18n'
```

**filledCount calculation** — port verbatim from `app.js:2845-2853`:

```js
// public/legacy/js/app.js:2845-2853
const filledCount = datasets.reduce((acc, d) => {
  const slot = d.answers?.[cat.id] || {};
  let n = 0;
  for (const [k, v] of Object.entries(slot)) {
    if (k === "__custom") n += Object.keys(v || {}).length;
    else if (v?.scale) n++;
  }
  return acc + n;
}, 0);
```

TypeScript port (target):

```ts
const filledCount = datasets.reduce((acc, ds) => {
  const slot = ds.answers?.[cat.id]
  if (!slot) return acc
  let n = 0
  for (const [k, v] of Object.entries(slot)) {
    if (k === '__custom') n += Object.keys((v as Record<string, unknown>) ?? {}).length
    else if (k !== '__hidden' && (v as { scale?: unknown })?.scale) n++
  }
  return acc + n
}, 0)
```

Caveat from research: `countAnswers` (`src/lib/format/date.ts:22`) is per-result, totals ALL categories. Do NOT reuse it here — filledCount is per-category. Implement inline.

**Hide-vs-dim rule** — port verbatim from `app.js:2855-2856, 2873-2874`:

```js
// hide (read-only context)
if (filledCount === 0 && !editableResult) return null;
// ...
// dim (editable, but zero)
if (filledCount === 0) card.classList.add("is-empty");
```

React equivalent:

```tsx
if (filledCount === 0 && !editableResult) return null
const isEmpty = filledCount === 0
const className = `cat-card cat-card-btn${isEmpty ? ' is-empty' : ''}`
```

CSS already in place at `legacy-components.css:710` (`.cat-card.is-empty { opacity: .58 }`).

**Markup pattern** — port verbatim from `app.js:2858-2872`:

```js
// public/legacy/js/app.js:2858-2872
h("button", {
  class: "cat-card cat-card-btn",
  style: `--c:${cat.color}`,
  type: "button",
  onClick: () => openCategoryModal(datasets, cat, editableResult),
},
  h("div", { class: "cat-card-head" },
    h("div", { class: "cat-card-icon" }, cat.icon),
    h("div", { class: "cat-card-titles" },
      h("h3", {}, getCatTitle(cat, _cclang)),
      h("p", { class: "muted small" }, _cclang === "de" && cat.deBlurb ? cat.deBlurb : cat.blurb)),
    fabiMode ? h("div", { class: "cat-card-summary", html: summaryCellsHTML(datasets, cat.id) }) : null,
    h("span", { class: "cat-card-toggle", "aria-hidden": "true" }, "→"),
  ),
);
```

React target:

```tsx
<button
  type="button"
  className={className}
  style={{ ['--c' as 'color']: cat.color } as CSSProperties}
  onClick={onClick}
  data-testid={testId}
>
  <div className="cat-card-head">
    <div className="cat-card-icon">{cat.icon}</div>
    <div className="cat-card-titles">
      <h3>{catTitle}</h3>
      <p className="muted small">{catBlurb}</p>
    </div>
    {/* fabiMode summary cells — deferred; placeholder comment only */}
    <span className="cat-card-toggle" aria-hidden>→</span>
  </div>
</button>
```

**Title/blurb localisation** — duplicated today as inline lambdas in `Compare.tsx:78-83`; lift into the new component:

```tsx
// Compare.tsx:78-83 (source of truth)
function catTitle(cat: CategoryDef): string {
  return lang === 'de' && cat.de ? cat.de : cat.title
}
function catBlurb(cat: CategoryDef): string {
  return lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb
}
```

CSS already present — `.cat-card`, `.cat-card-btn`, `.cat-card-head`, `.cat-card-icon`, `.cat-card-titles`, `.cat-card-toggle`, `.cat-card.is-empty` at `legacy-components.css:688-742` and `:710`. Do NOT add Tailwind utility classes alongside legacy classes on the same node (Risk #4 in RESEARCH).

**Fabi-mode summary cells:** out of scope for this phase (CONTEXT D-06 deferred clause + research A2). Leave a `// TODO(fabiMode): summary cells` comment near the toggle span.

---

### `src/routes/Result.tsx` (MODIFY)

**Current structure to remove** (lines locked in 04-RESEARCH.md "Current Result.tsx Structure"):

- `Result.tsx:26-37` — `activeAxis` state + `sectionRefs` + scroll effect. **Remove** wholesale; replace with `[modalCat, setModalCat]` + RAF mount-open effect.
- `Result.tsx:83` — `<Button variant="destructive" onClick={onDelete} …>` Delete. **Remove** per CONTEXT D-02.
- `Result.tsx:45-55` — `onDelete` handler. **Remove** with the button.
- `Result.tsx:86-95` — always-on `<Spider>` section. **Wrap in `{fabiMode && (…)}` only** per CONTEXT D-01.
- `Result.tsx:97-105` — `activeAxis` drill-down section. **Remove** entirely.
- `Result.tsx:107-116` — hidden `<span>` anchor nodes. **Remove** entirely.

**New header structure (D-02)** — port from legacy `app.js:2782-2793`:

```js
// public/legacy/js/app.js:2783-2792
h("header", { class: "result-head", style: `--c:${dataset.color}` },
  h("button", { class: "btn btn-ghost", onClick: () => navigate(`/profile/${profile.id}`) }, t("btn_back")),
  h("div", { class: "li-avatar" }, r.subjectEmoji || "💞"),
  h("div", {},
    h("h1", {}, r.subject + (r.version > 1 ? ` (v${r.version})` : "")),
    h("p", { class: "muted" }, `${profile.emoji} ${profile.name} · ${countAnswers(r)} ${t("answers")} · ${t("result_last_edited")} ${fmtDate(r.updatedAt)}`)),
  h("div", { class: "flex-spacer" }),
  h("button", { class: "btn", onClick: () => navigate(`/map/${r.id}/settings`) }, t("btn_map_settings")),
  h("button", { class: "btn", onClick: () => navigate(`/q/${profile.id}/${r.id}`) }, t("btn_continue_editing")),
  h("button", { class: "btn btn-primary", onClick: () => openExportModal(r, profile) }, t("btn_share")),
),
```

**Subtitle pattern** — copy from `ResultCard.tsx:43-45` (same helpers, same keys):

```tsx
// ResultCard.tsx:43-45
<p className="muted small">
  {`${t('updated')} ${fmtDate(result.updatedAt)} · ${countAnswers(result)} ${t('answers')}`}
</p>
```

New Result-page subtitle is structurally identical, with the leading `profile.emoji profile.name` prefix and `result_last_edited` replacing `updated`:

```tsx
<p className="muted small">
  {`${profile.emoji} ${profile.name} · ${countAnswers(result)} ${t('answers')} · ${t('result_last_edited')} ${fmtDate(result.updatedAt)}`}
</p>
```

**Header action order** (D-02 lock): Back → li-avatar → title block → flex-spacer → Map settings → Continue editing → Share. Current `Result.tsx:74-83` has Edit → Share → Settings → Delete; reorder + drop Delete.

**Action wiring already present** — keep using `Result.tsx:23`:

```tsx
const { openShare } = useShareData()
// later: onClick={() => openShare(result.id)}
```

**Deep-link `:catId` → modal mount** — new pattern (replaces `Result.tsx:26-37`). Mirrors legacy `app.js:2817-2820`:

```js
// public/legacy/js/app.js:2817-2820
if (openCatId) {
  const cat = CATEGORIES.find(c => c.id === openCatId);
  if (cat) requestAnimationFrame(() => openCategoryModal([dataset], cat, r));
}
```

React equivalent (use `CategoryDef` alias; cancel RAF on unmount):

```tsx
const [modalCat, setModalCat] = useState<CategoryDef | null>(null)
useEffect(() => {
  if (!catId) return
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) return
  const raf = requestAnimationFrame(() => setModalCat(cat))
  return () => cancelAnimationFrame(raf)
}, [catId])
```

The `CategoryDef` alias is already used in `Compare.tsx:20` — copy that one-liner.

**Compare-with section mount** — after header, before by-category:

```tsx
<section className="page-section">
  <header className="section-head">
    <h2>{t('compare_with')}</h2>
  </header>
  <CompareWithSomeone currentResultId={result.id} />
</section>
```

**By-category section + cat-grid** — port from legacy `app.js:2809-2814`:

```js
// public/legacy/js/app.js:2809-2814
h("section", { class: "page-section" },
  h("header", { class: "section-head" },
    h("h2", {}, t("by_category")),
    h("p", { class: "muted" }, t("by_category_sub")),
    r.enabledCategories ? h("button", { class: "btn", onClick: () => openAddCategoriesDialog(...) }, t("btn_add_categories")) : null),
  h("div", { class: "cat-grid" }, ...categoryCards([dataset], r))),
```

React target — uses `RsCategoryCard` with `editableResult={result}` (own map → dim, never hide):

```tsx
<section className="page-section">
  <header className="section-head">
    <h2>{t('by_category')}</h2>
    <p className="muted">{t('by_category_sub')}</p>
    {/* Add-more-categories button: see RsCategoryPicker pattern below */}
  </header>
  <div className="cat-grid">
    {CATEGORIES.map((cat) => (
      <RsCategoryCard
        key={cat.id}
        cat={cat}
        datasets={datasets}
        editableResult={result}
        fabiMode={fabiMode}
        onClick={() => setModalCat(cat)}
        testId={`result-cat-card-${cat.id}`}
      />
    ))}
  </div>
</section>
```

**Fabi-mode Spider section** — wrap existing Result.tsx:86-95 block in `{fabiMode && …}`. Port section header from legacy `app.js:2795-2801`:

```js
// public/legacy/js/app.js:2795-2801
Store.getFabiMode() ? h("section", { class: "page-section" },
  h("header", { class: "section-head" },
    h("h2", {}, t("result_category_overview")),
    h("p", { class: "muted" }, t("result_category_overview_sub"))),
  h("div", { class: "panel rs-chart-clickable", title: t("enlarge_chart"),
    onClick: () => openEnlargedSpiderModal([dataset]),
    html: renderSpider([dataset], { size: 540 }) })) : null,
```

Keep `EnlargedSpider` only inside this conditional. `fabiMode` is read with `useStore((s) => s.settings.fabiMode ?? false)` — copy from `Compare.tsx:38`.

**CategoryModal mount** — copy from `Compare.tsx:193-198`:

```tsx
// Compare.tsx:193-198
<CategoryModal
  open={modalCat !== null}
  onOpenChange={(open) => { if (!open) setModalCat(null) }}
  datasets={datasets}
  cat={modalCat}
/>
```

`datasets = [mapResultToDataset(result, profile)]` — keep current line `Result.tsx:42-43`.

**RsCategoryPicker integration (optional for Result page — only if `result.enabledCategories` is set)** — copy pattern from `CategoryOverview.tsx:82-84, 128-133`:

```tsx
// CategoryOverview.tsx:82-84
function onPickerSubmit(mergedIds: string[]) {
  saveResult({ ...result!, enabledCategories: mergedIds })
}

// CategoryOverview.tsx:128-133
<RsCategoryPicker
  open={pickerOpen}
  onOpenChange={setPickerOpen}
  existingIds={enabledIds}
  onSubmit={onPickerSubmit}
/>
```

Show the Add-more-categories button only when `result.enabledCategories` is truthy (legacy `app.js:2813`).

---

### `src/routes/Compare.tsx` (MODIFY)

**Existing structure to keep** (RESEARCH "Current Compare.tsx Structure"):

- `Compare.tsx:35-50` — store selectors + `allOptions`.
- `Compare.tsx:53-66` — `effectiveIds` + `datasets`.
- `Compare.tsx:108-134` — chip picker.
- `Compare.tsx:137-151` — Fabi tip / overview Spider.
- `Compare.tsx:154-161` — Alignment section.
- `Compare.tsx:193-198` — CategoryModal mount.

**Targeted edits:**

**1. Add `firstEditableResult`** (near line ~67) — port from legacy `app.js:3484-3486`:

```js
// public/legacy/js/app.js:3484-3486
const firstEditableResultObj = selected.find(s => s.kind === "result");
const firstEditableResult = firstEditableResultObj ? Store.getResult(firstEditableResultObj.id) : null;
```

React target (uses `effectiveIds`, not raw — Risk #6 in RESEARCH):

```tsx
const firstEditableResult = useMemo(() => {
  const firstResultId = effectiveIds.find((id) => !id.startsWith('imp:'))
  return firstResultId ? results.find((r) => r.id === firstResultId) ?? null : null
}, [effectiveIds.join(','), results])
```

**2. Add `compareFilterIds` union** (near line ~88) — port verbatim from legacy `app.js:3489-3498`:

```js
// public/legacy/js/app.js:3489-3498
const compareFilterIds = (() => {
  const idSet = new Set();
  let hasFilter = false;
  for (const s of selected) {
    const result = s.kind === "result" ? Store.getResult(s.id) : null;
    const ec = result?.enabledCategories || null;
    if (ec) { hasFilter = true; ec.forEach(id => idSet.add(id)); }
  }
  return hasFilter ? Array.from(idSet) : null;
})();
```

React port (already drafted in RESEARCH lines 159-179):

```tsx
const compareFilterIds = useMemo<string[] | null>(() => {
  const set = new Set<string>()
  let hasFilter = false
  for (const id of effectiveIds) {
    if (id.startsWith('imp:')) continue
    const r = results.find((x) => x.id === id)
    if (r?.enabledCategories) {
      hasFilter = true
      r.enabledCategories.forEach((cid) => set.add(cid))
    }
  }
  return hasFilter ? Array.from(set) : null
}, [effectiveIds.join(','), results])
```

**3. Update `visibleCategories`** — replace `Compare.tsx:97-99` with two-stage filter (filter union FIRST, then `hasItemValues`):

```tsx
const filteredCategories = compareFilterIds
  ? CATEGORIES.filter((c) => compareFilterIds.includes(c.id))
  : CATEGORIES
const visibleCategories = filteredCategories.filter((cat) =>
  datasets.some((ds) => hasItemValues(ds.answers, cat.id)),
)
```

**4. Add Add-more-categories button** — port from legacy `app.js:3539`:

```js
// public/legacy/js/app.js:3539
firstEditableResult ? h("button", { class: "btn", onClick: () => openAddCategoriesDialog(firstEditableResult.profileId, firstEditableResult.id, `/compare?ids=${ids.join(",")}`) }, t("btn_add_categories")) : null
```

React target — replace `Compare.tsx:171-172` (the TODO line) with a button rendered inside `<header className="section-head">`. Wire to `RsCategoryPicker` (CONTEXT D-04, RESEARCH "RsCategoryPicker API"):

```tsx
{firstEditableResult ? (
  <Button onClick={() => setPickerOpen(true)} data-testid="compare-add-cats">
    {t('btn_add_categories')}
  </Button>
) : null}
```

Button import from `@/components/ui/button` (already used in `Result.tsx:11`).

**5. RsCategoryPicker state + callback** — copy pattern from `CategoryOverview.tsx:23, 82-84, 128-133`:

```tsx
const [pickerOpen, setPickerOpen] = useState(false)
const saveResult = useStore((s) => s.saveResult)

function onPickerSubmit(mergedIds: string[]) {
  if (!firstEditableResult) return
  saveResult({ ...firstEditableResult, enabledCategories: mergedIds })
}

// Near CategoryModal:
<RsCategoryPicker
  open={pickerOpen}
  onOpenChange={setPickerOpen}
  existingIds={firstEditableResult?.enabledCategories ?? CATEGORIES.map((c) => c.id)}
  onSubmit={onPickerSubmit}
/>
```

**6. Swap ad-hoc cat tiles for `RsCategoryCard`** — replace `Compare.tsx:175-188` (the `<RsTile>` block) with:

```tsx
<RsCategoryCard
  key={cat.id}
  cat={cat}
  datasets={datasets}
  editableResult={firstEditableResult}
  fabiMode={fabiMode}
  onClick={() => setModalCat(cat)}
  testId={`compare-cat-card-${cat.id}`}
/>
```

`editableResult={firstEditableResult}` — when null (imports-only selection), empty categories hide; when set, they dim.

**7. Drop `RsTile` import** from `Compare.tsx:13` after the swap. `RsTile` stays used by `CategoryOverview.tsx`.

---

## Shared Patterns

### Zustand selectors (read-only, single key)

**Source:** `src/routes/Compare.tsx:35-38`
**Apply to:** `CompareWithSomeone.tsx`, `Result.tsx` (verify), `Compare.tsx` (verify)

```tsx
const profiles = useStore((s) => s.profiles)
const results = useStore((s) => s.results)
const imports = useStore((s) => s.imports)
const fabiMode = useStore((s) => s.settings.fabiMode ?? false)
const saveResult = useStore((s) => s.saveResult)
```

Risk #5 (RESEARCH): never select an object literal — re-renders forever in strict mode. Always one selector per store key.

### i18n usage

**Source:** `src/lib/i18n/i18n.ts` — exposes `t(key)` and `getLang()`.
**Apply to:** every new and modified file.

```tsx
import { t, getLang } from '@/lib/i18n/i18n'
// usage:
{t('compare_with')}
const lang = getLang()  // for cat.de / cat.deBlurb selection
```

All ten keys required for this phase are present in `en.ts:64, 135-136, 184, 196, 202-208` and `de.ts:70, 142-143, 193, 205, 211-218` (research verified). No new key additions needed.

**Lang-aware title/blurb pattern** (copy from `Compare.tsx:78-83`):

```tsx
const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
const catBlurb = lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb
```

### `--c` CSS variable inline style

**Source:** `src/components/RsTile.tsx:58, 82`; also `Compare.tsx:123`, `Result.tsx:59`
**Apply to:** `RsCompareTile.tsx`, `RsCategoryCard.tsx`, any node needing the colored left bar.

```tsx
style={{ ['--c' as 'color']: color } as React.CSSProperties}
```

The double cast `['--c' as 'color']` and `as CSSProperties` defeats TS's strict CSSProperties keys. This idiom is project-canon — do not invent alternatives.

### Hash-route navigation

**Source:** `src/routes/CategoryOverview.tsx:7, 18, 46, 79`
**Apply to:** `CompareWithSomeone.tsx`, `Result.tsx` (existing), `Compare.tsx` (existing).

```tsx
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate(`/compare?ids=${currentResultId},${otherId}`)
navigate('/import')
```

`createHashRouter` setup at `src/router.tsx:20` means all paths use the `#/...` form transparently — no manual hash assembly.

### CategoryModal mount

**Source:** `src/routes/Compare.tsx:193-198`
**Apply to:** `Result.tsx` (new use)

```tsx
<CategoryModal
  open={modalCat !== null}
  onOpenChange={(open) => { if (!open) setModalCat(null) }}
  datasets={datasets}
  cat={modalCat}
/>
```

API surface (`CategoryModal.tsx:20-25`): `{ open, onOpenChange, datasets, cat }`. No `defaultTab`, no edit tab, no `editableResult` — pass datasets only.

### Test patterns (Vitest + jsdom)

**Source:** `src/routes/__tests__/Compare.test.tsx:5-55`
**Apply to:** new tests for `RsCategoryCard`, `CompareWithSomeone`, and Compare/Result updates.

Canonical mount helper:

```tsx
async function mountAtHash(hash: string, storeJson?: string) {
  vi.resetModules()
  const mem = new MemoryLocalStorage()
  mem.setItem('relationshape.v1', storeJson ?? makeStore())
  vi.stubGlobal('localStorage', mem)
  window.location.hash = hash
  const appMod = await import('@/App')
  await act(async () => { render(<appMod.default />) })
}
```

`MemoryLocalStorage` at `tests/helpers/MemoryLocalStorage.ts`. Canonical fixture shape per global memory: `tests/example-localstorage.json`. Assertions go through `document.querySelector('[data-testid="…"]')` and `waitFor(...)` with a 10s timeout for the first render.

Phase-04 test files to add/update (RESEARCH Wave 0):
- NEW: `src/components/__tests__/CompareWithSomeone.test.tsx`
- NEW: `src/components/__tests__/RsCategoryCard.test.tsx`
- UPDATE: `src/routes/__tests__/Result.test.tsx` (lines 75-108 break — drill-down assertions removed)
- UPDATE: `src/routes/__tests__/Compare.test.tsx` (add Add-more-cats + compareFilterIds union cases)

---

## No Analog Found

| File | Why | Fallback |
|------|-----|----------|
| (none) | All 5 in-scope files have a strong existing analog | n/a |

The phase is mechanical — every new file maps to either an existing React primitive (`RsTile`, `RsCategoryPicker`) or a legacy `app.js` block with a direct line-range citation. RESEARCH section "i18n Key Audit" + "Existing Helper Inventory" confirm zero unfilled gaps.

---

## Metadata

**Analog search scope:**
- `src/components/Rs*.tsx`, `src/components/charts/*.tsx`
- `src/routes/Result.tsx`, `src/routes/Compare.tsx`, `src/routes/CategoryOverview.tsx`
- `src/lib/format/date.ts`, `src/lib/charts/datasets.ts`, `src/lib/charts/types.ts`
- `src/styles/legacy-components.css` (lines 685-794, 1573-1587)
- `public/legacy/js/app.js` (lines 2770-2876, 3193-3279, 3453-3544)
- `src/routes/__tests__/Compare.test.tsx`

**Files scanned:** 12

**Pattern extraction date:** 2026-05-17

**Confidence:** HIGH — every excerpt cited with exact file + line range; the upstream RESEARCH.md is itself HIGH confidence and self-consistent with these findings.
