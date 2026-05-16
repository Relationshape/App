// SHELL-03, D-15. Profile dropdown using shadcn Popover; replaces plan-1 <details> placeholder.
import { Link } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useStore } from '@/lib/storage/store'
import { t } from '@/lib/i18n/i18n'

export function ProfilePicker() {
  const profiles = useStore((s) => s.profiles)
  const current = profiles[0]
  return (
    <Popover>
      <PopoverTrigger
        aria-label={t('profile_picker_label')}
        data-testid="profile-picker"
        className="inline-flex items-center gap-2 px-3 py-1 rounded border border-line"
      >
        {current?.emoji ?? '👤'} {current?.name ?? t('profile_picker_label')}
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
  )
}
