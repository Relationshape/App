# Phase 2: Parity - Pattern Map

**Mapped:** 2026-05-15
**Files analysed:** ~80 (60+ new React components + ~10 hooks + ~5 libs + 6 shadcn primitives + ~10 test files + 2 modifications)
**Analog match coverage:** Exact / role-match for every new file. Phase 1 `src/` files supply the React idioms; v1.0 `public/legacy/js/` supplies the behavioural contract.

This document is grouped by the 7 plans from D-01. Each plan section contains:
1. **File-level pattern assignments** — for every new or modified file
2. **Closest analog** with absolute path + line range
3. **Concrete excerpt** the executor can crib from
4. **Convention notes** — what to translate (JS → TS/React/JSX)

Cross-cutting **Shared Patterns** are in their own section at the end so they aren't repeated 60 times.

---

## Conventions That Apply Phase-Wide

Apply these to every file unless the per-file row says otherwise.

| Convention | Rule | Source |
|------------|------|--------|
| File header | Top-of-file comment lists the requirement IDs satisfied (e.g. `// PROFILE-03, D-21`) plus the v1.0 analog with `public/legacy/js/app.js:NNN` | Phase 1 `src/components/ThemeToggle.tsx` lines 1-5 |
| Import order | (1) React; (2) react-router; (3) `@/components/...`; (4) `@/hooks/...`; (5) `@/lib/...`; (6) types last | Phase 1 `src/routes/DesignSystem.tsx` lines 15-21 |
| Store reads | `useStore((s) => s.<selector>)` — never call `useStore.getState()` inside a component render | Phase 1 `src/components/ThemeToggle.tsx` lines 13-14 |
| Store writes | Pull the action via `useStore((s) => s.<action>)` once at the top, call it from handlers | Phase 1 `src/components/ThemeToggle.tsx` line 14 |
| i18n | Every user-facing string MUST go through `t('key')`. Append new keys to BOTH `src/lib/i18n/en.ts` and `src/lib/i18n/de.ts`; the typed `TranslationKey` union catches misses | Phase 1 `src/lib/i18n/en.ts` (whole file) |
| Path aliases | Use `@/` everywhere (`@/components/...`, `@/lib/...`, `@/hooks/...`). Configured in `tsconfig.json` and `vite.config.ts` | Phase 1 `src/routes/DesignSystem.tsx` line 17 |
| Tailwind tokens | Consume tokens via Tailwind utility classes (`bg-bg`, `text-text`, `text-primary`, `bg-surface`). NEVER read CSS vars directly in TS. Use `style={{ background: \`var(--color-…)\` }}` only when a token must be set dynamically (e.g. `--c` per-card colour) | Phase 1 `src/routes/DesignSystem.tsx` lines 270-275 |
| v1.0 BEM `is-on` / `is-active` | Translate to React `data-state="active"` attributes + Tailwind `data-[state=active]:bg-accent` variants. Active-link state via `<NavLink>` from `react-router-dom` | Research §"Established Patterns" |
| XSS / user strings | NEVER use `dangerouslySetInnerHTML` on user-supplied text. Render via React text nodes (`{ str }`). Allow-listed i18n-only rich text uses `<TranslatedText>` (D-12) | D-05, D-12 |
| Tests | `// @vitest-environment jsdom` directive at top of every component test file. `cleanup()` in `afterEach()` because `vitest.config.ts` sets `globals: false`. Each test that touches the Zustand store calls `vi.resetModules()` + dynamic import of the module under test, plus `vi.stubGlobal('localStorage', new MemoryLocalStorage())` to isolate state | Phase 1 `src/__tests__/DesignSystem.test.tsx` lines 1-39 |
| Heredoc / Bash file creation | NEVER create files via `cat << EOF`. Always use the Write tool | Pattern mapper rule |

---

## Plan 1: App Shell

Sequenced first per D-01. Output is the router + root layout + persistent nav. Other plans build on this.

### File: `src/router.tsx` (MODIFIED — extend from 14 lines to ~30)

| Property | Value |
|----------|-------|
| Role | Lib (pure) |
| Data flow | Route table |
| Closest analog | `src/router.tsx` (Phase 1) lines 1-14; v1.0 dispatcher `public/legacy/js/app.js:853-884` |

**Phase 1 analog (existing structure to extend):**

```typescript
// src/router.tsx — current state
import { createHashRouter } from 'react-router-dom'
import { Placeholder } from './routes/Placeholder'
import { DesignSystem } from './routes/DesignSystem'

export const router = createHashRouter([
  { path: '/', element: <Placeholder /> },
  { path: '/design-system', element: <DesignSystem /> },
])
```

**v1.0 analog (route dispatcher being ported):**

```javascript
// public/legacy/js/app.js:853-884
function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, queryStr] = hash.split("?");
  const segs = path.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryStr || ""));
  $app.innerHTML = "";
  switch (segs[0]) {
    case undefined: case "": viewHome(); break;
    case "welcome": $app.append(viewWelcome()); break;
    case "profile":
      if (segs[1] === "new") viewProfileEdit(null);
      else if (segs[2] === "edit") viewProfileEdit(segs[1]);
      else viewProfile(segs[1]);
      break;
    case "q":        viewQuestionnaire(segs[1], segs[2]); break;
    case "result":   viewResult(segs[1], segs[2]); break;
    case "share":    viewShare(segs[1]); break;
    case "import":   viewImport(); break;
    case "compare":  viewCompare(query.ids ? query.ids.split(",") : []); break;
    case "settings": viewSettings(); break;
    case "map":      if (segs[2] === "settings") viewMapSettings(segs[1]); break;
    case "intro":
    case "about":    viewIntro(); break;
    case "q-categories": viewCategoryOverview(segs[1], segs[2]); break;
    default:         viewHome();
  }
}
```

**Convention notes:**
- Replace the `switch` with a nested-route array: ONE root route (`/` → `<RootLayout />`) with 15 children that match the D-24 table exactly.
- `#/result/:id/:catId` keeps the optional `catId` segment as a **separate route** entry — both rows render `<Result />`; the component reads `useParams<{ id: string; catId?: string }>()` (RESEARCH Pattern 10).
- The query string for `?ids=` is consumed inside `<Compare />` via `useSearchParams()`, NOT at the router level.
- Keep `path: '/design-system'` row from Phase 1; KEEP `<Placeholder />` row mapped to a transient route or delete it once `<Home />` lands (orchestrator decides).

---

### File: `src/App.tsx` (MODIFIED)

| Property | Value |
|----------|-------|
| Role | Layout |
| Data flow | Provider tree |
| Closest analog | `src/App.tsx` (Phase 1) lines 1-12 |

**Phase 1 analog:**

```typescript
// src/App.tsx — current
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useTheme } from './hooks/useTheme'

export default function App() {
  useTheme()
  return <RouterProvider router={router} />
}
```

**Convention notes:**
- Wrap `<RouterProvider />` in `<ThemeProvider>` and `<I18nProvider>` (D-14). Both are thin Context wrappers around existing `useTheme()` / `useLang()` hooks; their job is to throw a hard error if a consumer is rendered outside the tree (catches missing-provider bugs at review time).
- Keep the `useTheme()` call (its side effect — toggling `data-theme` on `<html>` — runs at App scope).
- Add `useLang()` call alongside so `document.documentElement.lang` updates reactively.

---

### File: `src/routes/RootLayout.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Layout |
| Data flow | Persistent shell + `<Outlet />` |
| Closest analog | RESEARCH §Pattern 1 (lines 462-499); v1.0 `bindGlobalNav` mount + `route()` exit at `public/legacy/js/app.js:836-851` |

**v1.0 analog (the persistent surface):**

```javascript
// public/legacy/js/app.js:836-851
window.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => applyTheme());
  bindGlobalNav();
  const isNewVisitor = !localStorage.getItem("rs-age-confirmed");
  route();
  await checkAgeGate();
  const hash = location.hash.replace(/^#\/?/, "");
  const seg = hash.split("?")[0].split("/")[0];
  if (isNewVisitor && localStorage.getItem("rs-age-confirmed")) {
    navigate("/welcome");
  } else if (!seg) {
    await showWizardIfFirstVisit();
  }
});
```

**Target shape (from RESEARCH Pattern 1):**

```typescript
// src/routes/RootLayout.tsx
import { Outlet } from 'react-router-dom'
import { Nav } from '@/components/Nav'
import { AgeGate } from '@/components/AgeGate'
import { WizardHost } from '@/components/WizardHost'
import { DialogHost } from '@/components/DialogHost'
import { Toaster } from '@/components/ui/sonner'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { useStore } from '@/lib/storage/store'
import { useToast } from '@/lib/hooks/useToast'
import { useEffect } from 'react'

export function RootLayout() {
  useScrollToTop()
  const lastSaveError = useStore((s) => s.lastSaveError)
  const clearLastSaveError = useStore((s) => s.clearLastSaveError)
  const { toast } = useToast()
  useEffect(() => {
    if (!lastSaveError) return
    toast.error(lastSaveError.message)
    clearLastSaveError()
  }, [lastSaveError, toast, clearLastSaveError])

  return (
    <>
      <Nav />
      <main id="app" className="min-h-screen">
        <Outlet />
      </main>
      <Toaster richColors position="bottom-center" />
      <DialogHost />
      <AgeGate />
      <WizardHost />
    </>
  )
}
```

**Convention notes:**
- The `lastSaveError` subscriber is **non-optional** — Phase 1 wires the slice, Phase 2 wires the UI feedback. Without this, QuotaExceededError silently swallows data (CONCERNS Pitfall 8).
- Mount order matters: `<Toaster />` first child so early subscribers (the effect above) can fire toasts even on the first render. Then `<Outlet />`, then portals.

---

### File: `src/hooks/useScrollToTop.ts` (NEW)

| Property | Value |
|----------|-------|
| Role | Hook |
| Data flow | Side-effect on route change |
| Closest analog | Phase 1 `src/hooks/useTheme.ts` lines 1-36 (same effect-shape pattern); v1.0 inline scroll at `public/legacy/js/app.js:891` |

**Phase 1 analog (effect-shape):**

```typescript
// src/hooks/useTheme.ts:1-15
import { useEffect } from 'react'
import { useStore } from '@/lib/storage/store'

export function useTheme(): void {
  const theme = useStore((s) => s.settings.theme)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  // … prefers-color-scheme matcher below …
}
```

**Target (RESEARCH §Pattern 2):**

```typescript
// src/hooks/useScrollToTop.ts
import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function useScrollToTop(): void {
  const { pathname, search } = useLocation()
  const navType = useNavigationType()
  useEffect(() => {
    if (navType === 'POP') return  // browser restores; don't fight
    window.scrollTo(0, 0)
  }, [pathname, search, navType])
}
```

**Convention notes:**
- Guard `typeof window` for jsdom — Phase 1's `useTheme` shows the SSR-safe pattern (line 13).
- Skip on POP navigation (back/forward); the browser already handles scroll restoration.

---

### File: `src/components/Nav.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Persistent UI |
| Data flow | Read settings + profile selector; navigate on click |
| Closest analog | v1.0 `bindGlobalNav` at `public/legacy/js/app.js:942-984`; Phase 1 `src/components/ThemeToggle.tsx` (idiom) |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:942-984
function bindGlobalNav() {
  $nav.innerHTML = "";
  $nav.classList.remove("nav-open");
  const backdrop = h("div", { class: "nav-backdrop" });
  document.body.appendChild(backdrop);
  const openMenu  = () => { $nav.classList.add("nav-open"); backdrop.classList.add("visible"); };
  const closeMenu = () => { $nav.classList.remove("nav-open"); backdrop.classList.remove("visible"); };
  const navLinks = h("div", { class: "nav-links" },
    navLink("#/",         ICONS.nav_profiles, t("nav_profiles")),
    navLink("#/import",   ICONS.nav_import,   t("nav_import")),
    navLink("#/compare",  ICONS.nav_compare,  t("nav_compare")),
    navLink("#/settings", ICONS.nav_settings, t("nav_settings")),
    navLink("#/intro",    ICONS.nav_about,    t("nav_about")),
  );
  navLinks.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
  const hamburger = h("button", { class: "nav-hamburger", type: "button", "aria-label": "Menu" },
    h("span", { class: "hb-bar" }), h("span", { class: "hb-bar" }), h("span", { class: "hb-bar" }));
  hamburger.addEventListener("click", e => { e.stopPropagation(); $nav.classList.contains("nav-open") ? closeMenu() : openMenu(); });
  $nav.append(
    h("a", { href: "#/welcome", class: "nav-brand", title: t("nav_home") }, …),
    navLinks, buildLangPicker(), hamburger);
}
```

**Target (RESEARCH §Pattern 3):**

```typescript
// src/components/Nav.tsx
import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ProfilePicker } from './ProfilePicker'
import { ThemeToggle } from './ThemeToggle'
import { LangToggle } from './LangToggle'
import { t } from '@/lib/i18n/i18n'

