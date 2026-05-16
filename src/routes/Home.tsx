// PROFILE-01. Port of public/legacy/js/app.js:987-1025 (profile grid) and
// app.js:1492-1514 (importCard) — full `.list-item` rows for imported results
// and templates, including Delete action.

import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { isTemplateImport } from '@/lib/data/imports'
import { dialog } from '@/lib/dialog/dialog'
import { fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'
import type { Import } from '@/lib/storage/types'

export function Home() {
  const profiles = useStore((s) => s.profiles)
  const imports = useStore((s) => s.imports)
  const visibleImports = imports
    .filter((i) => !isTemplateImport(i))
    .sort((a, b) => (b.importedAt ?? 0) - (a.importedAt ?? 0))
  const templateImports = imports
    .filter((i) => isTemplateImport(i))
    .sort((a, b) => (b.importedAt ?? 0) - (a.importedAt ?? 0))

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
      {visibleImports.length > 0 && (
        <section className="page-section" data-testid="home-imports">
          <header className="section-head">
            <h2>{t('imports_title')}</h2>
            <p className="muted">{t('imports_sub')}</p>
          </header>
          <div className="list">
            {visibleImports.map((i) => (
              <ImportRow key={i.id} imp={i} isTemplate={false} />
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
              <ImportRow key={i.id} imp={i} isTemplate={true} />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}

function ImportRow({ imp, isTemplate }: { imp: Import; isTemplate: boolean }) {
  const navigate = useNavigate()
  const deleteImport = useStore((s) => s.deleteImport)
  const v = (imp.version ?? 1) > 1 ? ` (v${imp.version})` : ''
  const isLocked = imp.exportMode === 'restricted' && !imp.answersUnlocked
  const color = imp.color || '#7c3aed'
  const subject = imp.subject?.trim() || '—'
  const title = (imp.name?.trim() || 'Imported result') + v
  const testIdBase = isTemplate ? `home-template-${imp.id}` : `home-import-${imp.id}`

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
          {isTemplate && (
            <span className="badge" style={{ marginLeft: 6, fontSize: 11 }}>
              {t('template_badge')}
            </span>
          )}
          {isLocked && (
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
        {isTemplate ? (
          <button
            type="button"
            className="btn btn-primary"
            data-testid={`${testIdBase}-use-template`}
          >
            {t('btn_use_as_template')}
          </button>
        ) : (
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
