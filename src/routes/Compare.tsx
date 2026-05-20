// SHARE-05, D-25, D-35. Port of public/legacy/js/app.js:3453-3544.

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { Spider } from '@/components/charts/Spider'
import { Alignment } from '@/components/charts/Alignment'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ImportForm } from '@/components/ImportForm'
import { UnlockAnswersBody } from '@/components/UnlockAnswersDialog'
import { mapResultToDataset, mapImportToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import type { AnswersBlob, Import } from '@/lib/storage/types'
import { useToast } from '@/lib/hooks/useToast'
import { dialog } from '@/lib/dialog/dialog'
import { t, getLang } from '@/lib/i18n/i18n'

import type { ResolvedCat } from '@/lib/data/customCategories'
type CategoryDef = (typeof CATEGORIES)[number]

export function Compare() {
  const [params, setParams] = useSearchParams()
  // null = param absent (first visit → default to first 2); '' = explicit empty (user deselected all)
  const idsParam = params.get('ids')
  const rawIds = idsParam !== null ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : null
  const truncatedRaw = rawIds !== null ? rawIds.slice(0, 4) : null
  const { toast } = useToast()
  const { openShare } = useShareData()

  useEffect(() => {
    if (rawIds !== null && rawIds.length > 4) toast.message(t('compare_too_many_truncated', { n: rawIds.length }) as string)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds?.length])

  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const imports = useStore((s) => s.imports)
  const unlockImport = useStore((s) => s.unlockImport)
  const fabiMode = useStore((s) => s.settings.fabiMode ?? false)

  // Separate own-result options and imported options for grouped display.
  const ownOptions = useMemo(
    () => results.map((r) => {
      const profile = profiles.find((p) => p.id === r.profileId)
      return {
        id: r.id,
        name: profile?.name ?? '?',
        subject: r.subject ?? '',
        emoji: r.subjectEmoji || profile?.emoji || '💞',
        color: r.subjectColor || profile?.color || '#7c3aed',
      }
    }),
    [results, profiles],
  )

  const importedOptions = useMemo(
    () => imports.map((i) => ({
      id: `imp:${i.id}`,
      impId: i.id,
      name: i.name ?? 'Anonymous',
      subject: i.subject ?? '',
      emoji: i.emoji || '📨',
      color: i.color || '#7c3aed',
      locked: i.exportMode === 'restricted' && !i.answersUnlocked,
    })),
    [imports],
  )

  const allOptions = useMemo(
    () => [...ownOptions.map((o) => ({ id: o.id })), ...importedOptions.map((o) => ({ id: o.id }))],
    [ownOptions, importedOptions],
  )

  // Default to the first 2 options when ?ids= param is absent; explicit empty string = nothing selected.
  const effectiveIds = truncatedRaw === null
    ? allOptions.slice(0, 2).map((o) => o.id)
    : truncatedRaw

  const datasets = useMemo(() => effectiveIds.map((id) => {
    if (id.startsWith('imp:')) {
      const imp = imports.find((i) => i.id === id.slice(4))
      return imp ? mapImportToDataset(imp) : null
    }
    const r = results.find((r) => r.id === id)
    if (!r) return null
    const profile = profiles.find((p) => p.id === r.profileId) ?? null
    return mapResultToDataset(r, profile)
  }).filter((d): d is NonNullable<typeof d> => d !== null), [effectiveIds.join(','), results, imports, profiles])

  const firstEditableResult = useMemo(() => {
    const firstResultId = effectiveIds.find((id) => !id.startsWith('imp:'))
    return firstResultId ? results.find((r) => r.id === firstResultId) ?? null : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIds.join(','), results])

  const compareFilterIds = useMemo<string[] | null>(() => {
    const set = new Set<string>()
    let hasFilter = false
    for (const id of effectiveIds) {
      if (id.startsWith('imp:')) continue
      const r = results.find((x) => x.id === id)
      if (r?.enabledCategories) {
        hasFilter = true
        r.enabledCategories.forEach((cid) => set.add(cid))
      }
    }
    return hasFilter ? Array.from(set) : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIds.join(','), results])

  const [activeAxis, setActiveAxis] = useState<string | null>(null)
  const [modalCat, setModalCat] = useState<CategoryDef | ResolvedCat | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  async function handlePdfReport() {
    if (generatingPdf || datasets.length === 0) return
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

  function handleImportSuccess(imp: Import) {
    setImportOpen(false)
    const id = `imp:${imp.id}`
    const cur = truncatedRaw ?? effectiveIds
    const next = cur.includes(id) ? cur : [...cur, id].slice(0, 4)
    setParams({ ids: next.join(',') })
  }

  function handleUnlockImport(impId: string) {
    const imp = imports.find((i) => i.id === impId)
    if (!imp) return
    void dialog<boolean>({
      title: t('unlock_answers_title'),
      body: (close) => (
        <UnlockAnswersBody
          imp={imp}
          onUnlock={(answers) => { unlockImport(impId, answers); close(true) }}
          onCancel={() => close(false)}
        />
      ),
      actions: [],
    })
  }

  function toggleId(id: string) {
    const cur = truncatedRaw ?? effectiveIds
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 4)
    setParams({ ids: next.join(',') })
  }

  function hasItemValues(answers: AnswersBlob | undefined, catId: string): boolean {
    const slot = answers?.[catId]
    if (!slot) return false
    for (const k of Object.keys(slot)) {
      if (k !== '__custom' && k !== '__hidden') return true
    }
    return Object.keys(slot.__custom ?? {}).length > 0
  }

  // Collect all category IDs (builtin + custom from datasets)
  const allCatIds = useMemo(() => {
    const builtinIds = CATEGORIES.map((c) => c.id)
    const customIds = datasets.flatMap((ds) => (ds.customCategories ?? []).map((c) => c.id))
    return [...builtinIds, ...customIds]
  }, [datasets])

  // In Fabi mode show all categories that have answers; otherwise respect enabled-category filter
  const filteredCatIds = (!fabiMode && compareFilterIds)
    ? allCatIds.filter((id) => compareFilterIds.includes(id))
    : allCatIds

  const visibleCategories = useMemo(() => {
    return filteredCatIds
      .map((id) => {
        const allResultCats = datasets.flatMap((ds) => ds.customCategories ?? [])
        return resolveAnyCat(id, allResultCats, [])
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .filter((cat) => datasets.some((ds) => hasItemValues(ds.answers, cat.id)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCatIds.join(','), datasets])

  const selectedCount = effectiveIds.length
  const atMax = selectedCount >= 4

  return (
    <section className="page" data-testid="compare-page">
      <header className="page-head">
        <h1>{t('compare_title')}</h1>
        <p className="muted">{t('compare_sub')}</p>
      </header>

      {/* Grouped dataset selector */}
      <div className="compare-selector" data-testid="compare-chips">
        {/* Selection counter */}
        <div className="compare-selector-meta">
          <span className="muted small">
            {t('compare_selected_of', { n: selectedCount })}
          </span>
          {atMax && (
            <span className="muted small"> · {t('compare_max_hint')}</span>
          )}
        </div>

        {/* Own maps */}
        {ownOptions.length > 0 && (
          <div className="compare-group">
            <h2 className="compare-group-label">{t('compare_own_section')}</h2>
            <div className="compare-group-items">
              {ownOptions.map((o) => {
                const selected = effectiveIds.includes(o.id)
                const disabled = atMax && !selected
                return (
                  <div
                    key={o.id}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-pressed={selected}
                    className={`compare-row${selected ? ' compare-row--on' : ''}${disabled ? ' compare-row--disabled' : ''}`}
                    style={{ ['--c' as 'color']: o.color } as React.CSSProperties}
                    onClick={() => !disabled && toggleId(o.id)}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); toggleId(o.id) } }}
                    data-testid={`compare-chip-${o.id}`}
                  >
                    <span className="compare-row-select">
                      <span className="compare-row-check" aria-hidden="true">
                        {selected ? '✓' : ''}
                      </span>
                      <span className="compare-row-emoji" aria-hidden="true">{o.emoji}</span>
                      <span className="compare-row-text">
                        <span className="compare-row-name">{o.subject || o.name}</span>
                        {o.subject && <span className="compare-row-sub">{o.name}</span>}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="compare-row-export"
                      onClick={(e) => { e.stopPropagation(); openShare(o.id) }}
                      data-testid={`compare-export-${o.id}`}
                    >
                      {t('btn_export_result')}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Imported results */}
        <div className="compare-group">
          <div className="compare-group-header">
            <h2 className="compare-group-label">{t('compare_imported_section')}</h2>
            <button
              type="button"
              className="btn btn-outline compare-import-inline-btn"
              onClick={() => setImportOpen(true)}
              data-testid="compare-import-btn"
            >
              {t('compare_import_btn')}
            </button>
          </div>
          {importedOptions.length === 0 && (
            <p className="muted small px-1" data-testid="compare-no-imports">{t('compare_no_imports_yet')}</p>
          )}
          {importedOptions.length > 0 && (
            <div className="compare-group-items">
              {importedOptions.map((o) => {
                if (o.locked) {
                  return (
                    <div
                      key={o.id}
                      className="compare-row compare-row--locked-import"
                      style={{ ['--c' as 'color']: o.color } as React.CSSProperties}
                      data-testid={`compare-chip-${o.id}`}
                    >
                      <span className="compare-row-select compare-row-select--locked">
                        <span className="compare-row-emoji" aria-hidden="true">{o.emoji}</span>
                        <span className="compare-row-text">
                          <span className="compare-row-name">{o.subject || o.name}</span>
                          {o.subject && <span className="compare-row-sub">{o.name}</span>}
                          <span className="compare-row-locked-label">{t('locked_answers_badge')}</span>
                        </span>
                      </span>
                      <button
                        type="button"
                        className="compare-row-unlock"
                        onClick={() => handleUnlockImport(o.impId)}
                        data-testid={`compare-unlock-${o.id}`}
                      >
                        {t('unlock_answers_btn')}
                      </button>
                    </div>
                  )
                }
                const selected = effectiveIds.includes(o.id)
                const disabled = atMax && !selected
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`compare-row${selected ? ' compare-row--on' : ''}${disabled ? ' compare-row--disabled' : ''}`}
                    style={{ ['--c' as 'color']: o.color } as React.CSSProperties}
                    onClick={() => !disabled && toggleId(o.id)}
                    data-testid={`compare-chip-${o.id}`}
                    aria-pressed={selected}
                    disabled={disabled}
                  >
                    <span className="compare-row-check" aria-hidden="true">
                      {selected ? '✓' : ''}
                    </span>
                    <span className="compare-row-emoji" aria-hidden="true">{o.emoji}</span>
                    <span className="compare-row-text">
                      <span className="compare-row-name">{o.subject || o.name}</span>
                      {o.subject && <span className="compare-row-sub">{o.name}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {datasets.length > 0 && !fabiMode && (
        <p className="callout muted small" data-testid="compare-fabi-tip">
          {t('compare_fabi_tip')}
        </p>
      )}

      {datasets.length >= 2 && (
        <section className="page-section">
          <header className="section-head">
            <h2>{t('alignment_title')}</h2>
          </header>
          <Alignment datasets={datasets} />
        </section>
      )}

      {datasets.length >= 1 && visibleCategories.length > 0 && (
        <section className="page-section" data-testid="compare-cat-details">
          <header className="section-head">
            <h2>{t('cat_details_title')}</h2>
            <p className="muted">{t('cat_details_sub')}</p>
            <p className="muted small">{t('cat_details_filter_hint')}</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { void handlePdfReport() }}
              disabled={generatingPdf}
              data-testid="compare-pdf-report"
            >
              {t('btn_pdf_report')}
            </button>
          </header>
          <div className="cat-grid">
            {visibleCategories.map((cat) => (
              <RsCategoryCard
                key={cat.id}
                cat={cat}
                datasets={datasets}
                editableResult={firstEditableResult}
                fabiMode={fabiMode}
                onClick={() => setModalCat(cat)}
                testId={`compare-cat-card-${cat.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Fabi-mode overview spider — shown below category details */}
      {datasets.length > 0 && fabiMode && (
        <section className="page-section panel" data-testid="compare-fabi-spider">
          <header className="section-head">
            <h2>{t('fabi_spider_title')}</h2>
            <p className="muted small">{t('fabi_spider_sub')}</p>
          </header>
          <Spider
            datasets={datasets}
            activeAxis={activeAxis}
            onAxisTap={(ax) => setActiveAxis((p) => (p === ax ? null : ax))}
          />
        </section>
      )}

      <CategoryModal
        open={modalCat !== null}
        onOpenChange={(open) => { if (!open) setModalCat(null) }}
        datasets={datasets}
        cat={modalCat}
        result={firstEditableResult}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg" data-testid="compare-import-modal">
          <DialogTitle>{t('compare_import_title')}</DialogTitle>
          <ImportForm onSuccess={handleImportSuccess} testIdPrefix="compare-import" />
        </DialogContent>
      </Dialog>
    </section>
  )
}
