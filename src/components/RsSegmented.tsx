// src/components/RsSegmented.tsx
// True joined segmented control — single rounded container holding all options
// (no inter-button gaps), used by ThemeToggle and LangToggle for the
// "pick one of N" rows on the Settings page. Active option gets the brand
// gradient; inactives blend with the container surface.

import type { ReactNode } from 'react'

export type RsSegmentedOption<V extends string> = {
  value: V
  label: ReactNode
  ariaLabel?: string
  testId?: string
}

type Props<V extends string> = {
  options: ReadonlyArray<RsSegmentedOption<V>>
  value: V
  onChange: (next: V) => void
  ariaLabel: string
  testId?: string
}

export function RsSegmented<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  testId,
}: Props<V>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="rs-segmented"
      data-testid={testId}
    >
      {options.map((opt) => {
        const on = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            className={'rs-segmented-item' + (on ? ' is-on' : '')}
            aria-pressed={on}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
            data-testid={opt.testId}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
