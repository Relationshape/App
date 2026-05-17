// SHARE-03, SHARE-04. Port of public/legacy/js/app.js:3359-3437.
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import { ImportForm } from '@/components/ImportForm'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { t } from '@/lib/i18n/i18n'
import type { Import } from '@/lib/storage/types'

export function Import() {
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const { openShare } = useShareData()

  const exportGroups = profiles
    .map((p) => ({ profile: p, results: results.filter((r) => r.profileId === p.id) }))
    .filter((g) => g.results.length > 0)

  function onImportSuccess(imp: Import) {
    navigate(`/compare?ids=imp:${imp.id}`)
  }

  return (
    <section className="page narrow" data-testid="import-page">
      <header>
        <h1>{t('import_title')}</h1>
        <p className="muted">{t('import_sub')}</p>
      </header>
      <ImportForm onSuccess={onImportSuccess} />

      <hr className="section-divider" />
      <h2>{t('import_section2_title')}</h2>
      <p className="muted">{t('import_section2_text')}</p>
      {exportGroups.length > 0 ? (
        <div className="export-results-list" data-testid="export-results-list">
          {exportGroups.flatMap(({ profile, results: pResults }) => [
            <div key={`head-${profile.id}`} className="export-profile-head">
              <span className="export-profile-avatar">{profile.emoji}</span>
              <strong>{profile.name}</strong>
            </div>,
            ...pResults.map((r) => (
              <div key={r.id} className="export-result-row" data-testid={`export-row-${r.id}`}>
                <span>
                  {(r.subjectEmoji || '💞') + ' ' + (r.subject ?? '')}
                  {(r.version ?? 1) > 1 ? ` (v${r.version})` : ''}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => openShare(r.id)}
                  data-testid={`export-share-${r.id}`}
                >
                  {t('btn_share')}
                </Button>
              </div>
            )),
          ])}
        </div>
      ) : (
        <p className="muted small">{t('import_no_results')}</p>
      )}
    </section>
  )
}
