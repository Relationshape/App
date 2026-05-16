// src/components/LangToggle.tsx
// D-14, D-28: shadcn Button is the only primitive in Phase 1. Compact segmented
// control (one button per available language) — mirrors ThemeToggle so the nav
// stays small. State source-of-truth = Zustand settings.lang; the store action
// calls i18n.setLang so the module-level _lang stays in sync.

import { Button } from '@/components/ui/button'
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
      className="inline-flex gap-1"
      data-testid="lang-toggle"
    >
      {availableLangs().map(({ code, label }) => (
        <Button
          key={code}
          variant={current === code ? 'default' : 'outline'}
          size="sm"
          aria-pressed={current === code}
          aria-label={label}
          onClick={() => setLang(code as Lang)}
          data-testid={`lang-toggle-${code}`}
          className="h-7 px-2 text-xs uppercase tracking-wide"
        >
          {code}
        </Button>
      ))}
    </div>
  )
}
