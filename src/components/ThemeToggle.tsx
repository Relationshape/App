// src/components/ThemeToggle.tsx
// Legacy parity: three-way segmented picker matching public/legacy/js/app.js
// theme-row (.theme-picker / .theme-pick / .is-on). Labels come from i18n
// (theme_auto / theme_light / theme_dark) so the emoji icons are localized
// alongside the text. State source-of-truth = Zustand settings.theme; the
// useTheme() hook (called in App.tsx) applies data-theme to <html> reactively.

import { useStore } from '@/lib/storage/store'
import type { Settings } from '@/lib/storage/types'
import { t } from '@/lib/i18n/i18n'
import type { TranslationKey } from '@/lib/i18n/en'

type ThemeOpt = NonNullable<Settings['theme']>
const OPTIONS: ReadonlyArray<{ value: ThemeOpt; labelKey: TranslationKey }> = [
  { value: 'auto',  labelKey: 'theme_auto' },
  { value: 'light', labelKey: 'theme_light' },
  { value: 'dark',  labelKey: 'theme_dark' },
]

export function ThemeToggle() {
  const current = useStore((s) => s.settings.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <div role="group" aria-label="Theme" className="theme-picker">
      {OPTIONS.map(({ value, labelKey }) => {
        const on = current === value
        return (
          <button
            key={value}
            type="button"
            className={'theme-pick' + (on ? ' is-on' : '')}
            aria-pressed={on}
            onClick={() => setTheme(value)}
            data-testid={`theme-toggle-${value}`}
          >
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}
