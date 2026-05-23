// Result overview modal: Category grid only (spider + edit tabs removed).
// Opened from ResultCard instead of navigating to /result/:id.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { mapResultToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import { countAnswers, fmtDate } from '@/lib/format/date'
import { t, getLang } from '@/lib/i18n/i18n'
import { useToast } from '@/lib/hooks/useToast'
import type { Result, Profile } from '@/lib/storage/types'

type CategoryDef = (typeof CATEGORIES)[number]

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  result: Result
  profile: Profile
}

export function ResultModal({ open, onOpenChange, result, profile }: Props) {
  const [selectedCat, setSelectedCat] = useState<CategoryDef | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const fabiMode = true
  const navigate = useNavigate()
  const { toast } = useToast()

  const dataset = mapResultToDataset(result, profile)
  const datasets = [dataset]

  const enabledCats = result.enabledCategories
    ? CATEGORIES.filter((c) => result.enabledCategories!.includes(c.id))
    : CATEGORIES

  function openCat(cat: CategoryDef) {
    setSelectedCat(cat)
  }

  function handleClose() {
    onOpenChange(false)
  }

  async function handlePdfReport() {
    if (generatingPdf) return
    setGeneratingPdf(true)
    toast.message(t('pdf_generating'))
    try {
      const { generatePdfReport } = await import('@/lib/pdf/generateReport')
      const allCatIds = Array.from(new Set([
        ...(result.enabledCategories ?? CATEGORIES.map((c) => c.id)),
        ...(result.customCategories ?? []).map((c) => c.id),
      ]))
      const subject = result.subject?.trim()
      const mapName = subject || profile.name
      const safeFilename = `relationshapes-${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      const ok = await generatePdfReport({
        datasets: [dataset],
        categoryIds: allCatIds,
        lang: getLang(),
        filename: safeFilename,
      })
      if (!ok) toast.message(t('pdf_no_answers'))
    } finally {
      setGeneratingPdf(false)
    }
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

          {/* Category grid */}
          <div
            className="cat-modal-bars-scroll cat-modal-content"
            role="tabpanel"
            data-testid="result-modal-panel-cats"
          >
            <div className="cat-grid">
              {enabledCats.map((cat) => (
                <RsCategoryCard
                  key={cat.id}
                  cat={cat}
                  datasets={datasets}
                  editableResult={result}
                  fabiMode={fabiMode}
                  onClick={() => openCat(cat)}
                  testId={`result-modal-cat-${cat.id}`}
                />
              ))}
            </div>
          </div>

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
              className="btn btn-outline"
              onClick={() => { void handlePdfReport() }}
              disabled={generatingPdf}
              data-testid="result-modal-pdf"
            >
              {t('btn_pdf_report')}
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
        onOpenChange={(o) => {
          if (!o) {
            setSelectedCat(null)
            handleClose()
            navigate(`/result/${result.id}`)
          }
        }}
        datasets={datasets}
        cat={selectedCat}
        result={result}
      />
    </>
  )
}
