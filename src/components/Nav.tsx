// SHELL-03 — floating-pill nav matching v1.0 (public/legacy/index.html).
// Markup uses the legacy class structure (nav-brand / nav-logo / nav-title /
// nav-links / nav-icon / nav-link-label / nav-hamburger / hb-bar) so all styling
// comes from src/styles/legacy-components.css. The id="nav" hook drives the
// fixed floating-pill positioning. Menu items use the shared RsMenuLink /
// RsMenuButton primitives (one source of truth for the icon+label shape).
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { RsLangDropdown } from './RsLangDropdown'
import { RsMenuLink, RsMenuButton } from './RsMenuButton'
import { CreateProfileModal } from './CreateProfileModal'
import { useStore } from '@/lib/storage/store'
import { t } from '@/lib/i18n/i18n'
import type { TranslationKey } from '@/lib/i18n/en'

// i18n labels bake in a leading emoji (e.g. "👤 Profile") that v1.0 stripped at
// render time because the SVG nav-icon replaces it. Same trick here.
const leadingEmoji = /^\p{Extended_Pictographic}️?\s+/u
export function cleanLabel(s: string): string {
  return s.replace(leadingEmoji, '')
}

// SVG icons copied verbatim from v1.0 (public/legacy/js/app.js ICONS).
const ICONS: Record<'profile' | 'import' | 'compare' | 'settings' | 'about', ReactNode> = {
  profile: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  import: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12m-4-4 4 4 4-4" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  ),
  compare: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="12" r="6" />
      <circle cx="16" cy="12" r="6" />
    </svg>
  ),
  settings: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  about: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
}

type NavItem = { to: string; icon: ReactNode; labelKey: TranslationKey; testId: string }
const STATIC_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/compare',  icon: ICONS.compare,  labelKey: 'nav_compare',  testId: 'nav-link-compare' },
  { to: '/settings', icon: ICONS.settings, labelKey: 'nav_settings', testId: 'nav-link-settings' },
  { to: '/intro',    icon: ICONS.about,    labelKey: 'nav_about',    testId: 'nav-link-about' },
]

export function Nav() {
  const [open, setOpen] = useState(false)
  const [createProfileOpen, setCreateProfileOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const firstProfileId = useStore((s) => s.profiles[0]?.id)

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <nav id="nav" className={open ? 'nav-open' : undefined} aria-label="Primary">
      <Link to="/welcome" className="nav-brand" title={t('nav_home')}>
        <span className="nav-logo" aria-hidden="true">∞</span>
        <span className="nav-title">Relationshapes</span>
      </Link>

      <div className="nav-links">
        {firstProfileId ? (
          <RsMenuLink
            to={`/profile/${firstProfileId}`}
            icon={ICONS.profile}
            label={cleanLabel(t('nav_profiles'))}
            testId="nav-link-profile"
          />
        ) : (
          <RsMenuButton
            icon={ICONS.profile}
            label={cleanLabel(t('nav_profiles'))}
            testId="nav-link-profile"
            onClick={() => setCreateProfileOpen(true)}
          />
        )}
        {STATIC_NAV_ITEMS.map((item) => (
          <RsMenuLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={cleanLabel(t(item.labelKey))}
            testId={item.testId}
          />
        ))}
      </div>

      <div className="nav-lang">
        <RsLangDropdown />
      </div>

      <button
        type="button"
        className="nav-hamburger"
        aria-label={open ? t('nav_close_menu') : t('nav_open_menu')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        data-testid="nav-hamburger"
      >
        <span className="hb-bar" />
        <span className="hb-bar" />
        <span className="hb-bar" />
      </button>

      <CreateProfileModal
        open={createProfileOpen}
        onOpenChange={setCreateProfileOpen}
        onCreated={(id) => navigate(`/profile/${id}`)}
      />
    </nav>
  )
}
