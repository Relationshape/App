// PROFILE-01. Port of public/legacy/js/app.js:987-1025

import { Link } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { isTemplateImport, importLabel } from '@/lib/data/imports'
import { t } from '@/lib/i18n/i18n'

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
          <ul>
            {visibleImports.map((i) => (
              <li key={i.id}>
                <Link to={`/compare?ids=imp:${i.id}`} data-testid={`home-import-${i.id}`}>
                  {importLabel(i)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {templateImports.length > 0 && (
        <section className="page-section" data-testid="home-templates">
          <header className="section-head">
            <h2>{t('templates_title')}</h2>
            <p className="muted">{t('templates_sub')}</p>
          </header>
          <ul>
            {templateImports.map((i) => (
              <li key={i.id}>
                <Link to={`/compare?ids=imp:${i.id}`} data-testid={`home-template-${i.id}`}>
                  {importLabel(i)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
