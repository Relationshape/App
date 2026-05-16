// SETTINGS-01/03. Reusable scale editor for global and per-map. Port of public/legacy/js/app.js:3555-3590.
import { useState } from 'react'
import type { MutableScaleStep } from '@/lib/data/types'
import { Button } from '@/components/ui/button'
import { RsTile } from '@/components/RsTile'
import { dialog } from '@/lib/dialog/dialog'
import { t } from '@/lib/i18n/i18n'

interface Props {
  scale: readonly MutableScaleStep[]
  onChange: (next: MutableScaleStep[]) => void
  /** Optional check whether a key has existing answers — if true, deletion needs confirmation. */
  hasData?: (key: string) => boolean
}

function freshStep(idx: number): MutableScaleStep {
  return {
    key: `step-${Date.now()}-${idx}`,
    label: 'New step',
    short: 'New',
    value: idx,
    color: '#7c3aed',
    description: '',
  }
}

export function ScaleEditor({ scale, onChange, hasData }: Props) {
  const [local, setLocal] = useState<MutableScaleStep[]>(() => scale.map((s) => ({ ...s })))

  function commit(next: MutableScaleStep[]) {
    setLocal(next)
    onChange(next)
  }
  function setField(i: number, patch: Partial<MutableScaleStep>) {
    const next = local.map((s, j) => (j === i ? { ...s, ...patch } : s))
    commit(next)
  }
  function swap(i: number, j: number) {
    if (i < 0 || j < 0 || i >= local.length || j >= local.length) return
    const next = local.slice()
    const a = next[i]!
    next[i] = next[j]!
    next[j] = a
    commit(next)
  }
  async function removeAt(i: number) {
    if (local.length <= 2) return
    const step = local[i]!
    if (hasData?.(step.key)) {
      const ok = await dialog<boolean>({
        title: t('scale_step_remove_confirm', { label: step.label }),
        body: <p>{t('scale_step_remove_confirm', { label: step.label })}</p>,
        actions: [
          { label: t('btn_cancel'), kind: 'ghost', value: false },
          { label: t('btn_delete'), kind: 'danger', value: true },
        ],
      })
      if (!ok) return
    }
    const next = local.filter((_, j) => j !== i)
    commit(next)
  }
  function addStep() {
    const idx = local.length
    commit([...local, freshStep(idx)])
  }

  return (
    <div className="scale-editor" data-testid="scale-editor">
      {local.map((s, i) => (
        <RsTile
          plain
          key={s.key}
          color={s.color}
          className="scale-row"
          testId={`scale-row-${s.key}`}
        >
          <span className="scale-row-rank">{local.length - i}</span>
          <input
            type="color"
            className="scale-row-color"
            value={s.color}
            onChange={(e) => setField(i, { color: e.target.value })}
            aria-label={t('scale_step_color')}
            data-testid={`scale-color-${s.key}`}
          />
          <input
            type="text"
            className="scale-row-label"
            value={s.label}
            onChange={(e) => setField(i, { label: e.target.value })}
            placeholder={t('scale_step_label')}
            data-testid={`scale-label-${s.key}`}
          />
          <input
            type="text"
            className="scale-row-short"
            value={s.short ?? ''}
            onChange={(e) => setField(i, { short: e.target.value.slice(0, 24) })}
            placeholder={t('scale_step_short')}
            maxLength={24}
            data-testid={`scale-short-${s.key}`}
          />
          <input
            type="number"
            className="scale-row-value"
            value={s.value}
            onChange={(e) => setField(i, { value: Number(e.target.value) })}
            data-testid={`scale-value-${s.key}`}
          />
          <input
            type="text"
            className="scale-row-desc"
            value={s.description ?? ''}
            onChange={(e) => setField(i, { description: e.target.value })}
            placeholder={t('scale_step_description')}
            data-testid={`scale-desc-${s.key}`}
          />
          <div className="scale-row-actions">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={i === 0}
              onClick={() => swap(i, i - 1)}
              aria-label="Move up"
              data-testid={`scale-up-${s.key}`}
            >↑</Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={i === local.length - 1}
              onClick={() => swap(i, i + 1)}
              aria-label="Move down"
              data-testid={`scale-down-${s.key}`}
            >↓</Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={local.length <= 2}
              onClick={() => removeAt(i)}
              aria-label="Remove"
              data-testid={`scale-remove-${s.key}`}
            >🗑</Button>
          </div>
        </RsTile>
      ))}
      <Button type="button" variant="outline" onClick={addStep} data-testid="scale-add-step">
        {t('scale_step_add')}
      </Button>
    </div>
  )
}
