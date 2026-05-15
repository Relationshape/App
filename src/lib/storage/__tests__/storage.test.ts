// src/lib/storage/__tests__/storage.test.ts
// CORE-01, CORE-02, CORE-03, CORE-08.
// Vitest env: node (default per D-25). We install a tiny in-memory localStorage stub.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { STORAGE_KEY } from '../persist'
import {
  V1_LOCALSTORAGE_BLOB,
  V1_LOCALSTORAGE_PARSED,
} from '../../../../tests/fixtures/v1-localstorage.fixture'

// ----------------------------------------
// localStorage stub helpers
// ----------------------------------------

class MemoryLocalStorage {
  private store = new Map<string, string>()
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v))
  }
  removeItem(k: string): void {
    this.store.delete(k)
  }
  clear(): void {
    this.store.clear()
  }
  get length(): number {
    return this.store.size
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null
  }
}

async function freshStore(localStorageImpl: MemoryLocalStorage) {
  vi.resetModules()
  vi.stubGlobal('localStorage', localStorageImpl)
  const mod = await import('../store')
  return mod.useStore
}

// ----------------------------------------
// Tests
// ----------------------------------------

describe('storage — hydrate from v1.0 blob (CORE-08)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hydrates profiles, results, imports, settings, scale from a v1.0 blob byte-for-byte', async () => {
    const ls = new MemoryLocalStorage()
    ls.setItem(STORAGE_KEY, V1_LOCALSTORAGE_BLOB)
    const useStore = await freshStore(ls)
    const state = useStore.getState()
    expect(state.profiles).toEqual(V1_LOCALSTORAGE_PARSED.profiles)
    expect(state.results).toEqual(V1_LOCALSTORAGE_PARSED.results)
    expect(state.imports).toEqual(V1_LOCALSTORAGE_PARSED.imports)
    expect(state.settings).toEqual(V1_LOCALSTORAGE_PARSED.settings)
    // Scale may be migrated (recalculated 0..n) but the keys + length must match
    expect(state.scale.length).toBe(V1_LOCALSTORAGE_PARSED.scale.length)
    state.scale.forEach((step, i) => {
      expect(step.key).toBe(V1_LOCALSTORAGE_PARSED.scale[i]?.key)
    })
  })

  it('falls back to defaults on missing localStorage entry', async () => {
    const ls = new MemoryLocalStorage()
    const useStore = await freshStore(ls)
    const state = useStore.getState()
    expect(state.profiles).toEqual([])
    expect(state.results).toEqual([])
    expect(state.imports).toEqual([])
    expect(state.settings.theme).toBe('auto')
  })

  it('falls back to defaults on malformed JSON', async () => {
    const ls = new MemoryLocalStorage()
    ls.setItem(STORAGE_KEY, 'not-json-at-all{{{')
    const useStore = await freshStore(ls)
    const state = useStore.getState()
    expect(state.profiles).toEqual([])
  })
})

describe('storage — QuotaExceededError surfaces as lastSaveError (CORE-02, D-07)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sets lastSaveError on quota overflow and keeps in-memory state intact', async () => {
    const ls = new MemoryLocalStorage()
    const useStore = await freshStore(ls)

    // Override setItem to throw a QuotaExceededError DOMException
    ls.setItem = (() => {
      const err = new DOMException('Quota exceeded', 'QuotaExceededError')
      throw err
    }) as MemoryLocalStorage['setItem']

    // Trigger a mutation
    useStore.getState().createProfile({ name: 'OverflowProfile' })
    const state = useStore.getState()
    expect(state.profiles.length).toBeGreaterThan(0)
    expect(state.profiles[0]?.name).toBe('OverflowProfile')
    expect(state.lastSaveError).not.toBeNull()
    expect(state.lastSaveError?.kind).toBe('QUOTA_EXCEEDED')
    expect(typeof state.lastSaveError?.message).toBe('string')
    expect(typeof state.lastSaveError?.at).toBe('number')
  })

  it('clears lastSaveError on the next successful save', async () => {
    const ls = new MemoryLocalStorage()
    const useStore = await freshStore(ls)

    // First save throws
    ls.setItem = (() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    }) as MemoryLocalStorage['setItem']
    useStore.getState().createProfile({ name: 'p1' })
    expect(useStore.getState().lastSaveError?.kind).toBe('QUOTA_EXCEEDED')

    // Restore setItem and trigger another mutation
    const real = new MemoryLocalStorage()
    ls.setItem = real.setItem.bind(real) as MemoryLocalStorage['setItem']
    useStore.getState().createProfile({ name: 'p2' })
    expect(useStore.getState().lastSaveError).toBeNull()
  })
})

