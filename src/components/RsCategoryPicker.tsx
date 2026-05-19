// Quick task 260516-qva. Modal port of public/legacy/js/app.js:1999-2065
// (`runCategoryPicker`) for the "Add more categories" entry point from
// CategoryOverview. Locks already-enabled rows; user can only ADD from here.
//
// CSS comes from src/styles/legacy-components.css (`.cat-picker-*`, `.onboarding-body`).
// Removal of categories lives in MapSettings — out of scope for this modal.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CATEGORIES, CATEGORY_GROUPS } from '@/lib/data/data'
import {
  QUICK_EMOJIS,
  makeCustomCatId,
  nextCustomCatColor,
} from '@/lib/data/customCategories'
import { dialog } from '@/lib/dialog/dialog'
import { ScaleEditor } from '@/components/ScaleEditor'
import { useStore } from '@/lib/storage/store'
import { t, getLang } from '@/lib/i18n/i18n'
import type { CustomCategoryDef, CustomItemFormat, CustomItemDef, AnswerCell, Result, Profile } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'

export interface PendingCustomItem {
  name: string
  format: CustomItemFormat
  options?: string[]
  itemScale?: MutableScaleStep[]
}

type WizardStep = 'list' | 'create' | 'items'

export interface PendingItemsByCat {
  [catId: string]: PendingCustomItem[]
}

/** Apply pending custom items (from a wizard flow) to a result before saving. */
export function applyPendingItems(result: Result, itemsByCat: PendingItemsByCat): Result {
  if (Object.keys(itemsByCat).length === 0) return result
  const next = structuredClone(result)
  for (const [catId, items] of Object.entries(itemsByCat)) {
    if (items.length === 0) continue
    const slot = next.answers[catId] ?? {}
    const customs: Record<string, AnswerCell> = { ...(slot.__custom ?? {}) }
    const defs: Record<string, CustomItemDef> = { ...((next.customItemDefs ?? {})[catId] ?? {}) }
    for (const item of items) {
      const cell: AnswerCell = { scale: 'open' }
      if (item.format === 'scale' && item.itemScale) cell.itemScale = item.itemScale
      customs[item.name] = cell
      const def: CustomItemDef = { format: item.format }
      if (item.options) def.options = item.options
      defs[item.name] = def
    }
    slot.__custom = customs
    next.answers[catId] = slot as Result['answers'][string]
    next.customItemDefs = { ...(next.customItemDefs ?? {}), [catId]: defs }
  }
  return next
}

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  existingIds: string[]
  result: Result
  profile: Profile | null
  onSubmit: (
    mergedIds: string[],
    resultCustomCats: CustomCategoryDef[],
    profileCustomCats: CustomCategoryDef[],
    pendingItemsByCat: PendingItemsByCat,
  ) => void
}

