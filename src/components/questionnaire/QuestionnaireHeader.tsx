// Sticky header for ListMode/SingleMode. Ghost back button + segmented
// emoji-labelled mode toggle (legacy q-mode-switch styling).

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { Result } from '@/lib/storage/types'
import { useStore } from '@/lib/storage/store'
import { t } from '@/lib/i18n/i18n'
import { cn } from '@/lib/utils'

interface Props { result: Result; profileId: string }

export function QuestionnaireHeader({ result, profileId }: Props) {
  const saveResult = useStore((s) => s.saveResult)
  const mode = result.progress?.mode ?? 'list'

  function setMode(next: 'list' | 'single') {
    saveResult({ ...result, progress: { ...result.progress, mode: next } })
  }

  return (
    <header className="q-header sticky top-0 z-10 bg-surface border-b border-line">
      <div className="mx-auto w-full max-w-[920px] px-4 py-2 flex items-center gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm" data-testid="q-back-to-categories">
          <Link to={`/q-categories/${profileId}/${result.id}`}>
            {t('q_back_to_categories')}
          </Link>
        </Button>
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
      </div>
    </header>
  )
}
