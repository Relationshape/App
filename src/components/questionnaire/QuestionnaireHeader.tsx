// Sticky header for ListMode/SingleMode. Ghost ← Categories button,
// optional active-category pip (emoji + title), segmented List/Single
// mode toggle, and a 📊 Results shortcut (legacy parity).

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { Result } from '@/lib/storage/types'
import { useStore } from '@/lib/storage/store'
import { t, getLang } from '@/lib/i18n/i18n'
import { cn } from '@/lib/utils'
import type { CATEGORIES } from '@/lib/data/data'
import type { ResolvedCat } from '@/lib/data/customCategories'

type Category = (typeof CATEGORIES)[number]

interface Props {
  result: Result
  profileId: string
  activeCat?: Category | ResolvedCat
  idx?: number
  total?: number
}

export function QuestionnaireHeader({ result, profileId, activeCat }: Props) {
  const saveResult = useStore((s) => s.saveResult)
  const mode = result.progress?.mode ?? 'list'
  const lang = getLang()

  function setMode(next: 'list' | 'single') {
    saveResult({
      ...result,
      progress: {
        ...result.progress,
        mode: next,
        // Reset item cursor when entering single mode so stale flatIndex from
        // a different category can't trigger the "all done" state immediately.
        ...(next === 'single' ? { flatIndex: 0 } : {}),
      },
    })
  }

  const catTitle = activeCat
    ? (lang === 'de' && activeCat.de ? activeCat.de : activeCat.title)
    : null

  const resultsHref = activeCat
    ? `/result/${result.id}/${activeCat.id}`
    : `/result/${result.id}`

  return (
    <header className="q-header sticky top-0 z-10 bg-surface border-b border-line">
      <div className="mx-auto w-full max-w-[920px] px-4 py-2 flex items-center gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm" data-testid="q-back-to-categories">
          <Link to={`/q-categories/${profileId}/${result.id}`}>
            {t('q_back_to_categories')}
          </Link>
        </Button>
        {activeCat && (
          <span
            className="q-cat-pip"
            style={{ ['--c' as string]: activeCat.color } as React.CSSProperties}
            data-testid="q-active-cat-pip"
          >
            <span aria-hidden>{activeCat.icon}</span> {catTitle}
          </span>
        )}
        <div
          role="group"
          aria-label={t('q_mode_list') + ' / ' + t('q_mode_single')}
          className="q-mode-switch ml-auto"
          data-testid="q-mode-tabs"
        >
          {(['list', 'single'] as const).map((m) => {
            const on = mode === m
            return (
              <button
                key={m}
                type="button"
                className={cn('btn', on && 'is-active')}
                aria-pressed={on}
                onClick={() => setMode(m)}
                data-testid={`q-mode-${m}`}
              >
                {t(m === 'list' ? 'q_mode_list' : 'q_mode_single')}
              </button>
            )
          })}
        </div>
        <Button asChild variant="ghost" size="sm" data-testid="q-results-shortcut">
          <Link to={resultsHref}>{t('btn_results')}</Link>
        </Button>
      </div>
    </header>
  )
}
