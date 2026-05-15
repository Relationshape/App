// D-13. Persistent shell: Nav above Outlet. Plan 2 mounts <Toaster />, <DialogHost />, <AgeGate />, <WizardHost />.
// NOTE: Full implementation completed in task 02-01-07 (Nav + useScrollToTop wired here).
import { Outlet } from 'react-router-dom'
import { Nav } from '@/components/Nav'
import { useScrollToTop } from '@/hooks/useScrollToTop'

export function RootLayout() {
  useScrollToTop()
  return (
    <>
      <Nav />
      <main id="app" className="min-h-screen">
        <Outlet />
      </main>
    </>
  )
}
