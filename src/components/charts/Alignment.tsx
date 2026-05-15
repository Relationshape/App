// RESULT-05, D-04. Top matches + biggest gaps between TWO datasets. Port of public/legacy/js/charts.js:424-458.

import { CATEGORIES } from '@/lib/data/data'
import { categoryAverage } from '@/lib/charts/math'
import type { ChartDataset } from './types'
import { t } from '@/lib/i18n/i18n'

interface Props { datasets: readonly ChartDataset[] }

export function Alignment({ datasets }: Props) {
  if (datasets.length < 2) return null
  const [a, b] = datasets
  if (!a || !b) return null
  const rows = CATEGORIES.map((cat) => {
    const va = categoryAverage(a.answers, cat.id, a.scale)
    const vb = categoryAverage(b.answers, cat.id, b.scale)
    if (!va || !vb) return null
    const diff = Math.abs(va.norm - vb.norm)
    return { cat, va, vb, diff, align: 1 - diff }
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
        <span aria-hidden="true">{row.cat.icon}</span>
        <span className="rs-align-title flex-1">
          {row.cat.title}{/* React text node */}
        </span>
        <span className="rs-align-meta muted small">
          {Math.round(row.va.norm * 100)}% ↔ {Math.round(row.vb.norm * 100)}%
        </span>
      </li>
    )
  }

  return (
    <div className="rs-align-grid grid md:grid-cols-2 gap-6" data-testid="alignment">
      <section>
        <h3>{t('alignment_match')}</h3>
        <ul className="rs-align-list" data-testid="alignment-top">
          {top.map((row) => <Row key={`top-${row.cat.id}`} row={row} />)}
        </ul>
      </section>
      <section>
        <h3>{t('alignment_gaps')}</h3>
        <ul className="rs-align-list" data-testid="alignment-gaps">
          {bottom.map((row) => <Row key={`bot-${row.cat.id}`} row={row} />)}
        </ul>
      </section>
    </div>
  )
}