export function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])  // close on route change (Pitfall 10)

  const items = (
    <>
      <ProfilePicker />
      <NavLink to="/import">{t('nav_import')}</NavLink>
      <NavLink to="/compare">{t('nav_compare')}</NavLink>
      <NavLink to="/settings">{t('nav_settings')}</NavLink>
      <NavLink to="/intro">{t('nav_about')}</NavLink>
      <ThemeToggle />
      <LangToggle />
    </>
  )
  return (
    <nav id="nav" className="…">
      <div className="hidden md:flex items-center gap-4">{items}</div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="md:hidden">☰</SheetTrigger>
        <SheetContent side="left">{items}</SheetContent>
      </Sheet>
    </nav>
  )
}
```

**Convention notes:**
- Replace document-level click-outside listener with shadcn `Sheet` (Radix-backed; ESC + click-outside built in).
- `<NavLink>` from `react-router-dom` supplies `aria-current="page"` and an `active` class automatically — `is-on` BEM modifier from v1.0 maps to this.
- Reuse Phase 1's `<ThemeToggle />` (`src/components/ThemeToggle.tsx`) and `<LangToggle />` (`src/components/LangToggle.tsx`) verbatim.
- `<ProfilePicker />` is a NEW component (next row).

---

### File: `src/components/ProfilePicker.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Persistent UI |
| Data flow | Read `profiles[]` from store; navigate on pick |
| Closest analog | v1.0 `profileCard` at `public/legacy/js/app.js:1478-1490` (same idiom for the dropdown rows) |

**v1.0 analog (profile-card row layout):**

```javascript
// public/legacy/js/app.js:1478-1490
function profileCard(p) {
  const results = Store.getResultsForProfile(p.id);
  const count = results.length;
  const countStr = count === 0
    ? t("no_results")
    : `${count} ${count === 1 ? t("results_count_one") : t("results_count_many")}`;
  return h("a", { class: "card profile-card", href: `#/profile/${p.id}`, style: `--c:${p.color}` },
    h("div", { class: "avatar" }, p.emoji || "✨"),
    h("h3", {}, p.name),
    p.pronouns ? h("p", { class: "muted small" }, p.pronouns) : null,
    h("p", { class: "small" }, countStr));
}
```

**Convention notes:**
- Wrap with shadcn `Popover` (D-15, D-21). The trigger is the active profile avatar; the content is a list of profile rows + "New profile" CTA.
- Each row is a `<Link to={\`/profile/\${p.id}\`}>` — clicks navigate AND auto-close the popover (Radix handles).
- Empty state: when `profiles.length === 0`, render `t('no_profiles_yet')` (NEW i18n key — append to en/de).

---

### File: `src/lib/i18n/en.ts` + `src/lib/i18n/de.ts` (MODIFIED — append keys)

| Property | Value |
|----------|-------|
| Role | Lib (pure data) |
| Data flow | Append nav + view + dialog + chart keys |
| Closest analog | v1.0 `public/legacy/js/i18n.js:5-786` (the whole map); Phase 1 `src/lib/i18n/en.ts:1-120` (idiom) |

**v1.0 analog (sample key block):**

```javascript
// public/legacy/js/i18n.js:5-30
const TRANSLATIONS = {
  en: {
    nav_profiles: "👤 Profiles",
    nav_import: "📥 Import/Export",
    nav_compare: "📊 Results/Compare",
    nav_settings: "⚙️ Settings",
    nav_about: "About",
    nav_home: "Home",
    welcome_title: "Relationshapes",
    welcome_sub: "A private space to map your relationships.…",
    welcome_cta: "✨ Start now",
    // … (~400 keys total)
  },
  de: { /* mirror */ }
};
```

**Phase 1 analog (idiom):**

```typescript
// src/lib/i18n/en.ts:7-15
export const EN = {
  nav_profiles: '👤 Profiles',
  nav_import: '📥 Import/Export',
  nav_compare: '📊 Results/Compare',
  nav_settings: '⚙️ Settings',
  nav_about: 'About',
  nav_home: 'Home',
  // …
} as const
```

**Convention notes:**
- Each plan appends ONLY the keys it needs (D-02). Plan-1's append set: any missing nav keys + `no_profiles_yet` + `nav_home` if absent.
- `de.ts` is typed as `Record<TranslationKey, string>` — every EN key MUST get a DE counterpart at compile time; missing keys break the typecheck.
- For long-form prose (Welcome / Intro): plan 3 adds the bulk of these (`feat_*_body`, `about_p1`…); plan 1 stays minimal.

---

### File: `src/__tests__/router.routes.test.tsx` (NEW — Wave 0)

| Property | Value |
|----------|-------|
| Role | Test |
| Data flow | Render `<App />`, assert each route resolves |
| Closest analog | Phase 1 `src/__tests__/App.smoke.test.tsx` lines 1-21 + `src/__tests__/DesignSystem.test.tsx` lines 84-112 (route-via-hash idiom) |

**Phase 1 analog (route-via-hash):**

```typescript
// src/__tests__/DesignSystem.test.tsx:86-94
window.location.hash = '#/design-system'
vi.resetModules()
vi.stubGlobal('localStorage', new MemoryLocalStorage())
const appMod = await import('@/App')
const AppRoot = appMod.default
await act(async () => {
  render(<AppRoot />)
})
```

**Convention notes:**
- One `it(...)` per row in the D-24 table — assert that mounting `<App />` with `window.location.hash = '#/...'` resolves to the expected leaf placeholder.
- Reuse Phase 1's `MemoryLocalStorage` helper verbatim (see `src/__tests__/DesignSystem.test.tsx:12-32`).

---

## Plan 2: Primitives

Vendors shadcn primitives, ships the typed `<Dialog />` / `<AlertDialog />` wrappers + `useToast` shim + `useSwipe` + age gate + wizard host.

### File: `src/components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `popover.tsx`, `tabs.tsx`, `sonner.tsx` (NEW — vendored via shadcn CLI)

| Property | Value |
|----------|-------|
| Role | shadcn primitive (vendored) |
| Data flow | Radix wrapper |
| Closest analog | Phase 1 `src/components/ui/button.tsx` lines 1-65 |

**Phase 1 analog (idiom):**

```typescript
// src/components/ui/button.tsx:1-65
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium …",
  { variants: { variant: { default: "bg-primary text-primary-foreground hover:bg-primary/90", … } } }
)

function Button({ className, variant = "default", size = "default", asChild = false, ...props }: …) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp data-slot="button" data-variant={variant} data-size={size} className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
export { Button, buttonVariants }
```

**Convention notes:**
- Run `npx shadcn@latest add dialog alert-dialog sheet popover tabs sonner` (RESEARCH §Standard Stack). Six commands or one bundled, planner's call.
- Each primitive lands in `src/components/ui/<name>.tsx` per Phase 1 D-26. NO edits to the generated files — they're vendor-managed.
- Smoke-test Sonner after `add sonner` BEFORE adding the other five (RESEARCH §Assumption A2 mitigation).
- Add `@use-gesture/react@10.3.1` as a runtime dep: `pnpm add @use-gesture/react@10.3.1`.

---

### File: `src/lib/dialog/dialogQueue.ts` (NEW)

| Property | Value |
|----------|-------|
| Role | Store slice (Zustand) |
| Data flow | Imperative `dialog({...}): Promise<T \| null>` queue |
| Closest analog | v1.0 `dialog({...})` at `public/legacy/js/app.js:379-476` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:379-405 (excerpt — the imperative API surface)
function dialog({ title, body, fields = [], actions, dismissable = true }) {
  return new Promise(resolve => {
    const overlay = h("div", { class: "rs-modal-overlay", role: "dialog", "aria-modal": "true" });
    const card = h("div", { class: "rs-modal-card" });
    const close = (val) => {
      overlay.classList.add("closing");
      setTimeout(() => overlay.remove(), 160);
      resolve(val);
      document.removeEventListener("keydown", esckey);
    };
    const esckey = (e) => {
      if (e.key === "Escape" && dismissable) close(null);
      else if (e.key === "Enter" && document.activeElement?.tagName !== "TEXTAREA") {
        const primary = card.querySelector(".rs-modal-actions .btn-primary");
        if (primary) { e.preventDefault(); primary.click(); }
      }
    };
    document.addEventListener("keydown", esckey);
    // … (fields rendering, action buttons)
  });
}
// Helper wrappers:
// dlgAlert (line 478) — single OK button
// dlgConfirm (line 485) — Cancel + OK
// dlgPrompt (line 494) — Cancel + Save with a text field
```

**Target (RESEARCH §Pattern 4):**

```typescript
// src/lib/dialog/dialogQueue.ts
import { create } from 'zustand'

export interface DialogAction<T> {
  label: string
  kind?: 'primary' | 'ghost' | 'danger'
  value: T
}

export interface DialogRequest<T = unknown> {
  id: string
  title?: string
  body: React.ReactNode | ((close: (v: T) => void) => React.ReactNode)
  actions: DialogAction<T>[]
  dismissable?: boolean
  resolve: (v: T | null) => void
}

interface DialogQueueState {
  queue: DialogRequest[]
  push: (req: DialogRequest) => void
  shift: (id: string) => void
}

export const useDialogQueue = create<DialogQueueState>((set) => ({
  queue: [],
  push: (req) => set((s) => ({ queue: [...s.queue, req] })),
  shift: (id) => set((s) => ({ queue: s.queue.filter((r) => r.id !== id) })),
}))

export function dialog<T>(opts: Omit<DialogRequest<T>, 'id' | 'resolve'>): Promise<T | null> {
  return new Promise((resolve) => {
    const id = crypto.randomUUID()
    useDialogQueue.getState().push({ ...opts, id, resolve } as DialogRequest)
  })
}
```

**Convention notes:**
- This is a **separate** Zustand store (not the main `useStore`). It has no persistence — dialogs are ephemeral.
- The `dialog()` helper is the only callsite-facing API. `<DialogHost />` (next row) drains the queue.
- Replace v1.0's `dlgAlert` / `dlgConfirm` / `dlgPrompt` with thin wrappers that compose `dialog()`.

---

### File: `src/components/DialogHost.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Persistent UI (portal) |
| Data flow | Subscribe to dialogQueue, render top item with Radix Dialog |
| Closest analog | RESEARCH §Pattern 4 lines 621-661 |

**Target (RESEARCH excerpt):**

```typescript
// src/components/DialogHost.tsx
import { useDialogQueue } from '@/lib/dialog/dialogQueue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function DialogHost() {
  const queue = useDialogQueue((s) => s.queue)
  const shift = useDialogQueue((s) => s.shift)

  return (
    <>
      {queue.map((req) => {
        const close = (v: unknown) => {
          req.resolve(v as never)
          shift(req.id)
        }
        return (
          <Dialog
            key={req.id}
            open={true}
            onOpenChange={(o) => { if (!o && req.dismissable !== false) close(null) }}
          >
            <DialogContent>
              {req.title && <DialogHeader><DialogTitle>{req.title}</DialogTitle></DialogHeader>}
              <div>{typeof req.body === 'function' ? req.body(close) : req.body}</div>
              <DialogFooter>
                {req.actions.map((a, i) => (
                  <Button key={i} variant={a.kind === 'primary' ? 'default' : a.kind === 'danger' ? 'destructive' : 'ghost'} onClick={() => close(a.value)}>
                    {a.label}
                  </Button>
                ))}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })}
    </>
  )
}
```

**Convention notes:**
- Mount inside `<RootLayout />` (D-13). Subscribes to the queue; Radix handles focus trap / ESC / ARIA for free.
- Queue serialisation prevents stacked-dialog races (CONCERNS Pitfall 3).

---

### File: `src/lib/hooks/useToast.ts` (NEW)

| Property | Value |
|----------|-------|
| Role | Hook |
| Data flow | Wrap `sonner.toast()` |
| Closest analog | v1.0 `showToast` at `public/legacy/js/app.js:510-518`; RESEARCH §Pattern 5 |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:510-518
let toastT;
function showToast(msg) {
  let toastEl = document.querySelector(".toast");
  if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.append(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove("show"), 1900);
}
```

**Target (RESEARCH §Pattern 5):**

```typescript
// src/lib/hooks/useToast.ts
import { toast as sonner } from 'sonner'

export function useToast() {
  return {
    toast: {
      message: (msg: string) => sonner(msg, { duration: 1900 }),
      success: (msg: string) => sonner.success(msg, { duration: 1900 }),
      error: (msg: string) => sonner.error(msg, { duration: 3500 }),
    },
  }
}
```

**Convention notes:**
- 1900ms duration preserves v1.0 timing (RESEARCH §Assumption A5).
- `<Toaster />` is mounted in `<RootLayout />` (Plan 1) at `position="bottom-center"` to match v1.0's `.toast` CSS.

---

### File: `src/lib/hooks/useSwipe.ts` + `useKeydown.ts` + `useReducedMotion.ts` + `useIsCoarsePointer.ts` (NEW)

| Property | Value |
|----------|-------|
| Role | Hook |
| Data flow | DOM event side-effects |
| Closest analog | v1.0 `bindSwipe` at `public/legacy/js/app.js:2700-2734`; v1.0 `(pointer: coarse)` check at `public/legacy/js/app.js:2462`; RESEARCH §Pattern 6 + Pattern 8 |

**v1.0 analog (bindSwipe):**

```javascript
// public/legacy/js/app.js:2700-2734
function bindSwipe(el, { onLeft, onRight, threshold = 80 } = {}) {
  let startX = null, startY = null, dx = 0, dy = 0, dragging = false;
  const start = e => {
    const tch = e.touches ? e.touches[0] : e;
    if (e.target.closest("button, input, textarea, .scale-pill")) return;
    startX = tch.clientX; startY = tch.clientY; dx = 0; dy = 0; dragging = true;
    el.classList.add("dragging");
  };
  const move = e => {
    if (!dragging) return;
    const tch = e.touches ? e.touches[0] : e;
    dx = tch.clientX - startX;
    dy = tch.clientY - startY;
    // Android scroll-vs-swipe guard:
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > 30) return;
    el.style.transform = `translate(${dx}px, ${dy * 0.2}px) rotate(${dx * 0.04}deg)`;
  };
  const end = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("dragging");
    el.style.transform = ""; el.style.opacity = "";
    if (dx <= -threshold) onLeft?.();
    else if (dx >= threshold) onRight?.();
  };
  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchmove", move, { passive: true });
  // … mouse listeners
}
```

**Target (RESEARCH §Pattern 6):**

```typescript
// src/lib/hooks/useSwipe.ts
import { useDrag } from '@use-gesture/react'
import { useReducedMotion } from './useReducedMotion'

