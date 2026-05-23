// src/lib/i18n/i18n.ts
// Custom typed i18n port per D-12 (~80 lines, no third-party i18n library).
// Mirrors semantics of public/legacy/js/i18n.js lines 798-846:
//   - detectLanguage() — localStorage settings.lang → navigator.language → 'en' (D-14)
//   - t(key, vars) — current-lang lookup → EN fallback → raw key, with {var} interpolation
//   - getLang() / setLang() — module-level lang state
//   - getLocalizedDefaultScale() — returns DE scale in DE mode, supplied English default otherwise
//
// DEFAULT_SCALE_DE lives in this module (NOT in data.ts) because data.ts is the
// English source of truth for the questionnaire content; localisation lives in i18n/.

import { DEFAULT_SCALE } from '@/lib/data/data'
import type { Lang, MutableScaleStep } from '@/lib/data/types'
import { EN, type TranslationKey } from './en'
import { DE } from './de'

const TRANSLATIONS = { en: EN, de: DE } as const

// German localised default answer scale.
// Ported verbatim from public/legacy/js/i18n.js lines 788-796.
export const DEFAULT_SCALE_DE: readonly MutableScaleStep[] = [
  {
    key: 'no',
    label: 'Nein',
    short: 'Nein',
    value: 0,
    color: '#264653',
    description: 'Ich will das nicht / stimme dem nicht zu.',
  },
  {
    key: 'not-really',
    label: 'Eher nicht',
    short: 'Eher nicht',
    value: 1,
    color: '#577590',
    description: 'Ich tendiere dagegen.',
  },
  {
    key: 'maybe',
    label: 'Vielleicht',
    short: 'Vielleicht',
    value: 2,
    color: '#43aa8b',
    description: 'Hoffentlich oder vielleicht in der Zukunft.',
  },
  {
    key: 'open',
    label: 'Offen dafür',
    short: 'Offen',
    value: 3,
    color: '#90be6d',
    description: 'Ich bin offen, neutral, bereit es auszuprobieren.',
  },
  {
    key: 'want',
    label: 'Möchte ich',
    short: 'Möchte',
    value: 4,
    color: '#f9c74f',
    description: 'Das würde ich gerne haben.',
  },
  {
    key: 'hell-yes',
    label: 'Ja, unbedingt!',
    short: 'Ja!',
    value: 5,
    color: '#f3722c',
    description: 'Starkes Ja, aufregend und willkommen.',
  },
  {
    key: 'need',
    label: 'Brauche ich',
    short: 'Brauche',
    value: 6,
    color: '#e63946',
    description: 'Höchste Wichtigkeit. Wenn unerfüllt, stelle ich die Beziehung evtl. in Frage.',
  },
] as const

function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'de'
}

function detectLanguage(): Lang {
  // Mirror v1.0: localStorage settings.lang → navigator.language → 'en' (D-14)
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('relationshape.v1')
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && 'settings' in parsed) {
          const settings = (parsed as { settings?: unknown }).settings
          if (settings && typeof settings === 'object' && 'lang' in settings) {
            const stored = (settings as { lang?: unknown }).lang
            if (isLang(stored)) return stored
          }
        }
      }
    }
  } catch {
    // ignore — fall through to navigator detection
  }
  if (typeof navigator !== 'undefined') {
    const browser = (navigator.language || 'en').split('-')[0]?.toLowerCase() ?? 'en'
    if (browser === 'de') return 'de'
  }
  return 'en'
}

let _lang: Lang = detectLanguage()
// Keep the HTML lang attribute in sync so CSS hyphens:auto works per locale.
if (typeof document !== 'undefined') document.documentElement.lang = _lang

export function getLang(): Lang {
  return _lang
}

export function setLang(lang: Lang): void {
  if (!isLang(lang)) return
  _lang = lang
  if (typeof document !== 'undefined') document.documentElement.lang = lang
  // Persistence to localStorage is the Zustand store's responsibility (plan 06).
  // This function only updates the module-level lang. v1.0 also wrote to localStorage
  // here — we move that side effect into the store action that calls setLang so
  // every persistence path goes through the same custom middleware (D-06).
}

export function availableLangs(): ReadonlyArray<{ code: Lang; label: string }> {
  return [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
  ]
}

export function t(key: TranslationKey, vars: Record<string, string | number> = {}): string {
  const dict = TRANSLATIONS[_lang]
  // Lookup chain mirrors v1.0: current-lang dict → EN fallback → raw key.
  // The EN fallback is dead code when the call site uses the typed `TranslationKey`
  // union (D-13) but is retained for runtime safety / dynamic lookups.
  let str: string = dict[key] ?? EN[key] ?? (key as string)
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v))
  }
  return str
}

export function getLocalizedDefaultScale(
  englishDefault: readonly MutableScaleStep[] = DEFAULT_SCALE as readonly MutableScaleStep[],
): readonly MutableScaleStep[] {
  if (_lang === 'de') return DEFAULT_SCALE_DE
  return englishDefault
}
