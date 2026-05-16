// SHARE-01, SHARE-02. Port of public/legacy/js/app.js:3282-3354.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import { encryptResult } from '@/lib/crypto/crypto'
import { buildSharePayload } from '@/lib/share/payload'
import { useToast } from '@/lib/hooks/useToast'
import { t } from '@/lib/i18n/i18n'

function slug(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'map'
}

export function Share() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const result = useStore((s) => (id ? s.results.find((r) => r.id === id) ?? null : null))
  const profile = useStore((s) => (result ? s.profiles.find((p) => p.id === result.profileId) ?? null : null))
  const { toast } = useToast()

  const [pass, setPass] = useState('')
  const [armor, setArmor] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!result || !profile) navigate('/')
  }, [result, profile, navigate])

  if (!result || !profile) return null

  async function onEncrypt(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!pass) { setErr(t('share_passphrase_required') as string); return }
    setBusy(true)
    try {
      const payload = buildSharePayload(result!, profile!)
      const out = await encryptResult(payload, pass)
      setArmor(out)
    } catch (encErr) {
      setErr((encErr as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copyToClipboard() {
    if (!armor) return
    try {
      await navigator.clipboard.writeText(armor)
      toast.success(t('share_copy_done') as string)
    } catch (copyErr) {
      toast.error((copyErr as Error).message)
    }
  }

  function downloadFile() {
    if (!armor) return
    const blob = new Blob([armor], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relationshape-${slug(profile!.name)}-${slug(result!.subject)}.rshape.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="page narrow" data-testid="share-page">
      <Button asChild variant="ghost" data-testid="share-back">
        <Link to={`/result/${result.id}`}>{t('btn_back')}</Link>
      </Button>
      <header>
        <h1>{t('share_title')}</h1>
        <p className="muted">{t('share_sub')}</p>
      </header>
      <form className="form" onSubmit={onEncrypt} data-testid="share-form">
        <label>
          {t('share_passphrase_label')}
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            autoComplete="off"
            data-testid="share-passphrase"
          />
        </label>
        {err && <p role="alert" className="text-danger" data-testid="share-error">{err}</p>}
        <Button type="submit" disabled={busy} data-testid="share-encrypt-btn">
          {busy ? '…' : t('share_encrypt_btn')}
        </Button>
      </form>
      {armor && (
        <section className="share-result mt-6" data-testid="share-result">
          <h2>{t('share_bundle_title')}</h2>
          <p className="muted">{t('share_bundle_sub')}</p>
          <textarea
            className="share-out w-full min-h-[12rem] font-mono text-xs rounded border border-line px-2 py-1"
            readOnly
            value={armor}
            data-testid="share-output"
          />
          <div className="form-actions flex gap-2 mt-2">
            <Button type="button" onClick={copyToClipboard} data-testid="share-copy-btn">{t('btn_copy')}</Button>
            <Button type="button" onClick={downloadFile} data-testid="share-download-btn">{t('btn_download')}</Button>
          </div>
        </section>
      )}
    </section>
  )
}
