// SHARE-05, D-25, D-35. Port of public/legacy/js/app.js:3453-3544.
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Spider } from '@/components/charts/Spider'
import { ItemSpider } from '@/components/charts/ItemSpider'
import { CategoryBars } from '@/components/charts/CategoryBars'
import { Alignment } from '@/components/charts/Alignment'
import { mapResultToDataset, mapImportToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import { useToast } from '@/lib/hooks/useToast'
import { t } from '@/lib/i18n/i18n'

export function Compare() {
  const [params, setParams] = useSearchParams()
  const idsParam = params.get('ids') ?? ''
  const rawIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
  const truncated = rawIds.slice(0, 4)
  const { toast } = useToast()

  useEffect(() => {
    if (rawIds.length > 4) toast.message(t('compare_too_many_truncated', { n: rawIds.length }) as string)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds.length])

  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const imports = useStore((s) => s.imports)

  const datasets = useMemo(() => truncated.map((id) => {
    if (id.startsWith('imp:')) {
      const imp = imports.find((i) => i.id === id.slice(4))
      return imp ? mapImportToDataset(imp) : null
    }
    const r = results.find((r) => r.id === id)
    if (!r) return null
    const profile = profiles.find((p) => p.id === r.profileId) ?? null
    return mapResultToDataset(r, profile)
  }).filter((d): d is NonNullable<typeof d> => d !== null), [idsParam, results, imports, profiles])

  const [activeAxis, setActiveAxis] = useState<string | null>(null)

  function removeId(id: string) {
    const next = truncated.filter((x) => x !== id)
    setParams({ ids: next.join(',') })
  }
  function addId(id: string) {
    if (truncated.includes(id)) return
    const next = [...truncated, id].slice(0, 4)
    setParams({ ids: next.join(',') })
  }

  const allOptions = [
    ...results.map((r) => ({ id: r.id, label: `${profiles.find((p) => p.id === r.profileId)?.name ?? '?'} · ${r.subject ?? ''}` })),
    ...imports.map((i) => ({ id: `imp:${i.id}`, label: i.subject ?? i.name ?? 'Anonymous' })),
  ]

  return (
    <section className="page" data-testid="compare-page">
      <header>
        <h1>{t('compare_title')}</h1>
      </header>
      <div className="chips flex flex-wrap gap-2" data-testid="compare-chips">
        {truncated.map((id) => {
          const ds = datasets.find((d) => d.id === id)
          return (
            <button
              key={id}
              type="button"
              className="chip border border-line rounded px-2 py-1"
              onClick={() => removeId(id)}
              style={{ ['--c' as 'color']: ds?.color } as React.CSSProperties}
              data-testid={`compare-chip-${id}`}
            >
              {ds?.emoji ?? '•'} {ds?.name ?? id} ×
            </button>
          )
        })}
        <details>
          <summary className="cursor-pointer text-sm muted">+ add</summary>
          <ul className="absolute z-10 bg-surface border border-line rounded p-2 mt-1" data-testid="compare-add-menu">
            {allOptions.filter((o) => !truncated.includes(o.id)).map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => addId(o.id)} className="block w-full text-left px-2 py-1 hover:bg-bg" data-testid={`compare-add-${o.id}`}>
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </details>
      </div>
      {datasets.length === 0 ? (
        <p className="muted mt-4" data-testid="compare-empty">{t('compare_empty')}</p>
      ) : (
        <>
          <section className="page-section">
            <Spider
              datasets={datasets}
              activeAxis={activeAxis}
              onAxisTap={(ax) => setActiveAxis((p) => (p === ax ? null : ax))}
            />
          </section>
          {datasets.length >= 2 && (
            <section className="page-section">
              <Alignment datasets={datasets} />
            </section>
          )}
          {activeAxis && (
            <section className="page-section" data-testid="compare-drilldown">
              <h2>{CATEGORIES.find((c) => c.id === activeAxis)?.title}</h2>
              <ItemSpider datasets={datasets} catId={activeAxis} />
              <CategoryBars datasets={datasets} catId={activeAxis} />
            </section>
          )}
        </>
      )}
    </section>
  )
}
