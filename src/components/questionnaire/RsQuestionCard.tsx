// List-mode question row (rendered inside .q-items by ListMode).
// Legacy parity: rounded .q-item row with title + Edit Item/Scale link,
// ScalePicker slider, optional .q-note textarea, Reset, and (when the cat has
// GR) G/R/Both toggle. SingleMode renders its own hero card (.q-card) — do
// NOT add the `.q-card` class here; that class is the absolute-positioned
// single-card layout and would collapse all list rows into one stack.
//
// Keyboard (list variant only, when the outer .q-item is focused):
//   1..N    → set scale step at i/(N-1) and call onAnswered
//   N+1     → clear answer
//   Enter / ArrowDown → focus next .q-item
//   ArrowUp           → focus previous .q-item

import { useState } from 'react'
import { ScalePicker } from '@/components/ScalePicker'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/storage/store'
import { CATEGORIES } from '@/lib/data/data'
import type { AnswerCell, Result } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'
import { t } from '@/lib/i18n/i18n'

interface Props {
  result: Result
  catId: string
  item: string
  isCustom: boolean
  cell: AnswerCell | undefined
  scale: readonly MutableScaleStep[]
  onBeforeMutate: () => Promise<boolean>
  onEditItemScale?: () => void
  variant: 'list' | 'single'
  onAnswered?: () => void
  onSave?: (next: Result) => void
}

export function RsQuestionCard({
  result,
  catId,
  item,
  isCustom,
  cell,
  scale,
  onBeforeMutate,
  onEditItemScale,
  variant,
  onAnswered,
  onSave,
}: Props) {
  const storeSaveResult = useStore((s) => s.saveResult)
  const saveResult = onSave ?? storeSaveResult
  const [note, setNote] = useState(cell?.note ?? '')

  const catDef = CATEGORIES.find((c) => c.id === catId)
  const showGR = variant === 'list' && Boolean((catDef as { gr?: boolean } | undefined)?.gr)

  async function setScaleKey(key: string, frac: number) {
    if (!(await onBeforeMutate())) return
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = slot.__custom ?? {}
      customs[item] = { ...(customs[item] ?? {}), scale: key, scaleFrac: frac } as AnswerCell
      slot.__custom = customs
    } else {
      slot[item] = { ...(slot[item] ?? {}), scale: key, scaleFrac: frac } as AnswerCell
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  async function clearAnswer() {
    if (!(await onBeforeMutate())) return
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = { ...(slot.__custom ?? {}) }
      delete customs[item]
      slot.__custom = customs
    } else {
      delete slot[item]
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  async function setGR(gr: 'G' | 'R' | 'Both') {
    if (!(await onBeforeMutate())) return
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = slot.__custom ?? {}
      customs[item] = { ...(customs[item] ?? { scale: 'open' }), gr } as AnswerCell
      slot.__custom = customs
    } else {
      slot[item] = { ...(slot[item] ?? { scale: 'open' }), gr } as AnswerCell
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  async function commitNote() {
    if (note === (cell?.note ?? '')) return
    if (!(await onBeforeMutate())) return
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = slot.__custom ?? {}
      customs[item] = { ...(customs[item] ?? { scale: 'open' }), note } as AnswerCell
      slot.__custom = customs
    } else {
      slot[item] = { ...(slot[item] ?? { scale: 'open' }), note } as AnswerCell
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  async function hide() {
    if (!(await onBeforeMutate())) return
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    slot.__hidden = { ...(slot.__hidden ?? {}), [item]: true }
    next.answers[catId] = slot
    saveResult(next)
  }

  function focusSibling(dir: 1 | -1) {
    const all = Array.from(document.querySelectorAll<HTMLElement>('.q-item'))
    const me = all.findIndex((el) => el.getAttribute('data-item-key') === item && el.getAttribute('data-cat-id') === catId)
    if (me === -1) return
    const target = all[me + dir]
    if (target) target.focus()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (variant !== 'list') return
    if (e.target !== e.currentTarget) return
    const N = scale.length
    if (!N) return
    if (/^[0-9]$/.test(e.key)) {
      const d = Number(e.key)
      if (d >= 1 && d <= N) {
        e.preventDefault()
        const idx = d - 1
        const frac = N > 1 ? idx / (N - 1) : 0
        const step = scale[idx]!
        void setScaleKey(step.key, frac).then(() => onAnswered?.())
        return
      }
      if (d === N + 1) {
        e.preventDefault()
        void clearAnswer().then(() => onAnswered?.())
        return
      }
    }
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusSibling(1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusSibling(-1)
    }
  }

  return (
    <div
      className="q-item"
      tabIndex={variant === 'list' ? 0 : -1}
      onKeyDown={onKeyDown}
      data-testid={`item-row-${catId}-${item}`}
      data-item-key={item}
      data-cat-id={catId}
    >
      <div className="q-item-name">
        <strong>{item}</strong>
        {onEditItemScale && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditItemScale}
            data-testid={`item-edit-scale-${catId}-${item}`}
          >
            {t('item_edit_scale')}
          </Button>
        )}
        {variant === 'list' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={hide}
            data-testid={`item-hide-${catId}-${item}`}
            className="ml-auto"
          >
            {t('btn_hide_item')}
          </Button>
        )}
      </div>

      {showGR && (
        <div className="q-gr-sliders" role="group" aria-label="G/R/Both">
          {(['G', 'R', 'Both'] as const).map((gr) => (
            <button
              key={gr}
              type="button"
              data-state={cell?.gr === gr ? 'active' : 'inactive'}
              onClick={() => setGR(gr)}
              className="px-2 py-1 text-xs border border-line rounded data-[state=active]:bg-accent"
              data-testid={`gr-${catId}-${item}-${gr}`}
            >
              {gr}
            </button>
          ))}
        </div>
      )}

      <div className="q-slider-wrap">
        <ScalePicker
          scale={scale}
          value={cell?.scale ?? null}
          valueFrac={cell?.scaleFrac ?? null}
          onChange={setScaleKey}
          onClear={clearAnswer}
          compact={variant === 'list'}
        />
      </div>

      <textarea
        placeholder={t('item_note_placeholder')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={commitNote}
        className="q-note"
        rows={2}
        data-testid={`item-note-${catId}-${item}`}
      />
    </div>
  )
}