export function RsCategoryPicker({ open, onOpenChange, existingIds, result, profile, onSubmit }: Props) {
  const lang = getLang()
  const storeScale = useStore((s) => s.scale)
  const scale = result.scale ?? storeScale

  const lockedIds = useMemo(() => new Set(existingIds), [existingIds])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set(existingIds))

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('list')
  const [pendingCat, setPendingCat] = useState<{ title: string; icon: string; scope: 'result' | 'profile' } | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingCustomItem[]>([])

  // Pending new custom cats (not yet submitted)
  const [pendingNewResultCats, setPendingNewResultCats] = useState<CustomCategoryDef[]>([])
  const [pendingNewProfileCats, setPendingNewProfileCats] = useState<CustomCategoryDef[]>([])
  // Items added per new custom category, keyed by the generated cat id
  const [pendingItemsByCat, setPendingItemsByCat] = useState<PendingItemsByCat>({})

  // Wizard form state (for 'create' step)
  const [createTitle, setCreateTitle] = useState('')
  const [createIcon, setCreateIcon] = useState(QUICK_EMOJIS[0]!)
  const [createScope, setCreateScope] = useState<'result' | 'profile'>('result')

  // Guard for dialog flow inside a Radix Dialog
  const addingItemRef = useRef(false)

  // Reset selection whenever the modal (re)opens or the locked set changes.
  useEffect(() => {
    if (open) {
      setCheckedIds(new Set(existingIds))
      setWizardStep('list')
      setPendingCat(null)
      setPendingItems([])
      setPendingNewResultCats([])
      setPendingNewProfileCats([])
      setPendingItemsByCat({})
      setCreateTitle('')
      setCreateIcon(QUICK_EMOJIS[0]!)
      setCreateScope('result')
    }
  }, [open, existingIds])

  const existingResultCats = result.customCategories ?? []
  const existingProfileCats = profile?.customCategories ?? []

  const newSelectedCount = Array.from(checkedIds).filter((id) => !lockedIds.has(id)).length
  const canSubmit = newSelectedCount > 0 || pendingNewResultCats.length > 0 || pendingNewProfileCats.length > 0

  function toggle(id: string) {
    if (lockedIds.has(id)) return
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    if (!canSubmit) return
    const mergedResultCats = [...existingResultCats, ...pendingNewResultCats]
    const mergedProfileCats = [...existingProfileCats, ...pendingNewProfileCats]
    onSubmit(Array.from(checkedIds), mergedResultCats, mergedProfileCats, pendingItemsByCat)
    onOpenChange(false)
  }

  function startCreate() {
    setCreateTitle('')
    setCreateIcon(QUICK_EMOJIS[0]!)
    setCreateScope('result')
    setWizardStep('create')
  }

  function goToItems() {
    if (!createTitle.trim()) return
    setPendingCat({ title: createTitle.trim(), icon: createIcon, scope: createScope })
    setPendingItems([])
    setWizardStep('items')
  }

  async function addItemFlow() {
    if (addingItemRef.current) return
    addingItemRef.current = true
    try {
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
              />
              <button
                type="button"
                onClick={submit}
                className="self-end px-3 py-1 rounded bg-accent text-on-accent"
              >
                {t('btn_ok')}
              </button>
            </div>
          )
        },
        actions: [{ label: t('btn_cancel'), kind: 'ghost', value: null }],
      })
      if (!name) return

      // Step 2: format
      const format = await dialog<CustomItemFormat | false>({
        title: t('q_add_custom_format_title'),
        dismissable: false,
        body: (close) => <FormatPickerInline onClose={close} />,
        actions: [],
      })
      if (!format) return

      // Step 3: options (if applicable)
      let options: string[] | undefined
      if (format === 'single' || format === 'multi' || format === 'ranking') {
        const rawOptions = await dialog<string[] | false>({
          title: t('q_add_custom_options_title'),
          dismissable: false,
          body: (close) => <OptionsInputInline onClose={close} />,
          actions: [],
        })
        if (rawOptions === null || rawOptions === false) return
        options = rawOptions as string[]
      }

      // Step 4: scale (if scale format)
      let itemScale: MutableScaleStep[] | undefined
      if (format === 'scale') {
        const scaleResult = await dialog<MutableScaleStep[] | null | false>({
          title: t('q_add_custom_scale_title'),
          dismissable: false,
          body: (close) => <ScalePickerInline defaultScale={scale} onClose={close} />,
          actions: [],
        })
        if (scaleResult === false || scaleResult === null) {
          if (scaleResult === false) return
          // null means use default, itemScale stays undefined
        } else {
          itemScale = scaleResult as MutableScaleStep[]
        }
      }

      const item: PendingCustomItem = {
        name,
        format,
        ...(options !== undefined ? { options } : {}),
        ...(itemScale !== undefined ? { itemScale } : {}),
      }
      setPendingItems((prev) => [...prev, item])
    } finally {
      addingItemRef.current = false
    }
  }

  function confirmCreate() {
    if (!pendingCat || pendingItems.length === 0) return

    const allExisting = [
      ...existingResultCats,
      ...existingProfileCats,
      ...pendingNewResultCats,
      ...pendingNewProfileCats,
    ]
    const newId = makeCustomCatId()
    const newColor = nextCustomCatColor(allExisting)
    const newDef: CustomCategoryDef = {
      id: newId,
      title: pendingCat.title,
      icon: pendingCat.icon,
      color: newColor,
    }

    if (pendingCat.scope === 'profile') {
      setPendingNewProfileCats((prev) => [...prev, newDef])
    } else {
      setPendingNewResultCats((prev) => [...prev, newDef])
    }

    setCheckedIds((prev) => {
      const next = new Set(prev)
      next.add(newId)
      return next
    })

    if (pendingItems.length > 0) {
      setPendingItemsByCat((prev) => ({ ...prev, [newId]: pendingItems }))
    }

    setPendingCat(null)
    setPendingItems([])
    setWizardStep('list')
  }

  const allCustomCats = [
    ...existingResultCats,
    ...existingProfileCats,
    ...pendingNewResultCats,
    ...pendingNewProfileCats,
  ]

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next && (wizardStep !== 'list')) {
        // go back to list on close attempt mid-wizard
        setWizardStep('list')
        return
      }
      onOpenChange(next)
    }}>
      <DialogContent
        className="max-w-[min(560px,96vw)] max-h-[min(90vh,720px)] p-6 flex flex-col gap-3"
        showCloseButton={true}
        data-testid="cat-picker"
        onInteractOutside={(e) => { if (addingItemRef.current) e.preventDefault() }}
      >
        {wizardStep === 'list' && (
          <>
            <DialogTitle asChild>
              <h2 className="rs-modal-title">{t('onboarding_title')}</h2>
            </DialogTitle>
            <div className="onboarding-body flex-1 overflow-y-auto min-h-0">
              <p className="muted small">{t('onboarding_sub')}</p>
              <div className="cat-picker-groups">
                {CATEGORY_GROUPS.map((group) => {
                  const groupTitle = lang === 'de' ? group.de : group.en
                  const items = group.categories
                    .map(({ id }) => CATEGORIES.find((c) => c.id === id))
                    .filter((c): c is NonNullable<typeof c> => Boolean(c))
                  if (items.length === 0) return null
                  return (
                    <div key={group.id} className="cat-picker-group">
                      <h3 className="cat-picker-group-title">{groupTitle}</h3>
                      <div className="cat-picker-items">
                        {items.map((cat) => {
                          const locked = lockedIds.has(cat.id)
                          const isChecked = checkedIds.has(cat.id)
                          const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
                          return (
                            <label
                              key={cat.id}
                              htmlFor={`cp-${cat.id}`}
                              className={
                                'cat-picker-item' +
                                (locked ? ' is-locked' : '') +
                                (isChecked ? ' is-checked' : '')
                              }
                              data-testid={`cat-picker-item-${cat.id}`}
                            >
                              <input
                                type="checkbox"
                                id={`cp-${cat.id}`}
                                checked={isChecked}
                                disabled={locked}
                                onChange={() => toggle(cat.id)}
                              />
                              <span className="cat-picker-icon" aria-hidden>{cat.icon}</span>
                              <span className="cat-picker-label">{catTitle}</span>
                              {locked ? (
                                <span className="cat-picker-lock" aria-label="already added">✓</span>
                              ) : (
                                <span className="cat-picker-check" aria-hidden>{isChecked ? '✓' : ''}</span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Custom categories section */}
              <div className="cat-picker-custom-section">
                <h3 className="cat-picker-group-title">{t('cat_picker_custom_section')}</h3>
                <button
                  type="button"
                  className="cat-picker-create-btn"
                  onClick={startCreate}
                  data-testid="cat-picker-create-btn"
                >
                  + {t('cat_picker_create_btn')}
                </button>
                {allCustomCats.length > 0 && (
                  <div className="cat-picker-items mt-2">
                    {allCustomCats.map((cat) => {
                      const locked = lockedIds.has(cat.id)
                      const isChecked = checkedIds.has(cat.id)
                      return (
                        <label
                          key={cat.id}
                          htmlFor={`cp-${cat.id}`}
                          className={
                            'cat-picker-item' +
                            (locked ? ' is-locked' : '') +
                            (isChecked ? ' is-checked' : '')
                          }
                          data-testid={`cat-picker-item-${cat.id}`}
                        >
                          <input
                            type="checkbox"
                            id={`cp-${cat.id}`}
                            checked={isChecked}
                            disabled={locked}
                            onChange={() => toggle(cat.id)}
                          />
                          <span className="cat-picker-icon" aria-hidden>{cat.icon}</span>
                          <span className="cat-picker-label">{cat.title}</span>
                          {locked ? (
                            <span className="cat-picker-lock" aria-label="already added">✓</span>
                          ) : (
                            <span className="cat-picker-check" aria-hidden>{isChecked ? '✓' : ''}</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="rs-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onOpenChange(false)}
                data-testid="cat-picker-cancel"
              >
                {t('btn_cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
                data-testid="cat-picker-submit"
              >
                {t('btn_add_categories')}
              </button>
            </div>
          </>
        )}

        {wizardStep === 'create' && (
          <>
            <DialogTitle asChild>
              <h2 className="rs-modal-title">{t('cat_picker_create_btn')}</h2>
            </DialogTitle>
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">{t('cat_create_title_label')}</label>
                <input
                  autoFocus
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder={t('cat_create_title_placeholder') as string}
                  className="w-full rounded border border-line px-2 py-1"
                  data-testid="cat-create-title-input"
                  onKeyDown={(e) => { if (e.key === 'Enter' && createTitle.trim()) goToItems() }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">{t('cat_create_emoji_label')}</label>
                <div className="cat-wizard-emoji-grid">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`cat-wizard-emoji-btn${createIcon === emoji ? ' is-selected' : ''}`}
                      onClick={() => setCreateIcon(emoji)}
                      data-testid={`cat-emoji-${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={createIcon}
                  onChange={(e) => setCreateIcon(e.target.value || QUICK_EMOJIS[0]!)}
                  placeholder="✶"
                  className="w-20 rounded border border-line px-2 py-1 mt-2 text-center"
                  maxLength={4}
                  data-testid="cat-create-icon-input"
                />
              </div>

              {profile !== null && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t('cat_create_scope_label')}</label>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cat-scope"
                        value="result"
                        checked={createScope === 'result'}
                        onChange={() => setCreateScope('result')}
                      />
                      <span>{t('cat_create_scope_result')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cat-scope"
                        value="profile"
                        checked={createScope === 'profile'}
                        onChange={() => setCreateScope('profile')}
                      />
                      <span>{t('cat_create_scope_profile')}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="rs-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setWizardStep('list')}
                data-testid="cat-create-back"
              >
                {t('btn_back')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={goToItems}
                disabled={!createTitle.trim()}
                data-testid="cat-create-next"
              >
                {t('cat_create_next')}
              </button>
            </div>
          </>
        )}

        {wizardStep === 'items' && pendingCat && (
          <>
            <DialogTitle asChild>
              <h2 className="rs-modal-title">{t('cat_items_step_title')}: {pendingCat.title}</h2>
            </DialogTitle>
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3">
              <p className="muted small">{t('cat_items_step_sub')}</p>
              <button
                type="button"
                className="cat-picker-create-btn"
                onClick={() => { void addItemFlow() }}
                data-testid="cat-items-add-btn"
              >
                + {t('cat_items_add_btn')}
              </button>
              {pendingItems.length > 0 && (
                <div className="cat-wizard-items-list">
                  {pendingItems.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="cat-wizard-item-row">
                      <span className="flex-1 text-sm">{item.name}</span>
                      <span className="cat-wizard-item-format">{item.format}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rs-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setWizardStep('create')}
                data-testid="cat-items-back"
              >
                {t('btn_back')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmCreate}
                disabled={pendingItems.length === 0}
                data-testid="cat-items-done"
              >
                {t('cat_items_done_btn')}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Inline helpers ────────────────────────────────────────────────────────────

export function FormatPickerInline({ onClose }: { onClose: (v: CustomItemFormat | false) => void }) {
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
        <Button variant="ghost" onClick={() => onClose(false)}>
          {t('btn_cancel')}
        </Button>
      </div>
    </div>
  )
}

export function OptionsInputInline({ onClose }: { onClose: (v: string[] | false) => void }) {
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
      />
      {error && <p className="text-sm text-destructive">{t('q_add_custom_options_min')}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={() => onClose(false)}>
          {t('btn_cancel')}
        </Button>
        <Button onClick={submit}>
          {t('btn_ok')}
        </Button>
      </div>
    </div>
  )
}

export function ScalePickerInline({
  defaultScale,
  onClose,
}: {
  defaultScale: MutableScaleStep[]
  onClose: (v: MutableScaleStep[] | null | false) => void
}) {
  const [customizing, setCustomizing] = useState(false)
  const [customScale, setCustomScale] = useState<MutableScaleStep[]>(() => defaultScale.map((s) => ({ ...s })))

  return (
    <div className="flex flex-col gap-3">
      <p className="muted small">{t('q_add_custom_scale_sub')}</p>
      {!customizing ? (
        <>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => onClose(false)}>
              {t('btn_cancel')}
            </Button>
            <Button variant="ghost" onClick={() => setCustomizing(true)}>
              {t('q_add_custom_scale_customize')}
            </Button>
            <Button onClick={() => onClose(null)}>
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
            <Button onClick={() => onClose(customScale)}>
              {t('btn_ok')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
