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
  onPrevCat?: (() => void) | undefined
}

export function QuestionnaireNav({ result, profileId, activeCat, onNextCat, onPrevCat }: Props) {
  const resultsHref = activeCat
    ? `/q-categories/${profileId}/${result.id}?cat=${activeCat.id}`
    : `/q-categories/${profileId}/${result.id}`
  return (
    <nav
      className="q-nav sticky bottom-0 z-10 bg-surface border-t border-line"
      aria-label="Questionnaire navigation"
    >
      <div className="mx-auto w-full max-w-[920px] px-4 py-2 flex items-center gap-2 min-w-0">
        <Button asChild variant="ghost" size="sm" data-testid="q-nav-categories" className="shrink-0">
          <Link to={`/q-categories/${profileId}/${result.id}`}>
            <span className="q-nav-label-long">{t('q_back_to_categories')}</span>
            <span className="q-nav-label-short" aria-hidden>←</span>
          </Link>
        </Button>
        {onPrevCat && (
          <button
            type="button"
            className="btn btn-outline shrink-0"
            onClick={onPrevCat}
            data-testid="q-nav-prev-cat"
          >
            <span className="q-nav-label-long">{t('q_nav_prev_cat')}</span>
            <span className="q-nav-label-short" aria-hidden>‹</span>
          </button>
        )}
        {onNextCat && (
          <button
            type="button"
            className="btn btn-outline shrink-0"
            onClick={onNextCat}
            data-testid="q-nav-next-cat"
          >
            <span className="q-nav-label-long">{t('q_nav_next_cat')}</span>
            <span className="q-nav-label-short" aria-hidden>›</span>
          </button>
        )}
        <Link to={resultsHref} data-testid="q-nav-see-results" className="btn btn-primary ml-auto shrink-0">
          {t('q_nav_see_results')} →
        </Link>
      </div>
    </nav>
  )
}
