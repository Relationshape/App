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

import { useState, useEffect, useRef } from 'react'
import { ScalePicker } from '@/components/ScalePicker'
import { ScaleEditor } from '@/components/ScaleEditor'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { getItemLabel } from '@/lib/data/locale'
import { isGrCat } from '@/lib/charts/items'
import type { AnswerCell, Result, CustomItemDef, CustomItemFormat } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'
import { t, getLang } from '@/lib/i18n/i18n'

interface Props {
  result: Result
  catId: string
  item: string
  isCustom: boolean
  cell: AnswerCell | undefined
  scale: readonly MutableScaleStep[]
  onBeforeMutate: () => Promise<boolean>
  variant: 'list' | 'single'
  onAnswered?: () => void
  onSave?: (next: Result) => void
  customItemDef?: CustomItemDef
  /** When true, automatically opens the edit dialog once (used after creating a new custom item). */
  autoOpenEdit?: boolean
  onAutoOpenDone?: () => void
  /** Ref set to true while a sub-dialog is open so parent modals don't close on interact-outside. */
  blockCloseRef?: React.MutableRefObject<boolean> | undefined
}

export function RsQuestionCard({
  result,
  catId,
  item,
  isCustom,
  cell,
  scale,
  onBeforeMutate,
  variant,
  onAnswered,
  onSave,
  customItemDef,
  autoOpenEdit,
  onAutoOpenDone,
  blockCloseRef,
}: Props) {
  const storeSaveResult = useStore((s) => s.saveResult)
  const saveResult = onSave ?? storeSaveResult
  // Read templateWarningDisabled reactively so saves don't overwrite it
  // when confirmIfTemplate sets it in the store before React re-renders.
  const storeTemplateWarningDisabled = useStore((s) =>
    s.results.find((r) => r.id === result.id)?.templateWarningDisabled ?? false
  )
  const [note, setNote] = useState(cell?.note ?? '')
  const [editOpen, setEditOpen] = useState(false)
  const wasAutoOpenedRef = useRef(false)
  const [pendingLabel, setPendingLabel] = useState('')
  const [pendingScale, setPendingScale] = useState<MutableScaleStep[] | null>(null)
  const [pendingFormat, setPendingFormat] = useState<CustomItemFormat>('scale')
  const [pendingOptions, setPendingOptions] = useState('')
  const [optionsError, setOptionsError] = useState(false)

  const format: CustomItemFormat = (isCustom && customItemDef?.format) ? customItemDef.format : 'scale'
  const showGR = isGrCat(catId) && format === 'scale'

  // Backward compat: old data stores GR answer in cell.gr + cell.scale; new data uses giving/receiving.
  const givingKey = cell?.giving ?? (cell?.gr === 'G' || cell?.gr === 'Both' ? (cell?.scale ?? null) : null)
  const givingFrac = cell?.givingFrac ?? (cell?.gr === 'G' || cell?.gr === 'Both' ? (cell?.scaleFrac ?? null) : null)
  const receivingKey = cell?.receiving ?? (cell?.gr === 'R' || cell?.gr === 'Both' ? (cell?.scale ?? null) : null)
  const receivingFrac = cell?.receivingFrac ?? (cell?.gr === 'R' || cell?.gr === 'Both' ? (cell?.scaleFrac ?? null) : null)

  const displayName = cell?.customLabel || (isCustom ? item : getItemLabel(catId, item, getLang()))

  function initEditDialog() {
    setPendingLabel(cell?.customLabel ?? '')
    setPendingScale(cell?.itemScale ? cell.itemScale.map((s) => ({ ...s })) : null)
    setPendingFormat(format)
    setPendingOptions(customItemDef?.options?.join('\n') ?? '')
    setOptionsError(false)
    setEditOpen(true)
  }

  async function openEditDialog() {
    const confirmed = await dialog<boolean>({
      title: t('confirm_item_scale_edit_title'),
      body: () => <p>{t('confirm_item_scale_edit_body')}</p>,
      actions: [
        { label: t('btn_cancel'), kind: 'ghost', value: false },
        { label: t('btn_continue'), kind: 'primary', value: true },
      ],
    })
    if (!confirmed) return
    initEditDialog()
  }

  useEffect(() => {
    if (autoOpenEdit) {
      wasAutoOpenedRef.current = true
      initEditDialog()
      onAutoOpenDone?.()
    }
  // initEditDialog reads from props/state captured at render time — stable enough for one-shot
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenEdit])

  function handleEditCancel() {
    if (wasAutoOpenedRef.current && isCustom) {
      const next = structuredClone(result)
      if (storeTemplateWarningDisabled) next.templateWarningDisabled = true
      const slot = next.answers[catId] ?? {}
      const customs = { ...(slot.__custom ?? {}) }
      delete customs[item]
      slot.__custom = customs
      if (next.customItemDefs?.[catId]?.[item]) {
        const defs = { ...next.customItemDefs }
        const catDefs = { ...defs[catId] }
        delete catDefs[item]
        defs[catId] = catDefs
        next.customItemDefs = defs
      }
      next.answers[catId] = slot
      saveResult(next)
    }
    wasAutoOpenedRef.current = false
    setEditOpen(false)
  }

  async function saveItemEdit() {
    wasAutoOpenedRef.current = false
    // Validate options if the pending format requires them
    const needsOptions = pendingFormat === 'single' || pendingFormat === 'multi' || pendingFormat === 'ranking'
    if (isCustom && needsOptions) {
      const lines = pendingOptions.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) { setOptionsError(true); return }
    }
    if (!(await onBeforeMutate())) { setEditOpen(false); return }
    const next = structuredClone(result)
    if (storeTemplateWarningDisabled) next.templateWarningDisabled = true
    const slot = next.answers[catId] ?? {}
    const formatChanged = isCustom && pendingFormat !== format

    function patchCell(existing: AnswerCell | undefined): AnswerCell {
      const c: AnswerCell = existing ? { ...existing } : { scale: 'open' }
      const label = pendingLabel.trim()
      if (label) c.customLabel = label; else delete c.customLabel
      if (!isCustom || pendingFormat === 'scale') {
        if (pendingScale) c.itemScale = pendingScale; else delete c.itemScale
      }
      // Clear answer fields when format changes
      if (formatChanged) {
        delete c.textValue
        delete c.selectedValues
        delete c.rankingValues
        if (pendingFormat !== 'scale') {
          c.scale = 'open'
          delete c.itemScale
        }
      }
      return c
    }

    if (isCustom) {
      slot.__custom = { ...(slot.__custom ?? {}), [item]: patchCell(slot.__custom?.[item]) }
      // Update customItemDef if format or options changed
      if (formatChanged || needsOptions) {
        const options = needsOptions
          ? pendingOptions.split('\n').map((l) => l.trim()).filter(Boolean)
          : undefined
        const newDef: CustomItemDef = { format: pendingFormat }
        if (options) newDef.options = options
        next.customItemDefs = {
          ...(next.customItemDefs ?? {}),
          [catId]: {
            ...((next.customItemDefs ?? {})[catId] ?? {}),
            [item]: newDef,
          },
        }
      }
    } else {
      slot[item] = patchCell(slot[item])
    }
    next.answers[catId] = slot
    saveResult(next)
    setEditOpen(false)
  }

  function patchCell(patch: Partial<AnswerCell>) {
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = slot.__custom ?? {}
      customs[item] = { ...(customs[item] ?? { scale: '' }), ...patch } as AnswerCell
      slot.__custom = customs
    } else {
      slot[item] = { ...(slot[item] ?? {}), ...patch } as AnswerCell
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  function setScaleKey(key: string, frac: number) {
    patchCell({ scale: key, scaleFrac: frac })
  }

  function setGiving(key: string, frac: number) {
    patchCell({ giving: key, givingFrac: frac })
  }

  function setReceiving(key: string, frac: number) {
    patchCell({ receiving: key, receivingFrac: frac })
  }

  function clearGiving() {
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    const existing = isCustom ? (slot.__custom ?? {})[item] : slot[item]
    if (!existing) return
    const updated: AnswerCell = { ...existing }
    delete updated.giving
    delete updated.givingFrac
    if (isCustom) {
      const customs = slot.__custom ?? {}
      customs[item] = updated
      slot.__custom = customs
    } else {
      slot[item] = updated
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  function clearReceiving() {
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    const existing = isCustom ? (slot.__custom ?? {})[item] : slot[item]
    if (!existing) return
    const updated: AnswerCell = { ...existing }
    delete updated.receiving
    delete updated.receivingFrac
    if (isCustom) {
      const customs = slot.__custom ?? {}
      customs[item] = updated
      slot.__custom = customs
    } else {
      slot[item] = updated
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  function clearAnswer() {
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = { ...(slot.__custom ?? {}) }
      customs[item] = { scale: '' }
      slot.__custom = customs
    } else {
      delete slot[item]
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  function resetNonScaleAnswer() {
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    const customs = { ...(slot.__custom ?? {}) }
    customs[item] = { scale: '' }
    slot.__custom = customs
    next.answers[catId] = slot
    saveResult(next)
  }

  function saveNonScaleAnswer(patch: Partial<AnswerCell>) {
    const next = structuredClone(result)
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = slot.__custom ?? {}
      customs[item] = { ...(customs[item] ?? { scale: 'open' }), ...patch } as AnswerCell
      slot.__custom = customs
    } else {
      slot[item] = { ...(slot[item] ?? { scale: 'open' }), ...patch } as AnswerCell
    }
    next.answers[catId] = slot
    saveResult(next)
  }

  function commitNote() {
    if (note === (cell?.note ?? '')) return
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
    if (blockCloseRef) blockCloseRef.current = true
    let confirmed: boolean | null = false
    try {
      confirmed = await dialog<boolean>({
        title: t('confirm_hide_item_title'),
        body: () => <p>{t('confirm_hide_item_body')}</p>,
        actions: [
          { label: t('btn_cancel'), kind: 'ghost', value: false },
          { label: t('btn_delete'), kind: 'danger', value: true },
        ],
      })
    } finally {
      if (blockCloseRef) blockCloseRef.current = false
    }
    if (!confirmed) return
    const next = structuredClone(result)
    if (storeTemplateWarningDisabled) next.templateWarningDisabled = true
    const slot = next.answers[catId] ?? {}
    if (isCustom) {
      const customs = { ...(slot.__custom ?? {}) }
      delete customs[item]
      slot.__custom = customs
      // Clean up customItemDef for this item
      if (next.customItemDefs?.[catId]?.[item]) {
        const defs = { ...next.customItemDefs }
        const catDefs = { ...defs[catId] }
        delete catDefs[item]
        defs[catId] = catDefs
        next.customItemDefs = defs
      }
    } else {
      slot.__hidden = { ...(slot.__hidden ?? {}), [item]: true }
      delete (slot as Record<string, unknown>)[item]
    }
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
        setScaleKey(step.key, frac); onAnswered?.()
        return
      }
      if (d === N + 1) {
        e.preventDefault()
        clearAnswer(); onAnswered?.()
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
    <>
      <div
        className="q-item"
        tabIndex={variant === 'list' ? 0 : -1}
        onKeyDown={onKeyDown}
        data-testid={`item-row-${catId}-${item}`}
        data-item-key={item}
        data-cat-id={catId}
      >
        <div className="q-item-name">
          <strong>{displayName}</strong>
        </div>

        {isCustom && format !== 'scale' && (
          <p className="q-format-badge">
            {t(`q_format_${format}_badge` as Parameters<typeof t>[0])}
          </p>
        )}

        {format === 'scale' ? (
          showGR ? (
            <div className="q-gr-sliders">
              <div className="q-gr-row">
                <span className="q-gr-label">{t('lbl_giving')}</span>
                <ScalePicker
                  scale={cell?.itemScale ?? scale}
                  value={givingKey}
                  valueFrac={givingFrac}
                  onChange={setGiving}
                  onClear={clearGiving}
                  compact={variant === 'list'}
                />
              </div>
              <div className="q-gr-row">
                <span className="q-gr-label">{t('lbl_receiving')}</span>
                <ScalePicker
                  scale={cell?.itemScale ?? scale}
                  value={receivingKey}
                  valueFrac={receivingFrac}
                  onChange={setReceiving}
                  onClear={clearReceiving}
                  compact={variant === 'list'}
                />
              </div>
            </div>
          ) : (
            <div className="q-slider-wrap">
              <ScalePicker
                scale={cell?.itemScale ?? scale}
                value={cell?.scale ?? null}
                valueFrac={cell?.scaleFrac ?? null}
                onChange={setScaleKey}
                onClear={clearAnswer}
                compact={variant === 'list'}
              />
            </div>
          )
        ) : format === 'text' ? (
          <NonScaleTextAnswer cell={cell} onSave={saveNonScaleAnswer} />
        ) : format === 'single' || format === 'multi' ? (
          <NonScaleSelectionAnswer
            format={format}
            options={customItemDef?.options ?? []}
            cell={cell}
            onSave={saveNonScaleAnswer}
          />
        ) : (
          <NonScaleRankingAnswer
            options={customItemDef?.options ?? []}
            cell={cell}
            onSave={saveNonScaleAnswer}
          />
        )}

        <div className="q-item-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { void openEditDialog() }}
            data-testid={`item-edit-${catId}-${item}`}
          >
            {t('item_edit_scale')}
          </Button>
          {variant === 'list' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={hide}
              data-testid={`item-hide-${catId}-${item}`}
            >
              {t('btn_hide_item')}
            </Button>
          )}
          {isCustom && format === 'text' && !!cell?.textValue && (
            <Button variant="ghost" size="sm" onClick={resetNonScaleAnswer} data-testid={`item-reset-${catId}-${item}`}>
              {t('q_slider_reset')}
            </Button>
          )}
          {isCustom && (format === 'single' || format === 'multi') && (cell?.selectedValues?.length ?? 0) > 0 && (
            <Button variant="ghost" size="sm" onClick={resetNonScaleAnswer} data-testid={`item-reset-${catId}-${item}`}>
              {t('q_slider_reset')}
            </Button>
          )}
          {isCustom && format === 'ranking' && (cell?.rankingValues?.length ?? 0) > 0 && (
            <Button variant="ghost" size="sm" onClick={resetNonScaleAnswer} data-testid={`item-reset-${catId}-${item}`}>
              {t('q_slider_reset')}
            </Button>
          )}
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

      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) handleEditCancel() }}>
        <DialogContent className="max-w-2xl flex flex-col" style={{ maxHeight: 'min(90vh, 800px)' }}>
          <DialogHeader>
            <DialogTitle>{t('q_edit_item_scale')}: {displayName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 py-2 pr-1">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t('q_item_rename_label')}</span>
              <input
                type="text"
                className="rounded border border-line px-2 py-1"
                placeholder={item}
                value={pendingLabel}
                onChange={(e) => setPendingLabel(e.target.value)}
                data-testid={`item-edit-label-${catId}-${item}`}
              />
            </label>
            {isCustom && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">{t('q_edit_format_section')}</span>
                <div className="flex flex-col gap-1">
                  {(['scale', 'text', 'single', 'multi', 'ranking'] as CustomItemFormat[]).map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`edit-format-${catId}-${item}`}
                        value={f}
                        checked={pendingFormat === f}
                        onChange={() => { setPendingFormat(f); setOptionsError(false) }}
                        data-testid={`item-edit-format-${f}-${catId}-${item}`}
                      />
                      <span className="text-sm">{t(`q_format_${f}` as Parameters<typeof t>[0])}</span>
                    </label>
                  ))}
                </div>
                {pendingFormat !== 'scale' && (
                  <p className="callout text-sm">{t('q_format_non_scale_hint')}</p>
                )}
                {pendingFormat !== format && (
                  <p className="text-sm text-destructive">{t('q_edit_format_change_warn')}</p>
                )}
                {(pendingFormat === 'single' || pendingFormat === 'multi' || pendingFormat === 'ranking') && (
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{t('q_edit_format_options_label')}</span>
                    <textarea
                      rows={5}
                      className="w-full rounded border border-line px-2 py-1 font-mono text-sm"
                      value={pendingOptions}
                      onChange={(e) => { setPendingOptions(e.target.value); setOptionsError(false) }}
                      data-testid={`item-edit-options-${catId}-${item}`}
                    />
                    {optionsError && <p className="text-sm text-destructive">{t('q_edit_format_options_min')}</p>}
                  </label>
                )}
              </div>
            )}
            {(!isCustom || pendingFormat === 'scale') && (
              <div className="flex flex-col gap-2">
                <p className="muted text-sm">{t('q_edit_item_scale_warning')}</p>
                <ScaleEditor
                  key={`${catId}-${item}`}
                  scale={pendingScale ?? scale}
                  onChange={setPendingScale}
                />
                {pendingScale && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() => setPendingScale(null)}
                    data-testid={`item-scale-reset-${catId}-${item}`}
                  >
                    {t('q_item_scale_reset')}
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleEditCancel}>{t('btn_cancel')}</Button>
            <Button
              onClick={() => { void saveItemEdit() }}
              data-testid={`item-edit-save-${catId}-${item}`}
            >
              {t('btn_save_changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Non-scale answer sub-components ──────────────────────────────────────────

export function NonScaleTextAnswer({ cell, onSave }: { cell: AnswerCell | undefined; onSave: (p: Partial<AnswerCell>) => void }) {
  const [val, setVal] = useState(cell?.textValue ?? '')
  useEffect(() => { setVal(cell?.textValue ?? '') }, [cell?.textValue])
  return (
    <div className="q-non-scale-wrap">
      <textarea
        className="q-text-answer"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onSave({ textValue: val })}
        placeholder={t('q_text_answer_placeholder')}
        rows={2}
      />
    </div>
  )
}

export function NonScaleSelectionAnswer({ format, options, cell, onSave }: {
  format: 'single' | 'multi'
  options: string[]
  cell: AnswerCell | undefined
  onSave: (p: Partial<AnswerCell>) => void
}) {
  const selected = new Set(cell?.selectedValues ?? [])
  function toggle(opt: string) {
    if (format === 'single') {
      onSave({ selectedValues: selected.has(opt) ? [] : [opt] })
    } else {
      const next = new Set(selected)
      if (next.has(opt)) next.delete(opt); else next.add(opt)
      onSave({ selectedValues: Array.from(next) })
    }
  }
  return (
    <div className="q-non-scale-wrap">
      <div className="q-option-list">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`q-option-row${selected.has(opt) ? ' is-selected' : ''}`}
            onClick={() => toggle(opt)}
            aria-pressed={selected.has(opt)}
          >
            <span className={`q-option-indicator q-option-indicator--${format}`} aria-hidden="true">
              {format === 'single'
                ? (selected.has(opt) ? <span className="q-option-dot" /> : null)
                : (selected.has(opt) ? '✓' : null)
              }
            </span>
            <span className="q-option-label">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function NonScaleRankingAnswer({ options, cell, onSave }: {
  options: string[]
  cell: AnswerCell | undefined
  onSave: (p: Partial<AnswerCell>) => void
}) {
  // Show all items ranked from the start in their defined order.
  // saved = explicitly ranked; append any options not yet in the saved list.
  const saved = cell?.rankingValues ?? []
  const effective = [...saved, ...options.filter((o) => !saved.includes(o))]

  function move(index: number, dir: 1 | -1) {
    const next = [...effective]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    onSave({ rankingValues: next })
  }

  return (
    <div className="q-non-scale-wrap">
      <div className="q-ranking-list">
        {effective.map((opt, i) => (
          <div key={opt} className="q-ranking-row">
            <span className="q-ranking-pos">{i + 1}.</span>
            <span className="q-ranking-label">{opt}</span>
            <button type="button" className="btn-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Up">↑</button>
            <button type="button" className="btn-icon" onClick={() => move(i, 1)} disabled={i === effective.length - 1} aria-label="Down">↓</button>
          </div>
        ))}
      </div>
    </div>
  )
}
