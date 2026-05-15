// D-12. RICH_TEXT_KEYS allow-list — only these i18n keys may flow through dangerouslySetInnerHTML.

import React from 'react'
import { type TranslationKey } from './en'
import { t } from './i18n'

// Every entry MUST be a TranslationKey present in BOTH src/lib/i18n/en.ts and de.ts.
// Adding a key without a corresponding `as const satisfies` typecheck would let
// unsafe HTML render — so the satisfies clause below is the gate.
export const RICH_TEXT_KEYS = [
  'about_credits',
  'about_credits_repo',
  'about_credits_unofficial',
] as const satisfies readonly TranslationKey[]

export type RichTextKey = typeof RICH_TEXT_KEYS[number]

export function isRichTextKey(k: TranslationKey): k is RichTextKey {
  return (RICH_TEXT_KEYS as readonly string[]).includes(k)
}

export function TranslatedText({ k }: { k: TranslationKey }): React.ReactElement {
  if (isRichTextKey(k)) {
    // Safe ONLY because k is in the typed allow-list. NEVER pass user-supplied keys here.
    return <span dangerouslySetInnerHTML={{ __html: t(k) }} />
  }
  return <span>{t(k)}</span>
}
