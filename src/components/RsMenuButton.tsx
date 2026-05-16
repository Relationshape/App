// RsMenuButton — single source of truth for the v1.0 nav menu item shape
// (icon + uppercase label, .nav-link styling from src/styles/legacy-components.css).
// Two exports cover the two call patterns:
//   • RsMenuLink — router NavLink with auto .active class (use for routes)
//   • RsMenuButton — <button> with forwardRef for Radix `asChild` triggers
// Both render identical inner spans so styling stays in one place.
import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type Common = {
  icon: ReactNode
  label: string
  testId?: string
}

// ---- Link variant -----------------------------------------------------------
type RsMenuLinkProps = Common & {
  to: string
}

export function RsMenuLink({ to, icon, label, testId }: RsMenuLinkProps) {
  return (
    <NavLink
      to={to}
      data-testid={testId}
      className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
    >
      <RsMenuContent icon={icon} label={label} />
    </NavLink>
  )
}

// ---- Button variant ---------------------------------------------------------
type RsMenuButtonProps = Common & ComponentPropsWithoutRef<'button'>

export const RsMenuButton = forwardRef<HTMLButtonElement, RsMenuButtonProps>(
  function RsMenuButton({ icon, label, testId, className, type, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        data-testid={testId}
        className={'nav-link' + (className ? ' ' + className : '')}
        {...rest}
      >
        <RsMenuContent icon={icon} label={label} />
      </button>
    )
  },
)

// ---- Shared inner content ---------------------------------------------------
function RsMenuContent({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <>
      <span className="nav-icon">{icon}</span>
      <span className="nav-link-label">{label}</span>
    </>
  )
}
