// PROFILE-04. Port of public/legacy/js/app.js:1564-1589

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { ResultCard } from '@/components/ResultCard'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { UnlockAnswersBody } from '@/components/UnlockAnswersDialog'
import { ImportListRow } from '@/components/ImportListRow'
import { TemplateViewModal } from '@/components/TemplateViewModal'
import { CATEGORIES } from '@/lib/data/data'
import { seedAnswersFromTemplate } from '@/lib/charts/items'
import { t } from '@/lib/i18n/i18n'
import { ProcessGuideModal } from '@/components/ProcessGuideModal'
import { useToast } from '@/lib/hooks/useToast'
import type { Import } from '@/lib/storage/types'

function hasNoAnswers(imp: Import): boolean {
  return Object.values(imp.answers).every((cat) =>
    Object.entries(cat).every(([k, v]) =>
      k === '__hidden' || k === '__custom' || !v || !('scale' in (v as object))
    ) && !Object.keys(cat.__custom ?? {}).length
  )
}

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  // Select arrays then derive — avoids unstable .find()/.filter() references in useSyncExternalStore (React 19 #3099-compat)
  const profiles = useStore((s) => s.profiles)
  const allResults = useStore((s) => s.results)
  const allImports = useStore((s) => s.imports)
  const deleteProfile = useStore((s) => s.deleteProfile)
  const saveResult = useStore((s) => s.saveResult)
  const unlockImport = useStore((s) => s.unlockImport)
  const storeScale = useStore((s) => s.scale)
  const navigate = useNavigate()
  const { toast } = useToast()

  const profile = id ? (profiles.find((p) => p.id === id) ?? null) : null
  const results = id ? allResults.filter((r) => r.profileId === id) : []

  const byDate = (a: Import, b: Import) => (b.importedAt ?? 0) - (a.importedAt ?? 0)
  const withAnswers = allImports
    .filter((i) => {
      if (i.exportMode === 'restricted' && !i.answersUnlocked) return false
      if (i.exportMode === 'template') return false
      if (i.exportMode !== 'restricted' && hasNoAnswers(i)) return false
      return true
    })
    .sort(byDate)
  const lockedImports = allImports
    .filter((i) => i.exportMode === 'restricted' && !i.answersUnlocked)
    .sort(byDate)
  const templateImports = allImports
    .filter((i) => i.exportMode === 'template' || (i.exportMode !== 'restricted' && hasNoAnswers(i)))
    .sort(byDate)

  // "Use as template" dialog — single step (profile already known)
  const [templateImp, setTemplateImp] = useState<Import | null>(null)
  const [templateSubject, setTemplateSubject] = useState('')
  const [viewTemplateImp, setViewTemplateImp] = useState<Import | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  // "Copy map" dialog — same simple flow as use-as-template
  const [copySourceResult, setCopySourceResult] = useState<import('@/lib/storage/types').Result | null>(null)
  const [copySubject, setCopySubject] = useState('')

  function startCopyResult(r: import('@/lib/storage/types').Result) {
    setCopySubject(r.subject?.trim() ?? '')
    setCopySourceResult(r)
  }

  function confirmCopyResult(withAnswers: boolean) {
    if (!copySourceResult || !profile) return
    const newId = crypto.randomUUID()
    saveResult({
      id: newId,
      profileId: profile.id,
      subject: copySubject.trim() || profile.name,
      subjectEmoji: copySourceResult.subjectEmoji || profile.emoji,
      subjectColor: copySourceResult.subjectColor || profile.color,
      enabledCategories: copySourceResult.enabledCategories ?? CATEGORIES.map((c) => c.id),
      scale: copySourceResult.scale ?? storeScale,
      ...(copySourceResult.customItemDefs ? { customItemDefs: structuredClone(copySourceResult.customItemDefs) } : {}),
      ...(copySourceResult.customCategories ? { customCategories: structuredClone(copySourceResult.customCategories) } : {}),
      answers: withAnswers
        ? structuredClone(copySourceResult.answers)
        : seedAnswersFromTemplate(copySourceResult.customItemDefs, copySourceResult.customCategories),
      seededFromResultId: copySourceResult.id,
      progress: { mode: 'list' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    setCopySourceResult(null)
    navigate(`/q-categories/${profile.id}/${newId}`)
  }

  function openTemplateWizard(imp: Import) {
    setTemplateSubject(imp.subject?.trim() ?? '')
    setTemplateImp(imp)
  }

  function closeTemplateWizard() {
    setTemplateImp(null)
    setTemplateSubject('')
  }

  function confirmUseAsTemplate() {
    if (!templateImp || !profile) return
    const newId = crypto.randomUUID()
    saveResult({
      id: newId,
      profileId: profile.id,
      subject: templateSubject.trim() || profile.name,
      subjectEmoji: templateImp.subjectEmoji || profile.emoji,
      subjectColor: templateImp.subjectColor || profile.color,
      enabledCategories: templateImp.enabledCategories ?? CATEGORIES.map((c) => c.id),
      scale: templateImp.scale ?? storeScale,
      ...(templateImp.customItemDefs ? { customItemDefs: templateImp.customItemDefs } : {}),
      ...(templateImp.customCategories ? { customCategories: templateImp.customCategories } : {}),
      answers: seedAnswersFromTemplate(templateImp.customItemDefs, templateImp.customCategories),
      seededFromImportId: templateImp.id,
      progress: { mode: 'list' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    closeTemplateWizard()
    navigate(`/q-categories/${profile.id}/${newId}`)
  }

  function handleUnlockImport(imp: Import) {
    void dialog<boolean>({
      title: t('unlock_answers_title'),
      body: (close) => (
        <UnlockAnswersBody
          imp={imp}
          onUnlock={(answers) => { unlockImport(imp.id, answers); close(true) }}
          onCancel={() => close(false)}
        />
      ),
      actions: [],
    })
  }

  // Use useEffect to avoid setState-in-render when redirecting on not-found
  useEffect(() => {
    if (profile === null) navigate('/')
  }, [profile, navigate])

  if (!profile) return null

  function downloadBackup() {
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

  async function onDelete() {
    const ok = await dialog<boolean>({
      title: t('confirm_delete_profile_title'),
      body: <p>{t('confirm_delete_profile')}</p>,
      actions: [
        { label: t('btn_cancel'), kind: 'ghost', value: false },
        { label: t('btn_delete'), kind: 'danger', value: true },
      ],
    })
    if (ok && profile) { deleteProfile(profile.id); navigate('/') }
  }

  return (
    <section className="page" data-testid="profile-detail-page">
      <header
        className="profile-head"
        style={{ ['--c' as 'color']: profile.color } as React.CSSProperties}
      >
        <div className="avatar avatar-lg">{profile.emoji}</div>
        <div className="profile-head-info">
          <h1 data-testid="profile-name">{profile.name}</h1>
          {profile.pronouns && <p className="muted">{profile.pronouns}</p>}
        </div>
        <div className="flex-spacer" />
        <div className="profile-head-actions">
          <Button asChild variant="outline" data-testid="profile-edit-btn">
            <Link to={`/profile/${profile.id}/edit`}>{t('btn_edit')}</Link>
          </Button>
          <Button variant="destructive" onClick={onDelete} data-testid="profile-delete-btn">{t('btn_delete')}</Button>
        </div>
      </header>
      <section className="page-section">
        <header className="section-head flex items-start justify-between gap-2">
          <div>
            <h2>{t('maps_title')}</h2>
            <p className="muted">{t('maps_sub')}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setGuideOpen(true)} data-testid="profile-guide-btn">{t('guide_open_btn')}</Button>
        </header>
        <div className="list" data-testid="result-list">
          {results.map((r) => (
            <ResultCard key={r.id} result={r} profile={profile} onCopy={startCopyResult} />
          ))}
          <button
            type="button"
            className="list-add"
            onClick={() => navigate(`/q-categories/${profile.id}/new`)}
            data-testid="new-map-btn"
          >
            {t('btn_new_map')}
          </button>
        </div>
      </section>

      {/* Imports section — always visible; shows subsections only when they have content */}
      <section className="page-section" data-testid="profile-imports-section">
        <header className="section-head">
          <h2>{t('imports_section_title')}</h2>
        </header>

        {allImports.length === 0 && (
          <p className="muted small" data-testid="profile-no-imports">{t('profile_no_imports_yet')}</p>
        )}

        {withAnswers.length > 0 && (
          <div data-testid="profile-imports">
            <h3 className="section-sub-head">{t('imports_with_answers_title')}</h3>
            <p className="muted small mb-2">{t('imports_with_answers_sub')}</p>
            <div className="list">
              {withAnswers.map((i) => (
                <ImportListRow
                  key={i.id}
                  imp={i}
                  category="answers"
                  testIdBase={`profile-import-${i.id}`}
                  onUseTemplate={openTemplateWizard}
                  onUnlock={handleUnlockImport}
                />
              ))}
            </div>
          </div>
        )}

        {lockedImports.length > 0 && (
          <div data-testid="profile-locked-imports" className="mt-4">
            <h3 className="section-sub-head">{t('imports_locked_title')}</h3>
            <p className="muted small mb-2">{t('imports_locked_sub')}</p>
            <div className="list">
              {lockedImports.map((i) => (
                <ImportListRow
                  key={i.id}
                  imp={i}
                  category="locked"
                  testIdBase={`profile-locked-${i.id}`}
                  onUseTemplate={openTemplateWizard}
                  onUnlock={handleUnlockImport}
                />
              ))}
            </div>
          </div>
        )}

        {templateImports.length > 0 && (
          <div data-testid="profile-templates" className="mt-4">
            <h3 className="section-sub-head">{t('templates_title')}</h3>
            <p className="muted small mb-2">{t('templates_sub')}</p>
            <div className="list">
              {templateImports.map((i) => (
                <ImportListRow
                  key={i.id}
                  imp={i}
                  category="template"
                  testIdBase={`profile-template-${i.id}`}
                  onUseTemplate={openTemplateWizard}
                  onUnlock={handleUnlockImport}
                  onViewTemplate={setViewTemplateImp}
                />
              ))}
            </div>
          </div>
        )}

        {/* Always-visible import CTA */}
        <div className="list mt-4">
          <button
            type="button"
            className="list-add"
            onClick={() => navigate('/import')}
            data-testid="profile-import-btn"
          >
            {t('btn_import_cards')}
          </button>
        </div>
      </section>

      <section className="page-section">
        <Button variant="outline" onClick={downloadBackup} data-testid="profile-backup-btn">{t('btn_backup')}</Button>
      </section>

      <Dialog open={!!templateImp} onOpenChange={(o) => { if (!o) closeTemplateWizard() }}>
        <DialogContent className="max-w-sm" data-testid="profile-use-template-dialog">
          <DialogTitle>{t('use_template_step2_title')}</DialogTitle>
          <div className="flex flex-col gap-2 py-1">
            <input
              type="text"
              className="w-full rounded border border-line px-3 py-2 text-sm bg-surface"
              value={templateSubject}
              onChange={(e) => setTemplateSubject(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmUseAsTemplate() }}
              placeholder={t('map_name_label')}
              autoFocus
              data-testid="profile-use-template-subject"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeTemplateWizard}>{t('btn_cancel')}</Button>
            <Button onClick={confirmUseAsTemplate} data-testid="profile-use-template-confirm">
              {t('use_template_start_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewTemplateImp && (
        <TemplateViewModal
          open={!!viewTemplateImp}
          onOpenChange={(o) => { if (!o) setViewTemplateImp(null) }}
          imp={viewTemplateImp}
          onUseAsTemplate={() => openTemplateWizard(viewTemplateImp)}
        />
      )}

      <Dialog open={!!copySourceResult} onOpenChange={(o) => { if (!o) setCopySourceResult(null) }}>
        <DialogContent className="max-w-sm" data-testid="profile-copy-map-dialog">
          <DialogTitle>{t('copy_map_title')}</DialogTitle>
          <div className="flex flex-col gap-3 py-1">
            <input
              type="text"
              className="w-full rounded border border-line px-3 py-2 text-sm bg-surface"
              value={copySubject}
              onChange={(e) => setCopySubject(e.target.value)}
              placeholder={t('map_name_label')}
              autoFocus
              data-testid="profile-copy-map-subject"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => confirmCopyResult(true)}
                data-testid="profile-copy-with-answers"
              >
                {t('copy_map_with_answers')}
              </button>
              <button
                type="button"
                className="btn flex-1"
                onClick={() => confirmCopyResult(false)}
                data-testid="profile-copy-without-answers"
              >
                {t('copy_map_without_answers')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProcessGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </section>
  )
}
