// src/hooks/useTheme.ts
// D-19: read settings.theme from the Zustand store, apply data-theme to <html>,
//       react to prefers-color-scheme changes when theme === 'auto'.
// Replaces v1.0 applyTheme() (public/legacy/js/app.js:47-57).

import { useEffect } from 'react'
import { useStore } from '@/lib/storage/store'

export function useTheme(): void {
  const theme = useStore((s) => s.settings.theme)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'auto') return
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => {
      // Re-assert the data-theme attribute so the CSS @media block re-evaluates.
      document.documentElement.removeAttribute('data-theme')
      requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-theme', 'auto')
      })
    }
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
    return undefined
  }, [theme])
}
