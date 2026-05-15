// PROFILE-04. Port of public/legacy/js/app.js:1564-1589

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { ResultCard } from '@/components/ResultCard'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n/i18n'

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const profile = useStore((s) => (id ? s.profiles.find((p) => p.id === id) ?? null : null))
  const results = useStore((s) => (id ? s.results.filter((r) => r.profileId === id) : []))
  const deleteProfile = useStore((s) => s.deleteProfile)
  const navigate = useNavigate()

  if (!profile) { navigate('/'); return null }

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
        <div>
          <h1 data-testid="profile-name">{profile.name}</h1>
          {profile.pronouns && <p className="muted">{profile.pronouns}</p>}
        </div>
        <div className="flex-spacer" />
        <Button asChild variant="outline" data-testid="profile-edit-btn">
          <Link to={`/profile/${profile.id}/edit`}>{t('btn_edit')}</Link>
        </Button>
        <Button variant="destructive" onClick={onDelete} data-testid="profile-delete-btn">{t('btn_delete')}</Button>
      </header>
      <section className="page-section">
        <header className="section-head">
          <h2>{t('maps_title')}</h2>
          <p className="muted">{t('maps_sub')}</p>
        </header>
        <div className="list" data-testid="result-list">
          {results.map((r) => (
            <ResultCard key={r.id} result={r} profile={profile} />
          ))}
          <Button asChild data-testid="new-map-btn">
            <Link to={`/q-categories/${profile.id}/new`}>{t('new_map_btn')}</Link>
          </Button>
        </div>
      </section>
    </section>
  )
}
