// Quick task 260516-ex7. Per-category modal with Spider + Items tabs.
// Port of public/legacy/js/app.js:2879-3050 openCategoryModal — minus the Edit-answers
// tab (out of scope for this task; tracked separately).
//
// Built on shadcn Dialog (consistent with EnlargedSpider). Layered on top with the
// legacy `cat-modal-*` classes from src/styles/legacy-components.css. The shadcn
// default close-X is hidden because the layout uses a header row + footer button,
// and the X would overlap the cat-modal-head-row.

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ItemSpider } from './ItemSpider'
import { CategoryBars } from './CategoryBars'
import type { ChartDataset } from './types'
import type { CATEGORIES } from '@/lib/data/data'
import { t, getLang } from '@/lib/i18n/i18n'

type CategoryDef = (typeof CATEGORIES)[number]

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  datasets: readonly ChartDataset[]
  cat: CategoryDef | null
}

export function CategoryModal({ open, onOpenChange, datasets, cat }: Props) {
  const [tab, setTab] = useState<'spider' | 'items'>('spider')
  const lang = getLang()

  // Render the Dialog regardless so Radix gets a chance to animate close,
  // but the body short-circuits when no category is selected.
  if (!cat) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[min(820px,96vw)] max-h-[min(90vh,900px)] p-0 overflow-hidden flex flex-col gap-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Category</DialogTitle>
        </DialogContent>
      </Dialog>
    )
  }

  const title = lang === 'de' && cat.de ? cat.de : cat.title
  const blurb = lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(820px,96vw)] max-h-[min(90vh,900px)] p-0 overflow-hidden flex flex-col gap-0"
        style={{ ['--c' as 'color']: cat.color } as React.CSSProperties}
        showCloseButton={false}
        data-testid="category-modal"
      >
        {/* Header row — icon + title + blurb. Uses --c (cat color) for the icon tint. */}
        <div className="cat-modal-head-row">
          <div className="cat-modal-icon-wrap">
            <span className="cat-modal-icon" aria-hidden="true">{cat.icon}</span>
            <div>
              <DialogTitle asChild>
                <h2 className="cat-modal-title">{title}</h2>
              </DialogTitle>
              <p className="muted small">{blurb}</p>
            </div>
          </div>
        </div>

        {/* Tab bar — Spider | Items. Edit tab intentionally omitted (out of scope). */}
        <div className="cat-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'spider'}
            className={`cat-modal-tab${tab === 'spider' ? ' active' : ''}`}
            onClick={() => setTab('spider')}
            data-testid="cat-modal-tab-spider"
          >
            {t('tab_spider')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'items'}
            className={`cat-modal-tab${tab === 'items' ? ' active' : ''}`}
            onClick={() => setTab('items')}
            data-testid="cat-modal-tab-items"
          >
            {t('tab_items')}
          </button>
        </div>

        {/* Tab content — scrolls vertically inside the modal. */}
        {tab === 'spider' ? (
          <div
            className="cat-modal-spider cat-modal-content"
            role="tabpanel"
            data-testid="cat-modal-panel-spider"
          >
            <ItemSpider datasets={datasets} catId={cat.id} size={520} />
          </div>
        ) : (
          <div
            className="cat-modal-bars-scroll cat-modal-content"
            role="tabpanel"
            data-testid="cat-modal-panel-items"
          >
            <CategoryBars datasets={datasets} catId={cat.id} />
          </div>
        )}

        {/* Footer actions. Save button intentionally omitted (no Edit tab). */}
        <div className="rs-modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onOpenChange(false)}
            data-testid="cat-modal-close"
          >
            {t('btn_close')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
