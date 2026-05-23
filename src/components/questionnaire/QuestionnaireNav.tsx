// Sticky bottom nav pair (D-31 "always-visible save button").
// Provides ← Categories + (Next category |) See results → navigation always visible during questionnaire.

import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { dialog } from '@/lib/dialog/dialog'
import type { Result } from '@/lib/storage/types'
import type { CATEGORIES } from '@/lib/data/data'
import type { ResolvedCat } from '@/lib/data/customCategories'
import { t } from '@/lib/i18n/i18n'

type Category = (typeof CATEGORIES)[number]
type AnyCell = { scale?: string; scaleFrac?: number; giving?: string; receiving?: string }

/** Returns true when the given category slot has at least one real answer. */
function catHasAnswers(result: Result, catId: string): boolean {
  const slot = result.answers[catId]
  if (!slot) return false
  for (const [k, v] of Object.entries(slot)) {
    if (k === '__hidden' || k === '__custom') continue
    const cell = v as AnyCell | null
    if (cell?.scale || cell?.giving || cell?.receiving) return true
  }
  for (const cell of Object.values(slot.__custom ?? {}) as AnyCell[]) {
    if (cell?.giving || cell?.receiving) return true
    if (cell?.scale && (cell.scale !== 'open' || cell.scaleFrac != null)) return true
  }
  return false
}

interface Props {
  result: Result
  profileId: string
  activeCat?: Category | ResolvedCat
  onNextCat?: (() => void) | undefined
  onPrevCat?: (() => void) | undefined
}

export function QuestionnaireNav({ result, profileId, activeCat, onNextCat, onPrevCat }: Props) {
  const navigate = useNavigate()
  const resultsHref = activeCat
    ? `/result/${result.id}/${activeCat.id}`
    : `/result/${result.id}`

  async function handleResultsClick(e: React.MouseEvent) {
    e.preventDefault()
    if (activeCat && !catHasAnswers(result, activeCat.id)) {
      await dialog<null>({
        title: t('q_nav_see_results') as string,
        body: <p>{t('q_no_answers_for_results')}</p>,
        actions: [{ label: 'OK', kind: 'primary', value: null }],
      })
      return
    }
    navigate(resultsHref)
  }

  return (
    <nav
      className="q-nav shrink-0"
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
        <button
          type="button"
          onClick={(e) => { void handleResultsClick(e) }}
          data-testid="q-nav-see-results"
          className="btn btn-primary ml-auto shrink-0"
        >
          {t('q_nav_see_results')} →
        </button>
      </div>
    </nav>
  )
}