interface UseSwipeOpts {
  onLeft?: () => void
  onRight?: () => void
  threshold?: number  // default 40 to match v1.0 wizard swipe
}

export function useSwipe(opts: UseSwipeOpts) {
  const reduced = useReducedMotion()
  return useDrag(
    ({ movement: [mx], last }) => {
      if (last) {
        const tShold = opts.threshold ?? 40
        if (mx < -tShold) opts.onLeft?.()
        else if (mx > tShold) opts.onRight?.()
      }
    },
    {
      axis: 'x',
      pointer: { touch: true },
      filterTaps: true,
      rubberband: reduced ? 0 : 0.15,
    },
  )
}
```

**`useIsCoarsePointer.ts` (RESEARCH §Pattern 8 lines 873-889):**

```typescript
// src/lib/hooks/useIsCoarsePointer.ts
import { useEffect, useState } from 'react'

export function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(pointer: coarse)')
    setCoarse(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return coarse
}
```

**Convention notes:**
- Replace v1.0's manual scroll-vs-swipe guard (`Math.abs(dy) > Math.abs(dx) * 1.5`) with `@use-gesture/react`'s `axis: 'x'` + `touch-action: 'pan-y'` on the bound element. This fixes the Android pitfall (CONCERNS Pitfall 1).
- `useReducedMotion` is `matchMedia('(prefers-reduced-motion: reduce)')` — pattern is identical to `useIsCoarsePointer`.
- `useKeydown` is a thin `document.addEventListener('keydown', …)` wrapper with cleanup — no v1.0 analog (v1.0 attaches listeners per-view; React's `useEffect` does the cleanup automatically).

---

### File: `src/components/AgeGate.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Persistent UI (root-mounted) |
| Data flow | Read `settings.ageConfirmed` + legacy `rs-age-confirmed` localStorage; write through Zustand action |
| Closest analog | v1.0 `checkAgeGate` at `public/legacy/js/app.js:808-825` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:808-825
async function checkAgeGate() {
  if (localStorage.getItem("rs-age-confirmed")) return;
  const confirmed = await dialog({
    title: t("age_gate_title"),
    body: () => h("p", { class: "muted" }, t("age_gate_body")),
    actions: [
      { label: t("age_gate_no"), kind: "ghost", value: false },
      { label: t("age_gate_yes"), kind: "primary", primary: true, value: true },
    ],
    dismissable: false,
  }).catch(() => false);
  if (confirmed) {
    localStorage.setItem("rs-age-confirmed", "1");
  } else {
    document.body.innerHTML = `<div style="display:flex;align-items:center;…">${t("age_gate_body")}</div>`;
  }
}
```

**Convention notes:**
- Use shadcn `AlertDialog` (not `Dialog`) — `dismissable: false` semantics matches `AlertDialog`'s no-ESC, no-click-outside-dismiss behaviour.
- Migration block (CONCERNS Pitfall 13): on mount, if `settings.ageConfirmed !== true` AND `localStorage.getItem('rs-age-confirmed') === '1'`, treat as confirmed AND call `setSettings({ ageConfirmed: true })` so the legacy key flow merges into the unified `relationshape.v1` blob.
- Under-18 branch: render an inline stop view (NOT a route — RESEARCH §Open Question 3 recommends inline). Use `t('age_gate_body')` only.
- `Settings` type extension needed (D-29): add `ageConfirmed?: boolean` to `src/lib/storage/types.ts:75-80`.

---

### File: `src/components/WizardHost.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Persistent UI (root-mounted, first-visit only) |
| Data flow | `useReducer<{step, totalSteps, dir}>`; reads `settings.wizardDone` |
| Closest analog | v1.0 `runWizard` at `public/legacy/js/app.js:740-806`; v1.0 `buildWizardSteps` at `public/legacy/js/app.js:728-738` |

**v1.0 analog (the wizard step config):**

```javascript
// public/legacy/js/app.js:728-738
function buildWizardSteps() {
  return [
    { title: t("wizard_s1_title"), body: t("wizard_s1_body"), emoji: "🌷" },
    { title: t("wizard_s2_title"), body: t("wizard_s2_body"), emoji: "🔒" },
    { title: t("wizard_s3_title"), body: t("wizard_s3_body"), emoji: "👤" },
    { title: t("wizard_s4_title"), body: t("wizard_s4_body"), emoji: "🗺️" },
    { title: t("wizard_s5_title"), body: t("wizard_s5_body"), emoji: "📤" },
    { title: t("wizard_s6_title"), body: t("wizard_s6_body"), visual: demoSpiderSVG() },
    { title: t("wizard_s7_title"), body: t("wizard_s7_body"), emoji: "⚙️" },
  ];
}
```

**v1.0 analog (swipe handling):**

```javascript
// public/legacy/js/app.js:754-762
card.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
card.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 40) return;
  if (dx < 0 && idx < steps.length - 1) { idx++; render(); }
  else if (dx > 0 && idx > 0) { idx--; render(); }
}, { passive: true });
```

**Convention notes:**
- Port `buildWizardSteps` to a top-level `WIZARD_STEPS: WizardStep[]` const in the same file (D-23).
- Replace `let idx = 0; render()` with `useReducer({ step: 0, totalSteps: 7, dir: 'fwd' })`.
- Replace raw touchstart/touchend with `useSwipe({ onLeft: dispatch('next'), onRight: dispatch('prev') })`.
- Add `useKeydown(['ArrowLeft', 'ArrowRight'], …)` for keyboard parity.
- First-visit gating: read `useStore((s) => s.settings.wizardDone)`. Falsy → mount the dialog. On finish/skip → `setSettings({ wizardDone: true })`.
- `Settings` type extension needed (D-23): add `wizardDone?: boolean` to `src/lib/storage/types.ts:75-80`.

---

### File: `src/__tests__/primitives.test.tsx`, `src/components/__tests__/AgeGate.test.tsx`, `src/components/__tests__/WizardHost.test.tsx` (NEW — Wave 0)

| Property | Value |
|----------|-------|
| Role | Test |
| Closest analog | Phase 1 `src/__tests__/DesignSystem.test.tsx` (full file) |

Use the same `renderFreshX` helper pattern (`vi.resetModules` + `vi.stubGlobal('localStorage', new MemoryLocalStorage())` + dynamic import) from Phase 1's DesignSystem test.

---

## Plan 3: Profile Lifecycle