describe('storage — in-memory cache (CORE-03, D-05)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not call JSON.parse on subsequent reads after hydration', async () => {
    const ls = new MemoryLocalStorage()
    ls.setItem(STORAGE_KEY, V1_LOCALSTORAGE_BLOB)
    const parseSpy = vi.spyOn(JSON, 'parse')
    const useStore = await freshStore(ls)

    // Allow hydration's one JSON.parse call
    const hydrationCallCount = parseSpy.mock.calls.length

    // Multiple reads
    useStore.getState().getProfile('profile-test-subject')
    useStore.getState().getResult('result-test-fixture')
    useStore.getState().getProfile('profile-test-subject')
    useStore.getState().getResultsByProfile('profile-test-subject')

    // Reads must NOT have triggered any new JSON.parse calls
    expect(parseSpy.mock.calls.length).toBe(hydrationCallCount)
    parseSpy.mockRestore()
  })
})

describe('storage — action coverage (CORE-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('createProfile persists the new profile to localStorage', async () => {
    const ls = new MemoryLocalStorage()
    const useStore = await freshStore(ls)
    const profile = useStore
      .getState()
      .createProfile({ name: 'Test', color: '#abcdef' })
    const persistedRaw = ls.getItem(STORAGE_KEY)
    expect(persistedRaw).not.toBeNull()
    const persisted = JSON.parse(persistedRaw as string) as {
      profiles: { id: string; name: string }[]
    }
    expect(persisted.profiles.find((p) => p.id === profile.id)?.name).toBe('Test')
  })

  it('setTheme persists the new theme', async () => {
    const ls = new MemoryLocalStorage()
    const useStore = await freshStore(ls)
    useStore.getState().setTheme('dark')
    const persisted = JSON.parse(ls.getItem(STORAGE_KEY) as string) as {
      settings: { theme: string }
    }
    expect(persisted.settings.theme).toBe('dark')
  })

  it('replaceAll swaps profiles + preserves keys not present in the snapshot', async () => {
    const ls = new MemoryLocalStorage()
    const useStore = await freshStore(ls)
    useStore.getState().createProfile({ name: 'p1' })
    const newProfile = {
      id: 'new-id',
      name: 'NewProfile',
      pronouns: '',
      color: '#000000',
      emoji: '🌟',
      notes: '',
      createdAt: 1,
    }
    useStore.getState().replaceAll({ profiles: [newProfile] })
    const state = useStore.getState()
    expect(state.profiles).toEqual([newProfile])
    // imports + settings should retain their default values since the snapshot didn't include them
    expect(state.imports).toEqual([])
    expect(state.settings.theme).toBe('auto')
  })

  it('deleteProfile cascade-deletes results for that profile', async () => {
    const ls = new MemoryLocalStorage()
    const useStore = await freshStore(ls)
    const p = useStore.getState().createProfile({ name: 'p1' })
    useStore.getState().saveResult({
      id: 'r1',
      profileId: p.id,
      answers: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    expect(useStore.getState().results).toHaveLength(1)
    useStore.getState().deleteProfile(p.id)
    expect(useStore.getState().results).toHaveLength(0)
  })

  it('lastSaveError field is NOT serialised into the localStorage blob', async () => {
    const ls = new MemoryLocalStorage()
    const useStore = await freshStore(ls)
    // Force a quota error to populate lastSaveError, then restore setItem
    const realSet = ls.setItem.bind(ls)
    ls.setItem = (() => {
      throw new DOMException('q', 'QuotaExceededError')
    }) as MemoryLocalStorage['setItem']
    useStore.getState().createProfile({ name: 'p1' })
    ls.setItem = realSet as MemoryLocalStorage['setItem']
    useStore.getState().createProfile({ name: 'p2' })
    const persisted = JSON.parse(ls.getItem(STORAGE_KEY) as string)
    expect(persisted).not.toHaveProperty('lastSaveError')
  })
})
