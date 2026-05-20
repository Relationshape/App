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
import { useStore } from '@/lib/storage/store'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import { enabledItemsForCat, isGrCat } from '@/lib/charts/items'
import { dialog } from '@/lib/dialog/dialog'
import { useToast } from '@/lib/hooks/useToast'
import { runAddCustomItemFlow } from '@/components/questionnaire/addCustomItemFlow'
import type { ChartDataset } from './types'
import type { CATEGORIES } from '@/lib/data/data'
import type { Result } from '@/lib/storage/types'
import type { ResolvedCat } from '@/lib/data/customCategories'
import { t, getLang } from '@/lib/i18n/i18n'

type CategoryDef = (typeof CATEGORIES)[number]
type Tab = 'spider' | 'items' | 'edit'

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  datasets: readonly ChartDataset[]
  cat: CategoryDef | ResolvedCat | null
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
    // Keep the guard up through the next animation frame so any stray
    // onInteractOutside fired by the closing confirm dialog doesn't close
    // the modal before the new tab renders.
    confirmingRef.current = true
    setTab(newTab)
    requestAnimationFrame(() => { confirmingRef.current = false })
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
            {isGrCat(cat.id) ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="muted small text-center mb-1">{t('lbl_giving')}</p>
                  <ItemSpider datasets={datasets} catId={cat.id} size={520} grSide="giving" />
                </div>
                <div>
                  <p className="muted small text-center mb-1">{t('lbl_receiving')}</p>
                  <ItemSpider datasets={datasets} catId={cat.id} size={520} grSide="receiving" />
                </div>
              </div>
            ) : (
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
            )}
            <p className="muted small text-center mt-1" style={{ opacity: 0.6 }} data-testid="spider-scale-only-hint">
              {t('spider_scale_only_hint')}
            </p>
            {!isGrCat(cat.id) && (
              <Dialog open={spiderEnlarged} onOpenChange={setSpiderEnlarged}>
                <DialogContent
                  className="max-w-[min(1400px,96vw)] max-h-[min(96vh,1400px)] p-4 flex flex-col gap-2"
                  data-testid="cat-modal-spider-fullscreen"
                >
                  <DialogTitle className="sr-only">{title}</DialogTitle>
                  <div className="overflow-auto flex-1">
                    <ItemSpider datasets={datasets} catId={cat.id} size={1200} />
                    <p className="text-center muted small mt-3" style={{ opacity: 0.65 }}>
                      {t('spider_hover_hint')}
                    </p>
                    <p className="text-center muted small mt-1" style={{ opacity: 0.5 }}>
                      {t('spider_scale_only_hint')}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
        <div className="rs-modal-actions cat-modal-footer">
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
  cat: CategoryDef | ResolvedCat
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

  const [autoOpenItem, setAutoOpenItem] = useState<string | null>(null)

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
    const createdName = await runAddCustomItemFlow({
      result,
      catId: cat.id,
      scale,
      storeTemplateWarningDisabled,
      onDuplicate: () => toast.message(t('q_item_already_exists')),
      onSave: (next) => {
        if (onLocalChange) onLocalChange(next)
        else if (onImmediateSave) onImmediateSave(next)
        else saveResult(next)
      },
    })
    if (createdName) setAutoOpenItem(createdName)
  }

  const catLabel = lang === 'de' && cat.de ? cat.de : cat.title

  return (
    <div className="modal-edit-items q-items" data-testid={`modal-edit-cat-${cat.id}`}>
      <p className="muted small px-1 pb-2">{catLabel}</p>
      <Button
        variant="outline"
        onClick={addCustom}
        className="add-custom-btn mb-2"
        data-testid={`modal-add-custom-${cat.id}`}
      >
        {t('q_add_custom')}
      </Button>
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
            blockCloseRef={addingRef}
            {...(customItemDef !== undefined ? { customItemDef } : {})}
            {...(onLocalChange ? { onSave: onLocalChange } : {})}
            autoOpenEdit={autoOpenItem === item}
            onAutoOpenDone={() => setAutoOpenItem(null)}
          />
        )
      })}
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
          blockCloseRef={addingRef}
          {...(onLocalChange ? { onSave: onLocalChange } : {})}
        />
      ))}
    </div>
  )
}
