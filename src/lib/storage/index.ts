// src/lib/storage/index.ts
// Barrel re-export for the storage module (CORE-01, CORE-02, CORE-03, CORE-05, CORE-07, CORE-08).

export { useStore, store } from './store'
export { relationshapePersist, STORAGE_KEY } from './persist'
export { migrateScale, recalcScaleValues } from './migrateScale'
export type {
  AppState,
  Profile,
  Result,
  Import,
  Settings,
  PersistedShape,
  LastSaveError,
  AnswerCell,
  CategoryAnswers,
  AnswersBlob,
  ResultProgress,
  GROfBoth,
} from './types'