Welcome / Home / Profile create-edit / Profile detail / Intro / About / wizard content (the wizard host shipped in plan 2; this plan fills `WIZARD_STEPS`'s i18n keys).

### File: `src/routes/Welcome.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Pure presentational + 2 navigate buttons + 4 feature dialogs |
| Closest analog | v1.0 `viewWelcome` at `public/legacy/js/app.js:1399-1448` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:1399-1434 (excerpt)
function viewWelcome() {
  return h("section", { class: "page" },
    h("div", { class: "hero" },
      h("div", { class: "hero-blob" }),
      h("div", { class: "hero-blob hero-blob-holo" }),
      h("h1", { class: "hero-title" }, t("welcome_title")),
      h("p", { class: "hero-sub" }, t("welcome_sub")),
      h("div", { class: "hero-actions" },
        h("button", { class: "btn btn-primary", onClick: () => startNowFlow() }, t("welcome_cta")),
        h("button", { class: "btn btn-ghost", onClick: () => navigate("/intro") }, t("welcome_about")),
      ),
      h("ul", { class: "hero-features" },
        ...[
          [ICONS.feat_maps,     t("feat_maps_title"),     t("feat_maps_short"),     t("feat_maps_body")],
          [ICONS.feat_personal, t("feat_personal_title"), t("feat_personal_short"), t("feat_personal_body")],
          // … 4 total
        ].map(([icon, title, short, body]) => h("li", {},
          h("button", { class: "hero-feat-btn", onClick: () => dialog({
            title, body: h("p", { style: "line-height:1.6" }, body),
            actions: [{ label: t("btn_close"), value: null, kind: "primary" }],
          }) }, /* … */),
        )),
      ),
    ),
    /* how-to section, 4 steps */
  );
}
```

**Convention notes:**
- Hero blobs (`hero-blob`, `hero-blob-holo`) — keep the CSS classes from `public/legacy/css/style.css` *visual identity* but use Tailwind utility classes + the existing `holoOrbDrift` keyframe from Phase 1's `src/styles/animations.css`. Phase 1's `<DesignSystem />` route renders the same gradient + animation combo (`src/routes/DesignSystem.tsx:70-90`) — copy that JSX block.
- 4 feature buttons each open an imperative `dialog({...})`. Plan 2's `dialog()` helper is the call.
- "Start now" CTA: call `startNowFlow()` analog — read `useStore((s) => s.profiles)`, if empty → trigger wizard, else open a chooser dialog.

---

### File: `src/routes/Home.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Read profiles + imports from store; nav to profile / new profile / compare |
| Closest analog | v1.0 `viewHome` at `public/legacy/js/app.js:987-1025` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:987-1025
function viewHome() {
  const profiles = Store.getProfiles();
  const imports  = Store.getImports();
  $app.append(h("section", { class: "page" },
    h("header", { class: "page-head" },
      h("h1", {}, t("profiles_title")),
      h("p", { class: "muted" }, t("profiles_sub"))),
    h("div", { class: "grid cards" },
      ...profiles.map(profileCard),
      h("button", { class: "card card-add", onClick: () => navigate("/profile/new") },
        h("div", { class: "card-add-icon" }, "+"),
        h("div", {}, t("new_profile_btn")))),
    /* imports section, conditional on imports.length */
  ));
}
```

**Convention notes:**
- Selectors: `useStore((s) => s.profiles)` and `useStore((s) => s.imports)`.
- Sort imports descending by `importedAt` (RESEARCH §Open Question 1 — Claude's recommendation).
- Each profile card is a `<Link to={\`/profile/\${p.id}\`}>` — replaces `href="#/..."` from v1.0.
- Template-import filter (v1.0 line 1005): `imports.filter(i => !isTemplateImport(i))` — port `isTemplateImport` to a pure helper in `src/lib/data/imports.ts`.

---

### File: `src/routes/ProfileEdit.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component (handles both `/profile/new` and `/profile/:id/edit`) |
| Data flow | Controlled form → `useStore.createProfile` or `useStore.updateProfile` → navigate |
| Closest analog | v1.0 `viewProfileEdit` at `public/legacy/js/app.js:1517-1563`; RESEARCH §Plan-3 Example lines 1180-1235 |

**v1.0 analog (excerpt):**

```javascript
// public/legacy/js/app.js:1517-1531
function viewProfileEdit(id) {
  const profile = id ? Store.getProfile(id) : { name: "", pronouns: "", color: "#7c3aed", emoji: "🌷" };
  if (id && !profile) return navigate("/");
  const form = h("form", { class: "form profile-form", onSubmit: e => {
    e.preventDefault();
    const fd = new FormData(form);
    const patch = {
      name: (fd.get("name") || "").trim() || "Unnamed",
      pronouns: fd.get("pronouns") || "",
      color: fd.get("color"),
      emoji: (fd.get("emoji") || "").trim() || "✨",
    };
    if (id) { Store.updateProfile(id, patch); navigate(`/profile/${id}`); }
    else { const p = Store.createProfile(patch); navigate(`/profile/${p.id}`); }
  }}, …);
}
```

**Target (RESEARCH lines 1190-1235):**

```typescript
// src/routes/ProfileEdit.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from '@/components/EmojiPicker'
import { t } from '@/lib/i18n/i18n'

const PALETTE = ['#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#22c55e', '#e11d48']

export function ProfileEdit() {
  const { id } = useParams<{ id?: string }>()
  const existing = useStore((s) => (id ? s.profiles.find((p) => p.id === id) : null))
  const createProfile = useStore((s) => s.createProfile)
  const updateProfile = useStore((s) => s.updateProfile)
  const navigate = useNavigate()

  const [name, setName] = useState(existing?.name ?? '')
  const [pronouns, setPronouns] = useState(existing?.pronouns ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🌷')
  const [color, setColor] = useState(existing?.color ?? PALETTE[0])
  const [notes, setNotes] = useState(existing?.notes ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (id && existing) updateProfile(id, { name, pronouns, emoji, color, notes })
    else createProfile({ name, pronouns, emoji, color, notes })
    navigate('/')
  }
  // … render the form …
}
```

**Convention notes:**
- Plain `useState` per field (D-18 — no `react-hook-form`).
- The `PALETTE` const is identical to `src/lib/storage/store.ts:28-31`. Import it from there if it's exported; otherwise duplicate (Phase 1 keeps it inside the store module).
- `<EmojiPicker />` is bespoke (next row).

---

### File: `src/components/EmojiPicker.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Domain component |
| Data flow | Pop-over hosted grid → onChange callback |
| Closest analog | v1.0 `pickEmojiDialog` at `public/legacy/js/app.js:107-133`; `EMOJI_BANK` at `public/legacy/js/app.js:97-105` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:107-133
async function pickEmojiDialog(current = "✨") {
  let freeInput;
  return dialog({
    title: t("profile_emoji_label"),
    body: (close) => {
      freeInput = h("input", { type: "text", maxlength: 8, value: "", placeholder: "or type your own emoji…" });
      return h("div", { class: "emoji-picker" },
        h("div", { class: "emoji-grid" },
          ...EMOJI_BANK.map(e => h("button", {
            class: "emoji-cell" + (e === current ? " is-active" : ""),
            type: "button",
            onClick: () => close(e),
          }, e))),
        h("div", { class: "emoji-free" }, freeInput));
    },
    actions: [
      { label: t("btn_cancel"), kind: "ghost", value: null },
      { label: t("btn_ok"), kind: "primary",
        handler: () => {
          const v = (freeInput?.value || "").trim();
          if (!v) return false;
          if (!isLikelyEmoji(v)) { dlgAlert("Please enter an emoji character…"); return false; }
          return v;
        } },
    ],
  });
}
```

**Convention notes:**
- Use shadcn `Popover` (not `Dialog`) for inline placement next to the field (D-21).
- Move `EMOJI_BANK` (70+ entries) into `src/lib/data/emoji.ts` as a new export. Phase 1's store has the 14-entry version for random defaults — keep that, add this longer one separately (CONCERNS Pitfall 14).
- Port `isLikelyEmoji` (line 135-139) as a pure helper in `src/lib/data/emoji.ts`.
- BEM `is-active` modifier → `data-state="active"` attribute.

---

### File: `src/routes/ProfileDetail.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Read profile + results-by-profile; nav buttons per result |
| Closest analog | v1.0 `viewProfile` at `public/legacy/js/app.js:1564-1589` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:1564-1589
function viewProfile(id) {
  const profile = Store.getProfile(id);
  if (!profile) return navigate("/");
  const results = Store.getResultsForProfile(id);

  $app.append(h("section", { class: "page" },
    h("header", { class: "profile-head", style: `--c:${profile.color}` },
      h("div", { class: "avatar avatar-lg" }, profile.emoji),
      h("div", {},
        h("h1", {}, profile.name),
        profile.pronouns ? h("p", { class: "muted" }, profile.pronouns) : null),
      h("div", { class: "flex-spacer" }),
      h("button", { class: "btn", onClick: () => navigate(`/profile/${id}/edit`) }, t("btn_edit")),
    ),
    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("maps_title")),
        h("p", { class: "muted" }, t("maps_sub"))),
      h("div", { class: "list" },
        ...results.map(r => resultCard(r, profile)),
        h("button", { class: "list-add", onClick: () => createNewResult(profile.id) }, t("btn_new_map"))),
    ),
  ));
}
```

**Convention notes:**
- `useParams<{ id: string }>()` for profile ID.
- If profile not found, `useNavigate()('/')`.
- `resultCard` (v1.0 line 1591) becomes a small co-located component in this file or `src/components/ResultCard.tsx`.
- `createNewResult` (v1.0 line 1692) becomes a handler that opens an imperative `dialog({...})` to ask "blank / from import / from template".
- Use `style={{ '--c': profile.color }}` for the dynamic accent colour (the CSS still references `--c` for that BEM `--c:${profile.color}` pattern).

---

### File: `src/routes/Intro.tsx` (NEW — also serves `/about` per D-24)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Pure long-form prose render |
| Closest analog | v1.0 `viewIntro` at `public/legacy/js/app.js:3895-3917` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:3895-3917
function viewIntro() {
  $app.append(h("section", { class: "page narrow prose" },
    h("h1", {}, t("about_title")),
    h("p", {}, t("about_p1")),
    h("p", {}, t("about_p2")),
    h("h2", {}, t("about_how_title")),
    h("ol", {},
      h("li", {}, t("about_how_1")),
      h("li", {}, t("about_how_2")),
      h("li", {}, t("about_how_3"), " ", h("em", {}, "Need → No"), " ", t("about_how_3b")),
      h("li", {}, t("about_how_4")),
      h("li", {}, t("about_how_5")),
    ),
    h("h2", {}, t("about_privacy_title")),
    h("p", {}, t("about_privacy")),
    h("h2", {}, t("about_credits_title")),
    h("p", {}, t("about_credits"), " ",
      h("a", { href: "https://github.com/Relationshape/Relationshape-Pre-release-1", target: "_blank", rel: "noopener" }, t("about_credits_repo")), ".",
      " ", t("about_credits_unofficial")),
  ));
}
```

**Convention notes:**
- D-11: Keep long-form prose as flat i18n keys. Append all `about_*` keys to en.ts + de.ts.
- D-12: If any v1.0 key contains inline `<strong>` / `<em>` / `<a>` HTML, add it to the `RICH_TEXT_KEYS` allow-list in `src/lib/i18n/richText.ts` (NEW file — RESEARCH §Pattern 12) and render via `<TranslatedText>` helper. Otherwise plain `<p>{t('about_p1')}</p>`.
- Same component renders both routes (D-24); no internal branching needed — both routes mount `<Intro />`.

---

### File: `src/routes/__tests__/Profile.test.tsx`, `src/routes/__tests__/Intro.test.tsx` (NEW — Wave 0)

| Property | Value |
|----------|-------|
| Role | Test |
| Closest analog | Phase 1 `src/__tests__/DesignSystem.test.tsx` |

Use the same idiom (memory localStorage + `vi.resetModules` + dynamic import).

---

## Plan 4: Questionnaire

The hardest plan. Category overview, list mode, single-card mode + swipe + per-item scale override + scale picker + deep-link.

### File: `src/routes/CategoryOverview.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Read result; render category tiles; toggle `enabledCategories`; save through store |
| Closest analog | v1.0 `viewCategoryOverview` at `public/legacy/js/app.js:1622-1690` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:1659-1689 (the tile grid + actions)
h("div", { class: "cat-overview-grid" },
  ...enabledCats.map((cat, i) => {
    const { answered, total } = catProgress(cat);
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    const done = answered >= total && total > 0;
    const catTitle = lang === "de" && cat.de ? cat.de : cat.title;
    return h("button", {
      class: "cat-overview-tile" + (done ? " is-done" : ""),
      style: `--c:${cat.color}`,
      onClick: () => {
        result.progress = result.progress || {};
        result.progress.catIndex = i;
        Store.saveResult(result);
        navigate(`/q/${profileId}/${resultId}`);
      },
    },
      h("span", { class: "cat-overview-icon" }, cat.icon),
      h("div", { class: "cat-overview-body" },
        h("span", { class: "cat-overview-title" }, catTitle),
        h("div", { class: "cat-overview-bar-wrap" },
          h("div", { class: "cat-overview-bar", style: `width:${pct}%; background:${cat.color}` })),
        h("span", { class: "cat-overview-pct muted small" }, done ? "✓ " + t("q_done_title") : `${answered}/${total}`),
      ),
    );
  })
)
```

**Convention notes:**
- `useParams<{ profileId: string; resultId: string }>()` for the two IDs.
- Port `catProgress` (v1.0 line 1635) to a pure helper in `src/lib/charts/math.ts` (it's pure logic — fits next to `categoryAverage`).
- Tile click handler dispatches `saveResult({ ...result, progress: { ...result.progress, catIndex: i } })` (NOT mutate-in-place — Zustand requires fresh references).

---

### File: `src/routes/Questionnaire.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component (mode dispatcher) |
| Data flow | Read `result.progress.mode`; render `<ListMode />` or `<SingleMode />` |
| Closest analog | v1.0 `viewQuestionnaire` at `public/legacy/js/app.js:2099-2107` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:2099-2107
function viewQuestionnaire(profileId, resultId) {
  const profile = Store.getProfile(profileId);
  const result = Store.getResult(resultId);
  if (!profile || !result || result.profileId !== profileId) return navigate("/");
  const mode = result.progress?.mode || "list";
  if (mode === "single") return viewQuestionnaireSingle(profile, result);
  return viewQuestionnaireList(profile, result);
}
```

**Convention notes:**
- Two-line dispatcher — most of the work is in `<ListMode />` / `<SingleMode />`.
- Mode toggle (`<Tabs />`?) lives in `<QuestionnaireHeader />`; user can switch modes mid-flow (v1.0 `setMode` at line 2109).

---

### File: `src/components/questionnaire/ListMode.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Domain component |
| Data flow | Render category items; each item is a row with G/R/Both toggle + scale picker + note + hide |
| Closest analog | v1.0 `viewQuestionnaireList` at `public/legacy/js/app.js:2151-2240` |

**v1.0 analog (excerpt — the items + custom-add flow):**

```javascript
// public/legacy/js/app.js:2195-2213
h("div", { class: "q-items" },
  ...baseItems.map(item => itemRow(cat, item, answers, false, SCALE)),
  ...customNames.map(name => itemRow(cat, name, answers.__custom, true, SCALE)),
  h("button", { class: "q-add", onClick: async () => {
    if (!await checkTemplateWarning(result)) return;
    const name = await dlgPrompt({
      title: t("add_custom_title"),
      label: t("add_custom_label"),
      placeholder: t("add_custom_placeholder"),
      okLabel: t("btn_add"),
    });
    if (!name) return;
    if (cat.items.includes(name) || answers.__custom[name]) {
      return showToast(t("item_already_exists"));  // Custom-items duplicate guard (Pitfall 4)
    }
    answers.__custom[name] = { scale: "open" };
    persist(); rerender();
  }}, t("btn_add_custom")),
),
```

**Convention notes:**
- `itemRow` becomes its own component `src/components/questionnaire/ItemRow.tsx`.
- Every answer mutation MUST be preceded by `await templateWarning.confirmIfTemplate()` (D-30) — see plan 4's hook below.
- Custom-items duplicate guard at line 2207 is critical — port verbatim.
- "Always-visible save button" (D-31) → sticky bottom action pair: `<button onClick={prev}>← Categories</button>` / `<button onClick={next}>See results →</button>`. Both rendered inside `<QuestionnaireNav />` with `position: sticky; bottom: 0`.

---

### File: `src/components/questionnaire/SingleMode.tsx` (NEW — hardest component)

| Property | Value |
|----------|-------|
| Role | Domain component |
| Data flow | `useReducer({cursor, dir})`; swipe + keyboard; per-card scale picker; per-item scale override dialog |
| Closest analog | v1.0 `viewQuestionnaireSingle` at `public/legacy/js/app.js:2450-2700`; RESEARCH §Pattern 8 |

**v1.0 analog (the rendering loop + swipe binding):**

```javascript
// public/legacy/js/app.js:2479-2515 (excerpt)
function renderCard(noAnimate = false) {
  if (cursor >= items.length) { /* done view */ return; }
  const cur = items[cursor];
  const peekNext = items[cursor + 1];
  stack.innerHTML = "";
  if (peekNext) stack.append(makeCard(peekNext, true));
  const card = makeCard(cur, false);
  stack.append(card);
  // … header update …
  bindSwipe(card, {
    onLeft: () => advance(null, "left"),
    onRight: () => advance(null, "swipe-prev"),
  });
  if (noAnimate) card.classList.add("in");
  else requestAnimationFrame(() => card.classList.add("in"));
}
```

**Target shape (RESEARCH §Pattern 8 lines 837-867):**

