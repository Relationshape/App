// Per-category modal with Spider | Items | Edit tabs.
// Port of public/legacy/js/app.js:2879-3050 openCategoryModal.
// Built on shadcn Dialog. Legacy `cat-modal-*` CSS in legacy-components.css.

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ItemSpider } from './ItemSpider'
import { CategoryBars } from './CategoryBars'
import { RsQuestionCard } from '@/components/questionnaire/RsQuestionCard'
import { ScaleEditor } from '@/components/ScaleEditor'
import { useStore } from '@/lib/storage/store'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import { enabledItemsForCat } from '@/lib/charts/items'
import { dialog } from '@/lib/dialog/dialog'
import { useToast } from '@/lib/hooks/useToast'
import type { ChartDataset } from './types'
import type { CATEGORIES } from '@/lib/data/data'
import type { Result, CustomItemDef, CustomItemFormat } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'
import { localizeStep } from '@/lib/data/locale'
import { t, getLang } from '@/lib/i18n/i18n'
import { CATEGORIES as ALL_CATS } from '@/lib/data/data'

type CategoryDef = (typeof CATEGORIES)[number]
type Tab = 'spider' | 'items' | 'edit'

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  datasets: readonly ChartDataset[]
  cat: CategoryDef | null
  /** When provided, the Edit Answers tab is shown and answers are saved to this result. */
  result?: Result | null
  /** Tab to open on when the modal first becomes visible. Defaults to 'spider'. */
  initialTab?: Tab
}

