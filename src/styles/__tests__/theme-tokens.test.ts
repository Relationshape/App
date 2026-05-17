// src/styles/__tests__/theme-tokens.test.ts
// DESIGN-01: every v1.0 :root token has a corresponding @theme entry in theme.css with the same hex value
// (modulo the prefix rename). Now also asserts light-mode hex value parity per checker warning 4 —
// silent drift from v1.0 light-mode colors is no longer possible.
// Vitest env: node (default per D-25).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM-safe __dirname (project is "type": "module" + tsconfig "module": "ESNext")
const __dirname = dirname(fileURLToPath(import.meta.url))

// Intentional deviations from v1.0 values — accessibility or design improvements.
// These tokens are excluded from the byte-for-byte parity check.
const KNOWN_DEVIATIONS = new Set([
  '--color-muted', // lightened ~30% for dark-mode readability (was #8880b8, now #aca6cd)
])

// Map from v1.0 unprefixed token name → v2.0 prefixed token name
const TOKEN_RENAME: Record<string, string> = {
  '--bg':              '--color-bg',
  '--bg-2':            '--color-bg-2',
  '--surface':         '--color-surface',
  '--surface-2':       '--color-surface-2',
  '--surface-3':       '--color-surface-3',
  '--text':            '--color-text',
  '--muted':           '--color-muted',
  '--line':            '--color-line',
  '--primary':         '--color-primary',
  '--primary-strong':  '--color-primary-strong',
  '--accent':          '--color-accent',
  '--green':           '--color-green',
  '--red':             '--color-red',
  '--glass':           '--color-glass',
  '--glass-border':    '--color-glass-border',
  '--glass-blur':      '--glass-blur',
  '--glow':            '--shadow-glow',
  '--glow-sm':         '--shadow-glow-sm',
  '--font-sans':       '--font-sans',
  '--font-heading':    '--font-heading',
  '--shadow':          '--shadow',
  '--shadow-sm':       '--shadow-sm',
  '--radius':          '--radius',
  '--radius-lg':       '--radius-lg',
}

function readThemeCss(): string {
  return readFileSync(resolve(__dirname, '../theme.css'), 'utf-8')
}

function readLegacyStyleCss(): string {
  return readFileSync(resolve(__dirname, '../../../public/legacy/css/style.css'), 'utf-8')
}

/**
 * Parse a CSS block bounded by a header regex and the next \}. Returns a Map of
 * variable-name → value. Whitespace is preserved in values to match exact byte parity.
 * Robust enough for the two blocks we care about (the legacy :root dark block + the
 * @media (prefers-color-scheme: light) inner block + the [data-theme="light"] block).
 */
function parseTokens(css: string, blockHeaderRe: RegExp): Map<string, string> {
  const headMatch = blockHeaderRe.exec(css)
  if (!headMatch) return new Map()
  const start = headMatch.index + headMatch[0].length
  // Find the matching closing brace (naive — handles single nesting fine for these blocks)
  let depth = 1
  let i = start
  while (i < css.length && depth > 0) {
    const ch = css[i]
    if (ch === '{') depth++
    else if (ch === '}') depth--
    if (depth === 0) break
    i++
  }
  const body = css.slice(start, i)
  const out = new Map<string, string>()
  // Match "  --name: value;" lines. The value can be anything up to the semicolon.
  const lineRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi
  let m: RegExpExecArray | null
  while ((m = lineRe.exec(body)) !== null) {
    const name = m[1]
    const value = m[2]
    if (name && value !== undefined) out.set(name, value.trim().replace(/\s+/g, ' '))
  }
  return out
}

function normalise(value: string): string {
  // Normalise whitespace to be tolerant of formatting differences; values are still compared exactly otherwise.
  return value.replace(/\s+/g, ' ').trim()
}

