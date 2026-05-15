// src/lib/storage/store.ts
// Zustand store + ported v1.0 Store API.
// CORE-01, D-04. All actions are sync (no async/await — Store methods are synchronous in v1.0).
// D-05: state IS the in-memory cache.

import { create } from 'zustand'
import { DEFAULT_SCALE } from '@/lib/data/data'
import type { MutableScaleStep } from '@/lib/data/types'
import { getLocalizedDefaultScale, setLang as i18nSetLang } from '@/lib/i18n/i18n'
import { migrateScale } from './migrateScale'
import { relationshapePersist } from './persist'
import type {
  AppState,
  Profile,
  Result,
  PersistedShape,
} from './types'

// uid: crypto.randomUUID with v1.0 fallback (Pitfall 7)
function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

// Palette + emoji constants from v1.0 storage.js — used for random profile defaults
const PALETTE: readonly string[] = [
  '#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#a78bfa', '#22c55e', '#e11d48',
]
const EMOJI_BANK: readonly string[] = [
  '🌷', '🌻', '🌊', '🌙', '🔥', '🌿', '✨', '🪐', '🍀', '🦋', '🪷', '🍑', '🌸', '🌞',
]

function randomPick<T>(arr: readonly T[]): T {
  const idx = Math.floor(Math.random() * arr.length)
  // noUncheckedIndexedAccess: assert non-empty (arr has constant non-zero length above)
  return arr[idx] as T
}

const defaultsState: PersistedShape = {
  profiles: [],
  results: [],
  imports: [],
  settings: { theme: 'auto' },
  scale: DEFAULT_SCALE.map((s) => ({ ...s })) as MutableScaleStep[],
}

export const useStore = create<AppState>()(
  relationshapePersist((set, get) => ({
    ...defaultsState,
    lastSaveError: null,

    // Profile actions
    createProfile: (init) => {
      const profile: Profile = {
        id: uid(),
        name: init.name ?? 'Unnamed',
        pronouns: init.pronouns ?? '',
        color: init.color ?? randomPick(PALETTE),
        emoji: init.emoji ?? randomPick(EMOJI_BANK),
        notes: init.notes ?? '',
        createdAt: Date.now(),
      }
      set((state) => ({ profiles: [...state.profiles, profile] }))
      return profile
    },
    updateProfile: (id, patch) => {
      let updated: Profile | null = null
      set((state) => {
        const profiles = state.profiles.map((p) => {
          if (p.id !== id) return p
          updated = { ...p, ...patch }
          return updated
        })
        return { profiles }
      })
      return updated
    },
    deleteProfile: (id) => {
      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== id),
        results: state.results.filter((r) => r.profileId !== id),
      }))
    },
    getProfile: (id) => get().profiles.find((p) => p.id === id) ?? null,

    // Result actions
    saveResult: (result) => {
      const now = Date.now()
      const final: Result = { ...result, updatedAt: now }
      set((state) => {
        const existing = state.results.findIndex((r) => r.id === result.id)
        if (existing >= 0) {
          const next = state.results.slice()
          next[existing] = final
          return { results: next }
        }
        return {
          results: [
            ...state.results,
            { ...final, createdAt: final.createdAt || now },
          ],
        }
      })
    },
    getResult: (id) => get().results.find((r) => r.id === id) ?? null,
    getResultsByProfile: (profileId) =>
      get().results.filter((r) => r.profileId === profileId),
    deleteResult: (id) => {
      set((state) => ({ results: state.results.filter((r) => r.id !== id) }))
    },

    // Import actions
    saveImport: (imp) => {
      set((state) => {
        const existing = state.imports.findIndex((i) => i.id === imp.id)
        if (existing >= 0) {
          const next = state.imports.slice()
          next[existing] = imp
          return { imports: next }
        }
        return { imports: [...state.imports, imp] }
      })
    },
    getImport: (id) => get().imports.find((i) => i.id === id) ?? null,
    deleteImport: (id) => {
      set((state) => ({ imports: state.imports.filter((i) => i.id !== id) }))
    },

    // Snapshot replace (backup restore)
    replaceAll: (snapshot) => {
      set((state) => ({
        profiles: snapshot.profiles ?? state.profiles,
        results: snapshot.results ?? state.results,
        imports: snapshot.imports ?? state.imports,
        settings: snapshot.settings ?? state.settings,
        scale: Array.isArray(snapshot.scale)
          ? migrateScale(snapshot.scale as MutableScaleStep[])
          : state.scale,
      }))
    },

    // Theme
    setTheme: (theme) => {
      set((state) => ({ settings: { ...state.settings, theme } }))
    },

    // Lang — also syncs the i18n module-level _lang (D-14)
    setLang: (lang) => {
      i18nSetLang(lang)
      set((state) => ({ settings: { ...state.settings, lang } }))
    },

    // Scale
    setScale: (scale) => {
      set({ scale: migrateScale(scale) })
    },
    getScale: () => {
      const s = get().scale
      // CORE-07: if the persisted scale equals the English DEFAULT_SCALE and language is DE, return DE scale
      // (Phase-1 semantic preservation per v1.0 getScale()).
      return getLocalizedDefaultScale(s as readonly MutableScaleStep[]) as MutableScaleStep[]
    },

    // Error reset
    clearLastSaveError: () => set({ lastSaveError: null }),
  })),
)

/** Direct (non-React) access for callers outside the component tree (i18n, side-effects, etc.). */
export const store = useStore
