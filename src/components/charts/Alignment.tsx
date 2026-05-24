// RESULT-05, D-04. Top matches + biggest gaps between TWO datasets. Port of public/legacy/js/charts.js:424-458.

import { CATEGORIES } from '@/lib/data/data'
import { categoryItemAlignment } from '@/lib/charts/math'
import type { ChartDataset } from './types'
import { t, getLang } from '@/lib/i18n/i18n'

interface Props { datasets: readonly ChartDataset[] }

export function Alignment({ datasets }: Props) {
  if (datasets.length < 2) return null
  const [a, b] = datasets
  if (!a || !b) return null

  // Merge custom categories from both datasets (union, deduped by id)
  const customCatMap = new Map<string, { id: string; title: string; icon: string }>()
  for (const c of [...(a.customCategories ?? []), ...(b.customCategories ?? [])]) {
    if (!customCatMap.has(c.id)) customCatMap.set(c.id, { id: c.id, title: c.title, icon: c.icon })
  }

  const opts = {
    customItemDefsA: a.customItemDefs,
    customItemDefsB: b.customItemDefs,
    customCatsA: a.customCategories,
    customCatsB: b.customCategories,
  }

  const lang = getLang()
  const rows = [
    ...CATEGORIES.map((cat) => ({ id: cat.id, title: lang === 'de' && cat.de ? cat.de : cat.title, icon: cat.icon })),
    ...Array.from(customCatMap.values()),
  ].map(({ id, title, icon }) => {
    const align = categoryItemAlignment(a.answers, b.answers, id, a.scale, b.scale, opts)
    if (align === null) return null
    return { id, title, icon, align, diff: 1 - align }
  }).filter((r): r is NonNullable<typeof r> => r !== null).sort((x, y) => x.diff - y.diff)

  const top = rows.slice(0, 5)
  const bottom = rows.slice(-5).reverse()

  function Row({ row }: { row: typeof rows[number] }) {
    const pct = Math.round(row.align * 100)
    return (
      <li className="rs-align-row flex items-center gap-2 py-1">
        <span
          className="rs-align-pill inline-block h-2 w-24 rounded"
          style={{ background: `linear-gradient(90deg, #22c55e ${pct}%, #ef4444 ${pct}%)` }}
        />
        <span aria-hidden="true">{row.icon}</span>
        <span className="rs-align-title flex-1">
          {row.title}
        </span>
        <span className="rs-align-meta muted small">{pct}%</span>
      </li>
    )
  }

  return (
    <div className="rs-align-grid grid md:grid-cols-2 gap-6" data-testid="alignment">
      <section>
        <h3>{t('alignment_match')}</h3>
        <ul className="rs-align-list" data-testid="alignment-top">
          {top.map((row) => <Row key={`top-${row.id}`} row={row} />)}
        </ul>
      </section>
      <section>
        <h3>{t('alignment_gaps')}</h3>
        <ul className="rs-align-list" data-testid="alignment-gaps">
          {bottom.map((row) => <Row key={`bot-${row.id}`} row={row} />)}
        </ul>
      </section>
    </div>
  )
}
