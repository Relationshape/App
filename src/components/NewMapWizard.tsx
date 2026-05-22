// New-map onboarding wizard. Port of public/legacy/js/app.js:1725-1766 (startBlank).
// 3 steps: map name → scale confirm/customize → category picker.
// Shown in CategoryOverview when resultId === 'new'.

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CATEGORIES, CATEGORY_GROUPS } from '@/lib/data/data'
import { useStore } from '@/lib/storage/store'
import { ScaleEditor } from '@/components/ScaleEditor'
import { localizeStep } from '@/lib/data/locale'
import { dialog } from '@/lib/dialog/dialog'
import {
  QUICK_EMOJIS, EMOJI_GROUPS, makeCustomCatId, nextCustomCatColor,
} from '@/lib/data/customCategories'
import {
  applyPendingItems,
  type PendingCustomItem, type PendingItemsByCat,
} from '@/components/RsCategoryPicker'
import { ImportForm } from '@/components/ImportForm'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { t, getLang } from '@/lib/i18n/i18n'
import type { MutableScaleStep } from '@/lib/data/types'
import type { CustomCategoryDef, CustomItemFormat, Import, Profile } from '@/lib/storage/types'

interface Props {
  profile: Profile
}

type Step = 'source' | 'import' | 'pick' | 0 | 1 | 2

type TemplateSource =
  | { kind: 'import'; id: string }
  | { kind: 'result'; id: string }

function hasNoAnswersForImport(imp: Import): boolean {
  return Object.values(imp.answers).every((cat) =>
    Object.entries(cat).every(([k, v]) =>
      k === '__hidden' || k === '__custom' || !v || !('scale' in (v as object))
    ) && !Object.keys(cat.__custom ?? {}).length
  )
}

