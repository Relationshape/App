// React port of public/legacy/js/app.js:1107-1241 openExportModal.
// Single-source share modal exposed via useShareData() — every "Share / Teilen" button
// in the app routes through this provider so the flow stays identical.
//
// Three modes (legacy parity):
//   - unrestricted: full answers travel in the encrypted bundle
//   - restricted:   answers are double-encrypted with a second reveal passphrase
//   - template:     no answers, just question catalogue + scale
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '@/lib/storage/store'
import type { Result, Profile } from '@/lib/storage/types'
import { encryptResult } from '@/lib/crypto/crypto'
import {
  buildBaseSharePayload,
  buildExportAskedItems,
  type ExportMode,
  type SharePayload,
} from '@/lib/share/payload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/useToast'
import { t } from '@/lib/i18n/i18n'

type Step = 'mode' | 'pass' | 'output'

interface ShareDataContextValue {
  /** Open the share modal for the given result id. No-op if the id can't be resolved. */
  openShare(resultId: string): void
  /** Open the share modal pre-set to template mode. onDone is called after the modal closes. */
  openShareTemplate(resultId: string, onDone?: () => void): void
}

const ShareDataContext = createContext<ShareDataContextValue | null>(null)

export function useShareData(): ShareDataContextValue {
  const ctx = useContext(ShareDataContext)
  if (!ctx) throw new Error('useShareData must be used within ShareDataProvider')
  return ctx
}

