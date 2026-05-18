// Locale helpers for content that lives in data.ts (items, scale steps).
// Keeps data.ts "content-frozen" while providing DE display labels.

import { CATEGORIES } from './data'
import type { MutableScaleStep } from './types'

/**
 * Return the display label for a base item in the given locale.
 * The item key (English) is always preserved for storage; this is display-only.
 */
export function getItemLabel(catId: string, item: string, lang: string): string {
  if (lang !== 'de') return item
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) return item
  const idx = (cat.items as readonly string[]).indexOf(item)
  if (idx === -1) return item
  return (cat.deItems as readonly string[])[idx] ?? item
}

// German labels for the DEFAULT_SCALE keys.
// Only applied when lang='de' and the step key matches a known default key.
const DE_SCALE: Record<string, { label: string; short: string; description: string }> = {
  'no':         { label: 'Nein',                  short: 'Nein',        description: 'Ich will / stimme dem nicht zu.' },
  'not-really': { label: 'Eher nein',              short: 'Eher nein',   description: 'Ich tendiere dagegen.' },
  'maybe':      { label: 'Vielleicht / Zukunft',   short: 'Vielleicht',  description: 'Hoffentlich oder vielleicht in Zukunft.' },
  'open':       { label: 'Offen dafür',            short: 'Offen',       description: 'Ich bin offen, neutral, bereit zu erkunden.' },
  'want':       { label: 'Möchte ich',             short: 'Möchte',      description: 'Ich würde das gerne.' },
  'hell-yes':   { label: 'Auf jeden Fall!',         short: 'Ja!',         description: 'Starkes Ja, aufregend und willkommen.' },
  'need':       { label: 'Brauche ich',            short: 'Brauche',     description: 'Höchste Priorität. Wenn nicht erfüllt, überdenke ich die Beziehung.' },
}

/**
 * Return localized label + short for a scale step.
 * For user-customized labels (not matching a known default key), the stored value is returned as-is.
 */
export function localizeStep(step: MutableScaleStep, lang: string): { label: string; short: string; description: string } {
  if (lang === 'de') {
    const de = DE_SCALE[step.key]
    if (de) return de
  }
  return { label: step.label, short: step.short, description: step.description }
}
