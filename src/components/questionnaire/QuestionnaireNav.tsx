// Sticky bottom nav pair (D-31 "always-visible save button").
// Provides ← Categories + (Next category |) See results → navigation always visible during questionnaire.

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { Result } from '@/lib/storage/types'
import type { CATEGORIES } from '@/lib/data/data'
import type { ResolvedCat } from '@/lib/data/customCategories'
import { t } from '@/lib/i18n/i18n'

type Category = (typeof CATEGORIES)[number]

interface Props {
  result: Result
  profileId: string
  activeCat?: Category | ResolvedCat
  onNextCat?: (() => void) | undefined
}

export function QuestionnaireNav({ result, profileId, activeCat, onNextCat }: Props) {
  const resultsHref = activeCat
    ? `/result/${result.id}/${activeCat.id}`
    : `/result/${result.id}`
  return (
    <nav
      className="q-nav sticky bottom-0 z-10 bg-surface border-t border-line"
      aria-label="Questionnaire navigation"
    >
      <div className="mx-auto w-full max-w-[920px] px-4 py-2 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" data-testid="q-nav-categories">
          <Link to={`/q-categories/${profileId}/${result.id}`}>
            {t('q_back_to_categories')}
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {onNextCat && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={onNextCat}
              data-testid="q-nav-next-cat"
            >
              {t('q_nav_next_cat')}
            </button>
          )}
          <Link to={resultsHref} data-testid="q-nav-see-results" className="btn btn-primary">
            {t('q_nav_see_results')} →
          </Link>
        </div>
      </div>
    </nav>
  )
}
