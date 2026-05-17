// PROFILE-01. Port of public/legacy/js/app.js:987-1025 (profile grid) and
// app.js:1492-1514 (importCard) — full `.list-item` rows for imported results
// and templates, including Delete action.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { t } from '@/lib/i18n/i18n'
import { CATEGORIES } from '@/lib/data/data'
import {
  Dialog, DialogContent, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UnlockAnswersBody } from '@/components/UnlockAnswersDialog'
import { ImportListRow } from '@/components/ImportListRow'
import type { Import, Profile } from '@/lib/storage/types'

function hasNoAnswers(imp: Import): boolean {
  return Object.values(imp.answers).every((cat) =>
    Object.entries(cat).every(([k, v]) =>
      k === '__hidden' || k === '__custom' || !v || !('scale' in (v as object))
    ) && !Object.keys(cat.__custom ?? {}).length
  )
}

export function Home() {
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const imports = useStore((s) => s.imports)
  const saveResult = useStore((s) => s.saveResult)
  const unlockImport = useStore((s) => s.unlockImport)

  const byDate = (a: Import, b: Import) => (b.importedAt ?? 0) - (a.importedAt ?? 0)
  const withAnswers = imports
    .filter((i) => {
      if (i.exportMode === 'restricted' && !i.answersUnlocked) return false
      if (i.exportMode === 'template') return false
      if (i.exportMode !== 'restricted' && hasNoAnswers(i)) return false
      return true
    })
    .sort(byDate)
  const lockedImports = imports
    .filter((i) => i.exportMode === 'restricted' && !i.answersUnlocked)
    .sort(byDate)
  const templateImports = imports
    .filter((i) => i.exportMode === 'template' || (i.exportMode !== 'restricted' && hasNoAnswers(i)))
    .sort(byDate)

  // "Use as template" dialog state — 2-step wizard
  const [templateImp, setTemplateImp] = useState<Import | null>(null)
  const [templateProfileId, setTemplateProfileId] = useState<string>('')
  const [templateStep, setTemplateStep] = useState<1 | 2>(1)
  const [templateSubject, setTemplateSubject] = useState<string>('')

  function openTemplateWizard(imp: Import) {
    setTemplateProfileId(profiles[0]?.id ?? '')
    // Skip profile picker when there is exactly one profile
    setTemplateStep(profiles.length === 1 ? 2 : 1)
    setTemplateSubject(imp.subject?.trim() ?? '')
    setTemplateImp(imp)
  }

  function closeTemplateWizard() {
    setTemplateImp(null)
    setTemplateStep(1)
    setTemplateSubject('')
  }

  function confirmUseAsTemplate() {
    if (!templateImp || !templateProfileId) return
    const profile = profiles.find((p) => p.id === templateProfileId)
    if (!profile) return
    const id = crypto.randomUUID()
    saveResult({
      id,
      profileId: templateProfileId,
      subject: templateSubject.trim() || profile.name,
      subjectEmoji: templateImp.subjectEmoji || profile.emoji,
      subjectColor: templateImp.subjectColor || profile.color,
      enabledCategories: templateImp.enabledCategories ?? CATEGORIES.map((c) => c.id),
      ...(templateImp.scale ? { scale: templateImp.scale } : {}),
      answers: {},
      seededFromImportId: templateImp.id,
      progress: { mode: 'list' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    closeTemplateWizard()
    navigate(`/q-categories/${templateProfileId}/${id}`)
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

  return (
    <section className="page" data-testid="home-page">
      <header className="page-head">
        <h1>{t('profiles_title')}</h1>
        <p className="muted">{t('profiles_sub')}</p>
      </header>
      <div className="grid cards" data-testid="home-profiles">
        {profiles.map((p) => (
          <Link
            key={p.id}
            to={`/profile/${p.id}`}
            className="card profile-card"
            style={{ ['--c' as 'color']: p.color } as React.CSSProperties}
            data-testid={`home-profile-${p.id}`}
          >
            <div className="avatar">{p.emoji || '✨'}</div>
            <h3>{p.name}</h3>
            {p.pronouns && <p className="muted small">{p.pronouns}</p>}
          </Link>
        ))}
        {profiles.length === 0 && (
          <Link to="/profile/new" className="card card-add" data-testid="home-new-profile">
            <div className="card-add-icon">+</div>
            <div>{t('new_profile_btn')}</div>
          </Link>
        )}
      </div>
      {withAnswers.length > 0 && (
        <section className="page-section" data-testid="home-imports">
          <header className="section-head">
            <h2>{t('imports_with_answers_title')}</h2>
            <p className="muted">{t('imports_with_answers_sub')}</p>
          </header>
          <div className="list">
            {withAnswers.map((i) => (
              <ImportListRow key={i.id} imp={i} category="answers" onUseTemplate={openTemplateWizard} onUnlock={handleUnlockImport} />
            ))}
          </div>
        </section>
      )}
      {lockedImports.length > 0 && (
        <section className="page-section" data-testid="home-locked-imports">
          <header className="section-head">
            <h2>{t('imports_locked_title')}</h2>
            <p className="muted">{t('imports_locked_sub')}</p>
          </header>
          <div className="list">
            {lockedImports.map((i) => (
              <ImportListRow key={i.id} imp={i} category="locked" onUseTemplate={openTemplateWizard} onUnlock={handleUnlockImport} />
            ))}
          </div>
        </section>
      )}
      {templateImports.length > 0 && (
        <section className="page-section" data-testid="home-templates">
          <header className="section-head">
            <h2>{t('templates_title')}</h2>
            <p className="muted">{t('templates_sub')}</p>
          </header>
          <div className="list">
            {templateImports.map((i) => (
              <ImportListRow key={i.id} imp={i} category="template" onUseTemplate={openTemplateWizard} onUnlock={handleUnlockImport} />
            ))}
          </div>
        </section>
      )}

      {/* 2-step "Use as template" wizard */}
      <Dialog open={!!templateImp} onOpenChange={(o) => { if (!o) closeTemplateWizard() }}>
        <DialogContent className="max-w-sm" data-testid="use-template-dialog">
          {templateStep === 1 && (
            <>
              <DialogTitle>{t('use_as_template_step1_title')}</DialogTitle>
              <p className="muted small">{t('use_as_template_step1_sub')}</p>
              <div className="flex flex-col gap-2 py-1">
                {profiles.map((p) => (
                  <ProfilePickerRow
                    key={p.id}
                    profile={p}
                    selected={p.id === templateProfileId}
                    onSelect={() => setTemplateProfileId(p.id)}
                  />
                ))}
                {profiles.length === 0 && (
                  <p className="muted small">{t('no_profiles_yet')}</p>
                )}
                <button
                  type="button"
                  className="btn btn-ghost text-left text-sm"
                  onClick={() => { closeTemplateWizard(); navigate('/profile/new') }}
                  data-testid="use-template-create-profile"
                >
                  {t('profile_picker_create_new')}
                </button>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={closeTemplateWizard}>{t('btn_cancel')}</Button>
                <Button
                  disabled={!templateProfileId || profiles.length === 0}
                  onClick={() => setTemplateStep(2)}
                  data-testid="use-template-step1-next"
                >
                  {t('btn_next')}
                </Button>
              </DialogFooter>
            </>
          )}
          {templateStep === 2 && (
            <>
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
                  data-testid="use-template-subject-input"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setTemplateStep(1)}>{t('btn_back')}</Button>
                <Button
                  onClick={confirmUseAsTemplate}
                  data-testid="use-template-confirm"
                >
                  {t('use_template_start_btn')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function ProfilePickerRow({ profile, selected, onSelect }: { profile: Profile; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={`list-item list-item--selectable${selected ? ' is-selected' : ''}`}
      style={{ ['--c' as 'color']: profile.color } as React.CSSProperties}
      onClick={onSelect}
      data-testid={`use-template-profile-${profile.id}`}
    >
      <div className="li-avatar" style={{ fontSize: 20 }}>{profile.emoji || '✨'}</div>
      <div className="li-body">
        <strong>{profile.name}</strong>
        {profile.pronouns && <span className="muted small" style={{ marginLeft: 6 }}>{profile.pronouns}</span>}
      </div>
      {selected && <span aria-hidden className="li-check">✓</span>}
    </button>
  )
}