function slug(s: string | undefined): string {
  return (s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'map'
}

interface ModeCardProps {
  icon: string
  title: string
  desc: string
  testId: string
  onClick: () => void
}

function ModeCard({ icon, title, desc, testId, onClick }: ModeCardProps) {
  return (
    <button
      type="button"
      className="start-card"
      onClick={onClick}
      data-testid={testId}
    >
      <div className="start-icon" aria-hidden="true">{icon}</div>
      <div className="start-body">
        <h3>{title}</h3>
        <p className="muted small">{desc}</p>
      </div>
    </button>
  )
}

export function ShareDataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('mode')
  const [mode, setMode] = useState<ExportMode | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [pass, setPass] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [revealPass, setRevealPass] = useState('')
  const [revealPassConfirm, setRevealPassConfirm] = useState('')
  const [passError, setPassError] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [armor, setArmor] = useState<string | null>(null)

  const passInputRef = useRef<HTMLInputElement | null>(null)
  const onDoneRef = useRef<(() => void) | undefined>(undefined)

  const reset = useCallback(() => {
    setStep('mode')
    setMode(null)
    setResult(null)
    setProfile(null)
    setPass('')
    setPassConfirm('')
    setRevealPass('')
    setRevealPassConfirm('')
    setPassError(null)
    setBusy(false)
    setArmor(null)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    const cb = onDoneRef.current
    onDoneRef.current = undefined
    setTimeout(() => { reset(); cb?.() }, 200)
  }, [reset])

  const openShare = useCallback((resultId: string) => {
    const s = useStore.getState()
    const r = s.results.find((x) => x.id === resultId) ?? null
    const p = r ? s.profiles.find((x) => x.id === r.profileId) ?? null : null
    if (!r || !p) {
      // Nothing to share — surface a toast instead of silently failing.
      toast.error(t('import_no_results') as string)
      return
    }
    reset()
    setResult(r)
    setProfile(p)
    setOpen(true)
  }, [reset, toast])

  const openShareTemplate = useCallback((resultId: string, onDone?: () => void) => {
    const s = useStore.getState()
    const r = s.results.find((x) => x.id === resultId) ?? null
    const p = r ? s.profiles.find((x) => x.id === r.profileId) ?? null : null
    if (!r || !p) {
      toast.error(t('import_no_results') as string)
      onDone?.()
      return
    }
    onDoneRef.current = onDone
    reset()
    setResult(r)
    setProfile(p)
    setMode('template')
    setStep('pass')
    setOpen(true)
    requestAnimationFrame(() => passInputRef.current?.focus())
  }, [reset, toast])

  function pickMode(selected: ExportMode) {
    setMode(selected)
    setPassError(null)
    setStep('pass')
    // Move focus into the passphrase field on the next frame.
    requestAnimationFrame(() => passInputRef.current?.focus())
  }

  async function submitEncrypt(e: React.FormEvent) {
    e.preventDefault()
    if (!result || !profile || !mode) return

    setPassError(null)

    if (pass.length < 6) { setPassError(t('pass_too_short') as string); return }
    if (pass !== passConfirm) { setPassError(t('pass_mismatch') as string); return }

    if (mode === 'restricted') {
      if (revealPass.length < 6) { setPassError(t('pass_too_short') as string); return }
      if (revealPass !== revealPassConfirm) { setPassError(t('pass_mismatch') as string); return }
    }

    setBusy(true)
    try {
      const base = buildBaseSharePayload(result, profile)
      let payload: SharePayload
      if (mode === 'unrestricted') {
        payload = { ...base, answers: result.answers, exportMode: 'unrestricted' }
      } else if (mode === 'restricted') {
        const lockedAnswers = await encryptResult({ answers: result.answers }, revealPass)
        payload = {
          ...base,
          answers: {},
          lockedAnswers,
          exportMode: 'restricted',
          askedItems: buildExportAskedItems(result),
        }
      } else {
        payload = {
          ...base,
          answers: {},
          exportMode: 'template',
          askedItems: buildExportAskedItems(result),
        }
      }
      const out = await encryptResult(payload, pass)
      setArmor(out)
      setStep('output')
    } catch (err) {
      setPassError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copyToClipboard() {
    if (!armor) return
    try {
      await navigator.clipboard.writeText(armor)
      toast.success(t('share_copy_done') as string)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function downloadFile() {
    if (!armor || !result || !profile) return
    const filename = `relationshape-${slug(profile.name)}-${slug(result.subject)}.rshape.txt`
    const blob = new Blob([armor], { type: 'text/plain' })
    const file = new File([blob], filename, { type: 'text/plain' })
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return } catch { /* fallthrough */ }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const value = useMemo<ShareDataContextValue>(() => ({ openShare, openShareTemplate }), [openShare, openShareTemplate])

  const modeTitle =
    mode === 'unrestricted' ? (t('export_unrestricted_title') as string) :
    mode === 'restricted'   ? (t('export_restricted_title')   as string) :
    mode === 'template'     ? (t('export_template_title')     as string) :
                              (t('export_mode_title')         as string)

  const title = step === 'mode' ? (t('export_mode_title') as string)
              : step === 'output' ? (t('share_bundle_title') as string)
              : modeTitle

  return (
    <ShareDataContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(o) => { if (!o) close() }}
      >
        <DialogContent data-testid="share-data-modal" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="share-data-title">{title}</DialogTitle>
          </DialogHeader>

          {step === 'mode' && (
            <div className="start-choices" data-testid="share-data-mode-choices">
              <ModeCard
                icon="✨"
                title={t('export_unrestricted_title') as string}
                desc={t('export_unrestricted_desc') as string}
                testId="share-data-mode-unrestricted"
                onClick={() => pickMode('unrestricted')}
              />
              <ModeCard
                icon="🔒"
                title={t('export_restricted_title') as string}
                desc={t('export_restricted_desc') as string}
                testId="share-data-mode-restricted"
                onClick={() => pickMode('restricted')}
              />
              <ModeCard
                icon="📋"
                title={t('export_template_title') as string}
                desc={t('export_template_desc') as string}
                testId="share-data-mode-template"
                onClick={() => pickMode('template')}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={close}
                  data-testid="share-data-cancel"
                >
                  {t('btn_cancel') as string}
                </Button>
              </div>
            </div>
          )}

          {step === 'pass' && (
            <form className="form" onSubmit={submitEncrypt} data-testid="share-data-pass-form">
              <div className="callout">
                <strong>{t('share_callout_title') as string}</strong>{' '}
                {t('share_callout_body') as string}
              </div>
              <label>
                {t('share_pass_label') as string}
                <input
                  ref={passInputRef}
                  type="password"
                  autoComplete="new-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  minLength={6}
                  data-testid="share-data-pass"
                />
              </label>
              <label>
                {t('share_pass_confirm_label') as string}
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passConfirm}
                  onChange={(e) => setPassConfirm(e.target.value)}
                  required
                  data-testid="share-data-pass-confirm"
                />
              </label>
              {mode === 'restricted' && (
                <>
                  <label>
                    {t('export_reveal_pass_label') as string}
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={revealPass}
                      onChange={(e) => setRevealPass(e.target.value)}
                      required
                      minLength={6}
                      data-testid="share-data-reveal-pass"
                    />
                  </label>
                  <label>
                    {t('export_reveal_pass_confirm_label') as string}
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={revealPassConfirm}
                      onChange={(e) => setRevealPassConfirm(e.target.value)}
                      required
                      data-testid="share-data-reveal-pass-confirm"
                    />
                  </label>
                </>
              )}
              {passError && (
                <p role="alert" className="text-danger" data-testid="share-data-error">
                  {passError}
                </p>
              )}
              <div className="form-actions flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={close}
                  data-testid="share-data-cancel"
                >
                  {t('btn_cancel') as string}
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  data-testid="share-data-encrypt"
                >
                  {busy ? '…' : (t('btn_encrypt') as string)}
                </Button>
              </div>
            </form>
          )}

          {step === 'output' && armor && (
            <div data-testid="share-data-output">
              <p className="muted">{t('share_bundle_sub') as string}</p>
              <textarea
                className="share-out w-full min-h-[12rem] font-mono text-xs rounded border border-line px-2 py-1"
                readOnly
                value={armor}
                data-testid="share-data-output-text"
              />
              <div className="form-actions flex flex-wrap justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={close}
                  data-testid="share-data-close"
                >
                  {t('btn_close') as string}
                </Button>
                <Button
                  type="button"
                  onClick={copyToClipboard}
                  data-testid="share-data-copy"
                >
                  {t('btn_copy') as string}
                </Button>
                <Button
                  type="button"
                  onClick={() => { void downloadFile() }}
                  data-testid="share-data-download"
                >
                  {t('btn_download') as string}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ShareDataContext.Provider>
  )
}
