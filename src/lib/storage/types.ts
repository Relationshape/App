// src/lib/storage/types.ts
// Domain types for the Zustand store.
// Source: public/legacy/js/storage.js defaults() + saveProfile/saveResult/saveImport method signatures.
// CORE-01.

import type { MutableScaleStep } from '@/lib/data/types'

export interface Profile {
  id: string
  name: string
  pronouns: string
  color: string
  emoji: string
  notes?: string
  createdAt: number
}

export type GROfBoth = 'G' | 'R' | 'Both'

export interface AnswerCell {
  scale: string
  scaleFrac?: number
  gr?: GROfBoth
  note?: string
}

// The answers blob is: { [categoryId]: { [itemName]: AnswerCell, __custom?: Record<string, AnswerCell>, __hidden?: Record<string, true> } }
export type CategoryAnswers = Record<string, AnswerCell> & {
  __custom?: Record<string, AnswerCell>
  __hidden?: Record<string, true>
}

export type AnswersBlob = Record<string, CategoryAnswers>

export interface ResultProgress {
  mode: 'list' | 'single'
  catIndex?: number
  flatIndex?: number
  focusItem?: string
  // Phase 2 (D-26 deep-link). Plan 4 sets this from useParams when arriving via #/result/:id/:catId;
  // plan 5's <Result /> reads it to scroll-into-view + open the per-category drill-down.
  openCatId?: string
}

export interface Result {
  id: string
  profileId: string
  subject?: string
  subjectEmoji?: string
  subjectColor?: string
  answers: AnswersBlob
  enabledCategories?: string[]
  askedItems?: Record<string, string[]>
  scale?: MutableScaleStep[]
  progress?: ResultProgress
  // Phase 2 (D-30). v1.0 marks results seeded from a template/import so the first edit
  // prompts a confirmation. templateWarningDisabled suppresses the dialog forever.
  seededFromImportId?: string
  seededFromResultId?: string
  templateWarningDisabled?: boolean
  version?: number
  createdAt: number
  updatedAt: number
}

export interface Import {
  id: string
  name?: string
  pronouns?: string
  emoji?: string
  color?: string
  subject?: string
  subjectEmoji?: string
  subjectColor?: string
  answers: AnswersBlob
  scale?: MutableScaleStep[]
  enabledCategories?: string[]
  askedItems?: Record<string, string[]>
  version?: number
  srcVersion?: number
  importedAt: number
  // Share export modes (v1.0 parity, D-36 / D-37)
  exportMode?: 'unrestricted' | 'restricted' | 'template'
  answersUnlocked?: boolean
  templateWarningDisabled?: boolean
}

export interface Settings {
  theme: 'auto' | 'light' | 'dark'
  lang?: 'en' | 'de'
  fabiMode?: boolean
  wizardSeen?: boolean
  // Phase 2 (PROFILE-06, D-29). Persisted age-gate confirmation; superseded the legacy `rs-age-confirmed` localStorage key.
  ageConfirmed?: boolean
}

export interface LastSaveError {
  kind: 'QUOTA_EXCEEDED' | 'UNKNOWN'
  message: string
  at: number
}

/**
 * Canonical persisted slice — exactly what gets written to localStorage["relationshape.v1"].
 * D-06: byte-compatible with v1.0; lastSaveError is NOT included.
 */
export interface PersistedShape {
  profiles: Profile[]
  results: Result[]
  imports: Import[]
  settings: Settings
  scale: MutableScaleStep[]
}

/**
 * Full in-memory store state — persisted slice + the in-memory-only lastSaveError + actions.
 */
export interface AppState extends PersistedShape {
  lastSaveError: LastSaveError | null

  // Profile actions
  createProfile: (init: Partial<Omit<Profile, 'id' | 'createdAt'>>) => Profile
  updateProfile: (id: string, patch: Partial<Profile>) => Profile | null
  deleteProfile: (id: string) => void
  getProfile: (id: string) => Profile | null

  // Result actions
  saveResult: (result: Result) => void
  getResult: (id: string) => Result | null
  getResultsByProfile: (profileId: string) => Result[]
  deleteResult: (id: string) => void

  // Import actions
  saveImport: (imp: Import) => void
  getImport: (id: string) => Import | null
  deleteImport: (id: string) => void

  // Snapshot replace (backup restore)
  replaceAll: (snapshot: Partial<PersistedShape>) => void

  // Theme + lang
  setTheme: (theme: Settings['theme']) => void
  setLang: (lang: NonNullable<Settings['lang']>) => void
  // Settings (Phase 2 extensions) — sets ageConfirmed, wizardSeen, etc. via Partial<Settings>
  setSettings: (patch: Partial<Settings>) => void

  // Scale
  setScale: (scale: MutableScaleStep[]) => void
  getScale: () => MutableScaleStep[]

  // Error
  clearLastSaveError: () => void
}
