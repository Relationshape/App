// SHELL-03 (desktop scaffold), D-15. Mobile Sheet drawer wired in plan 2 (replaces the hamburger placeholder).
import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ProfilePicker } from './ProfilePicker'
import { ThemeToggle } from './ThemeToggle'
import { LangToggle } from './LangToggle'
import { t } from '@/lib/i18n/i18n'

export function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <nav id="nav" aria-label="Primary" className="flex items-center gap-4 px-4 py-3 border-b border-line bg-surface">
      <ProfilePicker />
      <div className="hidden md:flex items-center gap-3" data-testid="nav-desktop">
        <NavLink to="/import" data-testid="nav-link-import">{t('nav_import')}</NavLink>
        <NavLink to="/compare" data-testid="nav-link-compare">{t('nav_compare')}</NavLink>
        <NavLink to="/settings" data-testid="nav-link-settings">{t('nav_settings')}</NavLink>
        <NavLink to="/intro" data-testid="nav-link-about">{t('nav_about')}</NavLink>
        <ThemeToggle />
        <LangToggle />
      </div>
      <button
        type="button"
        className="md:hidden"
        aria-label={open ? t('nav_close_menu') : t('nav_open_menu')}
        aria-expanded={open}
        data-testid="nav-hamburger"
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
    </nav>
  )
}
