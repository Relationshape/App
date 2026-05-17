// New-map onboarding wizard. Port of public/legacy/js/app.js:1725-1766 (startBlank).
// 3 steps: map name → category picker → scale confirm/customize.
// Shown in CategoryOverview when resultId === 'new'.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CATEGORIES, CATEGORY_GROUPS } from '@/lib/data/data'
import { useStore } from '@/lib/storage/store'
import { ScaleEditor } from '@/components/ScaleEditor'
import { t, getLang } from '@/lib/i18n/i18n'
import type { MutableScaleStep } from '@/lib/data/types'
import type { Import, Profile } from '@/lib/storage/types'

interface Props {
  profile: Profile
}

type Step = 'source' | 'pick' | 0 | 1 | 2

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
  const lang = getLang()
  const allResults = useStore((s) => s.results)
  const allImports = useStore((s) => s.imports)

  const profileResults = allResults.filter((r) => r.profileId === profile.id)
  const templateImports = allImports.filter((i) =>
    i.exportMode === 'template' ||
    (i.exportMode !== 'restricted' && hasNoAnswersForImport(i))
  )
  const hasTemplates = profileResults.length > 0 || templateImports.length > 0

  const [step, setStep] = useState<Step>(hasTemplates ? 'source' : 0)
  const [subject, setSubject] = useState('')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set())
  const [scale, setScale] = useState<MutableScaleStep[]>(() => globalScale.map((s) => ({ ...s })))
  const [customizeScale, setCustomizeScale] = useState(false)
  const [templateSource, setTemplateSource] = useState<TemplateSource | null>(null)

  function onCancel() {
    navigate(`/profile/${profile.id}`)
  }

  function onComplete() {
    const id = crypto.randomUUID()

    if (templateSource) {
      const tmplCategories = templateSource.kind === 'import'
        ? templateImports.find((i) => i.id === templateSource.id)?.enabledCategories ?? CATEGORIES.map((c) => c.id)
        : profileResults.find((r) => r.id === templateSource.id)?.enabledCategories ?? CATEGORIES.map((c) => c.id)
      const tmplScale = templateSource.kind === 'import'
        ? templateImports.find((i) => i.id === templateSource.id)?.scale
        : profileResults.find((r) => r.id === templateSource.id)?.scale
      saveResult({
        id,
        profileId: profile.id,
        subject: subject.trim() || profile.name,
        subjectColor: profile.color,
        subjectEmoji: profile.emoji,
        answers: {},
        enabledCategories: tmplCategories,
        ...(tmplScale ? { scale: tmplScale } : {}),
        ...(templateSource.kind === 'import'
          ? { seededFromImportId: templateSource.id }
          : { seededFromResultId: templateSource.id }),
        progress: { mode: 'list' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      navigate(`/q-categories/${profile.id}/${id}`, { replace: true })
      return
    }

    const enabledCategories =
      checkedIds.size > 0
        ? Array.from(checkedIds)
        : CATEGORIES.map((c) => c.id)

    saveResult({
      id,
      profileId: profile.id,
      subject: subject.trim() || profile.name,
      subjectColor: profile.color,
      subjectEmoji: profile.emoji,
      answers: {},
      enabledCategories,
      ...(customizeScale ? { scale } : {}),
      progress: { mode: 'list' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    navigate(`/q-categories/${profile.id}/${id}`, { replace: true })
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
    setCheckedIds(new Set(CATEGORIES.map((c) => c.id)))
    setStep(2)
  }

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent
        className="max-w-[min(560px,96vw)] max-h-[min(90vh,720px)] p-6 flex flex-col gap-3"
        showCloseButton={false}
        data-testid="new-map-wizard"
      >
        {step === 'source' && (
          <>
            <DialogHeader>
              <DialogTitle data-testid="wizard-step-source-title">{t('new_map_title')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
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
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onCancel} data-testid="wizard-cancel">
                {t('btn_cancel')}
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
                    if (templateSource) { onComplete() } else { setStep(1) }
                  }
                }}
                placeholder="e.g. Sam, my best friend"
                autoFocus
                data-testid="wizard-name-input"
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  if (templateSource) { setStep('pick') }
                  else if (hasTemplates) { setStep('source') }
                  else { onCancel() }
                }}
                data-testid="wizard-cancel"
              >
                {templateSource || hasTemplates ? t('btn_back') : t('btn_cancel')}
              </Button>
              <Button
                onClick={() => { if (templateSource) { onComplete() } else { setStep(1) } }}
                disabled={!subject.trim()}
                data-testid="wizard-name-next"
              >
                {templateSource ? t('use_template_start_btn') : t('btn_next')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>{t('onboarding_title')}</DialogTitle>
              <DialogDescription>{t('onboarding_sub')}</DialogDescription>
            </DialogHeader>
            <div className="onboarding-body flex-1 overflow-y-auto min-h-0" data-testid="wizard-cat-step">
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
              <Button variant="ghost" onClick={() => setStep(0)} data-testid="wizard-cat-back">
                {t('btn_back')}
              </Button>
              <Button variant="ghost" onClick={selectAllAndContinue} data-testid="wizard-cat-skip">
                {t('btn_skip_onboarding')}
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={checkedIds.size === 0}
                data-testid="wizard-cat-next"
              >
                {t('btn_start_map')}
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>{t('new_card_scale_title')}</DialogTitle>
              <DialogDescription>{t('new_card_scale_sub')}</DialogDescription>
            </DialogHeader>
            <div className="scale-dialog-body flex-1 overflow-y-auto min-h-0" data-testid="wizard-scale-step">
              <div className="callout" style={{ marginBottom: '12px', fontSize: '13px' }}>
                {t('wizard_scale_hint')}
              </div>
              {!customizeScale ? (
                <div className="scale-preview-list">
                  {scale.map((s) => (
                    <div key={s.key} className="scale-preview-row">
                      <div className="scale-preview-swatch" style={{ background: s.color }} />
                      <span className="scale-preview-label">{s.label}</span>
                      <span className="scale-preview-short">{s.short}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <ScaleEditor scale={scale} onChange={setScale} />
              )}
            </div>
            <div className="rs-modal-actions">
              <Button
                variant="ghost"
                onClick={() => { setStep(1); setCustomizeScale(false) }}
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
              <Button onClick={onComplete} data-testid="wizard-scale-confirm">
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

