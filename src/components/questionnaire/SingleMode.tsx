// QUEST-03, QUEST-04 partial. Port of public/legacy/js/app.js:2450-2700. Pattern 8 in 02-RESEARCH.md.
// Single-card swipe-mode questionnaire view.

import { useReducer, useMemo, useState } from 'react'
import { useStore } from '@/lib/storage/store'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import { useSwipe } from '@/lib/hooks/useSwipe'
import { useKeydown } from '@/lib/hooks/useKeydown'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'
import { useIsCoarsePointer } from '@/lib/hooks/useIsCoarsePointer'
import { ScalePicker } from '@/components/ScalePicker'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QuestionnaireHeader } from './QuestionnaireHeader'
import { QuestionnaireNav } from './QuestionnaireNav'
import { flatItemsForResult } from '@/lib/charts/items'
import { CATEGORIES } from '@/lib/data/data'
import type { Result, Profile } from '@/lib/storage/types'
import { t } from '@/lib/i18n/i18n'

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
  const items = useMemo(() => flatItemsForResult(result), [result])
  const initial = result.progress?.flatIndex ?? 0
  const [state, dispatch] = useReducer(reducer, { cursor: initial, dir: 'right' as Dir })
  const [editScaleOpen, setEditScaleOpen] = useState(false)

  const cur = items[state.cursor]
  const peekNext = items[state.cursor + 1]
  const isDone = state.cursor >= items.length

  async function advance(delta: 1 | -1, dir: Dir) {
    if (!await confirmIfTemplate()) return
    // Persist progress
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
    ' ': () => { void advance(+1, 'left') },  // skip
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state.cursor, result, items])

  useKeydown(keyHandlers, !isDone)

  async function setAnswer(key: string, frac: number) {
    if (!cur) return
    if (!await confirmIfTemplate()) return
    const next = structuredClone(result)
    const slot = next.answers[cur.catId] ?? {}
    if (cur.isCustom) {
      const customs = slot.__custom ?? {}
      customs[cur.item] = { ...(customs[cur.item] ?? {}), scale: key, scaleFrac: frac }
      slot.__custom = customs
    } else {
      slot[cur.item] = { ...(slot[cur.item] ?? {}), scale: key, scaleFrac: frac }
    }
    next.answers[cur.catId] = slot
    saveResult(next)
  }

  async function clearAnswer() {
    if (!cur) return
    if (!await confirmIfTemplate()) return
    const next = structuredClone(result)
    const slot = next.answers[cur.catId] ?? {}
    if (cur.isCustom) {
      const customs = { ...(slot.__custom ?? {}) }
      delete customs[cur.item]
      slot.__custom = customs
    } else {
      delete slot[cur.item]
    }
    next.answers[cur.catId] = slot
    saveResult(next)
  }

  if (isDone) {
    return (
      <div data-testid="single-mode-done" className="p-8 text-center">
        <h2>{t('q_done_title')}</h2>
        <QuestionnaireNav result={result} profileId={profile.id} />
      </div>
    )
  }
  if (!cur) return null
  const cat = CATEGORIES.find((c) => c.id === cur.catId)
  const cell = cur.isCustom
    ? result.answers[cur.catId]?.__custom?.[cur.item]
    : result.answers[cur.catId]?.[cur.item]

  return (
    <div data-testid="single-mode" className="flex flex-col min-h-screen">
      <QuestionnaireHeader result={result} profileId={profile.id} />
      <main className="mx-auto w-full max-w-[560px] px-4 py-3 relative">
        {peekNext && !reduced && (
          <div className="card peek" aria-hidden data-testid="single-peek" style={{ opacity: 0.5 }}>
            <h3>{peekNext.item}</h3>
          </div>
        )}
        <div
          className="card single-card"
          data-state={reduced ? undefined : `entering-${state.dir}`}
          data-testid="single-card"
          {...bind()}
          style={{ touchAction: 'pan-y' }}
        >
          <div className="muted small">{cat?.icon} {cat?.title}</div>
          <h1>{cur.item}</h1>
          <ScalePicker
            scale={scale}
            value={cell?.scale ?? null}
            valueFrac={cell?.scaleFrac ?? null}
            onChange={setAnswer}
            onClear={clearAnswer}
          />
          <Button variant="ghost" onClick={() => setEditScaleOpen(true)} data-testid="single-edit-scale">
            {t('q_edit_item_scale')}
          </Button>
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
              {/* Future: per-item scale override editor (D-33). v1.0 shows a scale editor inline. */}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditScaleOpen(false)}>{t('btn_cancel')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
      <QuestionnaireNav result={result} profileId={profile.id} />
    </div>
  )
}
