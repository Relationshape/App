// QUEST-04, D-20. Bespoke snap-dots scale picker. Port of public/legacy/js/app.js:262-346.
// NOT shadcn Slider — visually distinct snap-dot row per v1.0 design.

import { useId, useRef } from 'react'
import type { MutableScaleStep } from '@/lib/data/types'
import { t } from '@/lib/i18n/i18n'

interface Props {
  scale: readonly MutableScaleStep[]
  value: string | null              // active step key (or null when no answer yet)
  onChange: (key: string) => void
  onClear?: () => void
  compact?: boolean
}

export function ScalePicker({ scale, value, onChange, onClear, compact }: Props) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const activeIdx = value ? scale.findIndex((s) => s.key === value) : -1
  const N = scale.length

  function nudge(delta: number) {
    const next = Math.max(0, Math.min(N - 1, (activeIdx < 0 ? 0 : activeIdx) + delta))
    const step = scale[next]
    if (step) onChange(step.key)
  }

  function onKey(e: React.KeyboardEvent) {
    // Mirrors public/legacy/js/app.js:335-343
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); nudge(+1); return }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); nudge(-1); return }
    if (e.key === 'Home')  { e.preventDefault(); const s = scale[0]; if (s) onChange(s.key); return }
    if (e.key === 'End')   { e.preventDefault(); const s = scale[N - 1]; if (s) onChange(s.key); return }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); onClear?.(); return }
  }

  return (
    <div
      ref={rootRef}
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={activeIdx >= 0 ? Math.round((activeIdx / Math.max(1, N - 1)) * 100) : undefined}
      aria-label={t('scale_picker_label')}
      onKeyDown={onKey}
      className={`rs-click-scale ${value ? 'has-value' : 'no-value'} ${compact ? 'is-compact' : ''}`}
      data-testid={`scale-picker-${id}`}
      style={{ touchAction: 'manipulation' }}  // suppress iOS double-tap zoom (Pitfall 2)
    >
      <div className="rs-click-scale-dots flex flex-wrap gap-2">
        {scale.map((s, i) => (
          <button
            key={s.key}
            type="button"
            data-state={i === activeIdx ? 'active' : 'inactive'}
            aria-pressed={i === activeIdx}
            onClick={() => onChange(s.key)}
            style={{ ['--c' as string]: s.color } as React.CSSProperties}
            className="rs-click-scale-dot rounded px-2 py-1 border border-line data-[state=active]:bg-accent"
            data-testid={`scale-step-${s.key}`}
            title={s.description}
          >
            <span aria-hidden style={{ background: s.color }} className="inline-block h-3 w-3 rounded-full mr-1" />
            {s.short}
          </button>
        ))}
        {value && onClear && (
          <button type="button" onClick={onClear} data-testid="scale-clear" className="text-text-muted text-sm">
            {t('btn_clear')}
          </button>
        )}
      </div>
    </div>
  )
}
