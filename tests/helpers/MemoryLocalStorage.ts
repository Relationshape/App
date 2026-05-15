// Test helper — see Phase 2 PATTERNS.md "Shared Patterns".

import type { RenderResult } from '@testing-library/react'

export class MemoryLocalStorage {
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

/**
 * Renders a named React component from a module path in a fresh Vitest module registry
 * with an in-memory localStorage stub. Callers must be in a jsdom environment.
 *
 * @param modulePath - absolute or alias path to the module (e.g. '@/App')
 * @param ComponentName - exported component name to render
 * @param vi - Vitest `vi` object from the calling test file
 */
export async function renderFresh<T extends Record<string, unknown>>(
  modulePath: string,
  ComponentName: string,
  vi: { resetModules: () => void; stubGlobal: (key: string, value: unknown) => void }
): Promise<RenderResult> {
  const { render } = await import('@testing-library/react')
  const { createElement } = await import('react')
  vi.resetModules()
  vi.stubGlobal('localStorage', new MemoryLocalStorage())
  const mod = await import(modulePath) as T
  const Component = mod[ComponentName] as React.ComponentType
  return render(createElement(Component))
}
