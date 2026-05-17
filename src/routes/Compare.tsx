// SHARE-05, D-25, D-35. Port of public/legacy/js/app.js:3453-3544.

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Spider } from '@/components/charts/Spider'
import { Alignment } from '@/components/charts/Alignment'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { RsCategoryPicker } from '@/components/RsCategoryPicker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ImportForm } from '@/components/ImportForm'
import { mapResultToDataset, mapImportToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import type { AnswersBlob, Import } from '@/lib/storage/types'
import { useToast } from '@/lib/hooks/useToast'
import { t } from '@/lib/i18n/i18n'

type CategoryDef = (typeof CATEGORIES)[number]

export function Compare() {
  const [params, setParams] = useSearchParams()
  const idsParam = params.get('ids') ?? ''
  const rawIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
  const truncatedRaw = rawIds.slice(0, 4)
  const { toast } = useToast()

  useEffect(() => {
    if (rawIds.length > 4) toast.message(t('compare_too_many_truncated', { n: rawIds.length }) as string)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds.length])

  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const imports = useStore((s) => s.imports)
  const fabiMode = useStore((s) => s.settings.fabiMode ?? false)
  const saveResult = useStore((s) => s.saveResult)

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

  // Default to the first 2 options when ?ids= is empty.
  const effectiveIds = truncatedRaw.length === 0
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
  const [modalCat, setModalCat] = useState<CategoryDef | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  function handleImportSuccess(imp: Import) {
    setImportOpen(false)
    const id = `imp:${imp.id}`
    const cur = truncatedRaw.length === 0 ? effectiveIds : truncatedRaw
    const next = cur.includes(id) ? cur : [...cur, id].slice(0, 4)
    setParams({ ids: next.join(',') })
  }

  function toggleId(id: string) {
    const cur = truncatedRaw.length === 0 ? effectiveIds : truncatedRaw
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

  const filteredCategories = compareFilterIds
    ? CATEGORIES.filter((c) => compareFilterIds.includes(c.id))
    : CATEGORIES
  const visibleCategories = filteredCategories.filter((cat) =>
    datasets.some((ds) => hasItemValues(ds.answers, cat.id)),
  )

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
            <p className="compare-group-label">{t('compare_own_section')}</p>
            <div className="compare-group-items">
              {ownOptions.map((o) => {
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
          </div>
        )}

        {/* Imported results */}
        <div className="compare-group">
          <div className="compare-group-header">
            <p className="compare-group-label">{t('compare_imported_section')}</p>
            <button
              type="button"
              className="btn btn-ghost compare-import-inline-btn"
              onClick={() => setImportOpen(true)}
              data-testid="compare-import-btn"
            >
              📥 {t('compare_import_btn')}
            </button>
          </div>
          {importedOptions.length > 0 && (
            <div className="compare-group-items">
              {importedOptions.map((o) => {
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
                      {o.locked && <span className="compare-row-locked">🔒</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fabi-mode spider or tip */}
      {datasets.length > 0 && (
        fabiMode ? (
          <section className="page-section panel">
            <Spider
              datasets={datasets}
              activeAxis={activeAxis}
              onAxisTap={(ax) => setActiveAxis((p) => (p === ax ? null : ax))}
            />
          </section>
        ) : (
          <p className="callout muted small" data-testid="compare-fabi-tip">
            {t('compare_fabi_tip')}
          </p>
        )
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
            {firstEditableResult && (
              <Button onClick={() => setPickerOpen(true)} data-testid="compare-add-cats">
                {t('btn_add_categories')}
              </Button>
            )}
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

      <CategoryModal
        open={modalCat !== null}
        onOpenChange={(open) => { if (!open) setModalCat(null) }}
        datasets={datasets}
        cat={modalCat}
        result={firstEditableResult}
      />
      <RsCategoryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingIds={firstEditableResult?.enabledCategories ?? CATEGORIES.map((c) => c.id)}
        onSubmit={(mergedIds) => {
          if (!firstEditableResult) return
          saveResult({ ...firstEditableResult, enabledCategories: mergedIds })
        }}
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
