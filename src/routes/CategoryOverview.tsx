// QUEST-01. Port of public/legacy/js/app.js:1622-1690.
// Category overview tile grid for the active enabledCategories list. Tile click
// jumps into the questionnaire at that category (legacy behaviour); category
// selection is managed through the modal RsCategoryPicker (quick task 260516-qva).

import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import { catProgress } from '@/lib/charts/math'
import { mapResultToDataset } from '@/lib/charts/datasets'
import { Button } from '@/components/ui/button'
import { RsTile } from '@/components/RsTile'
import { RsCategoryPicker, applyPendingItems, type PendingItemsByCat } from '@/components/RsCategoryPicker'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { ResultModal } from '@/components/ResultModal'
import { NewMapWizard } from '@/components/NewMapWizard'
import { dialog } from '@/lib/dialog/dialog'
import { useToast } from '@/lib/hooks/useToast'
import { t, getLang } from '@/lib/i18n/i18n'
import { useShareData } from '@/components/providers/ShareDataProvider'
import type { CustomCategoryDef } from '@/lib/storage/types'
import {
  Dialog, DialogContent, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

export function CategoryOverview() {
  const { profileId, resultId } = useParams<{ profileId: string; resultId: string }>()
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const allResults = useStore((s) => s.results)
  const saveResult = useStore((s) => s.saveResult)
  const updateProfile = useStore((s) => s.updateProfile)
  const lang = getLang()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [preShareOpen, setPreShareOpen] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [renamingSubject, setRenamingSubject] = useState(false)
  const [subjectDraft, setSubjectDraft] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const resultsOpen = searchParams.get('results') === '1'
  const { openShareTemplate } = useShareData()
  const { toast } = useToast()

  const profile = profileId ? profiles.find((p) => p.id === profileId) ?? null : null
  const result = allResults.find((r) => r.id === resultId) ?? null

  // All hooks MUST be declared before any early returns (Rules of Hooks).

  useEffect(() => {
    if (!profile) navigate('/')
  }, [profile, navigate])

  useEffect(() => {
    if (profile && !result && resultId !== 'new') navigate(`/profile/${profile.id}`)
  }, [result, resultId, profile, navigate])

  const enabledIds = useMemo(
    () => result?.enabledCategories ?? CATEGORIES.map((c) => c.id),
    [result?.enabledCategories],
  )
  const enabledCats = useMemo(
    () =>
      enabledIds
        .map((id) => resolveAnyCat(id, result?.customCategories, profile?.customCategories))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [enabledIds, result?.customCategories, profile?.customCategories],
  )

  const hasAnswers = useMemo(() => {
    if (!result) return false
    return Object.values(result.answers).some((cat) => {
      const hasBase = Object.entries(cat).some(([k, v]) =>
        k !== '__hidden' && k !== '__custom' && v !== null && typeof v === 'object' && 'scale' in (v as object)
      )
      const hasCustom = Object.values(cat.__custom ?? {}).some(
        (cell) => cell?.scale && (cell.scale !== 'open' || cell.scaleFrac != null),
      )
      return hasBase || hasCustom
    })
  }, [result?.answers])

  if (!profile) return null
  if (resultId === 'new') return <NewMapWizard profile={profile} />
  if (!result) return null

  const catParam = searchParams.get('cat')
  const overviewModalCat = catParam
    ? resolveAnyCat(catParam, result.customCategories, profile.customCategories) ?? null
    : null
  const overviewDataset = mapResultToDataset(result, profile)

  function closeOverviewModal() {
    const next = new URLSearchParams(searchParams)
    next.delete('cat')
    setSearchParams(next, { replace: true })
  }

  function startQuestionnaire() {
    navigate(`/q/${profile!.id}/${result!.id}`)
  }

  function handleStartClick() {
    if (!hasAnswers) {
      setPreShareOpen(true)
    } else {
      startQuestionnaire()
    }
  }

  function openCategory(catId: string) {
    const idx = enabledCats.findIndex((c) => c.id === catId)
    saveResult({
      ...result!,
      progress: { ...(result!.progress ?? { mode: 'list' }), catIndex: idx >= 0 ? idx : 0 },
    })
    navigate(`/q/${profile!.id}/${result!.id}`)
  }

  function startRename() {
    setSubjectDraft(result?.subject ?? '')
    setRenamingSubject(true)
  }

  function commitRename() {
    if (!result) return
    const next = subjectDraft.trim()
    saveResult({ ...result, ...(next ? { subject: next } : {}), updatedAt: Date.now() })
    setRenamingSubject(false)
  }

  async function handleRemoveCat(catId: string) {
    if (!result) return
    const confirmed = await dialog<boolean>({
      title: t('cat_remove_title') as string,
      body: <p>{t('cat_remove_body')}</p>,
      actions: [
        { label: t('btn_cancel') as string, kind: 'ghost', value: false },
        { label: t('btn_remove_cat') as string, kind: 'danger', value: true },
      ],
    })
    if (!confirmed) return
    const newEnabled = (result.enabledCategories ?? CATEGORIES.map((c) => c.id)).filter((id) => id !== catId)
    const newAnswers = { ...result.answers }
    delete newAnswers[catId]
    const next: typeof result = { ...result, enabledCategories: newEnabled, answers: newAnswers, updatedAt: Date.now() }
    if (result.customItemDefs?.[catId]) {
      const newDefs = { ...result.customItemDefs }
      delete newDefs[catId]
      next.customItemDefs = newDefs
    }
    saveResult(next)
  }

  function onPickerSubmit(mergedIds: string[], resultCats: CustomCategoryDef[], profileCats: CustomCategoryDef[], itemsByCat: PendingItemsByCat) {
    if (profile && profileCats.length > (profile.customCategories?.length ?? 0)) {
      updateProfile(profile.id, { customCategories: profileCats })
    }
    const next = applyPendingItems({ ...result!, enabledCategories: mergedIds, customCategories: resultCats }, itemsByCat)
    saveResult(next)
  }

  async function handlePdfReport() {
    if (generatingPdf || !result) return
    const confirmed = await dialog<boolean>({
      title: t('btn_download_pdf') as string,
      body: <p>{t('pdf_confirm_body')}</p>,
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
      const dataset = mapResultToDataset(result, profile!)
      const allCatIds = Array.from(new Set([
        ...(result.enabledCategories ?? CATEGORIES.map((c) => c.id)),
        ...(result.customCategories ?? []).map((c) => c.id),
      ]))
      const mapName = result.subject?.trim() || profile!.name
      const safeFilename = `relationshapes-${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      const ok = await generatePdfReport({ datasets: [dataset], categoryIds: allCatIds, lang: getLang(), filename: safeFilename })
      if (!ok) toast.message(t('pdf_no_answers'))
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <section className="page" data-testid="category-overview-page">
      <header className="cat-overview-head">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="cat-overview-back-btn"
          data-testid="cat-overview-back"
        >
          <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/profile/${profile.id}`) }}>
            {t('cat_overview_back')}
          </a>
        </Button>
        <div className="cat-overview-head-body" data-testid="cat-overview-context">
          <h1 className="cat-overview-title">{t('q_overview_title')}</h1>
          <p className="cat-overview-breadcrumb" aria-label={`${profile.name} → ${result.subject || profile.name}`}>
            <span>{profile.name}</span>
            <span className="cat-overview-breadcrumb-arrow" aria-hidden="true"> → </span>
            {renamingSubject ? (
              <input
                autoFocus
                className="cat-overview-rename-input"
                value={subjectDraft}
                onChange={(e) => setSubjectDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setRenamingSubject(false)
                }}
                onBlur={commitRename}
                placeholder={t('result_rename_placeholder') as string}
                data-testid="cat-overview-rename-input"
              />
            ) : (
              <>
                <span>{result.subject || profile.name}</span>
                <button
                  type="button"
                  className="cat-overview-rename-btn"
                  onClick={startRename}
                  aria-label={t('result_rename_label') as string}
                  data-testid="cat-overview-rename-btn"
                >
                  ✎
                </button>
              </>
            )}
          </p>
          <p className="cat-overview-sub muted">{t('q_overview_sub')}</p>
        </div>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="cat-grid">
        {enabledCats.map((cat) => {
          const { answered, total } = catProgress(result.answers, cat.id, result.customItemDefs)
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0
          const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
          return (
            <div key={cat.id} className="cat-tile-wrap relative">
              <RsTile
                color={cat.color}
                active
                onClick={() => openCategory(cat.id)}
                testId={`cat-tile-${cat.id}`}
                icon={<span className="text-2xl">{cat.icon}</span>}
                title={catTitle}
                trailing={<span className="text-xs">{`${answered}/${total}`}</span>}
              >
                <div className="h-1 bg-line rounded mt-1">
                  <div className="h-1 rounded" style={{ width: `${pct}%`, background: cat.color }} />
                </div>
              </RsTile>
              <button
                type="button"
                className="cat-tile-remove-btn"
                onClick={(e) => { e.stopPropagation(); void handleRemoveCat(cat.id) }}
                aria-label={t('cat_remove_title') as string}
                data-testid={`cat-remove-${cat.id}`}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <div className="cat-overview-actions">
        <div className="cat-overview-actions-left">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPickerOpen(true)}
            data-testid="open-cat-picker"
          >
            {t('btn_add_categories')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { void handlePdfReport() }}
            disabled={generatingPdf}
            data-testid="cat-overview-pdf-btn"
          >
            {t('btn_download_pdf')}
          </Button>
        </div>
        <div className="cat-overview-actions-right">
          <Button
            asChild
            type="button"
            data-testid="cat-overview-compare-btn"
          >
            <a href={`/compare?ids=${result.id}`} onClick={(e) => { e.preventDefault(); navigate(`/compare?ids=${result.id}`) }}>
              {t('btn_compare_overview')}
            </a>
          </Button>
          <Button
            type="button"
            onClick={handleStartClick}
            data-testid="confirm-start-questionnaire"
          >
            {hasAnswers ? t('q_overview_continue') : t('q_overview_start')}
          </Button>
        </div>
      </div>
      <RsCategoryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingIds={enabledIds}
        result={result!}
        profile={profile}
        onSubmit={onPickerSubmit}
      />

      <Dialog open={preShareOpen} onOpenChange={(o) => { if (!o) setPreShareOpen(false) }}>
        <DialogContent className="max-w-md" data-testid="pre-share-prompt">
          <DialogTitle>{t('pre_share_title')}</DialogTitle>
          <p className="muted small" style={{ lineHeight: 1.55 }}>{t('pre_share_body')}</p>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setPreShareOpen(false); startQuestionnaire() }}
              data-testid="pre-share-skip"
            >
              {t('pre_share_skip')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPreShareOpen(false)
                openShareTemplate(result.id, startQuestionnaire)
              }}
              data-testid="pre-share-share-btn"
            >
              {t('pre_share_share_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CategoryModal
        open={overviewModalCat !== null}
        onOpenChange={(o) => { if (!o) closeOverviewModal() }}
        datasets={[overviewDataset]}
        cat={overviewModalCat}
        result={result}
      />

      {resultsOpen && profile && (
        <ResultModal
          open={resultsOpen}
          onOpenChange={(o) => {
            if (!o) {
              const next = new URLSearchParams(searchParams)
              next.delete('results')
              setSearchParams(next, { replace: true })
            }
          }}
          result={result}
          profile={profile}
        />
      )}
    </section>
  )
}
