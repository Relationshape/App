// PROFILE-02. Port of public/legacy/js/app.js:1399-1448

import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { t } from '@/lib/i18n/i18n'

const FEATURES: Array<{ key: 'maps' | 'personal' | 'sharing' | 'multi'; icon: string }> = [
  { key: 'maps', icon: '🗺️' },
  { key: 'personal', icon: '🔒' },
  { key: 'sharing', icon: '📤' },
  { key: 'multi', icon: '👥' },
]

export function Welcome() {
  const profiles = useStore((s) => s.profiles)
  const navigate = useNavigate()

  async function startNowFlow() {
    if (profiles.length === 0) { navigate('/profile/new'); return }
    const choice = await dialog<'new' | 'existing'>({
      title: t('start_now_title'),
      body: <p>{t('start_now_sub')}</p>,
      actions: [
        { label: t('start_now_existing'), kind: 'ghost', value: 'existing' },
        { label: t('start_now_new'), kind: 'primary', value: 'new' },
      ],
    })
    if (choice === 'new') navigate('/profile/new')
    else if (choice === 'existing' && profiles[0]) navigate(`/profile/${profiles[0].id}`)
  }

  return (
    <section className="page" data-testid="welcome-page">
      <div className="hero">
        <div className="hero-blob" />
        <div className="hero-blob hero-blob-holo" />
        <h1 className="hero-title">{t('welcome_title')}</h1>
        <p className="hero-sub">{t('welcome_sub')}</p>
        <div className="hero-actions">
          <button className="btn btn-primary" data-testid="welcome-cta" onClick={startNowFlow}>{t('welcome_cta')}</button>
          <Link to="/intro" className="btn btn-ghost" data-testid="welcome-about">{t('welcome_about')}</Link>
        </div>
        <ul className="hero-features">
          {FEATURES.map(({ key, icon }) => (
            <li key={key}>
              <button
                className="hero-feat-btn"
                data-testid={`welcome-feat-${key}`}
                onClick={() => dialog({
                  title: t(`feat_${key}_title` as const),
                  body: <p style={{ lineHeight: 1.6 }}>{t(`feat_${key}_body` as const)}</p>,
                  actions: [{ label: t('btn_close'), kind: 'primary', value: null }],
                })}
              >
                <span aria-hidden>{icon}</span>
                <strong>{t(`feat_${key}_title` as const)}</strong>
                <span className="muted small">{t(`feat_${key}_short` as const)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <section className="page-section" aria-labelledby="welcome-how">
        <h2 id="welcome-how">{t('welcome_how_title')}</h2>
        <ol>
          <li>{t('welcome_how_1')}</li>
          <li>{t('welcome_how_2')}</li>
          <li>{t('welcome_how_3')}</li>
          <li>{t('welcome_how_4')}</li>
        </ol>
      </section>
    </section>
  )
}
