// Shared multi-step "add custom item" flow used by both the
// CategoryModal Edit tab and the ListMode questionnaire view.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScaleEditor } from '@/components/ScaleEditor'
import { dialog } from '@/lib/dialog/dialog'
import type { Result, CustomItemDef, CustomItemFormat } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'
import { localizeStep } from '@/lib/data/locale'
import { CATEGORIES as ALL_CATS } from '@/lib/data/data'
import { t, getLang } from '@/lib/i18n/i18n'

// ── Picker sub-components ────────────────────────────────────────────────────

export function FormatPicker({ onClose }: { onClose: (v: CustomItemFormat | false | 'back') => void }) {
  const formats: { key: CustomItemFormat; labelKey: 'q_format_scale' | 'q_format_text' | 'q_format_single' | 'q_format_multi' | 'q_format_ranking'; descKey: 'q_format_scale_desc' | 'q_format_text_desc' | 'q_format_single_desc' | 'q_format_multi_desc' | 'q_format_ranking_desc' }[] = [
    { key: 'scale', labelKey: 'q_format_scale', descKey: 'q_format_scale_desc' },
    { key: 'text', labelKey: 'q_format_text', descKey: 'q_format_text_desc' },
    { key: 'single', labelKey: 'q_format_single', descKey: 'q_format_single_desc' },
    { key: 'multi', labelKey: 'q_format_multi', descKey: 'q_format_multi_desc' },
    { key: 'ranking', labelKey: 'q_format_ranking', descKey: 'q_format_ranking_desc' },
  ]
  return (
    <div className="flex flex-col gap-2">
      {formats.map(({ key, labelKey, descKey }) => (
        <button
          key={key}
          type="button"
          className="format-picker-tile"
          onClick={() => onClose(key)}
        >
          <span className="format-picker-tile-label">{t(labelKey)}</span>
          <span className="format-picker-tile-desc muted small">{t(descKey)}</span>
        </button>
      ))}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => onClose('back')} data-testid="modal-format-picker-back">
          {t('btn_back')}
        </Button>
        <Button variant="ghost" onClick={() => onClose(false)} data-testid="modal-format-picker-cancel">
          {t('btn_cancel')}
        </Button>
      </div>
    </div>
  )
}

