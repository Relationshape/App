// src/components/ThemeToggle.tsx
// Three-way joined segmented control (auto / light / dark) built on RsSegmented.
// Labels come from i18n (theme_auto / theme_light / theme_dark) so the leading
// emoji icons stay localized. State source-of-truth = Zustand settings.theme;
// the useTheme() hook (called in App.tsx) applies data-theme to <html>.

import { useStore } from '@/lib/storage/store'
import type { Settings } from '@/lib/storage/types'
import { RsSegmented } from './RsSegmented'
import { t } from '@/lib/i18n/i18n'

type ThemeOpt = NonNullable<Settings['theme']>

export function ThemeToggle() {
  const current = useStore((s) => s.settings.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <RsSegmented<ThemeOpt>
      ariaLabel="Theme"
      value={current}
      onChange={setTheme}
      options={[
        { value: 'auto',  label: t('theme_auto'),  testId: 'theme-toggle-auto' },
        { value: 'light', label: t('theme_light'), testId: 'theme-toggle-light' },
        { value: 'dark',  label: t('theme_dark'),  testId: 'theme-toggle-dark' },
      ]}
    />
  )
}
