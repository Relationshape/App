// QUEST-03, QUEST-04 partial. Port of public/legacy/js/app.js:2450-2700.
// Single-card questionnaire view, filtered to the active category
// (driven by progress.catIndex) — legacy parity (quick task 260516-rm2).

import { useReducer, useMemo, useState } from 'react'
import { useStore } from '@/lib/storage/store'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import { useSwipe } from '@/lib/hooks/useSwipe'
import { useKeydown } from '@/lib/hooks/useKeydown'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'
import { useIsCoarsePointer } from '@/lib/hooks/useIsCoarsePointer'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QuestionnaireHeader } from './QuestionnaireHeader'
import { QuestionnaireNav } from './QuestionnaireNav'
import { RsQuestionCard } from './RsQuestionCard'
import { RsScaleLegend } from './RsScaleLegend'
import { enabledItemsForCat, type FlatItem } from '@/lib/charts/items'
import { CATEGORIES } from '@/lib/data/data'
import type { Result, Profile } from '@/lib/storage/types'
import { t, getLang } from '@/lib/i18n/i18n'

type Dir = 'left' | 'right'
interface State { cursor: number; dir: Dir }
type Action = { type: 'next'; dir: Dir } | { type: 'prev' } | { type: 'set'; cursor: number }
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next': return { cursor: state.cursor + 1, dir: action.dir }
    case 'prev': return { cursor: Math.max(0, state.cursor - 1), dir: 'right' }
    case 'set': return { cursor: action.cursor, dir: 'right' }
  }
}

interface Props { result: Result; profile: Profile }

export function SingleMode({ result, profile }: Props) {
  const saveResult = useStore((s) => s.saveResult)
  const storeScale = useStore((s) => s.scale)
  const scale = result.scale ?? storeScale
  const { confirmIfTemplate } = useTemplateWarning(result)
  const reduced = useReducedMotion()
  const coarse = useIsCoarsePointer()
  const lang = getLang()

  const enabledCats = useMemo(() => (
    (result.enabledCategories ?? CATEGORIES.map((c) => c.id))
      .map((cid) => CATEGORIES.find((c) => c.id === cid))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
  ), [result.enabledCategories])

  const safeIdx = Math.min(Math.max(0, result.progress?.catIndex ?? 0), Math.max(0, enabledCats.length - 1))
  const cat = enabledCats[safeIdx]

  const items = useMemo<FlatItem[]>(() => {
    if (!cat) return []
    const { base, custom } = enabledItemsForCat(result.answers, cat.id)
    return [
      ...base.map((item) => ({ catId: cat.id, item, isCustom: false })),
      ...custom.map((item) => ({ catId: cat.id, item, isCustom: true })),
    ]
  }, [cat, result.answers])

  const initial = result.progress?.flatIndex ?? 0
  const [state, dispatch] = useReducer(reducer, { cursor: initial, dir: 'right' as Dir })
  const [editScaleOpen, setEditScaleOpen] = useState(false)

  const cur = items[state.cursor]
  const peekNext = items[state.cursor + 1]
  const isDone = state.cursor >= items.length

  async function advance(delta: 1 | -1, dir: Dir) {
    if (!await confirmIfTemplate()) return
    const newCursor = Math.max(0, Math.min(items.length, state.cursor + delta))
    saveResult({ ...result, progress: { ...result.progress, mode: 'single', flatIndex: newCursor } })
    if (delta > 0) dispatch({ type: 'next', dir })
    else dispatch({ type: 'prev' })
  }

  const bind = useSwipe({
    onLeft: () => { void advance(+1, 'left') },
    onRight: () => { void advance(-1, 'right') },
    threshold: 40,
  })

  const keyHandlers = useMemo(() => ({
    ArrowRight: () => { void advance(+1, 'right') },
    ArrowLeft: () => { void advance(-1, 'left') },
    ' ': () => { void advance(+1, 'left') },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state.cursor, result, items])

  useKeydown(keyHandlers, !isDone)

  if (!cat) {
    return (
      <div data-testid="single-mode-empty" className="p-8 text-center">
        <p className="muted">{t('q_done_title')}</p>
        <QuestionnaireNav result={result} profileId={profile.id} />
      </div>
    )
  }

  if (isDone) {
    return (
      <div data-testid="single-mode-done" className="p-8 text-center">
        <h2>{t('q_done_title')}</h2>
        <QuestionnaireNav result={result} profileId={profile.id} activeCat={cat} />
      </div>
    )
  }
  if (!cur) return null

  const cell = cur.isCustom
    ? result.answers[cur.catId]?.__custom?.[cur.item]
    : result.answers[cur.catId]?.[cur.item]
  const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
  const catBlurb = lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb

  return (
    <div data-testid="single-mode" className="flex flex-col min-h-screen">
      <QuestionnaireHeader
        result={result}
        profileId={profile.id}
        activeCat={cat}
        idx={state.cursor}
        total={items.length}
      />
      <main className="mx-auto w-full max-w-[640px] px-4 py-3 relative">
        <div className="q-cat-head mb-3" style={{ ['--c' as string]: cat.color } as React.CSSProperties}>
          <span className="q-cat-icon" aria-hidden>{cat.icon}</span>
          <div>
            <h1>{catTitle}</h1>
            <p className="muted">{catBlurb}</p>
          </div>
        </div>
        <RsScaleLegend scale={scale} />
        {peekNext && !reduced && (
          <div className="card peek" aria-hidden data-testid="single-peek" style={{ opacity: 0.5 }}>
            <h3>{peekNext.item}</h3>
          </div>
        )}
        <div
          className="card single-card relative"
          data-state={reduced ? undefined : `entering-${state.dir}`}
          data-testid="single-card"
          {...bind()}
          style={{ touchAction: 'pan-y', position: 'relative' }}
        >
          <div className="q-card-progress" data-testid="single-progress">
            {state.cursor + 1} / {items.length}
          </div>
          <RsQuestionCard
            result={result}
            catId={cur.catId}
            item={cur.item}
            isCustom={cur.isCustom}
            cell={cell}
            scale={scale}
            onBeforeMutate={confirmIfTemplate}
            onEditItemScale={() => setEditScaleOpen(true)}
            variant="single"
          />
          <div className="q-card-actions mt-3">
            <Button
              variant="ghost"
              disabled={state.cursor === 0}
              onClick={() => { void advance(-1, 'right') }}
              data-testid="single-back"
            >
              {t('btn_previous')}
            </Button>
            <Button
              onClick={() => { void advance(+1, 'left') }}
              data-testid="single-next"
            >
              {t('btn_next')}
            </Button>
          </div>
          <p className="text-text-muted small mt-2">
            {coarse ? t('q_single_hint_mobile') : t('q_single_hint_desktop')}
          </p>
        </div>
        {editScaleOpen && (
          <Dialog open={true} onOpenChange={setEditScaleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('q_edit_item_scale')}</DialogTitle>
              </DialogHeader>
              <p className="muted">{t('q_edit_item_scale_warning')}</p>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditScaleOpen(false)}>{t('btn_cancel')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
      <QuestionnaireNav result={result} profileId={profile.id} activeCat={cat} />
    </div>
  )
}
