// src/components/ThemeToggle.tsx
// D-28: shadcn Button is the only primitive in Phase 1. Three-way toggle: auto / light / dark.
// State source-of-truth = Zustand settings.theme; the useTheme() hook (called in App.tsx)
// applies data-theme to <html> reactively.

import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/storage/store'
import type { Settings } from '@/lib/storage/types'

const OPTIONS: ReadonlyArray<Settings['theme']> = ['auto', 'light', 'dark']

export function ThemeToggle() {
  const current = useStore((s) => s.settings.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <div role="group" aria-label="Theme" className="inline-flex gap-2">
      {OPTIONS.map((opt) => (
        <Button
          key={opt}
          variant={current === opt ? 'default' : 'outline'}
          size="sm"
          aria-pressed={current === opt}
          onClick={() => setTheme(opt)}
          data-testid={`theme-toggle-${opt}`}
        >
          {opt}
        </Button>
      ))}
    </div>
  )
}
