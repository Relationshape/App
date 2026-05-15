// src/lib/i18n/index.ts
// Barrel re-export for the i18n module (CORE-06).

export { EN, type TranslationKey } from './en'
export { DE } from './de'
export {
  t,
  getLang,
  setLang,
  availableLangs,
  getLocalizedDefaultScale,
  DEFAULT_SCALE_DE,
} from './i18n'