describe('design tokens — v1.0 → v2.0 parity (DESIGN-01, Pitfall 1)', () => {
  it('theme.css imports tailwindcss', () => {
    const css = readThemeCss()
    expect(css).toMatch(/@import\s+['"]tailwindcss['"]/)
  })

  it('theme.css declares a @theme block', () => {
    const css = readThemeCss()
    expect(css).toMatch(/@theme\s*\{/)
  })

  it('every v1.0 :root token has a corresponding v2.0 @theme entry (renamed per Pitfall 1)', () => {
    const css = readThemeCss()
    for (const [v1Name, v2Name] of Object.entries(TOKEN_RENAME)) {
      // The escape is for the leading '--' (regex-safe)
      const re = new RegExp(`\\${v2Name}\\s*:`)
      expect(css, `Missing v2 token ${v2Name} (was v1 ${v1Name})`).toMatch(re)
    }
  })

  it('theme.css declares both [data-theme="light"] and [data-theme="dark"] overrides', () => {
    const css = readThemeCss()
    expect(css).toMatch(/\[data-theme=['"]light['"]\]/)
    expect(css).toMatch(/\[data-theme=['"]dark['"]\]/)
  })

  it('theme.css declares an auto-mode @media (prefers-color-scheme: light) block', () => {
    const css = readThemeCss()
    expect(css).toMatch(/@media\s*\(prefers-color-scheme:\s*light\)/)
  })

  it('contains no fonts.googleapis.com or fonts.gstatic.com references (DESIGN-02 sanity)', () => {
    const css = readThemeCss()
    expect(css).not.toMatch(/fonts\.googleapis\.com/)
    expect(css).not.toMatch(/fonts\.gstatic\.com/)
  })

  it('legacy style.css :root tokens still exist (sanity — plan 01 moved file did not corrupt it)', () => {
    const legacy = readLegacyStyleCss()
    expect(legacy).toMatch(/--bg:\s*#07091a/)
    expect(legacy).toMatch(/--primary:\s*#b96eff/)
  })

  // ------------------------------------------------------------------
  // Checker warning 4: assert light-mode hex value parity, not just token names.
  // Parse v1.0 :root + @media (prefers-color-scheme: light) + [data-theme="light"]
  // blocks, then assert every renamed token has the same value in theme.css.
  // ------------------------------------------------------------------
  it('dark-mode hex values from legacy :root block match theme.css renamed counterparts', () => {
    const legacy = readLegacyStyleCss()
    const theme = readThemeCss()
    // Legacy dark :root block — matches the combined selector ":root, :root[data-theme=\"dark\"], :root[data-theme=\"auto\"] {"
    const legacyDark = parseTokens(legacy, /:root\s*,\s*:root\[data-theme="dark"\]\s*,\s*:root\[data-theme="auto"\]\s*\{/)
    const themeDefault = parseTokens(theme, /@theme\s*\{/)
    for (const [v1Name, v2Name] of Object.entries(TOKEN_RENAME)) {
      const v1Value = legacyDark.get(v1Name)
      if (v1Value === undefined) continue // some tokens (e.g. --font-sans family list) may legitimately differ when the v2.0 name is the same — skip if absent
      const v2Value = themeDefault.get(v2Name)
      expect(v2Value, `dark-mode ${v2Name} missing from theme.css @theme block (v1.0 was ${v1Name}: ${v1Value})`).toBeTruthy()
      // For color tokens, compare normalised values byte-for-byte. For typography (font family lists),
      // skip the byte compare because Fontsource variant names legitimately rename the family
      // (e.g. "DM Sans" → "DM Sans Variable").
      if (!v2Name.startsWith('--font-') && !KNOWN_DEVIATIONS.has(v2Name)) {
        expect(normalise(v2Value as string), `dark-mode ${v2Name} value drift from v1.0 (expected ${v1Value}, got ${v2Value})`).toBe(normalise(v1Value))
      }
    }
  })

  it('light-mode hex values from legacy @media (prefers-color-scheme: light) block match theme.css @media block', () => {
    const legacy = readLegacyStyleCss()
    const theme = readThemeCss()
    // Legacy light block via @media — the inner selector is ":root[data-theme=\"auto\"], :root:not([data-theme]) {"
    const legacyLight = parseTokens(legacy, /:root\[data-theme="auto"\]\s*,\s*:root:not\(\[data-theme\]\)\s*\{/)
    // theme.css @media block — match the inner :root[data-theme='auto'] / :root:not([data-theme]) selector
    const themeAutoLight = parseTokens(theme, /:root\[data-theme=['"]auto['"]\]\s*,\s*:root:not\(\[data-theme\]\)\s*\{/)
    expect(legacyLight.size, 'failed to parse legacy light-mode block').toBeGreaterThan(0)
    expect(themeAutoLight.size, 'failed to parse theme.css auto-light block').toBeGreaterThan(0)
    for (const [v1Name, v2Name] of Object.entries(TOKEN_RENAME)) {
      const v1Value = legacyLight.get(v1Name)
      if (v1Value === undefined) continue // not every token is overridden in light mode (e.g. --glass-blur stays the same)
      if (v2Name.startsWith('--font-')) continue
      const v2Value = themeAutoLight.get(v2Name)
      expect(v2Value, `light-mode (auto) ${v2Name} missing from theme.css (v1.0 was ${v1Name}: ${v1Value})`).toBeTruthy()
      expect(normalise(v2Value as string), `light-mode (auto) ${v2Name} value drift from v1.0 (expected ${v1Value}, got ${v2Value})`).toBe(normalise(v1Value))
    }
  })

  it('light-mode hex values from legacy [data-theme="light"] block match theme.css [data-theme="light"] block', () => {
    const legacy = readLegacyStyleCss()
    const theme = readThemeCss()
    const legacyLightExplicit = parseTokens(legacy, /:root\[data-theme="light"\]\s*\{/)
    const themeLightExplicit = parseTokens(theme, /:root\[data-theme=['"]light['"]\]\s*\{/)
    expect(legacyLightExplicit.size, 'failed to parse legacy [data-theme=light] block').toBeGreaterThan(0)
    expect(themeLightExplicit.size, 'failed to parse theme.css [data-theme=light] block').toBeGreaterThan(0)
    for (const [v1Name, v2Name] of Object.entries(TOKEN_RENAME)) {
      const v1Value = legacyLightExplicit.get(v1Name)
      if (v1Value === undefined) continue
      if (v2Name.startsWith('--font-')) continue
      const v2Value = themeLightExplicit.get(v2Name)
      expect(v2Value, `[data-theme=light] ${v2Name} missing (v1.0 was ${v1Name}: ${v1Value})`).toBeTruthy()
      expect(normalise(v2Value as string), `[data-theme=light] ${v2Name} value drift from v1.0 (expected ${v1Value}, got ${v2Value})`).toBe(normalise(v1Value))
    }
  })

  it('dark-mode explicit [data-theme="dark"] block matches legacy dark values', () => {
    const legacy = readLegacyStyleCss()
    const theme = readThemeCss()
    const legacyDark = parseTokens(legacy, /:root\s*,\s*:root\[data-theme="dark"\]\s*,\s*:root\[data-theme="auto"\]\s*\{/)
    const themeDarkExplicit = parseTokens(theme, /:root\[data-theme=['"]dark['"]\]\s*\{/)
    expect(themeDarkExplicit.size, 'failed to parse theme.css [data-theme=dark] block').toBeGreaterThan(0)
    for (const [v1Name, v2Name] of Object.entries(TOKEN_RENAME)) {
      const v1Value = legacyDark.get(v1Name)
      if (v1Value === undefined) continue
      if (v2Name.startsWith('--font-')) continue
      if (KNOWN_DEVIATIONS.has(v2Name)) continue
      const v2Value = themeDarkExplicit.get(v2Name)
      expect(v2Value, `[data-theme=dark] ${v2Name} missing (v1.0 was ${v1Name}: ${v1Value})`).toBeTruthy()
      expect(normalise(v2Value as string), `[data-theme=dark] ${v2Name} value drift from v1.0 (expected ${v1Value}, got ${v2Value})`).toBe(normalise(v1Value))
    }
  })
})
