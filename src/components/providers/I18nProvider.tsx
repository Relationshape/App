// SHELL-04, D-14. Context wrappers around the existing Zustand-backed useTheme/useLang hooks; enforce "must be wrapped" at review time.
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useLang } from '@/hooks/useLang'

const I18nContext = createContext<true | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  useLang()
  return <I18nContext.Provider value={true}>{children}</I18nContext.Provider>
}

export function useI18nContext(): true {
  const ctx = useContext(I18nContext)
  if (ctx === null) {
    throw new Error('useLang must be used inside <I18nProvider>')
  }
  return ctx
}
