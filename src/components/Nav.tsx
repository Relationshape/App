// SHELL-03 (full Nav with Sheet mobile drawer), D-15. Replaces plan-1 hamburger placeholder.
import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ProfilePicker } from './ProfilePicker'
import { RsLangDropdown } from './RsLangDropdown'
import { t } from '@/lib/i18n/i18n'

export function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])  // close on route change (Pitfall 10)

  const items = (
    <>
      <ProfilePicker />
      <NavLink to="/import" data-testid="nav-link-import">{t('nav_import')}</NavLink>
      <NavLink to="/compare" data-testid="nav-link-compare">{t('nav_compare')}</NavLink>
      <NavLink to="/settings" data-testid="nav-link-settings">{t('nav_settings')}</NavLink>
      <NavLink to="/intro" data-testid="nav-link-about">{t('nav_about')}</NavLink>
      <RsLangDropdown />
    </>
  )

  return (
    <nav id="nav" aria-label="Primary" className="flex items-center gap-4 px-4 py-3 border-b border-line bg-surface">
      <div className="hidden md:flex items-center gap-3" data-testid="nav-desktop">{items}</div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          type="button"
          className="md:hidden"
          aria-label={t('nav_open_menu')}
          data-testid="nav-hamburger"
        >
          ☰
        </SheetTrigger>
        <SheetContent side="left" data-testid="nav-mobile">
          <SheetTitle>{t('nav_home')}</SheetTitle>
          <div className="flex flex-col gap-3">{items}</div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