export function NewMapWizard({ profile }: Props) {
  const navigate = useNavigate()
  const globalScale = useStore((s) => s.scale)
  const saveResult = useStore((s) => s.saveResult)
  const updateProfile = useStore((s) => s.updateProfile)
  const { openShareTemplate } = useShareData()
  const lang = getLang()
  const allResults = useStore((s) => s.results)
  const allImports = useStore((s) => s.imports)

  const profileResults = allResults.filter((r) => r.profileId === profile.id)
  const templateImports = allImports.filter((i) =>
    i.exportMode === 'template' ||
    (i.exportMode !== 'restricted' && hasNoAnswersForImport(i))
  )
  const importedMaps = allImports.filter((i) =>
    !templateImports.includes(i)
  )
  const hasTemplates = profileResults.length > 0 || allImports.length > 0

  const [step, setStep] = useState<Step>('source')
  const [subject, setSubject] = useState('')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set())
  const [scale, setScale] = useState<MutableScaleStep[]>(() => globalScale.map((s) => ({ ...s })))
  const [customizeScale, setCustomizeScale] = useState(false)
  const [templateSource, setTemplateSource] = useState<TemplateSource | null>(null)
  const [skipSharePrompt, setSkipSharePrompt] = useState(false)

  // Custom category sub-wizard (shown within step 1)
  type CatSubStep = 'list' | 'create' | 'items' | 'item-form' | 'item-scale'
  const [catSubStep, setCatSubStep] = useState<CatSubStep>('list')
  const [createTitle, setCreateTitle] = useState('')
  const [createIcon, setCreateIcon] = useState(QUICK_EMOJIS[0]!)
  const [createForProfile, setCreateForProfile] = useState(false)
  const [pendingCatMeta, setPendingCatMeta] = useState<{ title: string; icon: string } | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingCustomItem[]>([])
  const [customCats, setCustomCats] = useState<CustomCategoryDef[]>([])
  const [itemsByCat, setItemsByCat] = useState<PendingItemsByCat>({})
  const addingItemRef = useRef(false)

  // Inline item-form state (replaces dialog-based addItemFlow)
  const [itemFormName, setItemFormName] = useState('')
  const [itemFormFormat, setItemFormFormat] = useState<CustomItemFormat>('scale')
  const [itemFormOptions, setItemFormOptions] = useState('')
  const [itemFormError, setItemFormError] = useState('')
  const [itemFormScale, setItemFormScale] = useState<MutableScaleStep[]>([])

  function onCancel() {
    navigate(`/profile/${profile.id}`)
  }

  async function onComplete() {
    const id = crypto.randomUUID()

    if (templateSource) {
      if (templateSource.kind === 'result') {
        const srcResult = profileResults.find((r) => r.id === templateSource.id)
        const copyAnswers = await dialog<boolean | null>({
          title: t('template_copy_answers_title') as string,
          body: <p style={{ lineHeight: 1.5 }}>{t('template_copy_answers_body')}</p>,
          actions: [
            { label: t('template_copy_answers_no') as string, kind: 'ghost', value: false },
            { label: t('template_copy_answers_yes') as string, kind: 'primary', value: true },
          ],
        })
        if (copyAnswers === null) return
        saveResult({
          id,
          profileId: profile.id,
          subject: subject.trim() || profile.name,
          subjectColor: profile.color,
          subjectEmoji: profile.emoji,
          answers: copyAnswers ? structuredClone(srcResult?.answers ?? {}) : {},
          enabledCategories: srcResult?.enabledCategories ?? CATEGORIES.map((c) => c.id),
          ...(srcResult?.scale ? { scale: srcResult.scale } : {}),
          ...(srcResult?.customCategories ? { customCategories: structuredClone(srcResult.customCategories) } : {}),
          ...(copyAnswers && srcResult?.customItemDefs ? { customItemDefs: structuredClone(srcResult.customItemDefs) } : {}),
          seededFromResultId: templateSource.id,
          progress: { mode: 'list' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      } else {
        const tmplImport = allImports.find((i) => i.id === templateSource.id)
        saveResult({
          id,
          profileId: profile.id,
          subject: subject.trim() || profile.name,
          subjectColor: profile.color,
          subjectEmoji: profile.emoji,
          answers: {},
          enabledCategories: tmplImport?.enabledCategories ?? CATEGORIES.map((c) => c.id),
          ...(tmplImport?.scale ? { scale: tmplImport.scale } : {}),
          seededFromImportId: templateSource.id,
          progress: { mode: 'list' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      }
      await promptShareTemplate(id)
      return
    }

    const enabledCategories =
      checkedIds.size > 0
        ? Array.from(checkedIds)
        : CATEGORIES.map((c) => c.id)

    const base = {
      id,
      profileId: profile.id,
      subject: subject.trim() || profile.name,
      subjectColor: profile.color,
      subjectEmoji: profile.emoji,
      answers: {} as Record<string, never>,
      enabledCategories,
      ...(customizeScale ? { scale } : {}),
      ...(customCats.length > 0 ? { customCategories: customCats } : {}),
      progress: { mode: 'list' as const },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveResult(applyPendingItems(base, itemsByCat))
    await promptShareTemplate(id)
  }

  async function promptShareTemplate(id: string) {
    if (skipSharePrompt) {
      navigate(`/q-categories/${profile.id}/${id}`, { replace: true })
      return
    }
    const choice = await dialog<string | null>({
      title: t('wizard_share_template_prompt_title') as string,
      body: () => (
        <p className="muted small" style={{ lineHeight: 1.5 }}>
          {t('wizard_share_template_prompt_body')}
        </p>
      ),
      actions: [
        { label: t('btn_skip') as string, kind: 'ghost', value: 'skip' },
        { label: t('wizard_share_template_btn') as string, kind: 'primary', value: 'share' },
      ],
    })
    if (choice === 'share') {
      openShareTemplate(
        id,
        () => navigate(`/q-categories/${profile.id}/${id}`, { replace: true }),
        () => void promptShareTemplate(id),
      )
    } else if (choice === 'skip') {
      navigate(`/q-categories/${profile.id}/${id}`, { replace: true })
    }
    // null (X clicked): do nothing — wizard remains on step 2 (categories)
  }

  function toggleCategory(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllAndContinue() {
    // Keep any custom cat IDs already checked, add all builtin cats
    setCheckedIds((prev) => {
      const next: Set<string> = new Set(CATEGORIES.map((c) => c.id))
      for (const id of prev) if (!CATEGORIES.some((c) => c.id === id)) next.add(id)
      return next
    })
    void onComplete()
  }

  function startCreateCat() {
    setCreateTitle('')
    setCreateIcon(QUICK_EMOJIS[0]!)
    setCreateForProfile(false)
    setCatSubStep('create')
  }

  function goToItemsStep() {
    if (!createTitle.trim()) return
    setPendingCatMeta({ title: createTitle.trim(), icon: createIcon })
    setPendingItems([])
    setCatSubStep('items')
  }

  function startItemForm() {
    setItemFormName('')
    setItemFormFormat('scale')
    setItemFormOptions('')
    setItemFormError('')
    setCatSubStep('item-form')
  }

  function submitItemForm() {
    const name = itemFormName.trim()
    if (!name) { setItemFormError(t('q_add_custom_name_empty') as string); return }
    const needsOptions = itemFormFormat === 'single' || itemFormFormat === 'multi' || itemFormFormat === 'ranking'
    let options: string[] | undefined
    if (needsOptions) {
      const lines = itemFormOptions.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) { setItemFormError(t('q_add_custom_options_min') as string); return }
      options = lines
    }
    if (itemFormFormat === 'scale') {
      setItemFormScale(scale.map((s) => ({ ...s })))
      setCatSubStep('item-scale')
      return
    }
    const item: PendingCustomItem = { name, format: itemFormFormat, ...(options ? { options } : {}) }
    setPendingItems((prev) => [...prev, item])
    setCatSubStep('items')
  }

  function confirmItemScale(customScale: MutableScaleStep[] | null) {
    const item: PendingCustomItem = {
      name: itemFormName.trim(),
      format: 'scale',
      ...(customScale ? { itemScale: customScale } : {}),
    }
    setPendingItems((prev) => [...prev, item])
    setCatSubStep('items')
  }

  function confirmCustomCat() {
    if (!pendingCatMeta || pendingItems.length === 0) return
    const newId = makeCustomCatId()
    const newColor = nextCustomCatColor([...customCats, ...(profile.customCategories ?? [])])
    const newDef: CustomCategoryDef = {
      id: newId,
      title: pendingCatMeta.title,
      icon: pendingCatMeta.icon,
      color: newColor,
      items: pendingItems.map((item) => ({
        name: item.name,
        format: item.format,
        ...(item.options ? { options: item.options } : {}),
      })),
    }
    if (createForProfile) {
      updateProfile(profile.id, { customCategories: [...(profile.customCategories ?? []), newDef] })
    } else {
      setCustomCats((prev) => [...prev, newDef])
    }
    setCheckedIds((prev) => { const next = new Set(prev); next.add(newId); return next })
    setItemsByCat((prev) => ({ ...prev, [newId]: pendingItems }))
    setPendingCatMeta(null)
    setPendingItems([])
    setCatSubStep('list')
  }

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent
        className="max-w-[min(640px,96vw)] max-h-[min(92vh,780px)] p-6 flex flex-col gap-3"
        showCloseButton={true}
        data-testid="new-map-wizard"
        onInteractOutside={(e) => { if (addingItemRef.current) e.preventDefault() }}
      >
        {step === 'source' && (
          <>
            <DialogHeader>
              <DialogTitle data-testid="wizard-step-source-title">{t('new_map_title')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-0">
              <button
                type="button"
                className="list-item list-item--selectable"
                onClick={() => { setTemplateSource(null); setStep(0) }}
                data-testid="wizard-source-blank"
              >
                <div className="li-body">
                  <strong>{t('wizard_source_blank')}</strong>
                  <p className="muted small">{t('wizard_source_blank_sub')}</p>
                </div>
              </button>
              {hasTemplates && (
                <button
                  type="button"
                  className="list-item list-item--selectable"
                  onClick={() => setStep('pick')}
                  data-testid="wizard-source-template"
                >
                  <div className="li-body">
                    <strong>{t('wizard_source_template')}</strong>
                    <p className="muted small">{t('wizard_source_template_sub')}</p>
                  </div>
                </button>
              )}
              <button
                type="button"
                className="list-item list-item--selectable"
                onClick={() => setStep('import')}
                data-testid="wizard-source-import"
              >
                <div className="li-body">
                  <strong>{t('wizard_source_import')}</strong>
                  <p className="muted small">{t('wizard_source_import_sub')}</p>
                </div>
              </button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onCancel} data-testid="wizard-cancel">
                {t('btn_cancel')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'import' && (
          <>
            <DialogHeader>
              <DialogTitle data-testid="wizard-step-import-title">{t('wizard_source_import')}</DialogTitle>
            </DialogHeader>
            <ImportForm
              onSuccess={(imp: Import) => {
                setTemplateSource({ kind: 'import', id: imp.id })
                setSkipSharePrompt(true)
                setStep(0)
              }}
              testIdPrefix="wizard-import"
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('source')} data-testid="wizard-import-back">
                {t('btn_back')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'pick' && (
          <>
            <DialogHeader>
              <DialogTitle data-testid="wizard-step-pick-title">{t('wizard_pick_template_title')}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2" data-testid="wizard-pick-step">
              {profileResults.length > 0 && (
                <div>
                  <p className="muted small font-semibold mb-1">{t('wizard_pick_own_section')}</p>
                  {profileResults.map((r) => (
                    <TemplatePickRow
                      key={r.id}
                      label={r.subject ?? profile.name}
                      emoji={r.subjectEmoji ?? profile.emoji}
                      testId={`wizard-pick-result-${r.id}`}
                      onClick={() => { setTemplateSource({ kind: 'result', id: r.id }); setStep(0) }}
                    />
                  ))}
                </div>
              )}
              {templateImports.length > 0 && (
                <div>
                  <p className="muted small font-semibold mb-1">{t('wizard_pick_import_section')}</p>
                  {templateImports.map((i) => (
                    <TemplatePickRow
                      key={i.id}
                      label={i.subject ?? i.name ?? 'Import'}
                      emoji={i.emoji ?? '📋'}
                      testId={`wizard-pick-import-${i.id}`}
                      onClick={() => { setTemplateSource({ kind: 'import', id: i.id }); setStep(0) }}
                    />
                  ))}
                </div>
              )}
              {importedMaps.length > 0 && (
                <div>
                  <p className="muted small font-semibold mb-1">{t('wizard_pick_imported_maps_section')}</p>
                  {importedMaps.map((i) => (
                    <TemplatePickRow
                      key={i.id}
                      label={i.subject ?? i.name ?? 'Import'}
                      emoji={i.emoji ?? '📨'}
                      testId={`wizard-pick-imported-map-${i.id}`}
                      onClick={() => { setTemplateSource({ kind: 'import', id: i.id }); setStep(0) }}
                    />
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('source')} data-testid="wizard-pick-back">
                {t('btn_back')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 0 && (
          <>
            <DialogHeader>
              <DialogTitle data-testid="wizard-step-name-title">{t('new_map_title')}</DialogTitle>
              <DialogDescription>{t('map_name_label')}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                className="w-full rounded border border-line px-3 py-2 text-sm bg-surface"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && subject.trim()) {
                    if (templateSource) { void onComplete() } else { setStep(1) }
                  }
                }}
                placeholder="e.g. Vera, my good friend"
                autoFocus
                data-testid="wizard-name-input"
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  if (templateSource) { setStep('pick') }
                  else { setStep('source') }
                }}
                data-testid="wizard-cancel"
              >
                {t('btn_back')}
              </Button>
              <Button
                onClick={() => { if (templateSource) { void onComplete() } else { setStep(1) } }}
                disabled={!subject.trim()}
                data-testid="wizard-name-next"
              >
                {templateSource ? t('use_template_start_btn') : t('btn_next')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && catSubStep === 'list' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('onboarding_title')}</DialogTitle>
              <DialogDescription>{t('onboarding_sub')}</DialogDescription>
            </DialogHeader>
            <div className="onboarding-body flex-1 overflow-y-auto min-h-0" data-testid="wizard-cat-step">
              <div className="cat-picker-custom-section">
                <h3 className="cat-picker-group-title">{t('cat_picker_custom_section')}</h3>
                <button
                  type="button"
                  className="cat-picker-create-btn"
                  onClick={startCreateCat}
                  data-testid="wizard-cat-create-btn"
                >
                  + {t('cat_picker_create_btn')}
                </button>
                {((profile.customCategories?.length ?? 0) > 0 || customCats.length > 0) && (
                  <div className="cat-picker-items mt-2">
                    {(profile.customCategories ?? []).map((cat) => {
                      const isChecked = checkedIds.has(cat.id)
                      return (
                        <label
                          key={cat.id}
                          htmlFor={`nmw-pc-${cat.id}`}
                          className={`cat-picker-item${isChecked ? ' is-checked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            id={`nmw-pc-${cat.id}`}
                            checked={isChecked}
                            onChange={() => toggleCategory(cat.id)}
                          />
                          <span className="cat-picker-icon" aria-hidden>{cat.icon}</span>
                          <span className="cat-picker-label">{cat.title}</span>
                          <span className="cat-picker-check" aria-hidden>{isChecked ? '✓' : ''}</span>
                        </label>
                      )
                    })}
                    {customCats.map((cat) => {
                      const isChecked = checkedIds.has(cat.id)
                      return (
                        <label
                          key={cat.id}
                          htmlFor={`nmw-cc-${cat.id}`}
                          className={`cat-picker-item${isChecked ? ' is-checked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            id={`nmw-cc-${cat.id}`}
                            checked={isChecked}
                            onChange={() => toggleCategory(cat.id)}
                          />
                          <span className="cat-picker-icon" aria-hidden>{cat.icon}</span>
                          <span className="cat-picker-label">{cat.title}</span>
                          <span className="cat-picker-check" aria-hidden>{isChecked ? '✓' : ''}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
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
                          const isChecked = checkedIds.has(cat.id)
                          const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
                          return (
                            <label
                              key={cat.id}
                              htmlFor={`nmw-cp-${cat.id}`}
                              className={`cat-picker-item${isChecked ? ' is-checked' : ''}`}
                              data-testid={`wizard-cat-item-${cat.id}`}
                            >
                              <input
                                type="checkbox"
                                id={`nmw-cp-${cat.id}`}
                                checked={isChecked}
                                onChange={() => toggleCategory(cat.id)}
                              />
                              <span className="cat-picker-icon" aria-hidden>{cat.icon}</span>
                              <span className="cat-picker-label">{catTitle}</span>
                              <span className="cat-picker-check" aria-hidden>{isChecked ? '✓' : ''}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="rs-modal-actions">
              <Button variant="ghost" onClick={() => setStep(1)} data-testid="wizard-cat-back">
                {t('btn_back')}
              </Button>
              <Button variant="ghost" onClick={selectAllAndContinue} data-testid="wizard-cat-skip">
                {t('btn_skip_onboarding')}
              </Button>
              <Button
                onClick={() => { void onComplete() }}
                disabled={checkedIds.size === 0}
                data-testid="wizard-cat-next"
              >
                {t('btn_start_map')}
              </Button>
            </div>
          </>
        )}

        {step === 2 && catSubStep === 'create' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('cat_picker_create_btn')}</DialogTitle>
            </DialogHeader>
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
                  data-testid="wizard-cat-create-title"
                  onKeyDown={(e) => { if (e.key === 'Enter' && createTitle.trim()) goToItemsStep() }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">{t('cat_create_emoji_label')}</label>
                <div className="cat-wizard-emoji-palette overflow-y-auto" style={{ maxHeight: '280px' }}>
                  {EMOJI_GROUPS.map((group) => (
                    <div key={group.label} className="cat-wizard-emoji-group">
                      <div className="cat-wizard-emoji-group-label">{group.label}</div>
                      <div className="cat-wizard-emoji-grid">
                        {group.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className={`cat-wizard-emoji-btn${createIcon === emoji ? ' is-selected' : ''}`}
                            onClick={() => setCreateIcon(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={createIcon}
                  onChange={(e) => setCreateIcon(e.target.value || QUICK_EMOJIS[0]!)}
                  placeholder="✶"
                  className="w-20 rounded border border-line px-2 py-1 mt-2 text-center"
                  maxLength={4}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createForProfile}
                  onChange={(e) => setCreateForProfile(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">{t('cat_create_save_to_profile')}</span>
              </label>
            </div>
            <div className="rs-modal-actions">
              <Button variant="ghost" onClick={() => setCatSubStep('list')} data-testid="wizard-cat-create-back">
                {t('btn_back')}
              </Button>
              <Button onClick={goToItemsStep} disabled={!createTitle.trim()} data-testid="wizard-cat-create-next">
                {t('cat_create_next')}
              </Button>
            </div>
          </>
        )}

        {step === 2 && catSubStep === 'items' && pendingCatMeta && (
          <>
            <DialogHeader>
              <DialogTitle>{t('cat_items_step_title')}: {pendingCatMeta.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3">
              <button
                type="button"
                className="cat-picker-create-btn"
                onClick={startItemForm}
                data-testid="wizard-cat-items-add"
              >
                + {t('cat_items_add_btn')}
              </button>
              {pendingItems.length === 0 && (
                <p className="muted small">{t('cat_items_step_sub')}</p>
              )}
              {pendingItems.length > 0 && (
                <div className="cat-wizard-items-list">
                  {pendingItems.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="cat-wizard-item-row">
                      <span className="flex-1 text-sm">{item.name}</span>
                      <span className="cat-wizard-item-format">{t(`q_format_${item.format}` as Parameters<typeof t>[0])}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rs-modal-actions">
              <Button variant="ghost" onClick={() => setCatSubStep('create')} data-testid="wizard-cat-items-back">
                {t('btn_back')}
              </Button>
              <Button onClick={confirmCustomCat} disabled={pendingItems.length === 0} data-testid="wizard-cat-items-done">
                {t('cat_items_done_btn')}
              </Button>
            </div>
          </>
        )}

        {step === 2 && catSubStep === 'item-form' && pendingCatMeta && (
          <>
            <DialogHeader>
              <DialogTitle>{t('cat_items_add_btn')}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">{t('q_add_custom_title')}</label>
                <input
                  autoFocus
                  type="text"
                  value={itemFormName}
                  onChange={(e) => { setItemFormName(e.target.value); setItemFormError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitItemForm() }}
                  placeholder={t('q_add_custom_placeholder') as string}
                  className="w-full rounded border border-line px-2 py-1"
                  data-testid="wizard-item-form-name"
                />
              </div>
              {/* Format */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">{t('q_edit_format_section')}</label>
                <div className="flex flex-col gap-1">
                  {(['scale', 'text', 'single', 'multi', 'ranking'] as CustomItemFormat[]).map((f) => (
                    <label key={f} className={`format-picker-tile${itemFormFormat === f ? ' is-active' : ''}`} style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        className="sr-only"
                        name="wizard-item-format"
                        checked={itemFormFormat === f}
                        onChange={() => { setItemFormFormat(f); setItemFormError('') }}
                      />
                      <span className="format-picker-tile-label">{t(`q_format_${f}` as Parameters<typeof t>[0])}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Options */}
              {(itemFormFormat === 'single' || itemFormFormat === 'multi' || itemFormFormat === 'ranking') && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t('q_edit_format_options_label')}</label>
                  <p className="muted small">{t('q_add_custom_options_sub')}</p>
                  <textarea
                    rows={5}
                    className="w-full rounded border border-line px-2 py-1 font-mono text-sm"
                    value={itemFormOptions}
                    onChange={(e) => { setItemFormOptions(e.target.value); setItemFormError('') }}
                    placeholder="Option A&#10;Option B&#10;Option C"
                    data-testid="wizard-item-form-options"
                  />
                </div>
              )}
              {itemFormError && <p className="text-sm text-destructive">{itemFormError}</p>}
            </div>
            <div className="rs-modal-actions">
              <Button variant="ghost" onClick={() => setCatSubStep('items')} data-testid="wizard-item-form-cancel">
                {t('btn_cancel')}
              </Button>
              <Button onClick={submitItemForm} data-testid="wizard-item-form-submit">
                {t('btn_ok')}
              </Button>
            </div>
          </>
        )}

        {step === 2 && catSubStep === 'item-scale' && pendingCatMeta && (
          <>
            <DialogHeader>
              <DialogTitle>{t('q_add_custom_scale_title')}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0">
              <ScaleEditor scale={itemFormScale} onChange={setItemFormScale} />
            </div>
            <div className="rs-modal-actions">
              <Button variant="ghost" onClick={() => setCatSubStep('item-form')} data-testid="wizard-item-scale-back">
                {t('btn_back')}
              </Button>
              <Button variant="ghost" onClick={() => confirmItemScale(null)} data-testid="wizard-item-scale-default">
                {t('q_add_custom_scale_use_default')}
              </Button>
              <Button onClick={() => confirmItemScale(itemFormScale)} data-testid="wizard-item-scale-confirm">
                {t('q_item_scale_confirm')}
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>{t('new_card_scale_title')}</DialogTitle>
              <DialogDescription>{t('new_card_scale_sub')}</DialogDescription>
            </DialogHeader>
            {/* Callout outside the scroll area so it stays visible and doesn't overlap rows */}
            <div className="callout" style={{ fontSize: '13px', flexShrink: 0 }}>
              {t('wizard_scale_hint')}
            </div>
            <div className="scale-dialog-body flex-1 overflow-y-auto min-h-0" data-testid="wizard-scale-step">
              {!customizeScale ? (
                <div className="scale-preview-list">
                  {scale.map((s) => {
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
              ) : (
                <ScaleEditor scale={scale} onChange={setScale} />
              )}
            </div>
            <div className="rs-modal-actions">
              <Button
                variant="ghost"
                onClick={() => { if (customizeScale) setCustomizeScale(false); else setStep(0) }}
                data-testid="wizard-scale-back"
              >
                {t('btn_back')}
              </Button>
              {!customizeScale && (
                <Button
                  variant="ghost"
                  onClick={() => setCustomizeScale(true)}
                  data-testid="wizard-scale-customize"
                >
                  {t('new_card_scale_customize')}
                </Button>
              )}
              <Button onClick={() => { setCustomizeScale(false); setStep(2) }} data-testid="wizard-scale-confirm">
                {t('new_card_scale_confirm')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TemplatePickRow({
  label,
  emoji,
  testId,
  onClick,
}: {
  label: string
  emoji: string
  testId: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="list-item list-item--selectable w-full text-left"
      onClick={onClick}
      data-testid={testId}
    >
      <div className="li-avatar">{emoji}</div>
      <div className="li-body">
        <strong>{label}</strong>
      </div>
    </button>
  )
}

