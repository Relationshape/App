// src/routes/DesignSystem.tsx
// DESIGN-06: reference route at /design-system. Five sections per D-27:
//   1. Header with theme + lang toggles
//   2. Palette grid
//   3. Typography scale
//   4. Animation gallery + in-page reduced-motion preview toggle
//   5. Surface samples
// CONTEXT.md <specifics>: the preview toggle adds data-prm='reduce' on <body> so reviewers can
// eyeball reduced-motion without changing OS settings. animations.css scopes the disable to
// body[data-prm='reduce'].
// D-28: only shadcn primitive in Phase 1 is Button.
// D-11: animations are rendered inline so reviewers can eyeball reduced-motion behaviour by
//        either toggling the in-page button OR DevTools "Emulate prefers-reduced-motion".

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LangToggle } from '@/components/LangToggle'
import { Button } from '@/components/ui/button'
import { DEFAULT_SCALE } from '@/lib/data/data'

const PALETTE_TOKENS: ReadonlyArray<{ name: string; cssVar: string }> = [
  { name: 'bg', cssVar: '--color-bg' },
  { name: 'bg-2', cssVar: '--color-bg-2' },
  { name: 'surface', cssVar: '--color-surface' },
  { name: 'surface-2', cssVar: '--color-surface-2' },
  { name: 'surface-3', cssVar: '--color-surface-3' },
  { name: 'text', cssVar: '--color-text' },
  { name: 'muted', cssVar: '--color-muted' },
  { name: 'primary', cssVar: '--color-primary' },
  { name: 'primary-strong', cssVar: '--color-primary-strong' },
  { name: 'accent', cssVar: '--color-accent' },
  { name: 'green', cssVar: '--color-green' },
  { name: 'red', cssVar: '--color-red' },
  { name: 'glass', cssVar: '--color-glass' },
]

