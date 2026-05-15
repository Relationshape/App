// src/lib/storage/persist.ts
// Custom Zustand persistence middleware — relationshapePersist.
// D-06: byte-compatible with v1.0 localStorage key "relationshape.v1"; does NOT use the built-in zustand persist middleware.
// D-07: quota overflow surfaces as lastSaveError; in-memory state stays intact.
// CORE-02, CORE-03, CORE-08.

import type { StateCreator } from 'zustand'
import { DEFAULT_SCALE } from '@/lib/data/data'
import type { MutableScaleStep } from '@/lib/data/types'
import { migrateScale } from './migrateScale'
import type { AppState, PersistedShape, LastSaveError } from './types'

export const STORAGE_KEY = 'relationshape.v1'

function isQuotaExceeded(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false
  // Standard name first; Firefox uses NS_ERROR_DOM_QUOTA_REACHED; iOS old uses code 22
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22
  )
}

/**
 * Load the persisted slice from localStorage. Returns a partial AppState the store can spread into its initial state.
 * Mirrors v1.0 load() semantics: silent fallback to defaults on any parse failure.
 */
function hydrate(): Partial<PersistedShape> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<PersistedShape>
    return {
      profiles: parsed.profiles ?? [],
      results: parsed.results ?? [],
      imports: parsed.imports ?? [],
      settings: parsed.settings ?? { theme: 'auto' },
      scale: Array.isArray(parsed.scale)
        ? migrateScale(parsed.scale as MutableScaleStep[])
        : (DEFAULT_SCALE.map((s) => ({ ...s })) as MutableScaleStep[]),
    }
  } catch {
    return {}
  }
}

/**
 * Custom Zustand middleware. Wraps every set() so a write to localStorage is attempted; on QuotaExceededError it
 * leaves the in-memory state intact and dispatches lastSaveError. The persisted slice excludes lastSaveError and
 * any function fields (Zustand actions live on the state but are not serialised).
 */
export function relationshapePersist<T extends AppState>(
  config: StateCreator<T, [], [], T>,
): StateCreator<T, [], [], T> {
  return (set, get, api) => {
    function persist(state: T): void {
      if (typeof localStorage === 'undefined') return
      const slice: PersistedShape = {
        profiles: state.profiles,
        results: state.results,
        imports: state.imports,
        settings: state.settings,
        scale: state.scale,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slice))
        if (state.lastSaveError) {
          // Clear prior error on successful write
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(set as any)({ lastSaveError: null } as Partial<T>)
        }
      } catch (err) {
        const error: LastSaveError = {
          kind: isQuotaExceeded(err) ? 'QUOTA_EXCEEDED' : 'UNKNOWN',
          message: err instanceof Error ? err.message : 'Unknown storage error',
          at: Date.now(),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(set as any)({ lastSaveError: error } as Partial<T>)
      }
    }

    const wrappedSet: typeof set = ((
      partial: Parameters<typeof set>[0],
      replace?: Parameters<typeof set>[1],
    ): void => {
      const before = get()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(set as any)(partial, replace)
      const after = get()
      if (after !== before) persist(after)
    }) as typeof set

    const initial = config(wrappedSet, get, api)
    const persisted = hydrate()
    return { ...initial, ...persisted } as T
  }
}
