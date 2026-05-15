// src/components/LangToggle.tsx
// D-14, D-28: plain <select> in Phase 1 (only Button is a shadcn primitive).
// State source-of-truth = Zustand settings.lang; the store action calls i18n.setLang
// so the module-level _lang stays in sync.

import { useStore } from '@/lib/storage/store'
import type { Settings } from '@/lib/storage/types'
import { availableLangs } from '@/lib/i18n/i18n'

type Lang = NonNullable<Settings['lang']>

export function LangToggle() {
  const current = useStore((s) => s.settings.lang ?? 'en')
  const setLang = useStore((s) => s.setLang)
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span>Language</span>
      <select
        value={current}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="rounded border border-line bg-surface px-2 py-1 text-text"
        data-testid="lang-toggle"
      >
        {availableLangs().map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
