// Sticky header for ListMode/SingleMode. Mode toggle + back-to-overview.

import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Result } from '@/lib/storage/types'
import { useStore } from '@/lib/storage/store'
import { t } from '@/lib/i18n/i18n'

interface Props { result: Result; profileId: string }

export function QuestionnaireHeader({ result, profileId }: Props) {
  const saveResult = useStore((s) => s.saveResult)
  const mode = result.progress?.mode ?? 'list'
  return (
    <header className="q-header sticky top-0 z-10 bg-surface border-b border-line px-4 py-2 flex items-center gap-3">
      <Link to={`/q-categories/${profileId}/${result.id}`} data-testid="q-back-to-categories">
        {t('q_back_to_categories')}
      </Link>
      <Tabs
        value={mode}
        onValueChange={(v) => saveResult({ ...result, progress: { ...result.progress, mode: v as 'list' | 'single' } })}
        data-testid="q-mode-tabs"
      >
        <TabsList>
          <TabsTrigger value="list" data-testid="q-mode-list">{t('q_mode_list')}</TabsTrigger>
          <TabsTrigger value="single" data-testid="q-mode-single">{t('q_mode_single')}</TabsTrigger>
        </TabsList>
      </Tabs>
    </header>
  )
}
