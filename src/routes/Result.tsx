// RESULT-01, RESULT-02..07. Port of public/legacy/js/app.js:2770-2821.

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { mapResultToDataset } from '@/lib/charts/datasets'
import { Spider } from '@/components/charts/Spider'
import { ItemSpider } from '@/components/charts/ItemSpider'
import { CategoryBars } from '@/components/charts/CategoryBars'
import { EnlargedSpider } from '@/components/charts/EnlargedSpider'
import { Button } from '@/components/ui/button'
import { dialog } from '@/lib/dialog/dialog'
import { CATEGORIES } from '@/lib/data/data'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { t } from '@/lib/i18n/i18n'

export function Result() {
  const { id, catId } = useParams<{ id: string; catId?: string }>()
  const navigate = useNavigate()
  const result = useStore((s) => (id ? s.results.find((r) => r.id === id) ?? null : null))
  const profile = useStore((s) => (result ? s.profiles.find((p) => p.id === result.profileId) ?? null : null))
  const deleteResult = useStore((s) => s.deleteResult)
  const { openShare } = useShareData()

  // Initialize activeAxis from catId (deep-link support, QUEST-06)
  const [activeAxis, setActiveAxis] = useState<string | null>(catId ?? null)
  const [enlargedOpen, setEnlargedOpen] = useState(false)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  // QUEST-06 deep-link: scroll the matching category section into view on mount
  // activeAxis is already initialized from catId via useState initializer above.
  useEffect(() => {
    if (!catId) return
    const el = sectionRefs.current.get(catId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // Run only on mount; catId is stable from URL params

  if (!result) { navigate('/'); return null }
  if (!profile) { navigate('/'); return null }

  const dataset = mapResultToDataset(result, profile)
  const datasets = [dataset]

  async function onDelete() {
    const ok = await dialog<boolean>({
      title: t('confirm_delete_result_title'),
      body: <p>{t('confirm_delete_result')}</p>,
      actions: [
        { label: t('btn_cancel'), kind: 'ghost', value: false },
        { label: t('btn_delete'), kind: 'danger', value: true },
      ],
    })
    if (ok && result && profile) { deleteResult(result.id); navigate(`/profile/${profile.id}`) }
  }

  return (
    <section className="page" data-testid="result-page">
      <header className="result-head" style={{ ['--c' as 'color']: dataset.color } as React.CSSProperties}>
        <Button asChild variant="ghost" data-testid="result-back">
          <Link to={`/profile/${profile.id}`}>{t('btn_back')}</Link>
        </Button>
        <div className="li-avatar text-3xl">{dataset.emoji}</div>
        <div>
          <h1 data-testid="result-title">
            {result.subject || profile.name}
            {(result.version ?? 1) > 1 && ` (v${result.version})`}
          </h1>
          <p className="muted small">
            {profile.emoji} {profile.name}
          </p>
        </div>
        <div className="flex-spacer" />
        <Button asChild data-testid="result-edit">
          <Link to={`/q/${profile.id}/${result.id}`}>{t('btn_continue_editing')}</Link>
        </Button>
        <Button variant="outline" onClick={() => openShare(result.id)} data-testid="result-share">
          {t('btn_share')}
        </Button>
        <Button asChild variant="outline" data-testid="result-settings">
          <Link to={`/map/${result.id}/settings`}>{t('btn_map_settings')}</Link>
        </Button>
        <Button variant="destructive" onClick={onDelete} data-testid="result-delete">{t('btn_delete')}</Button>
      </header>

      <section className="page-section">
        <Spider
          datasets={datasets}
          activeAxis={activeAxis}
          onAxisEnter={setActiveAxis}
          onAxisLeave={() => setActiveAxis(null)}
          onAxisTap={(ax) => setActiveAxis((prev) => (prev === ax ? null : ax))}
          onChartTap={() => setEnlargedOpen(true)}
        />
      </section>

      {activeAxis && (
        <section className="page-section" data-testid="result-drilldown">
          <h2 data-testid="drilldown-title">
            {CATEGORIES.find((c) => c.id === activeAxis)?.title}{/* React text node */}
          </h2>
          <ItemSpider datasets={datasets} catId={activeAxis} />
          <CategoryBars datasets={datasets} catId={activeAxis} />
        </section>
      )}

      {/* Hidden anchor sections for deep-link scroll target (QUEST-06) */}
      {CATEGORIES.map((c) => (
        <span
          key={c.id}
          ref={(el) => { if (el) sectionRefs.current.set(c.id, el as HTMLElement); else sectionRefs.current.delete(c.id) }}
          data-testid={`cat-anchor-${c.id}`}
          id={`cat-${c.id}`}
          aria-hidden="true"
        />
      ))}

      <EnlargedSpider
        open={enlargedOpen}
        onOpenChange={setEnlargedOpen}
        datasets={datasets}
        activeAxis={activeAxis}
        onAxisTap={(ax) => setActiveAxis((prev) => (prev === ax ? null : ax))}
      />
    </section>
  )
}
