// Continuous gradient scale bar — click anywhere to place a value at that
// exact fraction (snapped key + continuous frac). Port of
// public/legacy/js/app.js:262-346 (scaleClickEl). CSS lives at
// src/styles/legacy-components.css:1144-1210.

import { useId, useRef } from 'react'
import type { MutableScaleStep } from '@/lib/data/types'
import { localizeStep } from '@/lib/data/locale'
import { t, getLang } from '@/lib/i18n/i18n'

interface Props {
  scale: readonly MutableScaleStep[]
  value: string | null              // snapped step key (back-compat)
  valueFrac?: number | null         // continuous 0..1 — preferred when set
  onChange: (key: string, frac: number) => void
  onClear?: () => void
  compact?: boolean
}

function parseHex(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)] : null
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseHex(a), pb = parseHex(b)
  if (!pa || !pb) return a
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`
}

function interpolateColor(scale: readonly MutableScaleStep[], frac: number): string {
  const N = scale.length
  if (!N) return '#7c3aed'
  const pos = Math.max(0, Math.min(N - 1, frac * (N - 1)))
  const lo = Math.floor(pos), hi = Math.ceil(pos)
  if (lo === hi) return scale[lo]!.color
  return lerpColor(scale[lo]!.color, scale[hi]!.color, pos - lo)
}

export function ScalePicker({ scale, value, valueFrac, onChange, onClear, compact }: Props) {
  const id = useId()
  const lang = getLang()
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const N = scale.length
  const maxIdx = Math.max(1, N - 1)

  // Resolve the active fraction: prefer continuous valueFrac, else derive from snapped key.
  // 'open' without a frac is the custom-item unanswered sentinel; with frac it's the real "Open to it" answer.
  const scaleValue = (value === 'open' && valueFrac == null) ? null : value
  const activeIdx = scaleValue ? scale.findIndex((s) => s.key === scaleValue) : -1
  const resolvedFrac = valueFrac != null
    ? valueFrac
    : activeIdx >= 0
      ? activeIdx / maxIdx
      : null
  const hasValue = resolvedFrac != null

  function fracFromClientX(clientX: number): number {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return 0
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }

  function applyFrac(frac: number) {
    const idx = Math.max(0, Math.min(N - 1, Math.round(frac * maxIdx)))
    const step = scale[idx]
    if (step) onChange(step.key, frac)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Ignore clicks that land on a reference tick or the reset button —
    // those have their own handlers.
    const target = e.target as Element
    if (target.closest('[data-rs-scale-tick]') || target.closest('[data-rs-scale-reset]')) return
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    applyFrac(fracFromClientX(e.clientX))
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    applyFrac(fracFromClientX(e.clientX))
  }
  function onPointerUp(_e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = false
  }

  // Arrow keys intentionally NOT handled — the slider lives inside SingleMode,
  // where ArrowLeft/Right navigate between cards. Use Home/End to jump to
  // extremes; click the ticks or drag to set a value.
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Home') {
      e.preventDefault()
      const s = scale[0]
      if (s) onChange(s.key, 0)
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      const s = scale[N - 1]
      if (s) onChange(s.key, 1)
      return
    }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); onClear?.(); return }
  }

  // CSS gradient stops — one per scale step.
  const gradientStops = scale
    .map((s, i) => `${s.color} ${(i / maxIdx) * 100}%`)
    .join(', ')
  const gradientBg = `linear-gradient(90deg, ${gradientStops})`
  const markerColor = hasValue ? interpolateColor(scale, resolvedFrac!) : undefined

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={hasValue ? Math.round(resolvedFrac! * 100) : undefined}
      aria-label={t('scale_picker_label')}
      onKeyDown={onKey}
      className={`rs-click-scale ${hasValue ? 'has-value' : 'no-value'} ${compact ? 'is-compact' : ''}`}
      data-testid={`scale-picker-${id}`}
    >
      <div
        ref={trackRef}
        className="rs-click-scale-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="rs-click-scale-bg" aria-hidden />
        <div
          className="rs-click-scale-grad"
          aria-hidden
          style={{ background: gradientBg }}
        />
        {scale.map((s, i) => {
          const pct = N === 1 ? 50 : (i / maxIdx) * 100
          const exactFrac = N <= 1 ? 0.5 : i / maxIdx
          return (
            <div
              key={s.key}
              className="rs-click-scale-ref"
              style={{ left: `${pct}%`, ['--c' as string]: s.color } as React.CSSProperties}
            >
              <button
                type="button"
                data-rs-scale-tick
                data-state={i === activeIdx ? 'active' : 'inactive'}
                aria-pressed={i === activeIdx}
                onClick={(e) => { e.stopPropagation(); onChange(s.key, exactFrac) }}
                className="rs-click-scale-ref-tick"
                data-testid={`scale-step-${s.key}`}
                title={s.description}
                aria-label={s.label}
              />
              <span className="rs-click-scale-ref-label" aria-hidden>{localizeStep(s, lang).label}</span>
            </div>
          )
        })}
        {hasValue && (
          <div
            className="rs-click-scale-marker"
            aria-hidden
            style={{
              left: `${resolvedFrac! * 100}%`,
              ['--mc' as string]: markerColor,
            } as React.CSSProperties}
          />
        )}
      </div>
      {hasValue && onClear && (
        <button
          type="button"
          data-rs-scale-reset
          onClick={(e) => { e.stopPropagation(); onClear() }}
          data-testid="scale-clear"
          className="rs-slider-clear"
        >
          {t('q_slider_reset')}
        </button>
      )}
    </div>
  )
}
