// SHELL-03, D-15. Profile dropdown using shadcn Popover; replaces plan-1 <details> placeholder.
// The "Profile" pill itself is a NavLink to / (matches legacy navLink("#/", ICONS.nav_profiles, …)
// at public/legacy/js/app.js:956). A small adjacent caret opens the quick-switch popover so
// both behaviors coexist: click "Profile" → /, click ▾ → menu.
import { Link } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useStore } from '@/lib/storage/store'
import { t } from '@/lib/i18n/i18n'
import { RsMenuLink } from './RsMenuButton'
import { cleanLabel } from './Nav'

// SVG copied verbatim from v1.0 (public/legacy/js/app.js ICONS.nav_profiles).
const ProfileIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

export function ProfilePicker() {
  const profiles = useStore((s) => s.profiles)
  return (
    <span className="profile-picker-shell" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <RsMenuLink
        to="/"
        icon={ProfileIcon}
        label={cleanLabel(t('nav_profiles'))}
        testId="profile-picker"
      />
      <Popover>
        <PopoverTrigger
          type="button"
          aria-label={t('profile_picker_label')}
          data-testid="profile-picker-caret"
          className="profile-picker-caret"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            font: 'inherit',
            padding: '4px 6px',
            marginLeft: '-4px',
            opacity: 0.7,
          }}
        >
          ▾
        </PopoverTrigger>
        <PopoverContent data-testid="profile-picker-menu" align="start">
          {profiles.length === 0 ? (
            <p className="text-text-muted text-sm">{t('no_profiles_yet')}</p>
          ) : (
            <ul role="menu" className="flex flex-col gap-1">
              {profiles.map((p) => (
                <li key={p.id}>
                  <Link to={`/profile/${p.id}`} className="block px-2 py-1 hover:bg-bg" data-testid={`profile-picker-item-${p.id}`}>
                    {p.emoji} {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 border-t border-line pt-2">
            <Link to="/profile/new" data-testid="profile-picker-create">{t('profile_picker_create_new')}</Link>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  )
}
