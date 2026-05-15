// PROFILE-04. Card for a single result. v1.0 analog public/legacy/js/app.js (resultCard around 1591).

import { Link } from 'react-router-dom'
import type { Result, Profile } from '@/lib/storage/types'

export function ResultCard({ result, profile }: { result: Result; profile: Profile }) {
  const color = result.subjectColor || profile.color
  return (
    <Link
      to={`/result/${result.id}`}
      className="card result-card"
      style={{ ['--c' as 'color']: color } as React.CSSProperties}
      data-testid={`result-card-${result.id}`}
    >
      <div className="avatar">{result.subjectEmoji || '💞'}</div>
      <div>
        <h3>{result.subject || 'Untitled map'}</h3>
        <p className="muted small">v{result.version ?? 1}</p>
      </div>
    </Link>
  )
}
