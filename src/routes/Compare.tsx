// SHARE-05, D-25, D-35. Port of public/legacy/js/app.js:3453-3544.
// Quick task 260516-ex7: legacy CSS layout (compare-pick / pick-chip / cat-grid /
// cat-card / callout / page-head / section-head) + Kategorie-Details cat-grid
// section that opens a per-category modal. Default-to-first-2 selection mirrors
// legacy `viewCompare` line 3480.
// Phase 04 (D-04/D-05/D-06): Add-more-categories button, compareFilterIds union,
// and RsCategoryCard replaces ad-hoc RsTile for cat-grid.

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Spider } from '@/components/charts/Spider'
import { Alignment } from '@/components/charts/Alignment'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { RsCategoryPicker } from '@/components/RsCategoryPicker'
import { Button } from '@/components/ui/button'
import { mapResultToDataset, mapImportToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import type { AnswersBlob } from '@/lib/storage/types'
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

  // All available datasets (results first, then imports), as { id, label } for chip rendering.
  const allOptions = useMemo(
    () => [
      ...results.map((r) => ({
        id: r.id,
        label: `${profiles.find((p) => p.id === r.profileId)?.name ?? '?'} · ${r.subject ?? ''}`,
      })),
      ...imports.map((i) => ({ id: `imp:${i.id}`, label: i.subject ?? i.name ?? 'Anonymous' })),
    ],
    [results, imports, profiles],
  )

  // Default to the first 2 options when ?ids= is empty (legacy viewCompare:3480).
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

  // Phase-04 D-04: legacy app.js:3484-3486 — first own-result among selected
  // (used to gate the Add-more-categories button + as the editableResult for
  // RsCategoryCard's hide-vs-dim rule).
  const firstEditableResult = useMemo(() => {
    const firstResultId = effectiveIds.find((id) => !id.startsWith('imp:'))
    return firstResultId ? results.find((r) => r.id === firstResultId) ?? null : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIds.join(','), results])

  // Phase-04 D-04: legacy app.js:3489-3498 — union of enabledCategories across
  // all selected own-results. `null` means "no filter from any selected result".
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

  function toggleId(id: string) {
    const cur = truncatedRaw.length === 0 ? effectiveIds : truncatedRaw
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 4)
    setParams({ ids: next.join(',') })
  }

  // A category has "item by item" values when at least one dataset has any
  // per-item answer entry for it (base item or custom). Categories without
  // any item-level data are hidden from Kategorie-Details — opening their
  // modal would yield an empty ItemSpider anyway.
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

  return (
    <section className="page" data-testid="compare-page">
      <header className="page-head">
        <h1>{t('compare_title')}</h1>
        <p className="muted">{t('compare_sub')}</p>
      </header>

      {/* Chip picker — every option is a toggle. Selected state via `.on` modifier. */}
      <div className="compare-pick" data-testid="compare-chips">
        {allOptions.length === 0 ? (
          <p className="muted" data-testid="compare-empty">{t('compare_empty')}</p>
        ) : (
          allOptions.map((o) => {
            const selected = effectiveIds.includes(o.id)
            const ds = datasets.find((d) => d.id === o.id)
            const swatchColor = ds?.color
            return (
              <button
                key={o.id}
                type="button"
                className={`pick-chip${selected ? ' on' : ''}`}
                onClick={() => toggleId(o.id)}
                style={{ ['--c' as 'color']: swatchColor } as React.CSSProperties}
                data-testid={`compare-chip-${o.id}`}
                aria-pressed={selected}
              >
                <span className="swatch" aria-hidden="true" />
                <span aria-hidden="true">{ds?.emoji ?? '•'}</span>
                <span>{ds?.name ?? o.label}</span>
              </button>
            )
          })
        )}
      </div>

      {/* Either the Fabi-mode overview spider OR the tip callout that explains it. */}
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

      {/* Alignment overview only makes sense with ≥2 datasets. */}
      {datasets.length >= 2 && (
        <section className="page-section">
          <header className="section-head">
            <h2>{t('alignment_title')}</h2>
          </header>
          <Alignment datasets={datasets} />
        </section>
      )}

      {/* Kategorie-Details — one card per category that has item-by-item data
          in at least one of the selected datasets. */}
      {datasets.length >= 1 && visibleCategories.length > 0 && (
        <section className="page-section" data-testid="compare-cat-details">
          <header className="section-head">
            <h2>{t('cat_details_title')}</h2>
            <p className="muted">{t('cat_details_sub')}</p>
            {firstEditableResult ? (
              <Button
                onClick={() => setPickerOpen(true)}
                data-testid="compare-add-cats"
              >
                {t('btn_add_categories')}
              </Button>
            ) : null}
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
    </section>
  )
}
