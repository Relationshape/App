// LangToggle — v1.0-style dropdown picker (matches public/legacy/js/app.js
// buildLangPicker). Uses the legacy .nav-lang / .nav-lang-btn / .nav-lang-dropdown
// / .nav-lang-option classes from src/styles/legacy-components.css, so the look
// is the floating "DE ▾" button + dropdown shown in the v1.0 floating nav.
//
// State source-of-truth = Zustand settings.lang; the store action calls
// i18n.setLang so the module-level _lang stays in sync (D-06).

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/storage/store'
import type { Settings } from '@/lib/storage/types'
import { availableLangs } from '@/lib/i18n/i18n'

type Lang = NonNullable<Settings['lang']>

export function LangToggle() {
  const current = useStore((s) => s.settings.lang ?? 'en')
  const setLang = useStore((s) => s.setLang)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const langs = availableLangs()
  return (
    <div
      ref={wrapRef}
      className={`nav-lang${open ? ' open' : ''}`}
      data-testid="lang-toggle"
    >
      <button
        type="button"
        className="nav-lang-btn"
        aria-label="Language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        data-testid="lang-toggle-button"
      >
        {current.toUpperCase()}
        <span className="lang-arrow" aria-hidden="true">▾</span>
      </button>
      <div className="nav-lang-dropdown" role="listbox" aria-label="Language">
        {langs.map(({ code, label }) => {
          const active = current === code
          return (
            <button
              key={code}
              type="button"
              className={`nav-lang-option${active ? ' active' : ''}`}
              role="option"
              aria-selected={active}
              onClick={() => { setLang(code as Lang); setOpen(false) }}
              data-testid={`lang-toggle-${code}`}
            >
              {label}
              <span className="lang-check" aria-hidden="true">✓</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