```typescript
<SingleMode profile={…} result={…}>
 ├─ useReducer({cursor, dir}) — cursor is flatItemIndex; dir is animation direction
 ├─ const items = flatItemsForResult(result)   // pure helper (lifted from app.js:2134)
 ├─ const cur = items[cursor]
 ├─ const peekNext = items[cursor + 1]
 ├─ render order: peek (z=0) then cur (z=1)
 ├─ const bind = useSwipe({ onLeft: () => advance(+1, 'left'), onRight: () => advance(-1, 'right') })
 ├─ useKeydown({
 │     ArrowRight: () => advance(+1, 'right'),
 │     ArrowLeft:  () => advance(-1, 'left'),
 │     ' ':        () => advance(+1, 'left'),     // skip
 │     '1'..'N':   (k) => { setAnswer(SCALE[k-1].key); setTimeout(()=>advance(+1,'right'), 420) },
 │   })
 ├─ const reduced = useReducedMotion()
 └─ Card has:
    ├─ category header
    ├─ <h1> item label (React text-node — XSS safe)
    ├─ <ScalePicker /> (or two for G/R categories)
    ├─ <input type="text" /> note
    ├─ <Button>Edit scale for this item</Button>  → opens <Dialog /> (D-33)
    └─ data-state attribute drives Tailwind transitions
```

**Convention notes:**
- Port `flatItemsForResult` (v1.0 line 2134) to `src/lib/charts/math.ts` — pure function.
- Per-item scale override (D-33): button opens an in-tree `<Dialog />` (declarative, not imperative). Before discarding existing answer, call imperative `dialog({...})` for the confirm step (v1.0 line 2554).
- Reduced-motion (D-32): `useReducedMotion()` returns true → omit `data-state="entering|active|leaving"` transitions; advance instantly.
- Bound element gets `style={{ touchAction: 'pan-y' }}` to fix Android scroll-vs-swipe (RESEARCH §Pattern 6).

---

### File: `src/components/ScalePicker.tsx` (NEW — bespoke, NOT shadcn Slider)

| Property | Value |
|----------|-------|
| Role | Domain component |
| Data flow | Render snap-dots row; pointer drag + keyboard; emit (key, frac) on change |
| Closest analog | v1.0 `scaleClickEl` at `public/legacy/js/app.js:262-346` |

**v1.0 analog (excerpt):**

```javascript
// public/legacy/js/app.js:262-310
function scaleClickEl({ scale, valueFrac, onChange, onClear, compact = false }) {
  const N = scale.length;
  const hasValue = valueFrac !== undefined && valueFrac !== null;
  const root = h("div", {
    class: "rs-click-scale" + (hasValue ? " has-value" : " no-value") + (compact ? " is-compact" : ""),
    role: "slider", tabindex: "0",
    "aria-valuemin": "0", "aria-valuemax": "100",
    "aria-valuenow": hasValue ? String(Math.round(valueFrac * 100)) : null,
  });
  const trackGrad = scale.map((s, i) => `${s.color} ${(i / Math.max(1, N - 1)) * 100}%`).join(", ");
  const gradBar  = h("div", { class: "rs-click-scale-grad", style: `background: linear-gradient(90deg, ${trackGrad})` });
  const marker = h("div", { class: "rs-click-scale-marker" });
  if (hasValue) {
    marker.style.left = `${valueFrac * 100}%`;
    marker.style.setProperty("--mc", interpolateScaleColor(scale, valueFrac));
  } else { marker.style.display = "none"; }
  // … snap-dots ref ticks per step, each with onClick → onChange?.(s.key, exactFrac)
  // … drag handlers: pointerdown / pointermove / pointerup; applyFrac(frac)
  // … keyboard: ArrowRight/Up nudge +step, Home/End jump to bounds
}
```

**Convention notes:**
- `role="slider"`, `aria-valuemin/max/now` attributes — keep verbatim for a11y.
- Replace v1.0 raw pointer handlers with `useDrag` from `@use-gesture/react` (the dep is already added by `useSwipe`).
- Snap dots are `<button>` elements (keyboard reachable). Use `<button type="button">` to prevent form submit when nested inside a `<form>` (List mode wraps the picker in a form).
- Keyboard handler reproduces v1.0's `ArrowLeft/Right/Home/End/Backspace` mapping (line 335-343).
- Colours come from each step's `color` prop — Tailwind dynamic styling via `style={{ '--c': step.color }}` + a CSS class that consumes `--c`.

---

### File: `src/lib/hooks/useTemplateWarning.ts` (NEW)

| Property | Value |
|----------|-------|
| Role | Hook |
| Data flow | Async confirm wrapper using imperative `dialog()` |
| Closest analog | v1.0 `checkTemplateWarning` at `public/legacy/js/app.js:1049-1076`; RESEARCH §Pattern 11 |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:1049-1076
async function checkTemplateWarning(result) {
  if (!result || (!result.seededFromImportId && !result.seededFromResultId)) return true;
  if (result.templateWarningDisabled) return true;
  let disableForever = false;
  const bodyEl = h("div", {},
    h("p", {}, t("template_warning")),
    h("label", { style: "display:flex;align-items:center;gap:8px;margin-top:12px" },
      Object.assign(h("input", { type: "checkbox" }),
        { onchange: e => { disableForever = e.target.checked; } }),
      t("template_warning_disable")
    )
  );
  const choice = await dialog({
    title: t("template_warning_title"),
    body: () => bodyEl,
    actions: [
      { label: t("btn_cancel"), value: "cancel", kind: "ghost" },
      { label: t("btn_continue_anyway"), value: "ok", kind: "primary" },
    ],
  });
  if (!choice || choice === "cancel") return false;
  if (disableForever) {
    result.templateWarningDisabled = true;
    Store.saveResult(result);
  }
  return true;
}
```

**Target (RESEARCH §Pattern 11 lines 953-991):**

```typescript
// src/lib/hooks/useTemplateWarning.ts
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialogQueue'
import type { Result } from '@/lib/storage/types'
import { t } from '@/lib/i18n/i18n'

export function useTemplateWarning(result: Result | null) {
  const saveResult = useStore((s) => s.saveResult)
  return {
    confirmIfTemplate: async (): Promise<boolean> => {
      if (!result) return true
      if (!result.seededFromImportId && !result.seededFromResultId) return true
      if (result.templateWarningDisabled) return true
      let disableForever = false
      const choice = await dialog<'ok' | 'cancel'>({
        title: t('template_warning_title'),
        body: () => (
          <div>
            <p>{t('template_warning')}</p>
            <label>
              <input type="checkbox" onChange={(e) => { disableForever = e.target.checked }} />
              {t('template_warning_disable')}
            </label>
          </div>
        ),
        actions: [
          { label: t('btn_cancel'), kind: 'ghost', value: 'cancel' },
          { label: t('btn_continue_anyway'), kind: 'primary', value: 'ok' },
        ],
      })
      if (choice !== 'ok') return false
      if (disableForever) saveResult({ ...result, templateWarningDisabled: true })
      return true
    },
  }
}
```

**Convention notes:**
- `Result` type extensions needed: add `seededFromImportId?: string`, `seededFromResultId?: string`, `templateWarningDisabled?: boolean` to `src/lib/storage/types.ts:41-55`.
- Called BEFORE every answer mutation (v1.0 calls it at line 2070, 2199, 2280, 2552, 3070, 3081 — six call sites).

---

### File: `src/lib/charts/math.ts` (NEW — pure functions)

| Property | Value |
|----------|-------|
| Role | Lib (pure) |
| Data flow | Pure helpers; no React, no DOM |
| Closest analog | v1.0 `public/legacy/js/charts.js:11-134, 460-478` |

**v1.0 analog (the pure helpers in order — port verbatim):**

```javascript
// public/legacy/js/charts.js:24-28 — scaleMaxValue
function scaleMaxValue(scale) {
  let m = -Infinity;
  for (const s of scale) if (s.value > m) m = s.value;
  return m;
}

// public/legacy/js/charts.js:32-50 — pushAnswerValues
function pushAnswerValues(entry, scale, byKey, values) {
  if (!entry) return;
  const maxV = scaleMaxValue(scale);
  if (entry.giving !== undefined || entry.receiving !== undefined ||
      entry.givingFrac !== undefined || entry.receivingFrac !== undefined) {
    const gv = entry.givingFrac !== undefined
      ? entry.givingFrac * maxV
      : (entry.giving && byKey(entry.giving) ? byKey(entry.giving).value : null);
    const rv = entry.receivingFrac !== undefined
      ? entry.receivingFrac * maxV
      : (entry.receiving && byKey(entry.receiving) ? byKey(entry.receiving).value : null);
    if (gv != null) values.push(gv);
    if (rv != null) values.push(rv);
  } else if (entry.scaleFrac !== undefined) {
    values.push(entry.scaleFrac * maxV);
  } else if (entry.scale && byKey(entry.scale)) {
    values.push(byKey(entry.scale).value);
  }
}

// public/legacy/js/charts.js:52-65 — categoryAverage
export function categoryAverage(answers, catId, scale) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return null;
  scale = scale || Store.getScale();
  const max = scaleMaxValue(scale);
  const byKey = (k) => scale.find(s => s.key === k);
  const values = [];
  const slot = answers?.[catId] || {};
  for (const item of cat.items) pushAnswerValues(slot[item], scale, byKey, values);
  for (const k of Object.keys(slot.__custom || {})) pushAnswerValues(slot.__custom[k], scale, byKey, values);
  if (!values.length) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { value: avg, norm: max ? avg / max : 0 };
}

// public/legacy/js/charts.js:114-116 — labelFontSize
function labelFontSize(axisCount) {
  return Math.round(Math.max(18, Math.min(34, 220 / axisCount)));
}

// public/legacy/js/charts.js:119-134 — wrapLabel
function wrapLabel(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else { current = candidate; }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

// public/legacy/js/charts.js:460-467 — closestScaleEntry
function closestScaleEntry(value, scale) {
  let best = scale[0], d = Infinity;
  for (const e of scale) {
    const dd = Math.abs(e.value - value);
    if (dd < d) { d = dd; best = e; }
  }
  return best;
}

// public/legacy/js/charts.js:469-472 — angle
function angle(i, n, radius, cx, cy) {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
  return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
}
```

**Convention notes:**
- The TS port keeps the SAME function names (`categoryAverage`, `labelFontSize`, etc.) so the cross-reference to v1.0 stays unambiguous.
- Replace JS `Store.getScale()` calls with **arguments** — these helpers must be pure (no module side-effects). Caller passes `scale` explicitly.
- Add precise types: `AnswerCell | undefined`, `MutableScaleStep[]`, etc. — pull from `src/lib/data/types.ts` (already exists).
- Lifted to plan 4 because the questionnaire `<CategoryOverview />` consumes `categoryAverage`. Charts in plan 5 import the same module.
- Test file `src/lib/charts/__tests__/math.test.ts` is in Wave 0 — assert v1.0-equivalent output for a hand-crafted answers blob.

---

### File: `src/routes/__tests__/CategoryOverview.test.tsx`, `src/components/questionnaire/__tests__/ListMode.test.tsx`, `SingleMode.test.tsx`, `src/components/__tests__/ScalePicker.test.tsx`, `src/lib/i18n/__tests__/de-gendered.test.ts` (NEW — Wave 0)

| Property | Value |
|----------|-------|
| Role | Test |
| Closest analog | Phase 1 DesignSystem.test.tsx |

---

## Plan 5: Results & Charts

Result header + 4 chart components + enlarged modal. The XSS escape audit is structural — React text nodes do the work.

### File: `src/routes/Result.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Read result; build dataset; render header + overview spider + per-category drill-down |
| Closest analog | v1.0 `viewResult` at `public/legacy/js/app.js:2770-2821`; RESEARCH §Pattern 10 |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:2770-2821
function viewResult(resultId, openCatId = null) {
  const r = Store.getResult(resultId);
  if (!r) return navigate("/");
  const profile = Store.getProfile(r.profileId);
  const dataset = {
    name: resultLabel(r, profile),
    color: r.subjectColor || profile.color,
    answers: r.answers || {},
    scale: getResultScale(r),
  };
  $app.append(h("section", { class: "page" },
    h("header", { class: "result-head", style: `--c:${dataset.color}` },
      h("button", { class: "btn btn-ghost", onClick: () => navigate(`/profile/${profile.id}`) }, t("btn_back")),
      h("div", { class: "li-avatar" }, r.subjectEmoji || "💞"),
      h("div", {},
        h("h1", {}, r.subject + (r.version > 1 ? ` (v${r.version})` : "")),
        h("p", { class: "muted" }, `${profile.emoji} ${profile.name} · ${countAnswers(r)} ${t("answers")} · …`)),
      h("button", { class: "btn", onClick: () => navigate(`/map/${r.id}/settings`) }, t("btn_map_settings")),
      h("button", { class: "btn", onClick: () => navigate(`/q/${profile.id}/${r.id}`) }, t("btn_continue_editing")),
      h("button", { class: "btn btn-primary", onClick: () => openExportModal(r, profile) }, t("btn_share")),
    ),
    /* fabi-mode overview spider, conditional */
    /* compare-with picker */
    /* category cards */
  ));
  if (openCatId) {
    const cat = CATEGORIES.find(c => c.id === openCatId);
    if (cat) requestAnimationFrame(() => openCategoryModal([dataset], cat, r));
  }
}
```

**Deep-link handling (RESEARCH §Pattern 10):**

```typescript
// Inside Result.tsx
const { id, catId } = useParams<{ id: string; catId?: string }>()
const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
useEffect(() => {
  if (!catId) return
  const el = sectionRefs.current.get(catId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // open the drill-down for this category
  }
}, [catId])
```

**Convention notes:**
- "Active category" state owned by `<Result />` (D-34) and passed down to chart sub-components — single source of truth.
- "Share" button navigates to `/share/:id` (plan 6). The v1.0 `openExportModal` becomes navigation, not a modal.
- D-35: pass `datasets.slice(0, 4)` everywhere; toast if `datasets.length > 4`.

---

### File: `src/components/charts/Spider.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Chart component |
| Data flow | Pure render — datasets in, SVG JSX out |
| Closest analog | v1.0 `renderSpider` at `public/legacy/js/charts.js:303-322`; v1.0 `radar` at `public/legacy/js/charts.js:137-300`; RESEARCH §Pattern 7 |

**v1.0 analog (renderSpider + radar excerpt):**

```javascript
// public/legacy/js/charts.js:303-322
export function renderSpider(datasets, opts = {}) {
  const candidates = opts.axes || pickCategoryAxes(datasets);
  const axes = candidates.map(id => {
    const c = CATEGORIES.find(c => c.id === id);
    return { key: id, title: c?.title || id, icon: c?.icon || "•" };
  });
  const ds = datasets.map(d => {
    const scale = dsScale(d);
    return {
      name: d.name, color: d.color,
      points: axes.map(a => {
        const avg = categoryAverage(d.answers, a.key, scale);
        if (!avg) return null;
        const sc = closestScaleEntry(avg.value, scale);
        return { norm: avg.norm, label: sc?.label };
      }),
    };
  });
  return radar(axes, ds, { size: opts.size || 640, title: "Category overview", pad: opts.pad });
}

// public/legacy/js/charts.js:159-193 — label rendering (the part that emits svg <text>)
axes.forEach((ax, i) => {
  const [x, y] = angle(i, N, r, cx, cy);
  spokes += `<line class="rs-grid-spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
  const labelR = r + fs * 1.6;
  const [lx, ly] = angle(i, N, labelR, cx, cy);
  const anchor = Math.abs(lx - cx) < 4 ? "middle" : (lx > cx ? "start" : "end");
  // … wrapping logic …
  labels += `
    <g class="rs-axis-label" text-anchor="${anchor}" data-axis="${i}">
      ${ax.icon ? `<text x="${lx.toFixed(1)}" y="${iconY.toFixed(1)}" class="rs-axis-icon" …>${ax.icon}</text>` : ""}
      <text class="rs-axis-text" font-size="${fs}" text-anchor="${anchor}"><title>${escape(fullTitle)}</title>${tspans}</text>
    </g>`;
});
```

**Target (RESEARCH §Pattern 7 lines 795-834):**

```typescript
// src/components/charts/Spider.tsx
import { useSpiderInteraction } from '@/lib/hooks/useSpiderInteraction'
import { polarToCartesian, labelFontSize, wrapLabel, categoryAverage, closestScaleEntry, pickCategoryAxes } from '@/lib/charts/math'
import { CATEGORIES } from '@/lib/data/data'

