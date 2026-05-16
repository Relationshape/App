// SETTINGS-04, SHARE-06, D-39. Export / import / clear-all. Port of public/legacy/js/app.js data management section.
import { useState } from 'react'
import { useStore } from '@/lib/storage/store'
import { DEFAULT_SCALE } from '@/lib/data/data'
import type { MutableScaleStep } from '@/lib/data/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/lib/hooks/useToast'
import { t } from '@/lib/i18n/i18n'

export function DataManagement() {
  const replaceAll = useStore((s) => s.replaceAll)
  const { toast } = useToast()
  const [clearOpen, setClearOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  function exportBackup() {
    const s = useStore.getState()
    const snapshot = {
      profiles: s.profiles,
      results: s.results,
      imports: s.imports,
      settings: s.settings,
      scale: s.scale,
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().split('T')[0]
    a.download = `relationshape-backup-${date}.v1.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('backup_exported'))
  }

  async function importBackup(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid backup file')
      const { dialog } = await import('@/lib/dialog/dialog')
      const ok = await dialog<boolean>({
        title: t('backup_restore_confirm_title'),
        body: <p>{t('backup_restore_confirm_body')}</p>,
        actions: [
          { label: t('btn_cancel'), kind: 'ghost', value: false },
          { label: t('btn_restore'), kind: 'danger', value: true },
        ],
      })
      if (!ok) return
      replaceAll(parsed as Partial<{ profiles: any[]; results: any[]; imports: any[]; settings: any; scale: MutableScaleStep[] }>)
      toast.success(t('backup_imported'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  function clearAll() {
    if (confirmText !== 'DELETE') return
    replaceAll({
      profiles: [],
      results: [],
      imports: [],
      settings: { theme: 'auto' },
      scale: DEFAULT_SCALE.map((s) => ({ ...s })) as MutableScaleStep[],
    })
    setClearOpen(false)
    setConfirmText('')
    toast.success(t('cleared_all_data'))
  }

  return (
    <section className="page-section" data-testid="data-management">
      <header className="section-head"><h2>{t('settings_data_title')}</h2></header>
      <div className="form-actions">
        <button type="button" className="btn" onClick={exportBackup} data-testid="data-export-btn">{t('btn_backup')}</button>
        <label className="btn cursor-pointer">
          {t('btn_restore')}
          <input
            type="file"
            accept=".json"
            className="hidden"
            data-testid="data-import-file"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importBackup(f)
              e.target.value = ''  // allow same file again
            }}
          />
        </label>
        <button type="button" className="btn btn-danger-ghost" onClick={() => setClearOpen(true)} data-testid="data-clear-btn">
          {t('btn_erase')}
        </button>
      </div>
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent data-testid="data-clear-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clear_all_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('clear_all_body')}</AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded border border-line px-2 py-1"
            data-testid="data-clear-confirm-input"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConfirmText(''); setClearOpen(false) }} data-testid="data-clear-cancel">{t('btn_cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={confirmText !== 'DELETE'} onClick={clearAll} data-testid="data-clear-confirm">{t('btn_confirm_delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
