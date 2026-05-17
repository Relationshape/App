// src/components/RsLangDropdown.tsx
// Compact native-<select> language switcher — used in the top nav so the bar
// stays narrow when more languages get added. Settings uses the segmented
// LangToggle instead (full button-per-language for direct discoverability).
// State source-of-truth = Zustand settings.lang; the store action calls
// i18n.setLang so the module-level _lang stays in sync.

import { useStore } from '@/lib/storage/store'
import type { Settings } from '@/lib/storage/types'
import { availableLangs, getLang } from '@/lib/i18n/i18n'

type Lang = NonNullable<Settings['lang']>

export function RsLangDropdown() {
  const current = useStore((s) => s.settings.lang ?? getLang())
  const setLang = useStore((s) => s.setLang)
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">Language</span>
      <select
        value={current}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="rounded border border-line bg-surface px-2 py-1 text-text"
        data-testid="lang-dropdown"
        aria-label="Language"
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
