// Compare detail page — category grid, PDF download, and cross-category overview modal.
// Receives ?ids= from /compare and shows the full comparison view.

import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Spider } from '@/components/charts/Spider'
import { Alignment } from '@/components/charts/Alignment'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { mapResultToDataset, mapImportToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import { categoryAverage, categoryItemAlignment } from '@/lib/charts/math'
import { resolveAnyCat } from '@/lib/data/customCategories'
import type { AnswersBlob } from '@/lib/storage/types'
import { useToast } from '@/lib/hooks/useToast'
import { dialog } from '@/lib/dialog/dialog'
import { t, getLang } from '@/lib/i18n/i18n'

import type { ResolvedCat } from '@/lib/data/customCategories'
type CategoryDef = (typeof CATEGORIES)[number]

export function CompareDetails() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const idsParam = params.get('ids')
  const rawIds = idsParam !== null ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : null
  const effectiveIds = rawIds ?? []

  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const imports = useStore((s) => s.imports)

  const [activeAxis, setActiveAxis] = useState<string | null>(null)
  const [modalCat, setModalCat] = useState<CategoryDef | ResolvedCat | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'alignment' | 'spider'>('alignment')
  const [spiderEnlarged, setSpiderEnlarged] = useState(false)

  const datasets = useMemo(() => effectiveIds.map((id) => {
    if (id.startsWith('imp:')) {
      const imp = imports.find((i) => i.id === id.slice(4))
      return imp ? mapImportToDataset(imp) : null
    }
    const r = results.find((r) => r.id === id)
    if (!r) return null
    const profile = profiles.find((p) => p.id === r.profileId) ?? null
    return mapResultToDataset(r, profile)
  }).filter((d): d is NonNullable<typeof d> => d !== null),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [effectiveIds.join(','), results, imports, profiles])

  const firstEditableResult = useMemo(() => {
    const firstResultId = effectiveIds.find((id) => !id.startsWith('imp:'))
    return firstResultId ? results.find((r) => r.id === firstResultId) ?? null : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIds.join(','), results])


  function hasItemValues(answers: AnswersBlob | undefined, catId: string): boolean {
    const slot = answers?.[catId]
    if (!slot) return false
    type Cell = { scale?: string; scaleFrac?: number; giving?: string; receiving?: string }
    for (const k of Object.keys(slot)) {
      if (k === '__custom' || k === '__hidden') continue
      const cell = slot[k] as Cell | undefined
      if (cell?.scale || cell?.giving || cell?.receiving) return true
    }
    for (const cell of Object.values(slot.__custom ?? {}) as Cell[]) {
      if (cell?.giving || cell?.receiving) return true
      if (cell?.scale && (cell.scale !== 'open' || cell.scaleFrac != null)) return true
    }
    return false
  }

  const allCatIds = useMemo(() => {
    const builtinIds = CATEGORIES.map((c) => c.id)
    const customIds = datasets.flatMap((ds) => (ds.customCategories ?? []).map((c) => c.id))
    return Array.from(new Set([...builtinIds, ...customIds]))
  }, [datasets])

  const visibleCategories = useMemo(() => {
    return allCatIds
      .map((id) => {
        const allResultCats = datasets.flatMap((ds) => ds.customCategories ?? [])
        return resolveAnyCat(id, allResultCats, [])
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .filter((cat) => datasets.length > 0 && datasets.every((ds) => hasItemValues(ds.answers, cat.id)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCatIds.join(','), datasets])

  // Axes for the 2-map spider: all visible categories where BOTH maps have numeric answers.
  // Derived from visibleCategories so it covers all categories, not just SPIDER_AXES.
  const twoMapSpiderAxes = useMemo(() => {
    if (datasets.length !== 2 || !datasets[0] || !datasets[1]) return undefined
    const [a, b] = datasets
    return visibleCategories
      .map((cat) => cat.id)
      .filter((id) =>
        categoryAverage(a.answers, id, a.scale) !== null &&
        categoryAverage(b.answers, id, b.scale) !== null
      )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasets, visibleCategories])

  // Item-granular alignment score for ALL visible categories (feeds both cards and spider labels).
  const alignmentScores = useMemo<Record<string, number | null> | undefined>(() => {
    if (datasets.length !== 2 || !datasets[0] || !datasets[1]) return undefined
    const [a, b] = datasets
    const opts = {
      customItemDefsA: a.customItemDefs,
      customItemDefsB: b.customItemDefs,
      customCatsA: a.customCategories,
      customCatsB: b.customCategories,
    }
    return Object.fromEntries(
      visibleCategories.map((cat) => [
        cat.id,
        categoryItemAlignment(a.answers, b.answers, cat.id, a.scale, b.scale, opts),
      ])
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasets, visibleCategories])

  async function handlePdfReport() {
    if (generatingPdf || datasets.length === 0) return
    const confirmed = await dialog<boolean>({
      title: t('btn_download_pdf') as string,
      body: <p>{t('pdf_compare_confirm_body')}</p>,
      actions: [
        { label: t('btn_cancel') as string, kind: 'ghost', value: false },
        { label: t('btn_generate_pdf') as string, kind: 'primary', value: true },
      ],
    })
    if (!confirmed) return
    setGeneratingPdf(true)
    toast.message(t('pdf_generating'))
    try {
      const { generatePdfReport } = await import('@/lib/pdf/generateReport')
      const categoryIds = visibleCategories.map((c) => c.id)
      const ok = await generatePdfReport({
        datasets,
        categoryIds,
        lang: getLang(),
        filename: 'relationshapes-compare.pdf',
      })
      if (!ok) toast.message(t('pdf_no_answers'))
    } finally {
      setGeneratingPdf(false)
    }
  }

  const backUrl = `/compare?ids=${effectiveIds.join(',')}`

  return (
    <section className="page" data-testid="compare-details-page">
      <header className="compare-details-head">
        <button
          type="button"
          className="btn btn-ghost compare-details-back-btn"
          onClick={() => navigate(backUrl)}
          data-testid="compare-details-back"
        >
          {t('btn_back')}
        </button>
        <div>
          <h1 className="compare-details-title">{t('cat_details_title')}</h1>
          {datasets.length > 0 && (
            <div className="compare-details-maps" aria-label="Compared maps">
              {datasets.map((ds) => (
                <span
                  key={ds.id}
                  className="compare-details-map-chip"
                  style={{ ['--c' as 'color']: ds.color } as React.CSSProperties}
                >
                  {ds.emoji} {ds.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {visibleCategories.length > 0 ? (
        <section className="page-section" data-testid="compare-details-cat-grid">
          <header className="section-head">
            <p className="muted small">{t('cat_details_filter_hint')}</p>
          </header>
          <div className="cat-grid">
            {visibleCategories.map((cat) => (
              <RsCategoryCard
                key={cat.id}
                cat={cat}
                datasets={datasets}
                editableResult={firstEditableResult}
                alignmentScore={alignmentScores?.[cat.id] ?? null}
                onClick={() => setModalCat(cat)}
                testId={`compare-details-cat-${cat.id}`}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="muted px-1 mt-4" data-testid="compare-details-empty">{t('compare_empty')}</p>
      )}

      <div className="compare-details-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => { void handlePdfReport() }}
          disabled={generatingPdf || datasets.length === 0}
          data-testid="compare-details-pdf"
        >
          {t('btn_download_pdf')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setActiveTab('alignment'); setOverviewOpen(true) }}
          disabled={datasets.length < 2}
          data-testid="compare-details-overview-btn"
        >
          {t('compare_overview_btn')}
        </button>
      </div>

      <CategoryModal
        open={modalCat !== null}
        onOpenChange={(open) => { if (!open) setModalCat(null) }}
        datasets={datasets}
        cat={modalCat}
      />

      {/* Cross-category overview modal with tabs */}
      <Dialog open={overviewOpen} onOpenChange={setOverviewOpen}>
        <DialogContent
          className="max-w-[min(860px,96vw)] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
          data-testid="compare-overview-modal"
        >
          <div className="compare-overview-modal-head">
            <DialogTitle className="compare-overview-modal-title">{t('compare_overview_btn')}</DialogTitle>
            <div className="compare-overview-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'alignment'}
                className={`compare-overview-tab${activeTab === 'alignment' ? ' compare-overview-tab--active' : ''}`}
                onClick={() => setActiveTab('alignment')}
                data-testid="compare-overview-tab-alignment"
              >
                {t('compare_tab_highlights')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'spider'}
                className={`compare-overview-tab${activeTab === 'spider' ? ' compare-overview-tab--active' : ''}`}
                onClick={() => setActiveTab('spider')}
                data-testid="compare-overview-tab-spider"
              >
                {t('compare_tab_radar')}
              </button>
            </div>
          </div>
          <div className="compare-overview-modal-body" role="tabpanel">
            {activeTab === 'alignment' && (
              <div data-testid="compare-overview-panel-alignment">
                <Alignment datasets={datasets} />
              </div>
            )}
            {activeTab === 'spider' && (
              <div data-testid="compare-overview-panel-spider">
                {datasets.length !== 2 ? (
                  <p className="muted small text-center py-8" data-testid="compare-spider-need-two">
                    {t('compare_need_two_maps')}
                  </p>
                ) : (
                  <>
                    <p className="muted small text-center mb-3" style={{ opacity: 0.75, fontSize: '0.82rem', lineHeight: 1.4 }}>
                      {t('compare_alignment_hint')}
                    </p>
                    <Spider
                      datasets={datasets}
                      {...(twoMapSpiderAxes !== undefined ? { axes: twoMapSpiderAxes } : {})}
                      {...(alignmentScores !== undefined ? { alignmentScores } : {})}
                      activeAxis={activeAxis}
                      onAxisEnter={(ax) => setActiveAxis(ax)}
                      onAxisLeave={() => setActiveAxis(null)}
                      onAxisTap={(ax) => setActiveAxis((p) => (p === ax ? null : ax))}
                      onChartTap={() => setSpiderEnlarged(true)}
                    />
                    <p className="muted small text-center mt-1" style={{ opacity: 0.65 }}>
                      {t('spider_click_to_enlarge')}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={spiderEnlarged} onOpenChange={setSpiderEnlarged}>
        <DialogContent
          className="w-[min(98vw,96vh)] max-w-none p-2 sm:p-4 flex items-center justify-center"
          data-testid="compare-spider-enlarged"
        >
          <DialogTitle className="sr-only">{t('compare_tab_radar')}</DialogTitle>
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <Spider
              datasets={datasets}
              size={1000}
              {...(twoMapSpiderAxes !== undefined ? { axes: twoMapSpiderAxes } : {})}
              {...(alignmentScores !== undefined ? { alignmentScores } : {})}
              activeAxis={activeAxis}
              onAxisEnter={(ax) => setActiveAxis(ax)}
              onAxisLeave={() => setActiveAxis(null)}
              onAxisTap={(ax) => setActiveAxis((p) => (p === ax ? null : ax))}
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
