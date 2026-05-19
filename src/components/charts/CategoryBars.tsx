// RESULT-03, D-04. Per-category bar diff. Port of public/legacy/js/charts.js:373-422.
// Redesigned compare layout: each item shows a sub-row per dataset with the
// profile name next to the bar so answers to the same question are clearly
// stacked and attributed.

import { enabledItemsForCat } from '@/lib/charts/items'
import { getItemLabel, localizeStep } from '@/lib/data/locale'
import { scaleMaxValue } from '@/lib/charts/math'
import { CATEGORIES } from '@/lib/data/data'
import type { ChartDataset } from './types'
import type { AnswerCell } from '@/lib/storage/types'
import { getLang, t } from '@/lib/i18n/i18n'

interface Props { datasets: readonly ChartDataset[]; catId: string }

export function CategoryBars({ datasets, catId }: Props) {
  const lang = getLang()
  const truncated = datasets.slice(0, 4)
  const isKnownCat = CATEGORIES.some((c) => c.id === catId) ||
    truncated.some((ds) => ds.customCategories?.some((cc) => cc.id === catId))
  if (!isKnownCat) return null
  const itemSet = new Set<string>()
  for (const ds of truncated) {
    const { base, custom } = enabledItemsForCat(ds.answers, catId)
    base.forEach((i) => itemSet.add(i))
    custom.forEach((i) => itemSet.add(`✶ ${i}`))
  }
  const items = Array.from(itemSet).filter((item) => {
    const isCustom = item.startsWith('✶ ')
    const key = isCustom ? item.slice(2) : item
    return truncated.some((ds) => {
      const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
      if (!cell) return false
      // Never show non-scale custom items as bars
      if (isCustom) {
        const def = ds.customItemDefs?.[catId]?.[key]
        if (def && def.format !== 'scale') return false
      }
      const step = ds.scale.find((s) => s.key === cell.scale)
      return step != null
    })
  })

  // Collect non-scale custom items (those excluded from the bar chart)
  const nonScaleItems: string[] = []
  for (const ds of truncated) {
    const { custom } = enabledItemsForCat(ds.answers, catId)
    for (const item of custom) {
      const def = ds.customItemDefs?.[catId]?.[item]
      if (def && def.format !== 'scale' && !nonScaleItems.includes(item)) {
        nonScaleItems.push(item)
      }
    }
  }

  function formatNonScaleAnswer(cell: AnswerCell | undefined, format: string): string | null {
    if (!cell) return null
    if (format === 'text') return cell.textValue ?? null
    if (format === 'single' || format === 'multi') {
      const vals = cell.selectedValues
      return vals && vals.length > 0 ? vals.join(', ') : null
    }
    if (format === 'ranking') {
      const vals = cell.rankingValues
      return vals && vals.length > 0 ? vals.map((v, i) => `${i + 1}. ${v}`).join(' · ') : null
    }
    return null
  }

  return (
    <div className="rs-bars" data-testid={`category-bars-${catId}`}>
      {items.length === 0 && nonScaleItems.length === 0 && (
        <p className="muted small text-center py-4" data-testid={`cat-no-answers-bars-${catId}`}>
          {t('cat_no_answers')}
        </p>
      )}
      {items.map((displayItem) => {
        const isCustom = displayItem.startsWith('✶ ')
        const key = isCustom ? displayItem.slice(2) : displayItem
        const itemLabel = isCustom ? displayItem : getItemLabel(catId, key, lang)
        return (
          <div className="rs-bar-item" key={displayItem}>
            <div className="rs-bar-item-label" title={itemLabel}>
              {itemLabel}
            </div>
            <div className="rs-bar-item-rows">
              {truncated.map((ds, di) => {
                const cell = isCustom ? ds.answers[catId]?.__custom?.[key] : ds.answers[catId]?.[key]
                const step = cell ? ds.scale.find((s) => s.key === cell.scale) ?? null : null
                if (!step) {
                  return (
                    <div
                      key={di}
                      className="rs-bar-ds-row rs-bar-ds-row--empty"
                      data-testid={`bar-cell-empty-${di}-${displayItem}`}
                    >
                      <span className="rs-bar-ds-name" style={{ color: ds.color }}>{ds.name}</span>
                      <div className="rs-bar-track" />
                      <span className="rs-bar-label-text" />
                    </div>
                  )
                }
                const max = scaleMaxValue(ds.scale)
                const pct = max > 0 ? (step.value / max) * 100 : 0
                return (
                  <div
                    key={di}
                    className="rs-bar-ds-row"
                    data-testid={`bar-row-${di}-${displayItem}`}
                  >
                    <span
                      className="rs-bar-ds-name"
                      style={{ color: ds.color }}
                    >
                      {ds.name}
                    </span>
                    <div className="rs-bar-track">
                      <div
                        className="rs-bar-fill"
                        style={{ width: `${pct}%`, background: ds.color }}
                        title={ds.name}
                        data-testid={`bar-cell-${di}-${displayItem}`}
                      />
                    </div>
                    <span className="rs-bar-label-text">
                      {localizeStep(step, lang).label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {nonScaleItems.length > 0 && (
        <div className="rs-non-scale-section">
          {nonScaleItems.map((itemName) => (
            <div key={itemName} className="rs-non-scale-item">
              <div className="rs-non-scale-item-label">✶ {itemName}</div>
              {truncated.map((ds, di) => {
                const def = ds.customItemDefs?.[catId]?.[itemName]
                const cell = ds.answers[catId]?.__custom?.[itemName]
                const formatted = def ? formatNonScaleAnswer(cell, def.format) : null
                return (
                  <div key={di} className="rs-non-scale-answer-row">
                    <span className="rs-non-scale-answer-name" style={{ color: ds.color }}>{ds.name}</span>
                    {formatted
                      ? <span className="rs-non-scale-answer-val">{formatted}</span>
                      : <span className="rs-non-scale-empty">—</span>
                    }
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
