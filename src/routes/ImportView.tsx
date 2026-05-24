// Full-page read-only view for an imported result.
// Shows the same spider + category grid experience as Result.tsx but with no edit actions.

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { mapImportToDataset } from '@/lib/charts/datasets'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import { fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'
import type { ResolvedCat } from '@/lib/data/customCategories'

type CategoryDef = (typeof CATEGORIES)[number]

export function ImportView() {
  const { importId } = useParams<{ importId: string }>()
  const navigate = useNavigate()
  const imp = useStore((s) => (importId ? s.imports.find((i) => i.id === importId) ?? null : null))

  const [modalCat, setModalCat] = useState<ResolvedCat | CategoryDef | null>(null)

  if (!imp) {
    navigate('/')
    return null
  }

  const dataset = mapImportToDataset(imp)
  const datasets = [dataset]

  const enabledIds = imp.enabledCategories ?? CATEGORIES.map((c) => c.id)
  const enabledCats = enabledIds
    .map((id) => resolveAnyCat(id, imp.customCategories, []))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const v = (imp.version ?? 1) > 1 ? ` (v${imp.version})` : ''
  const title = (imp.subject?.trim() || imp.name?.trim() || 'Imported result') + v

  return (
    <section className="page" data-testid="import-view-page">
      <header
        className="result-head"
        style={{ ['--c' as 'color']: dataset.color } as React.CSSProperties}
      >
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          data-testid="import-view-back"
          className="result-back-btn"
        >
          {t('btn_back')}
        </Button>
        <div className="li-avatar text-3xl">{imp.emoji || '📨'}</div>
        <div className="result-head-info">
          <h1 data-testid="import-view-title">{title}</h1>
          <p className="muted small" data-testid="import-view-subtitle">
            {`${imp.name?.trim() || ''} · ${t('imported_on')} ${fmtDate(imp.importedAt)}`}
          </p>
        </div>
      </header>

      <section className="page-section" data-testid="import-view-cat-grid-section">
        <header className="section-head">
          <h2>{t('by_category')}</h2>
        </header>
        <div className="cat-grid">
          {enabledCats.map((cat) => (
            <RsCategoryCard
              key={cat.id}
              cat={cat}
              datasets={datasets}
              editableResult={null}
              fabiMode={false}
              onClick={() => setModalCat(cat)}
              testId={`import-view-cat-${cat.id}`}
            />
          ))}
        </div>
      </section>

      <CategoryModal
        open={modalCat !== null}
        onOpenChange={(open) => { if (!open) setModalCat(null) }}
        datasets={datasets}
        cat={modalCat}
        result={null}
      />
    </section>
  )
}
