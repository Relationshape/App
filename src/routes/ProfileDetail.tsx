// PROFILE-04. Port of public/legacy/js/app.js:1564-1589

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { ResultCard } from '@/components/ResultCard'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n/i18n'

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  // Select arrays then derive — avoids unstable .find()/.filter() references in useSyncExternalStore (React 19 #3099-compat)
  const profiles = useStore((s) => s.profiles)
  const allResults = useStore((s) => s.results)
  const deleteProfile = useStore((s) => s.deleteProfile)
  const navigate = useNavigate()

  const profile = id ? (profiles.find((p) => p.id === id) ?? null) : null
  const results = id ? allResults.filter((r) => r.profileId === id) : []

  // Use useEffect to avoid setState-in-render when redirecting on not-found
  useEffect(() => {
    if (profile === null) navigate('/')
  }, [profile, navigate])

  if (!profile) return null

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
    </section>
  )
}