export function Spider({ datasets, size = 640, axes: axesOverride }: { datasets: ChartDataset[]; size?: number; axes?: string[] }) {
  const { activeAxis, onAxisEnter, onAxisLeave, onAxisTap } = useSpiderInteraction(datasets)
  const candidates = axesOverride ?? pickCategoryAxes(datasets)
  const axes = candidates.map((id) => {
    const c = CATEGORIES.find((c) => c.id === id)
    return { key: id, title: c?.title ?? id, icon: c?.icon ?? '•' }
  })
  const fs = labelFontSize(axes.length)
  const pad = Math.max(100, Math.min(145, Math.ceil(fs * 4.2)))
  const r = size / 2 - pad
  const cx = size / 2; const cy = size / 2

  return (
    <div className="rs-chart-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Spider chart">
        {[1, 2, 3, 4, 5].map((g) => { /* ring polygon */ })}
        {axes.map((_, i) => { /* spoke line */ })}
        {datasets.map((ds, di) => { /* dataset polygon — fill={ds.color} */ })}
        {axes.map((ax, i) => (
          <g key={i} onPointerEnter={() => onAxisEnter(ax.key)} onPointerLeave={onAxisLeave} onClick={() => onAxisTap(ax.key)}>
            <text x={lx} y={ly} textAnchor={anchor} fontSize={fs} className={activeAxis === ax.key ? 'is-active' : undefined}>
              {ax.title}  {/* React text node — XSS-safe by construction (D-05) */}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
```

**Convention notes:**
- D-04 / D-05: emit SVG as JSX. NEVER `dangerouslySetInnerHTML`.
- v1.0's `escape(fullTitle)` (charts.js:473) becomes free — React text nodes escape automatically.
- v1.0's `bindSpiderInteractivity` (charts.js:238) is **replaced** by `useSpiderInteraction` hook + per-element handlers (D-06). No accumulated listeners, no manual cleanup.

---

### File: `src/components/charts/ItemSpider.tsx`, `CategoryBars.tsx`, `Alignment.tsx`, `EnlargedSpider.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Chart component |
| Data flow | Pure render |
| Closest analogs | v1.0 `renderItemSpider` at `charts.js:333-371`; `renderCategoryBars` at `charts.js:373-422`; `renderAlignment` at `charts.js:424-458` |

**v1.0 analog (renderCategoryBars excerpt):**

```javascript
// public/legacy/js/charts.js:373-422
export function renderCategoryBars(datasets, catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return "";
  const lang = getLang();
  const itemSet = new Set(cat.items);
  for (const ds of datasets) {
    Object.keys(ds.answers?.[catId]?.__custom || {}).forEach(k => itemSet.add("✶ " + k));
  }
  const items = Array.from(itemSet).filter(item => {
    const isCustom = item.startsWith("✶ ");
    const key = isCustom ? item.slice(2) : item;
    return datasets.some(ds => {
      const slot = isCustom ? ds.answers?.[catId]?.__custom?.[key] : ds.answers?.[catId]?.[key];
      return slot && answerAvgValue(slot, dsScale(ds)) != null;
    });
  });
  const rows = items.map(item => {
    const cells = datasets.map(ds => {
      /* compute width / color / tooltip / per-step label */
      return `<div class="rs-bar-cell" title="${escape(tip)}">…</div>`;
    }).join("");
    const isCustom = item.startsWith("✶ ");
    const displayLabel = isCustom ? item : getItemLabel(cat, item, lang);
    return `<div class="rs-bar-row">
      <div class="rs-bar-label">${escape(displayLabel)}</div>
      <div class="rs-bar-cells">${cells}</div>
    </div>`;
  }).join("");
  return `<div class="rs-bars">${rows}</div>`;
}
```

**v1.0 analog (renderAlignment excerpt):**

```javascript
// public/legacy/js/charts.js:424-458
export function renderAlignment(datasets) {
  if (datasets.length < 2) return "";
  const [a, b] = datasets;
  const sa = dsScale(a), sb = dsScale(b);
  const rows = CATEGORIES.map(cat => {
    const va = categoryAverage(a.answers, cat.id, sa);
    const vb = categoryAverage(b.answers, cat.id, sb);
    if (!va || !vb) return null;
    const diff = Math.abs(va.norm - vb.norm);
    const align = 1 - diff;
    return { cat, va, vb, diff, align };
  }).filter(Boolean).sort((x, y) => x.diff - y.diff);
  const top = rows.slice(0, 5);
  const bottom = rows.slice(-5).reverse();
  const fmt = r => `
    <li>
      <span class="rs-align-pill" style="background:linear-gradient(90deg,#22c55e ${Math.round(r.align*100)}%,#ef4444 ${Math.round(r.align*100)}%)"></span>
      <span class="rs-align-icon">${r.cat.icon}</span>
      <span class="rs-align-title">${escape(r.cat.title)}</span>
      <span class="rs-align-meta">${Math.round(r.va.norm*100)}% ↔ ${Math.round(r.vb.norm*100)}%</span>
    </li>`;
  return `<div class="rs-align-grid">
    <section><h3>${t("alignment_match")}</h3><ul class="rs-align-list">${top.map(fmt).join("")}</ul></section>
    <section><h3>${t("alignment_gaps")}</h3><ul class="rs-align-list">${bottom.map(fmt).join("")}</ul></section>
  </div>`;
}
```

**Convention notes:**
- Same recipe for all four: emit JSX, never HTML strings. The pure math (`categoryAverage`, `answerAvgValue`, `closestScaleEntry`) lives in `src/lib/charts/math.ts` (plan 4 already lifted these).
- `EnlargedSpider` is just `<Dialog>{<Spider size={760} />}</Dialog>` (D-07). No separate component logic needed — pass a larger `size` prop.
- v1.0's hidden-items filter (custom items prefixed `✶ `) — port verbatim in `<CategoryBars />`. Add a shared helper `enabledItemsForCat(result, catId)` if any code path duplicates it (CONCERNS Pitfall 5).

---

### File: `src/lib/hooks/useSpiderInteraction.ts` (NEW)

| Property | Value |
|----------|-------|
| Role | Hook |
| Data flow | `useState<string \| null>(activeAxis)` + handler factories |
| Closest analog | v1.0 `bindSpiderInteractivity` at `public/legacy/js/charts.js:238-297` |

**v1.0 analog:**

```javascript
// public/legacy/js/charts.js:260-297
function setActive(i) {
  wrap.dataset.activeI = i == null ? "" : i;
  polys.forEach(p => {
    const pi = p.dataset.i;
    p.classList.toggle("is-active", String(i) === pi);
    p.classList.toggle("is-faded", i != null && String(i) !== pi);
  });
  dots.forEach(d => {
    const di = d.dataset.i;
    d.classList.toggle("is-faded", i != null && String(i) !== di);
  });
}
dots.forEach(d => {
  d.addEventListener("mouseenter", () => { /* showTip; setActive(d.dataset.i) */ });
  d.addEventListener("mouseleave", () => { hideTip(); setActive(null); });
});
```

**Convention notes:**
- React `useState` replaces `dataset.activeI` flag.
- Per-element `onPointerEnter` / `onPointerLeave` / `onClick` handlers replace the `addEventListener` accumulation (CONCERNS Fragile Areas — "listener accumulation risk").
- Return shape: `{ activeAxis, onAxisEnter, onAxisLeave, onAxisTap }` — components map them onto `<g>` props.

---

### File: `src/components/charts/__tests__/Spider.test.tsx`, `ItemSpider.test.tsx`, `CategoryBars.test.tsx`, `Alignment.test.tsx`, `EnlargedSpider.test.tsx`, `src/routes/__tests__/Result.test.tsx`, `src/lib/charts/__tests__/math.test.ts` (NEW — Wave 0)

| Property | Value |
|----------|-------|
| Role | Test (snapshot + XSS) |
| Closest analog | Phase 1 DesignSystem.test.tsx |

**RESULT-07 XSS test pattern (from CONTEXT.md <specifics>):**
- Feed `<script>alert('xss')</script>` and `"><img onerror=alert(1) src=x>` as `ds.name`, profile name, custom item label.
- Snapshot SVG `outerHTML`; assert `.toContain('<script')` is FALSE.

---

## Plan 6: Share / Import / Compare

### File: `src/routes/Share.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Form: passphrase → `encryptResult(payload, pass)` → textarea + copy + download |
| Closest analog | v1.0 `viewShare` at `public/legacy/js/app.js:3282-3354` |

**v1.0 analog (the encrypt + render-output block):**

```javascript
// public/legacy/js/app.js:3304-3322
const output = h("textarea", { class: "share-out", readonly: "", rows: 12 });
const out = h("div", { class: "share-result", style: "display:none" },
  h("h2", {}, t("share_bundle_title")),
  h("p", { class: "muted" }, t("share_bundle_sub")),
  output,
  h("div", { class: "form-actions" },
    h("button", { class: "btn", onClick: async () => {
      await navigator.clipboard.writeText(output.value); showToast(t("btn_copy") + " ✔");
    }}, t("btn_copy")),
    h("button", { class: "btn", onClick: () => {
      const blob = new Blob([output.value], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relationshape-${slug(profile.name)}-${slug(r.subject)}.rshape.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }}, t("btn_download"))),
);
// … form submit handler:
const blob = await encryptResult(payload, pass);
output.value = blob;
out.style.display = "block";
```

**Convention notes:**
- Import `encryptResult` from Phase 1's `src/lib/crypto/crypto.ts` (already byte-compatible).
- Replace `output.value = blob` mutation with React state: `const [armor, setArmor] = useState<string \| null>(null)`. Show the output section when `armor !== null`.
- Replace `navigator.clipboard.writeText(output.value)` with same call against the state value; toast on success.
- Download: same `URL.createObjectURL` pattern, but use `useRef<HTMLAnchorElement>(null)` if you prefer not to create the `<a>` on the fly.
- Passphrase form: D-36 says use a `<Dialog />` (or shadcn `Sheet` on small screens — planner's call). Simple inline form is also acceptable.

---

### File: `src/routes/Import.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Form: paste-blob OR file-upload → `decryptResult(blob, pass)` → `saveImport(payload)` → navigate `/compare?ids=imp:<newId>` |
| Closest analog | v1.0 `viewImport` at `public/legacy/js/app.js:3359-3437` |

**v1.0 analog:**

```javascript
// public/legacy/js/app.js:3387-3437
h("form", { class: "form", onSubmit: async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const blob = (fd.get("blob") || "").toString().trim();
  const pass = (fd.get("pass") || "").toString();
  if (!blob) return dlgAlert(t("import_empty"));
  try {
    const payload = await decryptResult(blob, pass);
    if (payload.type !== "relationshape-result") throw new Error(t("import_wrong_type"));
    const version = Store.nextImportVersion(payload.name, payload.subject);
    const impData = { name: payload.name, /* … */, version, srcVersion: payload.version || 1 };
    impData.answers = payload.answers || {};
    const imp = Store.saveImport(impData);
    showToast(version > 1 ? t("imported_versioned_toast", { n: version }) : t("imported_toast"));
    navigate(`/compare?ids=imp:${imp.id}`);
  } catch (err) {
    dlgAlert(err.message || "Could not decrypt.", t("import_failed_title"));
  }
}},
  h("label", {}, t("import_bundle_label"), blobInput),
  h("label", {}, t("import_file_label"),
    h("input", { type: "file", accept: ".txt,.rshape,.json", onChange: e => {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => { blobInput.value = reader.result; };
      reader.readAsText(f);
    }})),
  h("label", {}, t("import_pass_label"),
    h("input", { name: "pass", type: "password", autocomplete: "off", required: true })),
  ...
)
```

**Convention notes:**
- `decryptResult` ported in Phase 1's `src/lib/crypto/crypto.ts`.
- Wrong-passphrase → catch → imperative `dialog({...})` with `t('unlock_failed')` body. Don't differentiate "wrong passphrase" from "corrupted bundle" (V6 security: information-leakage avoidance).
- After save, `useNavigate()(\`/compare?ids=imp:\${imp.id}\`)`.
- File-upload: `<input type="file" accept=".txt,.rshape,.json">` + `e.target.files?.[0]` + `FileReader.readAsText`. The `useState<string>('')` is the textarea content; the file's `onChange` sets the textarea.

---

### File: `src/routes/Compare.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | `useSearchParams().get('ids')` → split comma → resolve own + import IDs → render ≤4 datasets |
| Closest analog | v1.0 `viewCompare` at `public/legacy/js/app.js:3453-3544`; RESEARCH §Pattern 9 |

**v1.0 analog (ID resolution + dataset mapping):**

```javascript
// public/legacy/js/app.js:3453-3482
function viewCompare(ids) {
  const profiles = Store.getProfiles();
  const results = Store.getResults();
  const imports = Store.getImports();
  const allOptions = [
    ...results.map(r => ({
      id: r.id,
      label: resultLabel(r, profiles.find(p => p.id === r.profileId)),
      color: r.subjectColor, emoji: r.subjectEmoji, answers: r.answers, scale: r.scale, kind: "result"
    })),
    ...imports.map(i => ({
      id: "imp:" + i.id,
      label: importLabel(i),
      color: i.color || "#7c3aed", emoji: i.emoji || "📨", answers: i.answers, scale: i.scale, kind: "import"
    })),
  ];
  let selected = ids.map(id => allOptions.find(o => o.id === id)).filter(Boolean);
  if (!selected.length) selected = allOptions.slice(0, 2);
  const datasets = selected.map(s => ({ name: s.label, color: s.color, answers: s.answers, scale: s.scale }));
  // … pick chips + alignment + category cards …
}
```

**Target (RESEARCH §Pattern 9 lines 895-922):**

```typescript
// src/routes/Compare.tsx
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { useToast } from '@/lib/hooks/useToast'
import { useEffect } from 'react'

export function Compare() {
  const [params] = useSearchParams()
  const rawIds = (params.get('ids') ?? '').split(',').filter(Boolean)
  const truncated = rawIds.slice(0, 4)
  const { toast } = useToast()
  useEffect(() => {
    if (rawIds.length > 4) toast.message(t('compare_too_many_truncated'))
  }, [rawIds.length, toast])
  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const imports = useStore((s) => s.imports)
  const datasets = truncated.map((id) => {
    if (id.startsWith('imp:')) {
      const imp = imports.find((i) => i.id === id.slice(4))
      return imp ? mapImportToDataset(imp) : null
    }
    const r = results.find((r) => r.id === id)
    if (!r) return null
    const profile = profiles.find((p) => p.id === r.profileId)
    return mapResultToDataset(r, profile)
  }).filter(Boolean)
  // … render compare view (chips + spider + alignment + category cards)
}
```

**Convention notes:**
- D-25: URL scheme verbatim `?ids=a,b,imp:c` — `imp:` prefix denotes import.
- D-35: slice to 4 + toast if more.
- Reuse `<Spider />`, `<Alignment />`, `<CategoryBars />` from plan 5 — Compare composes them.
- Picking/un-picking a chip rewrites the URL via `setSearchParams({ ids: next.map(s => s.id).join(',') })`.

---

### File: `src/routes/__tests__/Share.test.tsx`, `Import.test.tsx`, `Import.fixture.test.tsx`, `Compare.test.tsx` (NEW — Wave 0)

| Property | Value |
|----------|-------|
| Role | Test |
| Closest analog | Phase 1 `tests/fixtures/v1-bundle.rshape.txt` + `tests/fixtures/v1-bundle.fixture.ts` |

**Fixture regression (SHARE-04):**
- Import already-captured Phase 1 fixture.
- Assert resulting `Import` object deep-equals the snapshot in `v1-bundle.fixture.ts`.
- No new fixture capture — Phase 1's plan 03 captured these.

---

## Plan 7: Settings

### File: `src/routes/Settings.tsx` (NEW)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Read scale; edit / reorder / delete; theme + lang pickers; data management |
| Closest analog | v1.0 `viewSettings` at `public/legacy/js/app.js:3547-3756` |

**v1.0 analog (scale editor row + reorder):**

```javascript
// public/legacy/js/app.js:3555-3590
fresh.forEach((s, i) => {
  const row = h("div", { class: "scale-row", style: `--c:${s.color}` },
    h("div", { class: "scale-row-rank" }, `${fresh.length - i}`),
    h("input", { class: "scale-row-color", type: "color", value: s.color,
      onInput: (e) => { fresh[i].color = e.target.value; Store.setScale(fresh); }}),
    h("input", { class: "scale-row-label", type: "text", value: s.label,
      onChange: (e) => { fresh[i].label = e.target.value || s.label; Store.setScale(fresh); }}),
    h("input", { class: "scale-row-short", type: "text", value: s.short, maxlength: 24,
      onChange: (e) => { fresh[i].short = (e.target.value || s.short).slice(0, 24); Store.setScale(fresh); }}),
    h("input", { class: "scale-row-desc", type: "text", value: s.description || "",
      onChange: (e) => { fresh[i].description = e.target.value; Store.setScale(fresh); }}),
    h("div", { class: "scale-row-actions" },
      h("button", { class: "icon-btn", title: "Move up", disabled: i === 0,
        onClick: () => { swap(fresh, i, i - 1); Store.setScale(fresh); rerender(); } }, "↑"),
      h("button", { class: "icon-btn", title: "Move down", disabled: i === fresh.length - 1,
        onClick: () => { swap(fresh, i, i + 1); Store.setScale(fresh); rerender(); } }, "↓"),
      h("button", { class: "icon-btn danger", title: "Remove", disabled: fresh.length <= 2,
        onClick: async () => {
          if (Store.scaleHasData(s.key)) {
            if (!await dlgConfirm(t("scale_step_remove_confirm", { label: s.label }), { danger: true })) return;
          }
          fresh.splice(i, 1);
          Store.setScale(fresh);
          rerender();
        } }, "🗑"),
    )
  );
  list.append(row);
});
```

**Convention notes:**
- D-40 says reorder via `@use-gesture/react` drag. Plan 7 may keep the v1.0 ↑/↓ buttons in addition (planner's call). For drag, use `useDrag` on each row and reorder on drop.
- D-42: theme picker is 3-button toggle group, language picker is 2-button toggle group. Reuse Phase 1's `<ThemeToggle />` (`src/components/ThemeToggle.tsx`) and `<LangToggle />` (`src/components/LangToggle.tsx`) verbatim — both already implement the toggle-group pattern.
- D-39: backup export / import / clear-all goes in this route (see RESEARCH §Plan-6 Example lines 1240-1323).
- Theme + Lang appear in BOTH Settings AND Nav (D-42); the components are shared.

---

### File: `src/routes/MapSettings.tsx` (NEW — `/map/:id/settings`)

| Property | Value |
|----------|-------|
| Role | Route component |
| Data flow | Read result; edit subject + scale override + enabledCategories; save through store |
| Closest analog | v1.0 `viewMapSettings` at `public/legacy/js/app.js:3758-3850` |

**v1.0 analog (scale + category-toggle grid):**

```javascript
// public/legacy/js/app.js:3766-3823
const list = h("div", { class: "scale-editor" });
function rerenderScale() {
  const fresh = r.scale;
  list.innerHTML = "";
  fresh.forEach((s, i) => {
    const row = h("div", { class: "scale-row", style: `--c:${s.color}` },
      /* identical to global scale editor, but: */
      onInput: (e) => { fresh[i].color = e.target.value; Store.setResultScale(r.id, fresh); }
    );
    list.append(row);
  });
}

const catGrid = h("div", { class: "cat-toggle-grid" });
function renderCats() {
  catGrid.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const enabled = r.enabledCategories.includes(cat.id);
    const tile = h("button", {
      class: "cat-toggle" + (enabled ? " is-on" : ""),
      style: `--c:${cat.color}`,
      onClick: () => {
        if (enabled) r.enabledCategories = r.enabledCategories.filter(c => c !== cat.id);
        else r.enabledCategories = [...r.enabledCategories, cat.id];
        Store.saveResult(r);
        renderCats();
      },
    },
      h("span", { class: "cat-toggle-icon" }, cat.icon),
      h("span", { class: "cat-toggle-title" }, getCatTitle(cat, _mslang)),
      h("span", { class: "cat-toggle-switch" + (enabled ? " on" : "") }),
    );
    catGrid.append(tile);
  });
}
```

**Convention notes:**
- D-41: identity (subject/emoji/colour) + scale override + category toggles all in one form.
- Same scale-editor JSX as plan 7's global Settings; factor into `<ScaleEditor />` component used by both routes.
- Saves via `saveResult({ ...r, enabledCategories, scale, subject, … })`.

---

### File: `src/routes/__tests__/Settings.test.tsx`, `Settings.backup.test.tsx`, `MapSettings.test.tsx`, `src/__tests__/a11y.dialog.test.tsx`, `src/__tests__/parity.smoke.test.tsx` (NEW — Wave 0)

| Property | Value |
|----------|-------|
| Role | Test |
| Closest analog | Phase 1 DesignSystem.test.tsx |

**`parity.smoke.test.tsx` (RESEARCH §"Phase-final integration test"):**
- Walks the golden path in ONE `it()` block: create profile → answer 3 items → see result → share → import → compare → backup → clear.
- Owned by plan 7 as the final integration gate.

---

## Shared Patterns

These patterns appear across multiple files. Don't repeat them in every plan section — reference this section.

### Pattern: Store selector + action pair

**Source:** Phase 1 `src/components/ThemeToggle.tsx` lines 13-14

```typescript
const current = useStore((s) => s.settings.theme)
const setTheme = useStore((s) => s.setTheme)
```

**Apply to:** Every route + every component that reads or writes Zustand state. Anti-pattern: `useStore.getState()` inside a component render (it doesn't subscribe).

---

### Pattern: Imperative `dialog({...})` confirm flow

**Source:** v1.0 `dlgConfirm` at `public/legacy/js/app.js:485-493` → Phase 2 `dialog({...})` helper from `src/lib/dialog/dialogQueue.ts`

```typescript
const ok = await dialog<boolean>({
  title: t('confirm_delete_map_title'),
  body: <p>{t('confirm_delete_map')}</p>,
  actions: [
    { label: t('btn_cancel'), kind: 'ghost', value: false },
    { label: t('btn_delete'), kind: 'danger', value: true },
  ],
})
if (!ok) return
// proceed with destructive action
```

**Apply to:** Every destructive action (delete profile, delete result, delete import, remove scale step, clear-all-data, change-scale-when-answered). Phase 2 `dialog()` is the imperative API; declarative `<Dialog open={…} onOpenChange={…}>` is preferred for in-tree forms.

---

### Pattern: Style with `--c` accent colour

**Source:** v1.0 `profileCard` / `resultCard` / `cat-overview-tile` — all use `style={\`--c:\${color}\`}`

```tsx
<div style={{ '--c': profile.color } as React.CSSProperties} className="profile-card">
  …
</div>
```

**Apply to:** Profile cards, result cards, category tiles, import cards, scale-editor rows, compare picker chips. The CSS class consumes `--c` to colour borders / left bars / icon badges.

---

### Pattern: Page wrapper + back button

**Source:** v1.0 every leaf view; e.g. `public/legacy/js/app.js:3325`

```javascript
h("button", { class: "btn btn-ghost", onClick: () => navigate(`/result/${resultId}`) }, t("btn_back"))
```

**React port:**

```tsx
const navigate = useNavigate()
// at top of page:
<Button variant="ghost" onClick={() => navigate(-1)}>{t('btn_back')}</Button>
```

**Apply to:** Share / Import / Profile detail / MapSettings / Result. v1.0 uses an absolute `navigate('/result/...')`; React Router's `navigate(-1)` is cleaner (one back step) — planner may use either, but `navigate(-1)` keeps history honest.

---

### Pattern: Test with fresh store

**Source:** Phase 1 `src/__tests__/DesignSystem.test.tsx` lines 12-39

```typescript
class MemoryLocalStorage {
  private store = new Map<string, string>()
  getItem(k: string): string | null { return this.store.has(k) ? (this.store.get(k) as string) : null }
  setItem(k: string, v: string): void { this.store.set(k, String(v)) }
  removeItem(k: string): void { this.store.delete(k) }
  clear(): void { this.store.clear() }
  get length(): number { return this.store.size }
  key(i: number): string | null { return Array.from(this.store.keys())[i] ?? null }
}

async function renderFreshThing() {
  vi.resetModules()
  vi.stubGlobal('localStorage', new MemoryLocalStorage())
  const mod = await import('@/routes/Thing')
  return render(<mod.Thing />)
}
```

**Apply to:** Every test that exercises `useStore` or reads/writes localStorage. Reuse this `MemoryLocalStorage` class verbatim — Phase 2 should NOT redefine it per test file. Factor into `tests/helpers/MemoryLocalStorage.ts` early in plan 1.

---

### Pattern: i18n key append + DE mirror

**Source:** Phase 1 `src/lib/i18n/en.ts` lines 7-15 + `src/lib/i18n/de.ts` (mirror)

```typescript
// en.ts
export const EN = {
  // … existing keys
  nav_compare: '📊 Results/Compare',
  compare_too_many_truncated: 'Showing first 4 comparisons. {n} were omitted.',
} as const

// de.ts must mirror — typed Record<TranslationKey, string> enforces this
export const DE: Record<TranslationKey, string> = {
  // … existing keys
  nav_compare: '📊 Ergebnisse/Vergleich',
  compare_too_many_truncated: 'Erste 4 Vergleiche angezeigt. {n} wurden weggelassen.',
}
```

**Apply to:** Every new user-facing string. Order: add to en.ts, run `pnpm typecheck`, the TS error tells you exactly which DE key is missing, mirror it.

---

### Pattern: shadcn primitive component composition

**Source:** Phase 1 `src/components/ui/button.tsx` (the pattern) + shadcn docs

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('title')}</DialogTitle>
    </DialogHeader>
    {/* body */}
  </DialogContent>
</Dialog>
```

**Apply to:** Every shadcn primitive (`Dialog`, `AlertDialog`, `Sheet`, `Popover`, `Tabs`) — use the auto-vendored sub-components, don't reach into Radix directly. `data-state` attributes on the root element drive Tailwind variants (`data-[state=open]:bg-accent`).

---

### Pattern: Reduced-motion gate

**Source:** Phase 1 `src/styles/animations.css` (global media-query gate) + `src/lib/hooks/useReducedMotion.ts` (plan 2)

```typescript
const reduced = useReducedMotion()
// In the component:
<div className={reduced ? '' : 'motion-safe:transition-transform motion-safe:duration-200'}>
  …
</div>
```

**Apply to:** Single-card peek animations (D-32), wizard step transitions (D-23), enlarged-spider modal entry. Tailwind's `motion-safe:` / `motion-reduce:` variants are the second line of defence — the JS `reduced` flag is the first line (it controls whether `data-state="entering"` is even set).

---

### Pattern: XSS-safe label rendering

**Source:** D-05; React's default text-node escaping

```tsx
// BAD — v1.0 inline HTML, never do this with user data:
<text dangerouslySetInnerHTML={{ __html: ds.name }} />

// GOOD — React text node escapes automatically:
<text>{ds.name}</text>
```

**Apply to:** Every chart label, every user-facing rendering of profile name / subject / custom item name / scale label. The `<TranslatedText k={...} />` helper from D-12 is the only escape hatch, and only for i18n keys in the `RICH_TEXT_KEYS` allow-list.

---

## Per-File Pattern Index (quick lookup)

| File | Plan | Closest analog | Key conventions |
|------|------|-----------------|-----------------|
| `src/router.tsx` (modified) | 1 | `app.js:853-884` | Extend route table; one root + 15 children |
| `src/App.tsx` (modified) | 1 | Phase 1 self | Wrap with `<ThemeProvider>` + `<I18nProvider>` |
| `src/routes/RootLayout.tsx` | 1 | `app.js:836-851` | Persistent shell + `<Outlet />` |
| `src/hooks/useScrollToTop.ts` | 1 | Phase 1 `useTheme.ts` | useEffect on location |
| `src/components/Nav.tsx` | 1 | `app.js:942-984` | `<NavLink>` + shadcn `Sheet` mobile |
| `src/components/ProfilePicker.tsx` | 1 | `app.js:1478-1490` | shadcn `Popover` host |
| `src/lib/i18n/en.ts` + `de.ts` (modified) | 1-7 | `i18n.js:5-786` | Append keys per plan |
| `src/components/ui/{dialog,alert-dialog,sheet,popover,tabs,sonner}.tsx` | 2 | Phase 1 `button.tsx` | `npx shadcn@latest add <name>` |
| `src/lib/dialog/dialogQueue.ts` | 2 | `app.js:379-476` | Zustand slice + `dialog()` helper |
| `src/components/DialogHost.tsx` | 2 | RESEARCH §Pattern 4 | Portal-mounted, drains queue |
| `src/lib/hooks/useToast.ts` | 2 | `app.js:510-518` | Wrap `sonner.toast` |
| `src/lib/hooks/useSwipe.ts` | 2 | `app.js:2700-2734` | `useDrag` with `axis: 'x'` |
| `src/lib/hooks/useKeydown.ts` | 2 | (no v1.0 analog) | document.keydown + cleanup |
| `src/lib/hooks/useReducedMotion.ts` | 2 | Phase 1 `useTheme` matcher pattern | matchMedia |
| `src/lib/hooks/useIsCoarsePointer.ts` | 2 | `app.js:2462` | matchMedia |
| `src/components/AgeGate.tsx` | 2 | `app.js:808-825` | AlertDialog + legacy localStorage migration |
| `src/components/WizardHost.tsx` | 2 | `app.js:728-806` | useReducer + WIZARD_STEPS config |
| `src/lib/hooks/useFormError.ts` | 2 | D-19 (no v1.0 analog) | aria-invalid + describedby |
| `src/routes/Welcome.tsx` | 3 | `app.js:1399-1448` | Hero + features + how-to + CTA |
| `src/routes/Home.tsx` | 3 | `app.js:987-1025` | Profile + import grids |
| `src/routes/ProfileEdit.tsx` | 3 | `app.js:1517-1563` | Controlled form |
| `src/routes/ProfileDetail.tsx` | 3 | `app.js:1564-1589` | Header + results list |
| `src/routes/Intro.tsx` | 3 | `app.js:3895-3917` | Long-form prose, `RICH_TEXT_KEYS` |
| `src/components/EmojiPicker.tsx` | 3 | `app.js:107-133` | Popover + EMOJI_BANK grid |
| `src/lib/data/emoji.ts` | 3 | `app.js:97-105` | Verbatim copy of 70+ emoji array |
| `src/routes/CategoryOverview.tsx` | 4 | `app.js:1622-1690` | Tile grid + progress bars |
| `src/routes/Questionnaire.tsx` | 4 | `app.js:2099-2107` | Mode dispatcher |
| `src/components/questionnaire/ListMode.tsx` | 4 | `app.js:2151-2240` | Item rows + custom-add |
| `src/components/questionnaire/SingleMode.tsx` | 4 | `app.js:2450-2700` | Card stack + swipe + keyboard |
| `src/components/questionnaire/ItemRow.tsx` | 4 | `app.js itemRow` (~2330) | One row per item |
| `src/components/questionnaire/QuestionnaireHeader.tsx` | 4 | `app.js qHeader` | Sticky top header |
| `src/components/questionnaire/QuestionnaireNav.tsx` | 4 | `app.js:2216-2220` | Sticky bottom action pair |
| `src/components/ScalePicker.tsx` | 4 | `app.js:262-346` | Bespoke snap-dots + drag + keyboard |
| `src/lib/hooks/useTemplateWarning.ts` | 4 | `app.js:1049-1076` | confirmIfTemplate hook |
| `src/lib/charts/math.ts` | 4 | `charts.js:11-134, 460-478` | Pure helpers ported verbatim |
| `src/routes/Result.tsx` | 5 | `app.js:2770-2821` | Header + charts + drill-down |
| `src/components/charts/Spider.tsx` | 5 | `charts.js:303-322, 137-300` | Declarative SVG |
| `src/components/charts/ItemSpider.tsx` | 5 | `charts.js:333-371` | Declarative SVG |
| `src/components/charts/CategoryBars.tsx` | 5 | `charts.js:373-422` | Bar diff JSX |
| `src/components/charts/Alignment.tsx` | 5 | `charts.js:424-458` | Top matches + biggest gaps |
| `src/components/charts/EnlargedSpider.tsx` | 5 | `app.js:2823-2836` | `<Dialog><Spider size={760}/></Dialog>` |
| `src/lib/hooks/useSpiderInteraction.ts` | 5 | `charts.js:238-297` | Active-axis state |
| `src/routes/Share.tsx` | 6 | `app.js:3282-3354` | Encrypt + textarea + download |
| `src/routes/Import.tsx` | 6 | `app.js:3359-3437` | Paste/file + decrypt + saveImport |
| `src/routes/Compare.tsx` | 6 | `app.js:3453-3544` | `?ids=` parsing + ≤4 datasets |
| `src/routes/Settings.tsx` | 7 | `app.js:3547-3756` | Scale editor + theme/lang + data mgmt |
| `src/routes/MapSettings.tsx` | 7 | `app.js:3758-3850` | Per-result subject + scale + categories |
| `src/lib/i18n/richText.ts` | 3 (Welcome / Intro) | D-12 | RICH_TEXT_KEYS allow-list |

## Type Extensions Required (`src/lib/storage/types.ts`)

The Phase 1 types are missing a few fields v1.0 uses. Plan 4 (questionnaire) or plan 2 (primitives) must add them additively (RESEARCH §Assumption A4):

```typescript
// Add to interface Result:
seededFromImportId?: string
seededFromResultId?: string
templateWarningDisabled?: boolean

// Add to interface Settings:
ageConfirmed?: boolean
wizardDone?: boolean  // (note: phase 1 already has `wizardSeen?: boolean` — choose ONE name; D-23 uses wizardDone)
```

The `wizardSeen` vs `wizardDone` collision needs a planner-level decision: keep `wizardSeen` (Phase 1's existing field, line 79) and update D-23 wording, OR rename to `wizardDone` and add the migration. **Recommendation:** keep `wizardSeen` (already persisted) and treat D-23's `wizardDone` wording as synonymous.

## No Analog Found

| File | Role | Why no analog |
|------|------|---------------|
| `src/lib/hooks/useFormError.ts` | Hook | NEW pattern from D-19 — no v1.0 forms standardise this. Use Phase 1 `useTheme.ts` shape as the idiom skeleton. |
| `src/lib/i18n/richText.ts` | Lib | NEW allow-list pattern (D-12). RESEARCH §Pattern 12 is the spec. |
| Test helpers (`tests/helpers/MemoryLocalStorage.ts`) | Test helper | Phase 1 inlines this in `src/__tests__/DesignSystem.test.tsx` — Phase 2 should factor it out. |

## Metadata

**Analog search scope:**
- Phase 1: every file in `src/` (39 files, all read)
- v1.0: `public/legacy/js/app.js` (3917 lines, every `viewX` + helper) + `public/legacy/js/charts.js` (478 lines, all renderers) + `public/legacy/js/i18n.js:1-90` (key shape) + `public/legacy/js/storage.js` (already mapped in Phase 1)
- Planning docs: `.planning/codebase/CONVENTIONS.md`, `.planning/phases/02-parity/02-CONTEXT.md`, `.planning/phases/02-parity/02-RESEARCH.md`

**Files scanned:** ~50

**Pattern extraction date:** 2026-05-15
