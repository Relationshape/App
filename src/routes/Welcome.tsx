// PROFILE-02. Port of public/legacy/js/app.js:1399-1457

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { CreateProfileModal } from '@/components/CreateProfileModal'
import { t } from '@/lib/i18n/i18n'
import { RsHeroConstellation } from '@/components/RsHeroConstellation'

// ─── Feature highlight icons (26×26, viewBox 24×24, stroke="currentColor") ───
// Verbatim port of public/legacy/js/app.js ICONS.feat_* (lines 80-83), with
// kebab-case attributes converted to camelCase for JSX.

function FeatMapsIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
      <polygon points="12 6 18 9.5 18 14.5 12 18 6 14.5 6 9.5" strokeOpacity="0.55" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

function FeatPersonalIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1" opacity="0.7" />
      <path d="M15.5 4.5 Q18 6 17 9" strokeDasharray="1.5 1.5" />
    </svg>
  )
}

function FeatShareIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function FeatPrivacyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" opacity="0.7" />
    </svg>
  )
}

const FEATURES: Array<{ key: 'maps' | 'personal' | 'share' | 'privacy'; icon: ReactNode }> = [
  { key: 'maps', icon: <FeatMapsIcon /> },
  { key: 'personal', icon: <FeatPersonalIcon /> },
  { key: 'share', icon: <FeatShareIcon /> },
  { key: 'privacy', icon: <FeatPrivacyIcon /> },
]

// ─── How-to step icons (22×22, viewBox 24×24, stroke="currentColor") ─────────
// Verbatim port of public/legacy/js/app.js ICONS.step_* (lines 89, 90, 91, 93).

function StepCreateIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M3 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
      <path d="M19 4v6M16 7h6" />
    </svg>
  )
}

function StepTopicsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="7" height="7" rx="1" />
      <rect x="2" y="14" width="7" height="7" rx="1" />
      <line x1="13" y1="6.5" x2="22" y2="6.5" />
      <line x1="13" y1="11" x2="22" y2="11" />
      <line x1="13" y1="17.5" x2="22" y2="17.5" />
    </svg>
  )
}

function StepAnswerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="7" x2="21" y2="7" />
      <circle cx="8" cy="7" r="2.5" fill="currentColor" stroke="none" opacity="0.85" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <circle cx="15" cy="13" r="2.5" fill="currentColor" stroke="none" opacity="0.85" />
      <line x1="3" y1="19" x2="21" y2="19" />
      <circle cx="10" cy="19" r="2.5" fill="currentColor" stroke="none" opacity="0.85" />
    </svg>
  )
}

function StepShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

type HowtoTitleKey = 'howto_step1_title' | 'howto_step2_title' | 'howto_step3_title' | 'howto_step4_title'
type HowtoDescKey = 'howto_step1_desc' | 'howto_step2_desc' | 'howto_step3_desc' | 'howto_step4_desc'

const HOWTO_STEPS: Array<{ num: string; titleKey: HowtoTitleKey; descKey: HowtoDescKey; icon: ReactNode }> = [
  { num: '1', titleKey: 'howto_step1_title', descKey: 'howto_step1_desc', icon: <StepCreateIcon /> },
  { num: '2', titleKey: 'howto_step2_title', descKey: 'howto_step2_desc', icon: <StepTopicsIcon /> },
  { num: '3', titleKey: 'howto_step3_title', descKey: 'howto_step3_desc', icon: <StepAnswerIcon /> },
  { num: '4', titleKey: 'howto_step4_title', descKey: 'howto_step4_desc', icon: <StepShareIcon /> },
]

export function Welcome() {
  const profiles = useStore((s) => s.profiles)
  const navigate = useNavigate()
  const [createProfileOpen, setCreateProfileOpen] = useState(false)

  async function startNowFlow() {
    if (profiles.length === 0) {
      setCreateProfileOpen(true)
      return
    }
    // Profile already exists — navigate to it directly
    if (profiles[0]) navigate(`/profile/${profiles[0].id}`)
  }

  return (
    <>
    <section className="page" data-testid="welcome-page">
      <div className="hero">
        <div className="hero-blob" />
        <div className="hero-blob hero-blob-holo" />
        <RsHeroConstellation />
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
                <span className="hero-feat-icon" aria-hidden>{icon}</span>
                <strong className="hero-feat-title">{t(`feat_${key}_title` as const)}</strong>
                <span className="hero-feat-sub">{t(`feat_${key}_short` as const)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <section className="page-section howto-section" aria-labelledby="welcome-how">
        <header className="section-head">
          <h2 id="welcome-how">{t('howto_title')}</h2>
        </header>
        <div className="howto-steps">
          {HOWTO_STEPS.map(({ num, titleKey, descKey, icon }) => (
            <div className="howto-step" key={num}>
              <div className="howto-step-icon" aria-hidden>{icon}</div>
              <div className="howto-step-num">{num}</div>
              <h3 className="howto-step-title">{t(titleKey)}</h3>
              <p className="howto-step-desc muted small">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </section>

    <CreateProfileModal
      open={createProfileOpen}
      onOpenChange={setCreateProfileOpen}
      onCreated={(id) => navigate(`/profile/${id}`)}
    />
    </>
  )
}
