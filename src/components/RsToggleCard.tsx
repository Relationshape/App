// RsToggleCard — port of the legacy .onboard-toggle markup (public/legacy/js/app.js:3658-3674).
// Rs* convention: reusable, named export, no default export.
// Reusable toggle-card primitive: bold title + muted description + pill switch on the right.
// Encapsulates the legacy .onboard-toggle / .onboard-text / .onboard-switch markup so multiple
// display-mode toggles (the legacy .onboard-toggles container is plural) can share the same shell.

import { useId } from 'react'

export interface RsToggleCardProps {
  title: string
  description?: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
  testId?: string
}

export function RsToggleCard({
  title,
  description,
  checked,
  onCheckedChange,
  testId,
}: RsToggleCardProps): JSX.Element {
  const titleId = useId()
  const rootClass = `onboard-toggle${checked ? ' is-on' : ''}`
  const switchClass = `onboard-switch${checked ? ' on' : ''}`
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={titleId}
      className={rootClass}
      onClick={() => onCheckedChange(!checked)}
      data-testid={testId}
    >
      <div className="onboard-text">
        <strong id={titleId}>{title}</strong>
        {description ? <p className="muted small">{description}</p> : null}
      </div>
      <div className={switchClass} />
    </button>
  )
}
