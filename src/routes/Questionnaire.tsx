// QUEST-02..08 dispatcher. Port of public/legacy/js/app.js:2099-2107.
// Dispatches to ListMode or SingleMode based on result.progress?.mode.

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { ListMode } from '@/components/questionnaire/ListMode'
import { SingleMode } from '@/components/questionnaire/SingleMode'

export function Questionnaire() {
  const { profileId, resultId } = useParams<{ profileId: string; resultId: string }>()
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const allResults = useStore((s) => s.results)

  const profile = profileId ? profiles.find((p) => p.id === profileId) ?? null : null
  const result = resultId ? allResults.find((r) => r.id === resultId) ?? null : null

  useEffect(() => {
    if (!profile || !result) { navigate('/'); return }
    if (result.profileId !== profile.id) { navigate('/'); return }
  }, [profile, result, navigate])

  if (!profile || !result) return null
  const mode = result.progress?.mode ?? 'list'
  return mode === 'single'
    ? <SingleMode result={result} profile={profile} />
    : <ListMode result={result} profile={profile} />
}
