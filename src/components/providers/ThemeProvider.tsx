// SHELL-04, D-14. Context wrappers around the existing Zustand-backed useTheme/useLang hooks; enforce "must be wrapped" at review time.
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useTheme } from '@/hooks/useTheme'

const ThemeContext = createContext<true | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  useTheme()
  return <ThemeContext.Provider value={true}>{children}</ThemeContext.Provider>
}

export function useThemeContext(): true {
  const ctx = useContext(ThemeContext)
  if (ctx === null) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return ctx
}
