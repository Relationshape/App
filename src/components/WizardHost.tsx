// PROFILE-05, D-23. First-visit wizard. Reads settings.wizardSeen.
// After the final "Los geht's" button, opens CreateProfileModal if no profile exists yet.
import { useReducer, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/storage/store'
import { useSwipe } from '@/lib/hooks/useSwipe'
import { useKeydown } from '@/lib/hooks/useKeydown'
import { CreateProfileModal } from './CreateProfileModal'
import { t } from '@/lib/i18n/i18n'
import type { TranslationKey } from '@/lib/i18n/en'

interface WizardStep { title: TranslationKey; body: TranslationKey }

// Mirrors v1.0 buildWizardSteps at public/legacy/js/app.js:728-738
// Note: emoji is embedded in the translation keys (v1.0 values preserved)
const WIZARD_STEPS: WizardStep[] = [
  { title: 'wizard_s1_title', body: 'wizard_s1_body' },
  { title: 'wizard_s2_title', body: 'wizard_s2_body' },
  { title: 'wizard_s3_title', body: 'wizard_s3_body' },
  { title: 'wizard_s4_title', body: 'wizard_s4_body' },
  { title: 'wizard_s5_title', body: 'wizard_s5_body' },
  { title: 'wizard_s6_title', body: 'wizard_s6_body' },
  { title: 'wizard_s7_title', body: 'wizard_s7_body' },
]

type Action = { type: 'next' } | { type: 'prev' } | { type: 'finish' }
interface State { step: number; finished: boolean }

function reducer(state: State, action: Action): State {
  if (state.finished) return state
  switch (action.type) {
    case 'next':  return state.step < WIZARD_STEPS.length - 1 ? { ...state, step: state.step + 1 } : { ...state, finished: true }
    case 'prev':  return state.step > 0 ? { ...state, step: state.step - 1 } : state
    case 'finish': return { ...state, finished: true }
    default: return state
  }
}

export function WizardHost() {
  const wizardSeen = useStore((s) => s.settings.wizardSeen)
  const ageConfirmed = useStore((s) => s.settings.ageConfirmed)
  const hasProfile = useStore((s) => s.profiles.length > 0)
  const setSettings = useStore((s) => s.setSettings)
  const [state, dispatch] = useReducer(reducer, { step: 0, finished: false })
  const [createProfileOpen, setCreateProfileOpen] = useState(false)
  const navigate = useNavigate()

  const stepCfg = WIZARD_STEPS[state.step]!
  const isLast = state.step === WIZARD_STEPS.length - 1

  const bind = useSwipe({
    onLeft: () => dispatch({ type: 'next' }),
    onRight: () => dispatch({ type: 'prev' }),
    threshold: 40,
  })
  const keyHandlers = useMemo(() => ({
    ArrowRight: () => dispatch({ type: 'next' }),
    ArrowLeft: () => dispatch({ type: 'prev' }),
  }), [])
  useKeydown(keyHandlers, !wizardSeen && ageConfirmed === true && !state.finished)

  // Persist on finish (or skip)
  useEffect(() => {
    if (state.finished && !wizardSeen) {
      setSettings({ wizardSeen: true })
    }
  }, [state.finished, wizardSeen, setSettings])

  // Gate: only render when age confirmed AND wizard never seen AND not yet done
  if (!ageConfirmed) return null
  // Keep rendering if we still need to show the create-profile modal
  if (wizardSeen && !createProfileOpen) return null
  if (state.finished && !createProfileOpen) return null

  function handleFinish() {
    dispatch({ type: 'finish' })
    if (!hasProfile) setCreateProfileOpen(true)
  }

  function handleSkip() {
    dispatch({ type: 'finish' })
    // Skip does NOT prompt profile creation
  }

  return (
    <>
      {!state.finished && (
        <Dialog open={true} onOpenChange={(o) => { if (!o) handleSkip() }}>
          <DialogContent data-testid="wizard-host" {...bind()} style={{ touchAction: 'pan-y' }}>
            <DialogHeader>
              <DialogTitle data-testid="wizard-step-title">
                {t(stepCfg.title)}
              </DialogTitle>
              <DialogDescription data-testid="wizard-step-body">{t(stepCfg.body)}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={handleSkip} data-testid="wizard-skip">{t('wizard_skip')}</Button>
              <Button variant="ghost" onClick={() => dispatch({ type: 'prev' })} disabled={state.step === 0} data-testid="wizard-prev">{t('btn_back')}</Button>
              <Button onClick={() => { if (isLast) { handleFinish() } else { dispatch({ type: 'next' }) } }} data-testid="wizard-next">
                {isLast ? t('wizard_finish') : t('wizard_next')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <CreateProfileModal
        open={createProfileOpen}
        onOpenChange={setCreateProfileOpen}
        onCreated={(id) => navigate(`/profile/${id}`)}
      />
    </>
  )
}
