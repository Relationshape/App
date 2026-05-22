// Modal showing category grid for an imported result.

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { mapImportToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import { fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'
import type { Import } from '@/lib/storage/types'
import type { ResolvedCat } from '@/lib/data/customCategories'

type CategoryDef = (typeof CATEGORIES)[number]

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  imp: Import
}

export function ImportViewModal({ open, onOpenChange, imp }: Props) {
  const [selectedCat, setSelectedCat] = useState<CategoryDef | ResolvedCat | null>(null)

  const dataset = mapImportToDataset(imp)
  const datasets = [dataset]

  const enabledIds = imp.enabledCategories ?? CATEGORIES.map((c) => c.id)
  const enabledCats = enabledIds
    .map((id) => resolveAnyCat(id, imp.customCategories, []))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const title = (imp.subject?.trim() || imp.name?.trim() || 'Imported result') +
    ((imp.version ?? 1) > 1 ? ` (v${imp.version})` : '')

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
        <DialogContent
          className="max-w-[min(820px,96vw)] max-h-[min(90vh,900px)] p-0 overflow-hidden flex flex-col gap-0"
          style={{ ['--c' as 'color']: dataset.color } as React.CSSProperties}
          showCloseButton={false}
          data-testid="import-view-modal"
          onInteractOutside={() => onOpenChange(false)}
        >
          <div className="cat-modal-head-row">
            <div className="cat-modal-icon-wrap">
              <span className="cat-modal-icon" style={{ fontSize: '1.6rem' }} aria-hidden="true">
                {imp.emoji || '📨'}
              </span>
              <div>
                <DialogTitle asChild>
                  <h2 className="cat-modal-title">{title}</h2>
                </DialogTitle>
                <p className="muted small">
                  {`${imp.name?.trim() || ''} · ${t('imported_on')} ${fmtDate(imp.importedAt)}`}
                </p>
              </div>
            </div>
          </div>

          <div
            className="cat-modal-bars-scroll cat-modal-content"
            role="tabpanel"
            data-testid="import-view-modal-panel-cats"
          >
            <div className="cat-grid">
              {enabledCats.map((cat) => (
                <RsCategoryCard
                  key={cat.id}
                  cat={cat}
                  datasets={datasets}
                  editableResult={null}
                  fabiMode={true}
                  onClick={() => setSelectedCat(cat)}
                  testId={`import-view-modal-cat-${cat.id}`}
                />
              ))}
            </div>
          </div>

          <div className="rs-modal-actions" style={{ borderTop: '1px solid var(--glass-border)', padding: '12px 24px 16px', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onOpenChange(false)}
              data-testid="import-view-modal-close"
            >
              {t('btn_close')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CategoryModal
        open={selectedCat !== null}
        onOpenChange={(o) => { if (!o) setSelectedCat(null) }}
        datasets={datasets}
        cat={selectedCat}
        result={null}
      />
    </>
  )
}