export function CategoryModal({ open, onOpenChange, datasets, cat, result, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'spider')
  const [spiderEnlarged, setSpiderEnlarged] = useState(false)
  const lang = getLang()
  const showEdit = Boolean(result)
  const saveStore = useStore((s) => s.saveResult)
  const { toast } = useToast()

  // Local answer state for the Edit tab
  const [localResult, setLocalResult] = useState<Result | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  // Guards against re-entrant confirmDiscard calls AND addCustom flows:
  // onInteractOutside fires for every click inside any portal dialog (treated
  // as "outside" the modal), which would otherwise close the main modal while
  // a sub-dialog is open.
  const confirmingRef = useRef(false)
  const addingCustomRef = useRef(false)

  // When edit tab opens, clone the result into local state.
  useEffect(() => {
    if (tab === 'edit' && result) {
      setLocalResult(structuredClone(result))
      setIsDirty(false)
    }
    // only watch tab change to avoid resetting while typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // After an immediate save the store result changes while isDirty is false —
  // resync localResult so the spider sees fresh data when switching tabs.
  useEffect(() => {
    if (tab === 'edit' && result && !isDirty) {
      setLocalResult(structuredClone(result))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  function handleLocalChange(next: Result) {
    setLocalResult(next)
    setIsDirty(true)
  }

  function handleImmediateSave(next: Result) {
    saveStore(next)
    setLocalResult(next)
    setIsDirty(false)
  }

  function doSave() {
    if (!localResult || !isDirty) return
    saveStore(localResult)
    setIsDirty(false)
    toast.success(t('btn_save_changes') + ' ✔')
  }

  async function confirmDiscard(): Promise<boolean> {
    if (confirmingRef.current) return false
    confirmingRef.current = true
    try {
      const choice = await dialog<string | null>({
        title: t('confirm_discard_changes') as string,
        body: () => null,
        actions: [
          { label: t('btn_cancel') as string, kind: 'ghost', value: null },
          { label: t('btn_discard') as string, kind: 'danger', value: 'discard' },
          { label: t('btn_save_changes') as string, kind: 'primary', value: 'save' },
        ],
      })
      if (!choice || choice === null) return false
      if (choice === 'save') { doSave(); return true }
      if (choice === 'discard') { setIsDirty(false); return true }
      return false
    } finally {
      confirmingRef.current = false
    }
  }

  async function handleTabChange(newTab: Tab) {
    if (isDirty && tab === 'edit' && newTab !== 'edit') {
      const ok = await confirmDiscard()
      if (!ok) return
    }
    setTab(newTab)
  }

  async function handleOpenChange(next: boolean) {
    if (!next && isDirty) {
      const ok = await confirmDiscard()
      if (!ok) return
    }
    if (!next) { setTab(initialTab ?? 'spider'); setIsDirty(false) }
    onOpenChange(next)
  }

  // Sync tab when the modal opens with a new initialTab
  useEffect(() => {
    if (open) setTab(initialTab ?? 'spider')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!cat) {
    return (
      <Dialog open={open} onOpenChange={(o) => { void handleOpenChange(o) }}>
        <DialogContent
          className="max-w-[min(820px,96vw)] max-h-[min(90vh,900px)] p-0 overflow-hidden flex flex-col gap-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Category</DialogTitle>
        </DialogContent>
      </Dialog>
    )
  }

  const title = lang === 'de' && cat.de ? cat.de : cat.title
  const blurb = lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb

  return (
    <Dialog open={open} onOpenChange={(o) => { void handleOpenChange(o) }}>
      <DialogContent
        className="max-w-[min(820px,96vw)] max-h-[min(90vh,900px)] p-0 overflow-hidden flex flex-col gap-0"
        style={{ ['--c' as 'color']: cat.color } as React.CSSProperties}
        showCloseButton={false}
        data-testid="category-modal"
        onPointerDownOutside={(e) => { if (isDirty || confirmingRef.current) e.preventDefault() }}
        onInteractOutside={(e) => { e.preventDefault(); if (!confirmingRef.current && !addingCustomRef.current) void handleOpenChange(false) }}
      >
        {/* Header row */}
        <div className="cat-modal-head-row">
          <div className="cat-modal-icon-wrap">
            <span className="cat-modal-icon" aria-hidden="true">{cat.icon}</span>
            <div>
              <DialogTitle asChild>
                <h2 className="cat-modal-title">{title}</h2>
              </DialogTitle>
              <p className="muted small">{blurb}</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="cat-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'spider'}
            className={`cat-modal-tab${tab === 'spider' ? ' active' : ''}`}
            onClick={() => { void handleTabChange('spider') }}
            data-testid="cat-modal-tab-spider"
          >
            {t('tab_spider')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'items'}
            className={`cat-modal-tab${tab === 'items' ? ' active' : ''}`}
            onClick={() => { void handleTabChange('items') }}
            data-testid="cat-modal-tab-items"
          >
            {t('tab_items')}
          </button>
          {showEdit && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'edit'}
              className={`cat-modal-tab${tab === 'edit' ? ' active' : ''}`}
              onClick={() => { void handleTabChange('edit') }}
              data-testid="cat-modal-tab-edit"
            >
              {t('tab_edit')}
            </button>
          )}
        </div>

        {/* Tab content */}
        {tab === 'spider' ? (
          <div
            className="cat-modal-spider cat-modal-content"
            role="tabpanel"
            data-testid="cat-modal-panel-spider"
          >
            <button
              type="button"
              className="cat-modal-spider-enlarge-btn"
              onClick={() => setSpiderEnlarged(true)}
              data-testid="cat-modal-spider-enlarge"
              aria-label={t('spider_click_to_enlarge') as string}
              title={t('spider_click_to_enlarge') as string}
            >
              <ItemSpider datasets={datasets} catId={cat.id} size={520} />
              <span className="cat-modal-spider-hint" aria-hidden="true">
                ⊞ {t('spider_click_to_enlarge')}
              </span>
            </button>
            <p className="muted small text-center mt-1" style={{ opacity: 0.6 }} data-testid="spider-scale-only-hint">
              {t('spider_scale_only_hint')}
            </p>
            <Dialog open={spiderEnlarged} onOpenChange={setSpiderEnlarged}>
              <DialogContent
                className="max-w-[min(1400px,96vw)] max-h-[min(96vh,1400px)] p-4 overflow-auto"
                data-testid="cat-modal-spider-fullscreen"
              >
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <ItemSpider datasets={datasets} catId={cat.id} size={1200} />
                <p className="text-center muted small mt-3" style={{ opacity: 0.65 }}>
                  {t('spider_hover_hint')}
                </p>
                <p className="text-center muted small mt-1" style={{ opacity: 0.5 }}>
                  {t('spider_scale_only_hint')}
                </p>
              </DialogContent>
            </Dialog>
          </div>
        ) : tab === 'items' ? (
          <div
            className="cat-modal-bars-scroll cat-modal-content"
            role="tabpanel"
            data-testid="cat-modal-panel-items"
          >
            <CategoryBars datasets={datasets} catId={cat.id} />
          </div>
        ) : (
          result && localResult && (
            <div
              className="cat-modal-content cat-modal-bars-scroll"
              role="tabpanel"
              data-testid="cat-modal-panel-edit"
            >
              <EditTabContent result={localResult} cat={cat} onLocalChange={handleLocalChange} onImmediateSave={handleImmediateSave} addingRef={addingCustomRef} />
            </div>
          )
        )}

        {/* Footer */}
        <div className="rs-modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { void handleOpenChange(false) }}
            data-testid="cat-modal-close"
          >
            {t('btn_close')}
          </button>
          {tab === 'edit' && showEdit && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isDirty}
              onClick={doSave}
              data-testid="cat-modal-save"
            >
              {t('btn_save_changes')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit tab content ──────────────────────────────────────────────────────────
// Isolated component so hooks (useStore, useTemplateWarning, useToast) are
// always called in stable order regardless of which tab is active.

interface EditTabProps {
  result: Result
  cat: CategoryDef
  onLocalChange?: (next: Result) => void
  onImmediateSave?: (next: Result) => void
  addingRef?: React.MutableRefObject<boolean>
}

function EditTabContent({ result, cat, onLocalChange, onImmediateSave, addingRef }: EditTabProps) {
  const saveResult = useStore((s) => s.saveResult)
  const storeScale = useStore((s) => s.scale)
  const storeTemplateWarningDisabled = useStore((s) =>
    s.results.find((r) => r.id === result.id)?.templateWarningDisabled ?? false
  )
  const { confirmIfTemplate } = useTemplateWarning(result)
  const { toast } = useToast()
  const lang = getLang()

  const scale = result.scale ?? storeScale
  const { base, custom } = enabledItemsForCat(result.answers, cat.id)
  const slot = result.answers[cat.id] ?? {}

  async function addCustom() {
    if (!await confirmIfTemplate()) return
    if (addingRef) addingRef.current = true
    try {
      await runAddCustom()
    } finally {
      if (addingRef) addingRef.current = false
    }
  }

  async function runAddCustom() {
    // Step 1: name
    const name = await dialog<string | null>({
      title: t('q_add_custom_title'),
      dismissable: false,
      body: (close) => {
        let value = ''
        const submit = () => close(value.trim() || null)
        return (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
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
    if (!name) return

    const c = ALL_CATS.find((x) => x.id === cat.id)!
    if ((c.items as readonly string[]).includes(name) || (slot.__custom ?? {})[name]) {
      toast.message(t('q_item_already_exists'))
      return
    }

    // Step 2: format selection
    const format = await dialog<CustomItemFormat | false>({
      title: t('q_add_custom_format_title'),
      dismissable: false,
      body: (close) => <FormatPicker onClose={close} />,
      actions: [],
    })
    if (!format) return

    // Step 3: for single/multi/ranking, collect options
    let options: string[] | undefined
    if (format === 'single' || format === 'multi' || format === 'ranking') {
      const rawOptions = await dialog<string[] | false>({
        title: t('q_add_custom_options_title'),
        dismissable: false,
        body: (close) => <OptionsInput onClose={close} />,
        actions: [],
      })
      if (!rawOptions) return
      options = rawOptions
    }

    // Step 4 (only for scale format): scale selection
    // dismissable: false so clicking outside doesn't resolve with null (which
    // would be indistinguishable from the "use default" button value).
    let itemScale: MutableScaleStep[] | null = null
    if (format === 'scale') {
      const scaleResult = await dialog<MutableScaleStep[] | null | false>({
        title: t('q_add_custom_scale_title'),
        dismissable: false,
        body: (close) => <CustomScalePicker defaultScale={scale} onClose={close} />,
        actions: [],
      })
      // false = cancel (abort entire flow), null = use default, array = custom scale
      if (scaleResult === false) return
      itemScale = scaleResult
    }

    const next = structuredClone(result)
    if (storeTemplateWarningDisabled) next.templateWarningDisabled = true
    const ns = next.answers[cat.id] ?? {}
    const cell = (format === 'scale' && itemScale) ? { scale: 'open', itemScale } : { scale: 'open' }
    ns.__custom = { ...(ns.__custom ?? {}), [name]: cell }
    next.answers[cat.id] = ns

    // Save customItemDef for non-default formats
    if (format !== 'scale' || options) {
      const def: CustomItemDef = { format, ...(options ? { options } : {}) }
      next.customItemDefs = {
        ...(next.customItemDefs ?? {}),
        [cat.id]: {
          ...(next.customItemDefs?.[cat.id] ?? {}),
          [name]: def,
        },
      }
    }

    if (onImmediateSave) {
      onImmediateSave(next)
    } else if (onLocalChange) {
      onLocalChange(next)
    } else {
      saveResult(next)
    }
  }

  const catLabel = lang === 'de' && cat.de ? cat.de : cat.title

  return (
    <div className="modal-edit-items q-items" data-testid={`modal-edit-cat-${cat.id}`}>
      <p className="muted small px-1 pb-2">{catLabel}</p>
      {base.map((item) => (
        <RsQuestionCard
          key={item}
          result={result}
          catId={cat.id}
          item={item}
          isCustom={false}
          cell={slot[item]}
          scale={scale}
          onBeforeMutate={confirmIfTemplate}
          variant="list"
          {...(onLocalChange ? { onSave: onLocalChange } : {})}
        />
      ))}
      {custom.map((item) => {
        const customItemDef = result.customItemDefs?.[cat.id]?.[item]
        return (
          <RsQuestionCard
            key={`custom-${item}`}
            result={result}
            catId={cat.id}
            item={item}
            isCustom={true}
            cell={slot.__custom?.[item]}
            scale={scale}
            onBeforeMutate={confirmIfTemplate}
            variant="list"
            {...(customItemDef !== undefined ? { customItemDef } : {})}
            {...(onLocalChange ? { onSave: onLocalChange } : {})}
          />
        )
      })}
      <Button
        variant="ghost"
        onClick={addCustom}
        className="mt-2"
        data-testid={`modal-add-custom-${cat.id}`}
      >
        {t('q_add_custom')}
      </Button>
    </div>
  )
}

function FormatPicker({ onClose }: { onClose: (v: CustomItemFormat | false) => void }) {
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
      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => onClose(false)} data-testid="modal-format-picker-cancel">
          {t('btn_cancel')}
        </Button>
      </div>
    </div>
  )
}

function OptionsInput({ onClose }: { onClose: (v: string[] | false) => void }) {
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
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={() => onClose(false)} data-testid="modal-options-cancel">
          {t('btn_cancel')}
        </Button>
        <Button onClick={submit} data-testid="modal-options-ok">
          {t('btn_ok')}
        </Button>
      </div>
    </div>
  )
}

function CustomScalePicker({
  defaultScale,
  onClose,
}: {
  defaultScale: MutableScaleStep[]
  onClose: (v: MutableScaleStep[] | null | false) => void
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
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => onClose(false)} data-testid="modal-add-custom-scale-cancel">
              {t('btn_cancel')}
            </Button>
            <Button variant="ghost" onClick={() => setCustomizing(true)}>
              {t('q_add_custom_scale_customize')}
            </Button>
            <Button onClick={() => onClose(null)} data-testid="modal-add-custom-scale-default">
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
