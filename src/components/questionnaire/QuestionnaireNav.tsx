// Sticky bottom nav pair (D-31 "always-visible save button").
// Provides ← Categories + See results → navigation always visible during questionnaire.

import { Link } from 'react-router-dom'
import type { Result } from '@/lib/storage/types'
import { t } from '@/lib/i18n/i18n'

interface Props { result: Result; profileId: string }

export function QuestionnaireNav({ result, profileId }: Props) {
  return (
    <nav
      className="q-nav sticky bottom-0 z-10 bg-surface border-t border-line px-4 py-2 flex items-center gap-3"
      aria-label="Questionnaire navigation"
    >
      <Link to={`/q-categories/${profileId}/${result.id}`} data-testid="q-nav-categories" className="btn btn-ghost">
        {t('q_back_to_categories')}
      </Link>
      <Link to={`/result/${result.id}`} data-testid="q-nav-see-results" className="btn btn-primary ml-auto">
        {t('q_nav_see_results')} →
      </Link>
    </nav>
  )
}
