// src/components/LangToggle.tsx
// Legacy parity: language picker uses the same .theme-picker / .theme-pick
// segmented style as ThemeToggle (mirrors public/legacy/js/app.js langRow).
// Full language names ("English", "Deutsch") — the compact 2-letter dropdown
// lives in the nav (RsLangDropdown). State source-of-truth = Zustand
// settings.lang; the store action calls i18n.setLang so the module-level
// _lang stays in sync.

import { useStore } from '@/lib/storage/store'
import type { Settings } from '@/lib/storage/types'
import { availableLangs } from '@/lib/i18n/i18n'

type Lang = NonNullable<Settings['lang']>

export function LangToggle() {
  const current = useStore((s) => s.settings.lang ?? 'en')
  const setLang = useStore((s) => s.setLang)
  return (
    <div
      role="group"
      aria-label="Language"
      className="theme-picker"
      data-testid="lang-toggle"
    >
      {availableLangs().map(({ code, label }) => {
        const on = current === code
        return (
          <button
            key={code}
            type="button"
            className={'theme-pick' + (on ? ' is-on' : '')}
            aria-pressed={on}
            aria-label={label}
            onClick={() => setLang(code as Lang)}
            data-testid={`lang-toggle-${code}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
