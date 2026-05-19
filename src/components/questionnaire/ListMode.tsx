// QUEST-02, QUEST-05, QUEST-07. Port of public/legacy/js/app.js:2151-2240.
// List questionnaire view — renders ONE active category (driven by progress.catIndex)
// as a header (emoji + title + blurb + keyboard tip), 7-chip scale legend, then
// rounded question cards. Legacy parity (quick task 260516-rm2).

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import { RsQuestionCard } from './RsQuestionCard'
import { RsScaleLegend } from './RsScaleLegend'
import { QuestionnaireHeader } from './QuestionnaireHeader'
import { QuestionnaireNav } from './QuestionnaireNav'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import { enabledItemsForCat } from '@/lib/charts/items'
import { runAddCustomItemFlow } from './addCustomItemFlow'
import { useToast } from '@/lib/hooks/useToast'
import type { Result, Profile } from '@/lib/storage/types'
import { t, getLang } from '@/lib/i18n/i18n'

interface Props { result: Result; profile: Profile }

export function ListMode({ result, profile }: Props) {
  const saveResult = useStore((s) => s.saveResult)
  const storeScale = useStore((s) => s.scale)
  const scale = result.scale ?? storeScale
  const { confirmIfTemplate } = useTemplateWarning(result)
  const { toast } = useToast()
  const lang = getLang()
  const navigate = useNavigate()

  const enabledCats = (result.enabledCategories ?? CATEGORIES.map((c) => c.id))
    .map((cid) => resolveAnyCat(cid, result.customCategories, profile.customCategories))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  useEffect(() => {
    if (!enabledCats.length) {
      navigate(`/result/${result.id}`)
    }
  }, [enabledCats.length, navigate, result.id])

  if (!enabledCats.length) return null

  const safeIdx = Math.min(Math.max(0, result.progress?.catIndex ?? 0), enabledCats.length - 1)
  const cat = enabledCats[safeIdx]!
  const hasNextCat = safeIdx + 1 < enabledCats.length
  const hasPrevCat = safeIdx > 0

  function goToNextCat() {
    saveResult({
      ...result,
      progress: { ...(result.progress ?? { mode: 'list' }), catIndex: safeIdx + 1 },
    })
  }

  function goToPrevCat() {
    saveResult({
      ...result,
      progress: { ...(result.progress ?? { mode: 'list' }), catIndex: safeIdx - 1 },
    })
  }
  const { base, custom } = enabledItemsForCat(result.answers, cat.id)
  const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
  const catBlurb = lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb

  const [autoOpenItem, setAutoOpenItem] = useState<string | null>(null)

  async function addCustom(catId: string) {
    if (!await confirmIfTemplate()) return
    const createdName = await runAddCustomItemFlow({
      result,
      catId,
      scale,
      onDuplicate: () => toast.message(t('q_item_already_exists')),
      onSave: saveResult,
    })
    if (createdName) setAutoOpenItem(createdName)
  }

  return (
    <div data-testid="list-mode" className="flex flex-col h-[100dvh]">
      <QuestionnaireHeader
        result={result}
        profileId={profile.id}
        activeCat={cat}
        idx={safeIdx}
        total={enabledCats.length}
      />
      <main className="flex-1 overflow-y-auto mx-auto w-full max-w-[920px] px-4 py-3">
        <section
          className="q-cat"
          style={{ ['--c' as string]: cat.color } as React.CSSProperties}
          data-testid="q-active-cat"
          data-cat-id={cat.id}
        >
          {/* Legacy parity: preserve the old per-category section testid alongside the new one */}
          <div data-testid={`q-cat-${cat.id}`} className="contents">
            <div className="q-cat-head">
              <span className="q-cat-icon" aria-hidden>{cat.icon}</span>
              <div>
                <h1>{catTitle}</h1>
                <p className="muted">{catBlurb}</p>
                <p className="muted small">{t('q_keyboard_tip', { n: scale.length, m: scale.length + 1 })}</p>
              </div>
            </div>
            <RsScaleLegend scale={scale} />
            <div className="q-items">
              <Button variant="outline" className="add-custom-btn" onClick={() => addCustom(cat.id)} data-testid={`add-custom-${cat.id}`}>
                {t('q_add_custom')}
              </Button>
              {custom.map((item) => {
                const slot = result.answers[cat.id] ?? {}
                const customItemDef = result.customItemDefs?.[cat.id]?.[item]
                return (
                  <RsQuestionCard
                    key={`custom-${item}`}
                    result={result}
                    catId={cat.id}
                    item={item}
                    isCustom={true}
                    cell={slot.__custom?.[item]}
                    scale={scale}
                    onBeforeMutate={confirmIfTemplate}
                    variant="list"
                    {...(customItemDef !== undefined ? { customItemDef } : {})}
                    autoOpenEdit={autoOpenItem === item}
                    onAutoOpenDone={() => setAutoOpenItem(null)}
                  />
                )
              })}
              {base.map((item) => {
                const slot = result.answers[cat.id] ?? {}
                return (
                  <RsQuestionCard
                    key={item}
                    result={result}
                    catId={cat.id}
                    item={item}
                    isCustom={false}
                    cell={slot[item]}
                    scale={scale}
                    onBeforeMutate={confirmIfTemplate}
                    variant="list"
                  />
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <QuestionnaireNav
        result={result}
        profileId={profile.id}
        activeCat={cat}
        onPrevCat={hasPrevCat ? goToPrevCat : undefined}
        onNextCat={hasNextCat ? goToNextCat : undefined}
      />
    </div>
  )
}
