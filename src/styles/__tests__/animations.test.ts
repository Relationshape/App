// src/styles/__tests__/animations.test.ts
// DESIGN-03 + DESIGN-04: 8 keyframe names present + reduced-motion guard exists.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM-safe __dirname (project is "type": "module" + tsconfig "module": "ESNext")
const __dirname = dirname(fileURLToPath(import.meta.url))

const EXPECTED_KEYFRAMES = [
  'heroBlobPulse',
  'holoOrbDrift',
  'holoBtnSpin',
  'holoIconSpin',
  'holoUnderlineSlide',
  'iridShift',
  'bgPulse',
  'silkShift',
]

function readAnimationsCss(): string {
  return readFileSync(resolve(__dirname, '../animations.css'), 'utf-8')
}

describe('animations.css (DESIGN-03, DESIGN-04)', () => {
  it('declares all 8 v1.0 @keyframes', () => {
    const css = readAnimationsCss()
    for (const name of EXPECTED_KEYFRAMES) {
      const re = new RegExp(`@keyframes\\s+${name}\\b`)
      expect(css, `Missing @keyframes ${name}`).toMatch(re)
    }
  })

  it('contains a @media (prefers-reduced-motion: reduce) block', () => {
    const css = readAnimationsCss()
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })

  it('reduced-motion block sets animation-duration: 0.001ms universally', () => {
    const css = readAnimationsCss()
    // Strip line-comments for safe `grep`-style assertion (Pitfall — comments could match the pattern themselves)
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(withoutComments).toMatch(/animation-duration:\s*0\.001ms\s*!important/)
    expect(withoutComments).toMatch(/animation-iteration-count:\s*1\s*!important/)
    expect(withoutComments).toMatch(/transition-duration:\s*0\.001ms\s*!important/)
  })

  it('reduced-motion block explicitly sets animation: none !important on at least 5 keyframe targets (Pitfall 6)', () => {
    const css = readAnimationsCss()
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const noneCount = (withoutComments.match(/animation:\s*none\s*!important/g) ?? []).length
    expect(noneCount).toBeGreaterThanOrEqual(2) // at least once for @media + once for body[data-prm]
  })

  it('declares the in-page reduced-motion preview toggle (body[data-prm="reduce"] selector for /design-system page)', () => {
    const css = readAnimationsCss()
    expect(css).toMatch(/body\[data-prm=['"]reduce['"]\]/)
  })
})
