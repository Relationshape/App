// Reusable import form: paste bundle + file + passphrase → decrypt → save → optional unlock.
// Used by Import.tsx (page) and Compare.tsx (inline modal).

import { useState } from 'react'
import { useStore } from '@/lib/storage/store'
import { decryptResult } from '@/lib/crypto/crypto'
import { parseImportPayload, payloadToImport } from '@/lib/share/payload'
import { dialog } from '@/lib/dialog/dialog'
import { useToast } from '@/lib/hooks/useToast'
import { Button } from '@/components/ui/button'
import { UnlockAnswersBody } from '@/components/UnlockAnswersDialog'
import { t } from '@/lib/i18n/i18n'
import type { Import } from '@/lib/storage/types'

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `imp-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

interface Props {
  /** Called after import (and optional unlock) completes successfully. */
  onSuccess: (imp: Import) => void
  /** Extra class applied to the <form> element. */
  className?: string
  testIdPrefix?: string
}

export function ImportForm({ onSuccess, className, testIdPrefix = 'import' }: Props) {
  const saveImport = useStore((s) => s.saveImport)
  const unlockImport = useStore((s) => s.unlockImport)
  const { toast } = useToast()
  const [blob, setBlob] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setBlob(await file.text())
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!blob.trim()) {
      await dialog<null>({
        title: t('import_failed_title') as string,
        body: <p>{t('import_empty')}</p>,
        actions: [{ label: t('btn_ok') as string, kind: 'primary', value: null }],
      })
      return
    }
    setBusy(true)
    try {
      const decrypted = await decryptResult(blob.trim(), pass) as unknown
      const payload = parseImportPayload(decrypted)
      const id = uid()
      const imp = payloadToImport(payload, id)
      saveImport(imp)
      toast.success(
        (payload.version ?? 1) > 1
          ? (t('imported_versioned_toast', { n: payload.version ?? 1 }) as string)
          : (t('imported_toast') as string),
      )

      // Immediately offer to unlock password-protected answers.
      if (imp.exportMode === 'restricted' && imp.lockedAnswers) {
        await dialog<boolean>({
          title: t('unlock_answers_title'),
          body: (close) => (
            <UnlockAnswersBody
              imp={imp}
              onUnlock={(answers) => { unlockImport(imp.id, answers); close(true) }}
              onCancel={() => close(false)}
            />
          ),
          actions: [],
          dismissable: false,
        })
      }

      onSuccess(imp)
    } catch {
      await dialog<null>({
        title: t('import_failed_title') as string,
        body: <p>{t('unlock_failed')}</p>,
        actions: [{ label: t('btn_ok') as string, kind: 'primary', value: null }],
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={`form${className ? ` ${className}` : ''}`} onSubmit={onSubmit} data-testid={`${testIdPrefix}-form`}>
      <label>
        {t('import_bundle_label')}
        <textarea
          value={blob}
          onChange={(e) => setBlob(e.target.value)}
          rows={6}
          className="w-full font-mono text-xs"
          data-testid={`${testIdPrefix}-textarea`}
          placeholder={'-----BEGIN RELATIONSHAPE BUNDLE-----\nv1\n…\n-----END RELATIONSHAPE BUNDLE-----'}
        />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t('import_file_label')}</span>
        <div className="flex items-center gap-2">
          <label className="btn cursor-pointer" style={{ display: 'inline-flex', alignItems: 'center' }}>
            {t('import_file_btn')}
            <input
              type="file"
              accept=".txt,.rshape,.json"
              className="hidden"
              onChange={onFile}
              data-testid={`${testIdPrefix}-file`}
            />
          </label>
          {fileName && <span className="text-sm muted truncate max-w-[12rem]">{fileName}</span>}
        </div>
      </div>
      <label>
        {t('import_pass_label')}
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="off"
          required
          data-testid={`${testIdPrefix}-passphrase`}
        />
      </label>
      <Button type="submit" disabled={busy} data-testid={`${testIdPrefix}-submit`}>
        {busy ? '…' : t('import_btn')}
      </Button>
    </form>
  )
}
