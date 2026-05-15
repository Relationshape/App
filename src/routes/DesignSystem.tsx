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

// Render mode per keyframe — each keyframe's transform/background-position assumes a specific
// element setup. Misrendering them all the same way ("a bar that spans the width with the
// keyframe applied directly") makes rotations look like the whole bar spins and makes
// translateX(-50%) keyframes appear off-center. v1.0 reference at public/legacy/css/additions.css:
//   - heroBlobPulse / holoOrbDrift: applied to absolutely-positioned blob at left:50% — the
//     keyframe's translateX(-50%) centers it.
//   - holoBtnSpin / holoIconSpin: applied to a ::before/::after conic-gradient RING layered
//     behind the visible element; the ring rotates, the element itself stays put.
//   - holoUnderlineSlide / iridShift / silkShift: background-position animation on a
//     gradient-backed strip — current horizontal-bar demo is appropriate.
//   - bgPulse: pure opacity — works on any element shape.
type RenderMode = 'centered-blob' | 'rotating-ring' | 'gradient-strip' | 'opacity-pulse'

const KEYFRAMES: ReadonlyArray<{ name: string; sample: string; mode: RenderMode }> = [
  { name: 'heroBlobPulse', sample: 'animation: heroBlobPulse 6s ease-in-out infinite', mode: 'centered-blob' },
  { name: 'holoOrbDrift', sample: 'animation: holoOrbDrift 14s linear infinite', mode: 'centered-blob' },
  { name: 'holoBtnSpin', sample: 'animation: holoBtnSpin 8s linear infinite', mode: 'rotating-ring' },
  { name: 'holoIconSpin', sample: 'animation: holoIconSpin 9s linear infinite', mode: 'rotating-ring' },
  { name: 'holoUnderlineSlide', sample: 'animation: holoUnderlineSlide 4s linear infinite', mode: 'gradient-strip' },
  { name: 'iridShift', sample: 'animation: iridShift 7s linear infinite', mode: 'gradient-strip' },
  { name: 'bgPulse', sample: 'animation: bgPulse 12s ease-in-out infinite', mode: 'opacity-pulse' },
  { name: 'silkShift', sample: 'animation: silkShift 6s linear infinite', mode: 'gradient-strip' },
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
          {KEYFRAMES.map(({ name, sample, mode }) => (
            <div
              key={name}
              className="rounded-[var(--radius)] border border-line p-4 bg-surface"
            >
              <code className="block text-sm text-primary">{name}</code>
              <div className="mt-3 relative h-24 w-full overflow-hidden rounded-md bg-bg-2">
                {mode === 'centered-blob' && (
                  // v1.0 hero blob: absolutely positioned at left: 50%; the keyframe's
                  // translateX(-50%) supplies the centering. transform-origin defaults to center.
                  <div
                    className="absolute top-1/2 h-16 w-16 rounded-full bg-gradient-to-br from-primary via-accent to-primary-strong blur-sm"
                    style={{
                      left: '50%',
                      marginTop: '-2rem', // vertical centering (top: 50% would conflict with the keyframe's transform)
                      animation: `${name} 6s linear infinite`,
                    }}
                    data-keyframe={name}
                  />
                )}
                {mode === 'rotating-ring' && (
                  // v1.0 .btn-primary::after / .hero-feat-icon::before: a circular conic-gradient
                  // ring behind the element rotates; the element itself stays put. Demo: a
                  // centered conic-gradient disk spins in place around its own center.
                  <>
                    <div
                      className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80"
                      style={{
                        background: 'conic-gradient(var(--color-primary), var(--color-accent), var(--color-primary-strong), var(--color-primary))',
                        animation: `${name} 6s linear infinite`,
                        transformOrigin: 'center',
                      }}
                      data-keyframe={name}
                    />
                    <div
                      className="absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface"
                      aria-hidden="true"
                    />
                  </>
                )}
                {mode === 'gradient-strip' && (
                  // background-position animation: a horizontal gradient strip slides.
                  <div
                    className="absolute inset-x-2 top-1/2 h-8 -translate-y-1/2 rounded-md"
                    style={{
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-primary-strong), var(--color-accent), var(--color-primary))',
                      backgroundSize: '300% 100%',
                      animation: `${name} 6s linear infinite`,
                    }}
                    data-keyframe={name}
                  />
                )}
                {mode === 'opacity-pulse' && (
                  <div
                    className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary via-accent to-primary-strong"
                    style={{ animation: `${name} 6s linear infinite` }}
                    data-keyframe={name}
                  />
                )}
              </div>
              <p className="mt-2 text-xs text-muted">{sample}</p>
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
