// src/hooks/useLang.ts
// D-14: read settings.lang from the Zustand store; expose a setLang callback
// that delegates to the store action (the store action keeps the i18n module-level
// _lang in sync via i18n.setLang).

import { useStore } from '@/lib/storage/store'
import { getLang } from '@/lib/i18n/i18n'
import type { Settings } from '@/lib/storage/types'

type Lang = NonNullable<Settings['lang']>

interface UseLangReturn {
  lang: Lang
  setLang: (next: Lang) => void
}

export function useLang(): UseLangReturn {
  const lang = useStore((s) => s.settings.lang ?? getLang())
  const setLang = useStore((s) => s.setLang)
  return { lang, setLang }
}
