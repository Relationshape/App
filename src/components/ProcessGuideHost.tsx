// Shows the process guide automatically on first visit (after age confirmation, before wizard).
// Subsequent opens are handled by individual pages via <ProcessGuideModal open={...} />.

import { useStore } from '@/lib/storage/store'
import { ProcessGuideModal } from './ProcessGuideModal'

export function ProcessGuideHost() {
  const ageConfirmed = useStore((s) => s.settings.ageConfirmed)
  const guideSeen = useStore((s) => s.settings.guideSeen)
  const setSettings = useStore((s) => s.setSettings)

  if (!ageConfirmed || guideSeen) return null

  return (
    <ProcessGuideModal
      open={true}
      onClose={() => setSettings({ guideSeen: true })}
    />
  )
}
