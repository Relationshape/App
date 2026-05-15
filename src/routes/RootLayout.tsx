// D-13. Persistent shell: Nav above Outlet. Plan 2 mounts <Toaster />, <DialogHost />, <AgeGate />, <WizardHost />.
// NOTE: Full implementation created in task 02-01-07 (this stub enables router.tsx to typecheck in task 02-01-04).
import { Outlet } from 'react-router-dom'

export function RootLayout() {
  return (
    <>
      <main id="app" className="min-h-screen">
        <Outlet />
      </main>
    </>
  )
}
