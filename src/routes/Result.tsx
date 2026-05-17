// Phase 04 D-01 + D-02. Result detail page restructured to legacy parity:
//   header → (Fabi-only) Spider overview → Compare-with-someone → By-category grid.
//
// Port of public/legacy/js/app.js:2770-2821 (viewResult). The phase-02 inline
// activeAxis-driven ItemSpider + CategoryBars drill-down is removed; per-category
// detail now lives in CategoryModal (already shared with the Compare overlay).
//
// RESULT-01..07 + D-01, D-02, D-05, D-06, D-08, D-09.

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { mapResultToDataset } from '@/lib/charts/datasets'
import { Spider } from '@/components/charts/Spider'
import { EnlargedSpider } from '@/components/charts/EnlargedSpider'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { CompareWithSomeone } from '@/components/CompareWithSomeone'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { RsCategoryPicker } from '@/components/RsCategoryPicker'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/data/data'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { countAnswers, fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'

type CategoryDef = (typeof CATEGORIES)[number]

export function Result() {
  const { id, catId } = useParams<{ id: string; catId?: string }>()
  const navigate = useNavigate()
  const result = useStore((s) => (id ? s.results.find((r) => r.id === id) ?? null : null))
  const profile = useStore((s) =>
    result ? s.profiles.find((p) => p.id === result.profileId) ?? null : null,
  )
  const fabiMode = useStore((s) => s.settings.fabiMode ?? false)
  const saveResult = useStore((s) => s.saveResult)
  const { openShare } = useShareData()

  const [modalCat, setModalCat] = useState<CategoryDef | null>(null)
  const [enlargedOpen, setEnlargedOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Phase 04 D-01: deep-link `/result/:id/:catId` → open CategoryModal on mount,
  // matching legacy app.js:2817-2820. RAF-scheduled so the route paint completes first.
  useEffect(() => {
    if (!catId) return
    const cat = CATEGORIES.find((c) => c.id === catId)
    if (!cat) return
    const raf = requestAnimationFrame(() => setModalCat(cat))
    return () => cancelAnimationFrame(raf)
  }, [catId])

  if (!result) {
    navigate('/')
    return null
  }
  if (!profile) {
    navigate('/')
    return null
  }

  const dataset = mapResultToDataset(result, profile)
  const datasets = [dataset]

  // Only show categories that are in the result's enabled list (or all if unset).
  // Mirrors legacy app.js:2843 `enabledIds ?? editableResult?.enabledCategories`.
  const enabledCats = result.enabledCategories
    ? CATEGORIES.filter((c) => result.enabledCategories!.includes(c.id))
    : CATEGORIES

  return (
    <section className="page" data-testid="result-page">
      {/* D-02 header — Back / avatar / title+subtitle / spacer / Map settings / Continue editing / Share. */}
      <header
        className="result-head"
        style={{ ['--c' as 'color']: dataset.color } as React.CSSProperties}
      >
        <Button asChild variant="ghost" data-testid="result-back">
          <Link to={`/profile/${profile.id}`}>{t('btn_back')}</Link>
        </Button>
        <div className="li-avatar text-3xl">{dataset.emoji}</div>
        <div>
          <h1 data-testid="result-title">
            {result.subject || profile.name}
            {(result.version ?? 1) > 1 && ` (v${result.version})`}
          </h1>
          <p className="muted small" data-testid="result-subtitle">
            {`${profile.emoji} ${profile.name} · ${countAnswers(result)} ${t('answers')} · ${t('result_last_edited')} ${fmtDate(result.updatedAt)}`}
          </p>
        </div>
        <div className="flex-spacer" />
        <Button asChild variant="outline" data-testid="result-settings">
          <Link to={`/map/${result.id}/settings`}>{t('btn_map_settings')}</Link>
        </Button>
        <Button asChild data-testid="result-edit">
          <Link to={`/q/${profile.id}/${result.id}`}>{t('btn_continue_editing')}</Link>
        </Button>
        <Button onClick={() => openShare(result.id)} data-testid="result-share">
          {t('btn_share')}
        </Button>
      </header>

      {/* D-01 Fabi-mode-only Spider overview section (mirrors legacy app.js:2795-2801). */}
      {fabiMode && (
        <section className="page-section" data-testid="result-spider-section">
          <header className="section-head">
            <h2>{t('result_category_overview')}</h2>
            <p className="muted">{t('result_category_overview_sub')}</p>
          </header>
          <div
            className="panel rs-chart-clickable"
            title={t('enlarge_chart')}
            onClick={() => setEnlargedOpen(true)}
          >
            <Spider datasets={datasets} />
          </div>
        </section>
      )}

      {/* D-03 Compare-with-someone section (handled by CompareWithSomeone). */}
      <section className="page-section" data-testid="result-compare-with-section">
        <header className="section-head">
          <h2>{t('compare_with')}</h2>
        </header>
        <CompareWithSomeone currentResultId={result.id} />
      </section>

      {/* D-01 + D-06 By-category cat-grid (replaces the phase-02 inline drill-down). */}
      <section className="page-section" data-testid="result-cat-grid-section">
        <header className="section-head">
          <h2>{t('by_category')}</h2>
          <p className="muted">{t('by_category_sub')}</p>
          {result.enabledCategories ? (
            <Button
              onClick={() => setPickerOpen(true)}
              data-testid="result-add-cats"
            >
              {t('btn_add_categories')}
            </Button>
          ) : null}
        </header>
        <div className="cat-grid">
          {enabledCats.map((cat) => (
            <RsCategoryCard
              key={cat.id}
              cat={cat}
              datasets={datasets}
              editableResult={result}
              fabiMode={fabiMode}
              onClick={() => setModalCat(cat)}
              testId={`result-cat-card-${cat.id}`}
            />
          ))}
        </div>
      </section>

      <CategoryModal
        open={modalCat !== null}
        onOpenChange={(open) => { if (!open) setModalCat(null) }}
        datasets={datasets}
        cat={modalCat}
        result={result}
      />

      <RsCategoryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingIds={result.enabledCategories ?? CATEGORIES.map((c) => c.id)}
        onSubmit={(mergedIds) => saveResult({ ...result, enabledCategories: mergedIds })}
      />

      <EnlargedSpider
        open={enlargedOpen}
        onOpenChange={setEnlargedOpen}
        datasets={datasets}
        activeAxis={null}
        onAxisTap={() => {}}
      />
    </section>
  )
}
