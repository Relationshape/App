// PROFILE-01. Port of public/legacy/js/app.js:987-1025 (profile grid) and
// app.js:1492-1514 (importCard) — full `.list-item` rows for imported results
// and templates, including Delete action.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'
import { CATEGORIES } from '@/lib/data/data'
import {
  Dialog, DialogContent, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Import, Profile } from '@/lib/storage/types'

export function Home() {
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const imports = useStore((s) => s.imports)
  const saveResult = useStore((s) => s.saveResult)

  const byDate = (a: Import, b: Import) => (b.importedAt ?? 0) - (a.importedAt ?? 0)
  const withAnswers = imports
    .filter((i) => i.exportMode !== 'template' && !(i.exportMode === 'restricted' && !i.answersUnlocked))
    .sort(byDate)
  const lockedImports = imports
    .filter((i) => i.exportMode === 'restricted' && !i.answersUnlocked)
    .sort(byDate)
  const templateImports = imports
    .filter((i) => i.exportMode === 'template')
    .sort(byDate)

  // "Use as template" dialog state
  const [templateImp, setTemplateImp] = useState<Import | null>(null)
  const [templateProfileId, setTemplateProfileId] = useState<string>('')

  function openTemplateWizard(imp: Import) {
    setTemplateProfileId(profiles[0]?.id ?? '')
    setTemplateImp(imp)
  }

  function confirmUseAsTemplate() {
    if (!templateImp || !templateProfileId) return
    const profile = profiles.find((p) => p.id === templateProfileId)
    if (!profile) return
    const id = crypto.randomUUID()
    saveResult({
      id,
      profileId: templateProfileId,
      subject: templateImp.subject?.trim() || profile.name,
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
    setTemplateImp(null)
    navigate(`/q-categories/${templateProfileId}/${id}`)
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
        <Link to="/profile/new" className="card card-add" data-testid="home-new-profile">
          <div className="card-add-icon">+</div>
          <div>{t('new_profile_btn')}</div>
        </Link>
      </div>
      {withAnswers.length > 0 && (
        <section className="page-section" data-testid="home-imports">
          <header className="section-head">
            <h2>{t('imports_with_answers_title')}</h2>
            <p className="muted">{t('imports_with_answers_sub')}</p>
          </header>
          <div className="list">
            {withAnswers.map((i) => (
              <ImportRow key={i.id} imp={i} category="answers" onUseTemplate={openTemplateWizard} />
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
              <ImportRow key={i.id} imp={i} category="locked" onUseTemplate={openTemplateWizard} />
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
              <ImportRow key={i.id} imp={i} category="template" onUseTemplate={openTemplateWizard} />
            ))}
          </div>
        </section>
      )}

      {/* Profile picker dialog for "Use as template" */}
      <Dialog open={!!templateImp} onOpenChange={(o) => { if (!o) setTemplateImp(null) }}>
        <DialogContent className="max-w-sm" data-testid="use-template-dialog">
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTemplateImp(null)}>{t('btn_cancel')}</Button>
            <Button
              disabled={!templateProfileId || profiles.length === 0}
              onClick={confirmUseAsTemplate}
              data-testid="use-template-confirm"
            >
              {t('btn_start_map')}
            </Button>
          </DialogFooter>
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

type ImportCategory = 'answers' | 'locked' | 'template'

function ImportRow({
  imp,
  category,
  onUseTemplate,
}: {
  imp: Import
  category: ImportCategory
  onUseTemplate: (imp: Import) => void
}) {
  const navigate = useNavigate()
  const deleteImport = useStore((s) => s.deleteImport)
  const v = (imp.version ?? 1) > 1 ? ` (v${imp.version})` : ''
  const color = imp.color || '#7c3aed'
  const subject = imp.subject?.trim() || '—'
  const title = (imp.name?.trim() || 'Imported result') + v
  const testIdBase = category === 'template' ? `home-template-${imp.id}` : `home-import-${imp.id}`

  async function onDelete() {
    const ok = await dialog<boolean>({
      title: t('confirm_delete_map'),
      body: <p>{t('confirm_delete_map')}</p>,
      actions: [
        { label: t('btn_cancel'), kind: 'ghost', value: false },
        { label: t('btn_delete'), kind: 'danger', value: true },
      ],
    })
    if (ok) deleteImport(imp.id)
  }

  return (
    <div
      className="list-item"
      style={{ ['--c' as 'color']: color } as React.CSSProperties}
      data-testid={testIdBase}
    >
      <div className="li-avatar">{imp.emoji || '📨'}</div>
      <div className="li-body">
        <h3>
          {title}
          {category === 'template' && (
            <span className="badge" style={{ marginLeft: 6, fontSize: 11 }}>
              {t('template_badge')}
            </span>
          )}
          {category === 'locked' && (
            <span className="badge" style={{ marginLeft: 6, fontSize: 11 }}>
              {t('locked_answers_badge')}
            </span>
          )}
        </h3>
        <p className="muted small">
          {`${subject}${v} · ${t('imported_on')} ${fmtDate(imp.importedAt)}`}
        </p>
      </div>
      <div className="li-actions">
        {category === 'answers' && (
          <button
            type="button"
            className="btn"
            onClick={() => navigate(`/compare?ids=imp:${imp.id}`)}
            data-testid={`${testIdBase}-compare`}
          >
            {t('btn_compare')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onUseTemplate(imp)}
          data-testid={`${testIdBase}-use-template`}
        >
          {t('btn_use_as_template')}
        </button>
        <button
          type="button"
          className="btn btn-danger-ghost"
          onClick={onDelete}
          data-testid={`${testIdBase}-delete`}
        >
          {t('btn_delete')}
        </button>
      </div>
    </div>
  )
}
