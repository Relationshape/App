// SHARE-05, D-25, D-35. Port of public/legacy/js/app.js:3453-3544.
// Quick task 260516-ex7: legacy CSS layout (compare-pick / pick-chip / cat-grid /
// cat-card / callout / page-head / section-head) + Kategorie-Details cat-grid
// section that opens a per-category modal. Default-to-first-2 selection mirrors
// legacy `viewCompare` line 3480.

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Spider } from '@/components/charts/Spider'
import { Alignment } from '@/components/charts/Alignment'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { mapResultToDataset, mapImportToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import { useToast } from '@/lib/hooks/useToast'
import { t, getLang } from '@/lib/i18n/i18n'

type CategoryDef = (typeof CATEGORIES)[number]

export function Compare() {
  const [params, setParams] = useSearchParams()
  const idsParam = params.get('ids') ?? ''
  const rawIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
  const truncatedRaw = rawIds.slice(0, 4)
  const { toast } = useToast()
  const lang = getLang()

  useEffect(() => {
    if (rawIds.length > 4) toast.message(t('compare_too_many_truncated', { n: rawIds.length }) as string)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds.length])

  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const imports = useStore((s) => s.imports)
  const fabiMode = useStore((s) => s.settings.fabiMode ?? false)

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

  const [activeAxis, setActiveAxis] = useState<string | null>(null)
  const [modalCat, setModalCat] = useState<CategoryDef | null>(null)

  function toggleId(id: string) {
    const cur = truncatedRaw.length === 0 ? effectiveIds : truncatedRaw
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 4)
    setParams({ ids: next.join(',') })
  }

  // Title/blurb selectors honour the active locale (DE → cat.de / cat.deBlurb when present).
  function catTitle(cat: CategoryDef): string {
    return lang === 'de' && cat.de ? cat.de : cat.title
  }
  function catBlurb(cat: CategoryDef): string {
    return lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb
  }

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

      {/* Kategorie-Details — every category becomes a card that opens the modal. */}
      {datasets.length >= 1 && (
        <section className="page-section" data-testid="compare-cat-details">
          <header className="section-head">
            <h2>{t('cat_details_title')}</h2>
            <p className="muted">{t('cat_details_sub')}</p>
          </header>
          {/* TODO: legacy app.js openAddCategoriesDialog ("Weitere Kategorien hinzufügen") is
              out of scope for this quick task — multi-screen flow tracked separately. */}
          <div className="cat-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="cat-card cat-card-btn"
                style={{ ['--c' as 'color']: cat.color } as React.CSSProperties}
                onClick={() => setModalCat(cat)}
                data-testid={`compare-cat-card-${cat.id}`}
              >
                <div className="cat-card-head">
                  <div className="cat-card-icon">{cat.icon}</div>
                  <div className="cat-card-titles">
                    <h3>{catTitle(cat)}</h3>
                    <p className="muted small">{catBlurb(cat)}</p>
                  </div>
                  <span className="cat-card-toggle" aria-hidden="true">→</span>
                </div>
              </button>
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
    </section>
  )
}
