// PROFILE-06, D-29. Blocking gate on first visit; migrates legacy rs-age-confirmed (CONCERNS Pitfall 13).
import { useEffect, useState } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useStore } from '@/lib/storage/store'
import { t } from '@/lib/i18n/i18n'

const LEGACY_KEY = 'rs-age-confirmed'

export function AgeGate() {
  const ageConfirmed = useStore((s) => s.settings.ageConfirmed)
  const setSettings = useStore((s) => s.setSettings)
  const [denied, setDenied] = useState(false)

  // Migration block (CONCERNS Pitfall 13): runs once on first mount.
  useEffect(() => {
    if (ageConfirmed) return
    if (typeof localStorage === 'undefined') return
    if (localStorage.getItem(LEGACY_KEY) === '1') {
      setSettings({ ageConfirmed: true })
      localStorage.removeItem(LEGACY_KEY)
    }
  }, [ageConfirmed, setSettings])

  if (denied) {
    return (
      <section role="alert" data-testid="age-gate-stop" className="flex min-h-screen items-center justify-center p-8 text-center">
        <p>{t('age_gate_stop')}</p>
      </section>
    )
  }
  if (ageConfirmed) return null

  return (
    <AlertDialog open={true}>
      <AlertDialogContent data-testid="age-gate-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('age_gate_title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('age_gate_body')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            data-testid="age-gate-no"
            onClick={() => setDenied(true)}
          >
            {t('age_gate_no')}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="age-gate-yes"
            onClick={() => setSettings({ ageConfirmed: true })}
          >
            {t('age_gate_yes')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
