// Result overview modal with 3 tabs: Spider chart, Category grid, Edit categories.
// Opened from ResultCard instead of navigating to /result/:id.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Spider } from '@/components/charts/Spider'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { mapResultToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import { useStore } from '@/lib/storage/store'
import { countAnswers, fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'
import type { Result, Profile } from '@/lib/storage/types'

type ModalTab = 'spider' | 'cats' | 'edit'
type CategoryDef = (typeof CATEGORIES)[number]

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  result: Result
  profile: Profile
}

export function ResultModal({ open, onOpenChange, result, profile }: Props) {
  const [tab, setTab] = useState<ModalTab>('spider')
  const [selectedCat, setSelectedCat] = useState<CategoryDef | null>(null)
  const [catInitialTab, setCatInitialTab] = useState<'spider' | 'edit'>('spider')
  const fabiMode = useStore((s) => s.settings.fabiMode ?? false)
  const navigate = useNavigate()

  const dataset = mapResultToDataset(result, profile)
  const datasets = [dataset]

  const enabledCats = result.enabledCategories
    ? CATEGORIES.filter((c) => result.enabledCategories!.includes(c.id))
    : CATEGORIES

  function openCat(cat: CategoryDef, initialTab: 'spider' | 'edit') {
    setCatInitialTab(initialTab)
    setSelectedCat(cat)
  }

  function handleClose() {
    setTab('spider')
    onOpenChange(false)
  }

  const title =
    (result.subject || profile.name) +
    ((result.version ?? 1) > 1 ? ` (v${result.version})` : '')

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent
          className="max-w-[min(820px,96vw)] max-h-[min(90vh,900px)] p-0 overflow-hidden flex flex-col gap-0"
          style={{ ['--c' as 'color']: dataset.color } as React.CSSProperties}
          showCloseButton={false}
          data-testid="result-modal"
          onInteractOutside={() => handleClose()}
        >
          {/* Header */}
          <div className="cat-modal-head-row">
            <div className="cat-modal-icon-wrap">
              <span className="cat-modal-icon" style={{ fontSize: '1.6rem' }} aria-hidden="true">
                {dataset.emoji}
              </span>
              <div>
                <DialogTitle asChild>
                  <h2 className="cat-modal-title">{title}</h2>
                </DialogTitle>
                <p className="muted small">
                  {`${profile.emoji} ${profile.name} · ${countAnswers(result)} ${t('answers')} · ${t('result_last_edited')} ${fmtDate(result.updatedAt)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="cat-modal-tabs" role="tablist">
            {(['spider', 'cats', 'edit'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`cat-modal-tab${tab === key ? ' active' : ''}`}
                onClick={() => setTab(key)}
                data-testid={`result-modal-tab-${key}`}
              >
                {key === 'spider' ? t('tab_spider') : key === 'cats' ? t('tab_categories') : t('tab_edit')}
              </button>
            ))}
          </div>

          {/* Tab content: Spider */}
          {tab === 'spider' && (
            <div
              className="cat-modal-spider cat-modal-content"
              role="tabpanel"
              data-testid="result-modal-panel-spider"
            >
              <Spider datasets={datasets} size={500} />
            </div>
          )}

          {/* Tab content: Categories / Edit — same category grid, different click target */}
          {(tab === 'cats' || tab === 'edit') && (
            <div
              className="cat-modal-bars-scroll cat-modal-content"
              role="tabpanel"
              data-testid={`result-modal-panel-${tab}`}
            >
              <div className="cat-grid">
                {enabledCats.map((cat) => (
                  <RsCategoryCard
                    key={cat.id}
                    cat={cat}
                    datasets={datasets}
                    editableResult={result}
                    fabiMode={fabiMode}
                    onClick={() => openCat(cat, tab === 'edit' ? 'edit' : 'spider')}
                    testId={`result-modal-cat-${cat.id}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="rs-modal-actions" style={{ borderTop: '1px solid var(--glass-border)', padding: '12px 24px 16px', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              data-testid="result-modal-close"
            >
              {t('btn_close')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                handleClose()
                navigate(`/q-categories/${profile.id}/${result.id}`)
              }}
              data-testid="result-modal-continue"
            >
              {t('btn_continue_editing')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CategoryModal
        open={selectedCat !== null}
        onOpenChange={(o) => { if (!o) setSelectedCat(null) }}
        datasets={datasets}
        cat={selectedCat}
        result={result}
        initialTab={catInitialTab}
      />
    </>
  )
}
