// Shows the process guide automatically after first profile creation.
// Subsequent opens are handled by individual pages via <ProcessGuideModal open={...} />.

import { useStore } from '@/lib/storage/store'
import { ProcessGuideModal } from './ProcessGuideModal'

export function ProcessGuideHost() {
  const guideSeen = useStore((s) => s.settings.guideSeen)
  const profiles = useStore((s) => s.profiles)
  const setSettings = useStore((s) => s.setSettings)

  if (guideSeen || profiles.length === 0) return null

  return (
    <ProcessGuideModal
      open={true}
      onClose={() => setSettings({ guideSeen: true })}
    />
  )
}
