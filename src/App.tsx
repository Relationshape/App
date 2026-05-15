// src/App.tsx
// Top-level component: applies the useTheme side effect (D-19) and mounts the hash router.

import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useTheme } from './hooks/useTheme'

export default function App() {
  useTheme()
  return <RouterProvider router={router} />
}
