// SHELL-03, D-15. Profile dropdown placeholder; plan 2 wraps in shadcn Popover.
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { t } from '@/lib/i18n/i18n'

export function ProfilePicker() {
  const profiles = useStore((s) => s.profiles)
  return (
    <details className="relative" data-testid="profile-picker">
      <summary aria-label={t('profile_picker_label')} className="cursor-pointer list-none">
        {profiles[0]?.emoji ?? '👤'} {profiles[0]?.name ?? t('profile_picker_label')}
      </summary>
      <ul role="menu" className="absolute z-10 mt-2 bg-surface border border-line rounded p-2 min-w-[12rem]" data-testid="profile-picker-menu">
        {profiles.length === 0 ? (
          <li className="text-text-muted text-sm">{t('no_profiles_yet')}</li>
        ) : profiles.map((p) => (
          <li key={p.id}>
            <Link to={`/profile/${p.id}`} className="block px-2 py-1 hover:bg-bg" data-testid={`profile-picker-item-${p.id}`}>
              {p.emoji} {p.name}
            </Link>
          </li>
        ))}
        <li className="mt-2 border-t border-line pt-2">
          <Link to="/profile/new" data-testid="profile-picker-create">{t('profile_picker_create_new')}</Link>
        </li>
      </ul>
    </details>
  )
}