export function OptionsInput({ onClose }: { onClose: (v: string[] | false | 'back') => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(false)

  function submit() {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) { setError(true); return }
    onClose(lines)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="muted small">{t('q_add_custom_options_sub')}</p>
      <textarea
        autoFocus
        rows={6}
        className="w-full rounded border border-line px-2 py-1 font-mono text-sm"
        value={text}
        onChange={(e) => { setText(e.target.value); setError(false) }}
        data-testid="modal-options-input"
      />
      {error && <p className="text-sm text-destructive">{t('q_add_custom_options_min')}</p>}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => onClose('back')} data-testid="modal-options-back">
          {t('btn_back')}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onClose(false)} data-testid="modal-options-cancel">
            {t('btn_cancel')}
          </Button>
          <Button onClick={submit} data-testid="modal-options-ok">
            {t('btn_ok')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CustomScalePicker({
  defaultScale,
  onClose,
}: {
  defaultScale: MutableScaleStep[]
  onClose: (v: MutableScaleStep[] | 'default' | false) => void
}) {
  const lang = getLang()
  const [customizing, setCustomizing] = useState(false)
  const [customScale, setCustomScale] = useState<MutableScaleStep[]>(() => defaultScale.map((s) => ({ ...s })))

  return (
    <div className="flex flex-col gap-3">
      <p className="muted small">{t('q_add_custom_scale_sub')}</p>
      {!customizing ? (
        <>
          <div className="scale-preview-list">
            {defaultScale.map((s) => {
              const loc = localizeStep(s, lang)
              return (
                <div key={s.key} className="scale-preview-row">
                  <div className="scale-preview-swatch" style={{ background: s.color }} />
                  <span className="scale-preview-label">{loc.label}</span>
                  <span className="scale-preview-short">{loc.short}</span>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="ghost" onClick={() => onClose(false)} data-testid="modal-add-custom-scale-cancel">
              {t('btn_cancel')}
            </Button>
            <Button variant="ghost" onClick={() => setCustomizing(true)}>
              {t('q_add_custom_scale_customize')}
            </Button>
            <Button onClick={() => onClose('default')} data-testid="modal-add-custom-scale-default">
              {t('q_add_custom_scale_use_default')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="overflow-y-auto" style={{ maxHeight: '45vh' }}>
            <ScaleEditor scale={customScale} onChange={setCustomScale} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setCustomizing(false); setCustomScale(defaultScale.map((s) => ({ ...s }))) }}>
              {t('btn_back')}
            </Button>
            <Button onClick={() => onClose(customScale)} data-testid="modal-add-custom-scale-confirm">
              {t('btn_ok')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Shared flow ──────────────────────────────────────────────────────────────

export interface RunAddCustomItemFlowParams {
  result: Result
  catId: string
  scale: readonly MutableScaleStep[]
  onSave: (next: Result) => void
  onDuplicate: () => void
  storeTemplateWarningDisabled?: boolean
}

/**
 * Multi-step wizard: name → format → options (if applicable) → scale (if applicable).
 * Supports "Back" from the format step to re-enter the name.
 * All steps use dismissable: false so the X button always closes the entire flow.
 */
/** Returns the created item name on success, null if the user cancelled. */
export async function runAddCustomItemFlow({
  result,
  catId,
  scale,
  onSave,
  onDuplicate,
  storeTemplateWarningDisabled,
}: RunAddCustomItemFlowParams): Promise<string | null> {
  const slot = result.answers[catId] ?? {}
  let initialName = ''

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Step 1: name
    const nameCapture = initialName
    const nameResult = await dialog<string | null>({
      title: t('q_add_custom_title'),
      dismissable: false,
      body: (close) => {
        let value = nameCapture
        const submit = () => close(value.trim() || null)
        return (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              defaultValue={nameCapture}
              placeholder={t('q_add_custom_placeholder')}
              onChange={(e) => { value = e.target.value }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              className="w-full rounded border border-line px-2 py-1"
              data-testid="modal-add-custom-input"
            />
            <button
              type="button"
              onClick={submit}
              className="self-end px-3 py-1 rounded bg-accent text-on-accent"
              data-testid="modal-add-custom-ok"
            >
              {t('btn_ok')}
            </button>
          </div>
        )
      },
      actions: [{ label: t('btn_cancel'), kind: 'ghost', value: null }],
    })
    if (!nameResult) return null
    const name = nameResult

    const c = ALL_CATS.find((x) => x.id === catId)
    if ((c ? (c.items as readonly string[]).includes(name) : false) || (slot.__custom ?? {})[name]) {
      onDuplicate()
      return null
    }

    // Step 2: format selection + step 3: options (inner loop handles back from options → format)
    let format: CustomItemFormat | null = null
    let options: string[] | undefined
    let backToName = false

    while (true) {
      const fmtResult = await dialog<CustomItemFormat | false | 'back'>({
        title: t('q_add_custom_format_title'),
        dismissable: false,
        body: (close) => <FormatPicker onClose={close} />,
        actions: [],
      })
      // null = X button (cancel), false = cancel button, 'back' = go back to name step
      if (fmtResult === null || fmtResult === false) return null
      if (fmtResult === 'back') { backToName = true; break }

      format = fmtResult

      // Step 3: collect options for choice-based formats
      if (format === 'single' || format === 'multi' || format === 'ranking') {
        const rawOptions = await dialog<string[] | false | 'back'>({
          title: t('q_add_custom_options_title'),
          dismissable: false,
          body: (close) => <OptionsInput onClose={close} />,
          actions: [],
        })
        if (rawOptions === null || rawOptions === false) return null
        if (rawOptions === 'back') { format = null; continue }
        options = rawOptions
      }

      break
    }

    if (backToName) { initialName = name; continue }
    if (!format) continue

    // Step 4: scale selection (scale format only)
    let itemScale: MutableScaleStep[] | null = null
    if (format === 'scale') {
      const scaleResult = await dialog<MutableScaleStep[] | 'default' | false>({
        title: t('q_add_custom_scale_title'),
        dismissable: false,
        body: (close) => <CustomScalePicker defaultScale={scale as MutableScaleStep[]} onClose={close} />,
        actions: [],
      })
      // null = X button (cancel), false = cancel button, 'default' = use result scale
      if (scaleResult === null || scaleResult === false) return null
      itemScale = scaleResult === 'default' ? null : scaleResult
    }

    const next = structuredClone(result)
    if (storeTemplateWarningDisabled) next.templateWarningDisabled = true
    const ns = next.answers[catId] ?? {}
    const cell = (format === 'scale' && itemScale) ? { scale: 'open', itemScale } : { scale: 'open' }
    ns.__custom = { ...(ns.__custom ?? {}), [name]: cell }
    next.answers[catId] = ns

    if (format !== 'scale' || options) {
      const def: CustomItemDef = { format, ...(options ? { options } : {}) }
      next.customItemDefs = {
        ...(next.customItemDefs ?? {}),
        [catId]: {
          ...(next.customItemDefs?.[catId] ?? {}),
          [name]: def,
        },
      }
    }

    onSave(next)
    return name
  }
  return null
}
