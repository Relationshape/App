// SHARE-03, SHARE-04. Port of public/legacy/js/app.js:3359-3437.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import { decryptResult } from '@/lib/crypto/crypto'
import { parseImportPayload, payloadToImport } from '@/lib/share/payload'
import { dialog } from '@/lib/dialog/dialog'
import { useToast } from '@/lib/hooks/useToast'
import { t } from '@/lib/i18n/i18n'

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `imp-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function Import() {
  const navigate = useNavigate()
  const saveImport = useStore((s) => s.saveImport)
  const { toast } = useToast()
  const [blob, setBlob] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setBlob(text)
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
      const payload = parseImportPayload(decrypted)  // throws on wrong type / shape
      const id = uid()
      const imp = payloadToImport(payload, id)
      saveImport(imp)
      toast.success((payload.version ?? 1) > 1
        ? t('imported_versioned_toast', { n: payload.version ?? 1 }) as string
        : t('imported_toast') as string)
      navigate(`/compare?ids=imp:${id}`)
    } catch {
      // V6 information leakage avoidance: single generic error, never differentiate wrong-pass from corrupted-bundle
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
    <section className="page narrow" data-testid="import-page">
      <header>
        <h1>{t('import_title')}</h1>
        <p className="muted">{t('import_sub')}</p>
      </header>
      <form className="form" onSubmit={onSubmit} data-testid="import-form">
        <label>
          {t('import_bundle_label')}
          <textarea
            value={blob}
            onChange={(e) => setBlob(e.target.value)}
            rows={10}
            className="w-full font-mono text-xs"
            data-testid="import-textarea"
          />
        </label>
        <label>
          {t('import_file_label')}
          <input
            type="file"
            accept=".txt,.rshape,.json"
            onChange={onFile}
            data-testid="import-file"
          />
        </label>
        <label>
          {t('import_pass_label')}
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="off"
            required
            data-testid="import-passphrase"
          />
        </label>
        <Button type="submit" disabled={busy} data-testid="import-submit">
          {busy ? '…' : t('import_btn')}
        </Button>
      </form>
    </section>
  )
}