// Demo each keyframe in its v1.0 production context so the visual reads correctly:
// transforms that assume `left: 50%` get a centered blob; rotations get the
// "rotating layer clipped by a fixed-shape element" treatment (mirrors v1.0's
// ::before / ::after pattern on .btn-primary and .hero-feat-icon); background-position
// animations get a real gradient-backed element. v1.0 references in public/legacy/css/.
const KEYFRAMES: ReadonlyArray<{
  name: string
  sample: string
  v1Selector: string
  render: () => ReactNode
}> = [
  {
    name: 'heroBlobPulse',
    sample: 'animation: heroBlobPulse 11s ease-in-out infinite',
    v1Selector: 'style.css .hero-blob',
    render: () => (
      // Blurred radial-gradient circle at left:50%; keyframe's translateX(-50%) centers it.
      <div
        className="absolute aspect-square w-32"
        style={{
          left: '50%',
          top: '50%',
          marginTop: '-4rem',
          background:
            'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.16) 0%, transparent 30%), radial-gradient(circle at center, color-mix(in oklab, var(--color-primary) 60%, transparent), transparent 62%)',
          filter: 'blur(18px)',
          animation: 'heroBlobPulse 6s ease-in-out infinite',
        }}
        data-keyframe="heroBlobPulse"
      />
    ),
  },
  {
    name: 'holoOrbDrift',
    sample: 'animation: holoOrbDrift 15s ease-in-out infinite',
    v1Selector: 'style.css .hero-blob-holo',
    render: () => (
      // More-blurred orb, drifts with rotation. Same left:50% anchor.
      <div
        className="absolute aspect-square w-32"
        style={{
          left: '50%',
          top: '50%',
          marginTop: '-4rem',
          background:
            'radial-gradient(circle at 40% 38%, color-mix(in oklab, var(--color-accent) 60%, transparent), transparent 55%), radial-gradient(circle at 65% 60%, rgba(79,172,254,0.35), transparent 60%)',
          filter: 'blur(22px)',
          animation: 'holoOrbDrift 6s linear infinite',
        }}
        data-keyframe="holoOrbDrift"
      />
    ),
  },
  {
    name: 'holoBtnSpin',
    sample: 'animation: holoBtnSpin 5s linear infinite (on hover)',
    v1Selector: 'additions.css .btn-primary::after',
    render: () => (
      // Button with rotating conic-gradient ::after layer (overflow-hidden clips to button shape).
      // The button itself stays still; only the layer inside rotates.
      <span className="relative inline-flex items-center justify-center overflow-hidden rounded-md px-5 py-2 text-sm font-medium border border-line bg-surface">
        <span className="relative z-10 text-primary">Primary</span>
        <span
          className="absolute aspect-square w-40 opacity-70"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: '-5rem',
            marginTop: '-5rem',
            background:
              'conic-gradient(from 0deg at 50% 120%, transparent 0deg, rgba(255,255,255,0.4) 60deg, transparent 120deg, color-mix(in oklab, var(--color-primary) 60%, transparent) 200deg, transparent 280deg)',
            animation: 'holoBtnSpin 5s linear infinite',
          }}
          data-keyframe="holoBtnSpin"
        />
      </span>
    ),
  },
  {
    name: 'holoIconSpin',
    sample: 'animation: holoIconSpin 5s linear infinite (on hover)',
    v1Selector: 'additions.css .hero-feat-icon::before',
    render: () => (
      // Circular icon button with blurred conic-gradient ring spinning behind it.
      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface border border-line text-primary">
        <span className="relative z-10 font-heading text-lg">★</span>
        <span
          className="absolute aspect-square w-20 rounded-full opacity-60"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: '-2.5rem',
            marginTop: '-2.5rem',
            zIndex: -1,
            background:
              'conic-gradient(from 0deg, var(--color-primary), var(--color-accent), color-mix(in oklab, var(--color-primary-strong) 70%, transparent), var(--color-primary))',
            filter: 'blur(8px)',
            animation: 'holoIconSpin 5s linear infinite',
          }}
          data-keyframe="holoIconSpin"
        />
      </span>
    ),
  },
  {
    name: 'holoUnderlineSlide',
    sample: 'animation: holoUnderlineSlide 6s linear infinite',
    v1Selector: 'additions.css .section-head h2::after',
    render: () => (
      // Heading with iridescent underline, gradient sliding background-position.
      <span className="relative inline-block">
        <span className="font-heading text-2xl text-primary">Heading</span>
        <span
          className="block h-1 mt-2 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, var(--color-primary), var(--color-accent), color-mix(in oklab, var(--color-primary-strong) 80%, white), var(--color-primary))',
            backgroundSize: '300% 100%',
            animation: 'holoUnderlineSlide 4s linear infinite',
          }}
          data-keyframe="holoUnderlineSlide"
        />
      </span>
    ),
  },
  {
    name: 'iridShift',
    sample: 'animation: iridShift 4s ease-in-out infinite',
    v1Selector: 'additions.css iridescent borders & pills',
    render: () => (
      // Pill / chip with iridescent shifting fill.
      <span
        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white"
        style={{
          background:
            'linear-gradient(90deg, var(--color-primary) 0%, color-mix(in oklab, var(--color-primary) 60%, var(--color-accent)) 40%, var(--color-accent) 75%, var(--color-primary-strong) 100%)',
          backgroundSize: '200% 100%',
          animation: 'iridShift 5s ease-in-out infinite',
        }}
        data-keyframe="iridShift"
      >
        Iridescent
      </span>
    ),
  },
  {
    name: 'bgPulse',
    sample: 'animation: bgPulse 14s ease-in-out infinite',
    v1Selector: "additions.css body::before (ambient backdrop)",
    render: () => (
      // Full-card ambient backdrop with multiple radial gradients pulsing opacity.
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 12% 18%, rgba(192,132,252,0.30) 0%, transparent 60%), radial-gradient(ellipse 50% 42% at 88% 14%, rgba(244,114,182,0.25) 0%, transparent 60%), radial-gradient(ellipse 52% 44% at 85% 88%, rgba(56,189,248,0.28) 0%, transparent 60%), radial-gradient(ellipse 48% 40% at 12% 88%, rgba(167,139,250,0.25) 0%, transparent 60%)',
          animation: 'bgPulse 6s ease-in-out infinite',
        }}
        data-keyframe="bgPulse"
      />
    ),
  },
  {
    name: 'silkShift',
    sample: 'animation: silkShift 8s ease-in-out infinite',
    v1Selector: 'additions.css card/panel surface shimmer',
    render: () => (
      // Card surface with diagonal silk gradient shifting background-position.
      <div
        className="absolute inset-2 rounded-md"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 30%, var(--color-surface-2)), color-mix(in oklab, var(--color-accent) 25%, var(--color-surface-2)), color-mix(in oklab, rgba(56,189,248,1) 25%, var(--color-surface-2)), color-mix(in oklab, var(--color-primary-strong) 30%, var(--color-surface-2)))',
          backgroundSize: '300% 300%',
          animation: 'silkShift 6s ease-in-out infinite',
        }}
        data-keyframe="silkShift"
      />
    ),
  },
]

