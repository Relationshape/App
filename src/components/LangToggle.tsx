// src/components/LangToggle.tsx
// Joined segmented control for language (Settings page) built on RsSegmented.
// Full language names ("English", "Deutsch") — the compact 2-letter dropdown
// lives in the nav (RsLangDropdown). State source-of-truth = Zustand
// settings.lang; the store action calls i18n.setLang so the module-level
// _lang stays in sync.

import { useStore } from '@/lib/storage/store'
import type { Settings } from '@/lib/storage/types'
import { availableLangs, getLang } from '@/lib/i18n/i18n'
import { RsSegmented } from './RsSegmented'

type Lang = NonNullable<Settings['lang']>

export function LangToggle() {
  const current = useStore((s) => s.settings.lang ?? getLang())
  const setLang = useStore((s) => s.setLang)
  return (
    <RsSegmented<Lang>
      ariaLabel="Language"
      testId="lang-toggle"
      value={current}
      onChange={setLang}
      options={availableLangs().map(({ code, label }) => ({
        value: code,
        label,
        ariaLabel: label,
        testId: `lang-toggle-${code}`,
      }))}
    />
  )
}
