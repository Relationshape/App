// Redirect to the first profile's detail page, or to /welcome when no profile exists.
// The profile list grid is gone — there is exactly one profile and ProfileDetail covers everything.

import { Navigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'

export function Home() {
  const firstProfileId = useStore((s) => s.profiles[0]?.id)
  if (firstProfileId) return <Navigate to={`/profile/${firstProfileId}`} replace />
  return <Navigate to="/welcome" replace />
}
