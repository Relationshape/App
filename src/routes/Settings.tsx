// SETTINGS-01/02/04 + quick-260516-fj5 (legacy parity: section-head wrappers + Fabi-Modus toggle).
// Port of public/legacy/js/app.js:3547-3756.
import { useState } from 'react'
import { useStore } from '@/lib/storage/store'
import { ScaleEditor } from '@/components/ScaleEditor'
import { DataManagement } from '@/components/DataManagement'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LangToggle } from '@/components/LangToggle'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n/i18n'
import type { MutableScaleStep } from '@/lib/data/types'

export function Settings() {
  const scale = useStore((s) => s.scale)
  const setScale = useStore((s) => s.setScale)
  const results = useStore((s) => s.results)
  const [pendingScale, setPendingScale] = useState<MutableScaleStep[] | null>(null)

  function hasData(key: string): boolean {
    for (const r of results) {
      for (const cat of Object.values(r.answers ?? {})) {
        for (const item of Object.values(cat as Record<string, unknown>)) {
          if (typeof item === 'object' && item && 'scale' in item && (item as { scale: unknown }).scale === key) return true
        }
      }
    }
    return false
  }

  return (
    <section className="page" data-testid="settings-page">
      <header className="page-head">
        <h1>{t('settings_title')}</h1>
      </header>

      {/* 1. Appearance / theme */}
      <section className="page-section" data-testid="settings-theme-section">
        <header className="section-head"><h2>{t('settings_theme_title')}</h2></header>
        <ThemeToggle />
      </section>

      {/* 2. Language */}
      <section className="page-section" data-testid="settings-lang-section">
        <header className="section-head"><h2>{t('settings_lang_title')}</h2></header>
        <LangToggle />
      </section>

      {/* 3. Default answer scale */}
      <section className="page-section" data-testid="settings-scale-section">
        <header className="section-head">
          <h2>{t('settings_scale_title')}</h2>
          <p className="muted">{t('settings_scale_sub')}</p>
        </header>
        <ScaleEditor
          scale={scale}
          onChange={(next: MutableScaleStep[]) => setPendingScale(next)}
          hasData={hasData}
        />
        {pendingScale && (
          <div className="flex gap-2 mt-3" data-testid="settings-scale-save-row">
            <Button
              onClick={() => { setScale(pendingScale); setPendingScale(null) }}
              data-testid="settings-scale-save"
            >
              {t('scale_save_btn')}
            </Button>
            <Button variant="ghost" onClick={() => setPendingScale(null)} data-testid="settings-scale-cancel">
              {t('btn_cancel')}
            </Button>
          </div>
        )}
      </section>

      {/* 5. Data management (renders its own .page-section internally) */}
      <DataManagement />
    </section>
  )
}
