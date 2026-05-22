// src/routes/RootLayout.tsx — D-13, SHELL-06. Mounts Toaster (first), Outlet, DialogHost, AgeGate, WizardHost.
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Nav } from '@/components/Nav'
import { Toaster } from '@/components/ui/sonner'
import { DialogHost } from '@/components/DialogHost'
import { AgeGate } from '@/components/AgeGate'
import { ProcessGuideHost } from '@/components/ProcessGuideHost'
import { WizardHost } from '@/components/WizardHost'
import { ShareDataProvider } from '@/components/providers/ShareDataProvider'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { useStore } from '@/lib/storage/store'
import { useToast } from '@/lib/hooks/useToast'

export function RootLayout() {
  useScrollToTop()
  const lastSaveError = useStore((s) => s.lastSaveError)
  const clearLastSaveError = useStore((s) => s.clearLastSaveError)
  const { toast } = useToast()
  useEffect(() => {
    if (!lastSaveError) return
    toast.error(lastSaveError.message)
    clearLastSaveError()
  }, [lastSaveError, toast, clearLastSaveError])

  return (
    <ShareDataProvider>
      <Toaster richColors position="bottom-center" duration={1900} />
      <Nav />
      <main id="app" className="min-h-screen">
        <Outlet />
      </main>
      <DialogHost />
      <AgeGate />
      <ProcessGuideHost />
      <WizardHost />
    </ShareDataProvider>
  )
}
