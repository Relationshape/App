// src/App.tsx
// Top-level component: applies theme/lang side effects and mounts the hash router.
// D-14, SHELL-04: ThemeProvider and I18nProvider wrap RouterProvider.

import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useTheme } from './hooks/useTheme'
import { useLang } from './hooks/useLang'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { I18nProvider } from './components/providers/I18nProvider'

export default function App() {
  useTheme()
  const { lang } = useLang()
  return (
    <ThemeProvider>
      <I18nProvider>
        <RouterProvider key={lang} router={router} />
      </I18nProvider>
    </ThemeProvider>
  )
}
