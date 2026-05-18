// QUEST-03, QUEST-04 partial. Port of public/legacy/js/app.js:2450-2698.
// Single-card questionnaire view, filtered to the active category
// (driven by progress.catIndex). Hero-card layout for legacy parity
// (.q-card / .q-card-cat / .q-card-item / .q-card-slider / .q-card-note /
// .q-card-actions / .q-card-progress). Quick task 260516-w94.

import { useReducer, useMemo, useState, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { useStore } from '@/lib/storage/store'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import { useKeydown } from '@/lib/hooks/useKeydown'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'
import { useIsCoarsePointer } from '@/lib/hooks/useIsCoarsePointer'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScalePicker } from '@/components/ScalePicker'
import { ScaleEditor } from '@/components/ScaleEditor'
import type { MutableScaleStep } from '@/lib/data/types'
import { QuestionnaireHeader } from './QuestionnaireHeader'
import { QuestionnaireNav } from './QuestionnaireNav'
import { enabledItemsForCat, type FlatItem } from '@/lib/charts/items'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import { getItemLabel } from '@/lib/data/locale'
import type { Result, Profile, AnswerCell } from '@/lib/storage/types'
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
  const enabledCats = useMemo(() => (
    (result.enabledCategories ?? CATEGORIES.map((c) => c.id))
      .map((cid) => resolveAnyCat(cid, result.customCategories, profile.customCategories))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
  ), [result.enabledCategories, result.customCategories, profile.customCategories])

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
  const [pendingLabel, setPendingLabel] = useState('')
  const [pendingScale, setPendingScale] = useState<MutableScaleStep[] | null>(null)
  const [dragX, setDragX] = useState(0)
  const [swipeClass, setSwipeClass] = useState<string | null>(null)
  const swipingRef = useRef(false)

  const cur = items[state.cursor]
  const isDone = state.cursor >= items.length

  async function advance(delta: 1 | -1, dir: Dir) {
    if (!await confirmIfTemplate()) return
    const newCursor = Math.max(0, Math.min(items.length, state.cursor + delta))
    saveResult({ ...result, progress: { ...result.progress, mode: 'single', flatIndex: newCursor } })
    if (delta > 0) dispatch({ type: 'next', dir })
    else dispatch({ type: 'prev' })
  }

  const bind = useDrag(
    ({ movement: [mx], last }) => {
      if (swipingRef.current) return
      if (!last) {
        if (!reduced) setDragX(mx)
        return
      }
      setDragX(0)
      const threshold = 40
      if (reduced) {
        if (mx < -threshold) void advance(+1, 'left')
        else if (mx > threshold) void advance(-1, 'right')
        return
      }
      if (mx < -threshold) {
        swipingRef.current = true
        setSwipeClass('swipe-left')
        setTimeout(() => {
          setSwipeClass(null)
          swipingRef.current = false
          void advance(+1, 'left')
        }, 180)
      } else if (mx > threshold) {
        swipingRef.current = true
        setSwipeClass('swipe-right')
        setTimeout(() => {
          setSwipeClass(null)
          swipingRef.current = false
          void advance(-1, 'right')
        }, 180)
      }
    },
    { axis: 'x', pointer: { touch: true }, filterTaps: true, rubberband: reduced ? 0 : 0.15 },
  )

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

  const cell: AnswerCell | undefined = cur.isCustom
    ? result.answers[cur.catId]?.__custom?.[cur.item]
    : result.answers[cur.catId]?.[cur.item]
  async function setScaleKey(key: string, frac: number) {
    if (!cur) return
    if (!(await confirmIfTemplate())) return
    const next = structuredClone(result)
    const slot = next.answers[cur.catId] ?? {}
    if (cur.isCustom) {
      const customs = slot.__custom ?? {}
      customs[cur.item] = { ...(customs[cur.item] ?? {}), scale: key, scaleFrac: frac } as AnswerCell
      slot.__custom = customs
    } else {
      slot[cur.item] = { ...(slot[cur.item] ?? {}), scale: key, scaleFrac: frac } as AnswerCell
    }
    next.answers[cur.catId] = slot
    saveResult(next)
  }

  async function clearAnswer() {
    if (!cur) return
    if (!(await confirmIfTemplate())) return
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

  async function setNoteValue(value: string) {
    if (!cur) return
    if (value === (cell?.note ?? '')) return
    if (!(await confirmIfTemplate())) return
    const next = structuredClone(result)
    const slot = next.answers[cur.catId] ?? {}
    if (cur.isCustom) {
      const customs = slot.__custom ?? {}
      customs[cur.item] = { ...(customs[cur.item] ?? { scale: 'open' }), note: value } as AnswerCell
      slot.__custom = customs
    } else {
      slot[cur.item] = { ...(slot[cur.item] ?? { scale: 'open' }), note: value } as AnswerCell
    }
    next.answers[cur.catId] = slot
    saveResult(next)
  }

  function openEditScaleDialog() {
    setPendingLabel(cell?.customLabel ?? '')
    setPendingScale(cell?.itemScale ? cell.itemScale.map((s) => ({ ...s })) : null)
    setEditScaleOpen(true)
  }

  async function saveItemEdit() {
    if (!cur) return
    if (!(await confirmIfTemplate())) return
    const next = structuredClone(result)
    const slot = next.answers[cur.catId] ?? {}
    function patchCell(existing: AnswerCell | undefined): AnswerCell {
      const c: AnswerCell = existing ? { ...existing } : { scale: 'open' }
      const label = pendingLabel.trim()
      if (label) c.customLabel = label; else delete c.customLabel
      if (pendingScale) c.itemScale = pendingScale; else delete c.itemScale
      return c
    }
    if (cur.isCustom) {
      slot.__custom = { ...(slot.__custom ?? {}), [cur.item]: patchCell(slot.__custom?.[cur.item]) }
    } else {
      slot[cur.item] = patchCell(slot[cur.item])
    }
    next.answers[cur.catId] = slot
    saveResult(next)
    setEditScaleOpen(false)
  }

  const cardStyle = { ['--c' as string]: cat.color } as React.CSSProperties

  return (
    <div data-testid="single-mode" className="flex flex-col min-h-screen">
      <QuestionnaireHeader
        result={result}
        profileId={profile.id}
        activeCat={cat}
        idx={state.cursor}
        total={items.length}
      />
      <section className="page q-page q-single-page mx-auto w-full">
        <p className="q-nav-hint muted small">
          {coarse ? t('q_single_hint_mobile') : t('q_single_hint_desktop')}
        </p>
        <div className="q-stack">
          <article
            className={`q-card in single-card${swipeClass ? ` ${swipeClass}` : dragX !== 0 ? ' dragging' : ''}`}
            data-state={reduced ? undefined : `entering-${state.dir}`}
            data-testid="single-card"
            style={{
              ...cardStyle,
              touchAction: 'pan-y',
              ...(dragX !== 0 && !reduced
                ? { transform: `translate(${dragX}px) rotate(${dragX * 0.03}deg)` }
                : {}),
            } as React.CSSProperties}
            {...bind()}
          >
            <div className="q-card-cat">
              {cur.isCustom && <span className="q-item-tag">{t('custom_tag')}</span>}
              <Button
                variant="ghost"
                size="sm"
                className="item-scale-btn"
                onClick={openEditScaleDialog}
                data-testid={`item-edit-scale-${cur.catId}-${cur.item}`}
              >
                {t('item_edit_scale')}
              </Button>
            </div>
            <h1 className="q-card-item">{cell?.customLabel || (cur.isCustom ? cur.item : getItemLabel(cur.catId, cur.item, getLang()))}</h1>
            <div className="q-card-slider">
              <ScalePicker
                scale={cell?.itemScale ?? scale}
                value={cell?.scale ?? null}
                valueFrac={cell?.scaleFrac ?? null}
                onChange={setScaleKey}
                onClear={clearAnswer}
              />
            </div>
            <input
              type="text"
              className="q-card-note"
              placeholder={t('note_placeholder')}
              defaultValue={cell?.note ?? ''}
              onBlur={(e) => { void setNoteValue(e.currentTarget.value) }}
              data-testid={`single-note-${cur.catId}-${cur.item}`}
            />
            <div className="q-card-actions">
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
            <div className="q-card-progress" data-testid="single-progress">
              {state.cursor + 1} / {items.length}
            </div>
          </article>
        </div>
        {editScaleOpen && (
          <Dialog open={true} onOpenChange={setEditScaleOpen}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('q_edit_item_scale')}: {cur.isCustom ? cur.item : getItemLabel(cur.catId, cur.item, getLang())}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{t('q_item_rename_label')}</span>
                  <input
                    type="text"
                    className="rounded border border-line px-2 py-1"
                    placeholder={cur.item}
                    value={pendingLabel}
                    onChange={(e) => setPendingLabel(e.target.value)}
                    data-testid="item-edit-label"
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <p className="muted text-sm">{t('q_edit_item_scale_warning')}</p>
                  <ScaleEditor
                    key={`${cur.catId}-${cur.item}`}
                    scale={pendingScale ?? scale}
                    onChange={setPendingScale}
                  />
                  {pendingScale && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start"
                      onClick={() => setPendingScale(null)}
                      data-testid="item-scale-reset"
                    >
                      {t('q_item_scale_reset')}
                    </Button>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditScaleOpen(false)}>{t('btn_cancel')}</Button>
                <Button onClick={() => { void saveItemEdit() }} data-testid="item-edit-save">{t('btn_save_changes')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </section>
      <QuestionnaireNav result={result} profileId={profile.id} activeCat={cat} />
    </div>
  )
}
