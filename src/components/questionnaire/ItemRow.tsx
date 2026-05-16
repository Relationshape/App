// QUEST-02. Per-item row used by ListMode. v1.0 itemRow around app.js:2330.
// Renders G/R/Both toggle, ScalePicker, optional note input, and hide/delete affordance.

import { useState } from 'react'
import { ScalePicker } from '@/components/ScalePicker'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/storage/store'
import type { Result, AnswerCell } from '@/lib/storage/types'
import { t } from '@/lib/i18n/i18n'

interface Props {
  result: Result
  catId: string
  item: string
  isCustom: boolean
  cell: AnswerCell | undefined
  onBeforeMutate: () => Promise<boolean>  // confirmIfTemplate
}

export function ItemRow({ result, catId, item, isCustom, cell, onBeforeMutate }: Props) {
  const saveResult = useStore((s) => s.saveResult)
  const storeScale = useStore((s) => s.scale)
  const scale = result.scale ?? storeScale
  const [note, setNote] = useState(cell?.note ?? '')

  async function setScaleKey(key: string) {
    if (!await onBeforeMutate()) return
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = slot.__custom ?? {}
      customs[item] = { ...(customs[item] ?? {}), scale: key } as AnswerCell
      slot.__custom = customs
    } else {
      slot[item] = { ...(slot[item] ?? {}), scale: key } as AnswerCell
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  async function setGR(gr: 'G' | 'R' | 'Both') {
    if (!await onBeforeMutate()) return
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
    if (!await onBeforeMutate()) return
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
    if (!await onBeforeMutate()) return
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    slot.__hidden = { ...(slot.__hidden ?? {}), [item]: true }
    next.answers[catId] = slot
    saveResult(next)
  }

  return (
    <div className="q-item-row border-b border-line py-3" data-testid={`item-row-${catId}-${item}`}>
      <div className="flex items-center gap-2 mb-2">
        <strong>{item}</strong>
        <div className="ml-auto flex gap-1" role="group" aria-label="G/R/Both">
          {(['G', 'R', 'Both'] as const).map((gr) => (
            <button
              key={gr}
              type="button"
              data-state={cell?.gr === gr ? 'active' : 'inactive'}
              onClick={() => setGR(gr)}
              className="px-2 py-1 text-xs border border-line rounded data-[state=active]:bg-accent"
              data-testid={`gr-${catId}-${item}-${gr}`}
            >{gr}</button>
          ))}
        </div>
      </div>
      <ScalePicker scale={scale} value={cell?.scale ?? null} onChange={setScaleKey} compact />
      <input
        type="text"
        placeholder={t('item_note_placeholder')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={commitNote}
        className="mt-2 w-full rounded border border-line px-2 py-1"
        data-testid={`item-note-${catId}-${item}`}
      />
      <Button variant="ghost" size="sm" onClick={hide} data-testid={`item-hide-${catId}-${item}`}>
        {t('btn_hide_item')}
      </Button>
    </div>
  )
}
