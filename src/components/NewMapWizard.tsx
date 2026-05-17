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
import type { Profile } from '@/lib/storage/types'

interface Props {
  profile: Profile
}

type Step = 0 | 1 | 2

export function NewMapWizard({ profile }: Props) {
  const navigate = useNavigate()
  const globalScale = useStore((s) => s.scale)
  const saveResult = useStore((s) => s.saveResult)
  const lang = getLang()

  const [step, setStep] = useState<Step>(0)
  const [subject, setSubject] = useState('')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set())
  const [scale, setScale] = useState<MutableScaleStep[]>(() => globalScale.map((s) => ({ ...s })))
  const [customizeScale, setCustomizeScale] = useState(false)

  function onCancel() {
    navigate(`/profile/${profile.id}`)
  }

  function onComplete() {
    const id = crypto.randomUUID()
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
                onKeyDown={(e) => { if (e.key === 'Enter' && subject.trim()) setStep(1) }}
                placeholder="e.g. Sam, my best friend"
                autoFocus
                data-testid="wizard-name-input"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onCancel} data-testid="wizard-cancel">
                {t('btn_cancel')}
              </Button>
              <Button
                onClick={() => setStep(1)}
                disabled={!subject.trim()}
                data-testid="wizard-name-next"
              >
                {t('btn_next')}
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