export function DesignSystem() {
  const [prmPreview, setPrmPreview] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (prmPreview) {
      document.body.setAttribute('data-prm', 'reduce')
    } else {
      document.body.removeAttribute('data-prm')
    }
    return () => {
      document.body.removeAttribute('data-prm')
    }
  }, [prmPreview])

  return (
    <main className="min-h-screen bg-bg text-text font-sans p-8 max-w-5xl mx-auto space-y-16">
      <header
        className="flex flex-wrap items-center justify-between gap-4"
        data-section="header"
      >
        <h1 className="font-heading text-4xl text-primary">Design System</h1>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <LangToggle />
        </div>
      </header>

      <section data-section="palette" aria-labelledby="palette-heading">
        <h2 id="palette-heading" className="font-heading text-2xl text-primary mb-4">
          1. Palette
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {PALETTE_TOKENS.map(({ name, cssVar }) => (
            <div key={name} className="flex flex-col items-center text-sm">
              <div
                className="w-24 h-24 rounded-[var(--radius)] border border-line"
                style={{ background: `var(${cssVar})` }}
                data-token={name}
              />
              <code className="mt-2 text-muted">{name}</code>
            </div>
          ))}
        </div>
      </section>

      <section data-section="typography" aria-labelledby="typography-heading">
        <h2 id="typography-heading" className="font-heading text-2xl text-primary mb-4">
          2. Typography
        </h2>
        <div className="space-y-2">
          <p className="font-heading text-5xl">Playfair Display 48 — display</p>
          <p className="font-heading text-3xl">Playfair Display 32 — heading</p>
          <p className="font-heading text-2xl">Playfair Display 24 — subhead</p>
          <p className="font-sans text-lg">DM Sans 18 — lead</p>
          <p className="font-sans text-base">DM Sans 16 — body</p>
          <p className="font-sans text-sm text-muted">DM Sans 14 — caption</p>
          <p className="font-sans text-xs text-muted">DM Sans 12 — micro</p>
        </div>
      </section>

      <section data-section="animations" aria-labelledby="animations-heading">
        <h2 id="animations-heading" className="font-heading text-2xl text-primary mb-4">
          3. Animations
        </h2>
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant={prmPreview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPrmPreview((v) => !v)}
            data-testid="prm-preview-toggle"
            aria-pressed={prmPreview}
          >
            {prmPreview ? 'Disable reduced-motion preview' : 'Enable reduced-motion preview'}
          </Button>
          <p className="text-sm text-muted">
            Adds <code>data-prm=&quot;reduce&quot;</code> to <code>&lt;body&gt;</code>. All 8
            animations should freeze when enabled.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {KEYFRAMES.map(({ name, sample, v1Selector, render }) => (
            <div
              key={name}
              className="rounded-[var(--radius)] border border-line p-4 bg-surface"
            >
              <code className="block text-sm text-primary">{name}</code>
              {/* Each demo is the v1.0 production element (button, icon, blob, heading, pill,
                  card) — same shape, same gradient, same animation — so reviewers can eyeball
                  parity against the equivalent surface in /legacy/. */}
              <div className="mt-3 relative h-32 w-full overflow-hidden rounded-md bg-bg-2 flex items-center justify-center">
                {render()}
              </div>
              <p className="mt-2 text-xs text-muted">{sample}</p>
              <p className="text-xs text-muted opacity-70">v1.0: {v1Selector}</p>
            </div>
          ))}
        </div>
      </section>

      <section data-section="surfaces" aria-labelledby="surfaces-heading">
        <h2 id="surfaces-heading" className="font-heading text-2xl text-primary mb-4">
          4. Surfaces
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[var(--radius)] p-6 bg-glass border border-glass-border shadow-[var(--shadow)] backdrop-blur-md">
            <h3 className="font-heading text-xl text-primary">Glass card</h3>
            <p className="text-sm text-muted mt-2">Translucent surface with glass-blur</p>
          </div>
          <div className="rounded-[var(--radius)] p-6 bg-surface shadow-[var(--shadow-glow)] border border-line">
            <h3 className="font-heading text-xl text-primary">Glow card</h3>
            <p className="text-sm text-muted mt-2">Neon glow elevation</p>
          </div>
          <div className="rounded-[var(--radius)] p-6 bg-surface-2 border border-line space-y-2">
            <h3 className="font-heading text-xl text-primary">Button variants</h3>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm">Default</Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
              <Button size="sm" variant="ghost">
                Ghost
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section data-section="scale-preview" aria-labelledby="scale-heading">
        <h2 id="scale-heading" className="font-heading text-2xl text-primary mb-4">
          5. Default scale (data.ts wiring)
        </h2>
        <div className="flex gap-2 flex-wrap">
          {DEFAULT_SCALE.map((step) => (
            <div
              key={step.key}
              className="rounded-full border border-line px-3 py-1 text-xs"
              style={{ background: step.color, color: '#fff' }}
            >
              {step.short}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
