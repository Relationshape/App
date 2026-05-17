import { useState } from 'react'
import { decryptResult } from '@/lib/crypto/crypto'
import { t } from '@/lib/i18n/i18n'
import type { AnswersBlob, Import } from '@/lib/storage/types'

export function UnlockAnswersBody({
  imp,
  onUnlock,
  onCancel,
}: {
  imp: Import
  onUnlock: (answers: AnswersBlob) => void
  onCancel: () => void
}) {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit() {
    if (!imp.lockedAnswers) return
    setBusy(true)
    setError(null)
    try {
      const decrypted = await decryptResult(imp.lockedAnswers, passphrase)
      const payload = decrypted as { answers: AnswersBlob }
      onUnlock(payload.answers)
    } catch {
      setError(t('unlock_answers_error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="muted small">{t('unlock_answers_sub')}</p>
      <input
        type="password"
        className="w-full rounded border border-line px-3 py-2 text-sm bg-surface"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && passphrase) void handleSubmit() }}
        placeholder={t('unlock_answers_title')}
        autoFocus
        data-testid="unlock-answers-input"
      />
      {error && <p className="text-red-500 text-sm" data-testid="unlock-answers-error">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          {t('btn_cancel')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => void handleSubmit()}
          disabled={!passphrase || busy}
          data-testid="unlock-answers-submit"
        >
          {t('unlock_answers_btn')}
        </button>
      </div>
    </div>
  )
}
