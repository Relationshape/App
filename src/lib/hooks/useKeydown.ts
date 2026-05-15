// QUEST-03. Generic document-level keydown listener with cleanup.
import { useEffect } from 'react'
type KeyHandlers = Record<string, (e: KeyboardEvent) => void>
export function useKeydown(handlers: KeyHandlers, enabled = true): void {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      const fn = handlers[e.key]
      if (fn) fn(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers, enabled])
}
