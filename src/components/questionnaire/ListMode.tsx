// QUEST-02, QUEST-05, QUEST-07. Port of public/legacy/js/app.js:2151-2240.
// List questionnaire view — renders ONE active category (driven by progress.catIndex)
// as a header (emoji + title + blurb + keyboard tip), 7-chip scale legend, then
// rounded question cards. Legacy parity (quick task 260516-rm2).

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import { RsQuestionCard } from './RsQuestionCard'
import { RsScaleLegend } from './RsScaleLegend'
import { QuestionnaireHeader } from './QuestionnaireHeader'
import { QuestionnaireNav } from './QuestionnaireNav'
import { Button } from '@/components/ui/button'
import { ScaleEditor } from '@/components/ScaleEditor'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import { enabledItemsForCat } from '@/lib/charts/items'
import { dialog } from '@/lib/dialog/dialog'
import { useToast } from '@/lib/hooks/useToast'
import type { Result, Profile } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'
import { localizeStep } from '@/lib/data/locale'
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
  const { base, custom } = enabledItemsForCat(result.answers, cat.id)
  const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
  const catBlurb = lang === 'de' && cat.deBlurb ? cat.deBlurb : cat.blurb

  async function addCustom(catId: string) {
    if (!await confirmIfTemplate()) return

    // Step 1: name
    const name = await dialog<string | null>({
      title: t('q_add_custom_title'),
      body: (close) => {
        let value = ''
        const submit = () => close(value.trim() || null)
        return (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              data-testid="add-custom-input"
              placeholder={t('q_add_custom_placeholder')}
              onChange={(e) => { value = e.target.value }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              className="w-full rounded border border-line px-2 py-1"
            />
            <button
              type="button"
              data-testid="add-custom-ok"
              onClick={submit}
              className="self-end px-3 py-1 rounded bg-accent text-on-accent"
            >
              {t('btn_ok')}
            </button>
          </div>
        )
      },
      actions: [{ label: t('btn_cancel'), kind: 'ghost', value: null }],
    })
    if (!name) return

    const slot = result.answers[catId] ?? {}
    const c = CATEGORIES.find((x) => x.id === catId)
    if ((c ? (c.items as readonly string[]).includes(name) : false) || (slot.__custom ?? {})[name]) {
      toast.message(t('q_item_already_exists'))
      return
    }

    // Step 2: scale selection — dismissable: false so clicking outside doesn't
    // resolve with null (indistinguishable from the "use default" button).
    const itemScale = await dialog<MutableScaleStep[] | null | false>({
      title: t('q_add_custom_scale_title'),
      dismissable: false,
      body: (close) => <ListModeScalePicker defaultScale={scale} onClose={close} />,
      actions: [],
    })
    if (itemScale === false) return

    const next = structuredClone(result)
    const ns = next.answers[catId] ?? {}
    const cell = itemScale ? { scale: 'open', itemScale } : { scale: 'open' }
    ns.__custom = { ...(ns.__custom ?? {}), [name]: cell }
    next.answers[catId] = ns
    saveResult(next)
  }

  return (
    <div data-testid="list-mode" className="flex flex-col">
      <QuestionnaireHeader
        result={result}
        profileId={profile.id}
        activeCat={cat}
        idx={safeIdx}
        total={enabledCats.length}
      />
      <main className="mx-auto w-full max-w-[920px] px-4 py-3">
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
              {custom.map((item) => {
                const slot = result.answers[cat.id] ?? {}
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
                  />
                )
              })}
              <Button variant="ghost" onClick={() => addCustom(cat.id)} data-testid={`add-custom-${cat.id}`}>
                {t('q_add_custom')}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <QuestionnaireNav result={result} profileId={profile.id} activeCat={cat} />
    </div>
  )
}

function ListModeScalePicker({
  defaultScale,
  onClose,
}: {
  defaultScale: MutableScaleStep[]
  onClose: (v: MutableScaleStep[] | null | false) => void
}) {
  const lang = getLang()
  const [customizing, setCustomizing] = useState(false)
  const [customScale, setCustomScale] = useState<MutableScaleStep[]>(() => defaultScale.map((s) => ({ ...s })))

  return (
    <div className="flex flex-col gap-3">
      <p className="muted small">{t('q_add_custom_scale_sub')}</p>
      {!customizing ? (
        <>
          <div className="scale-preview-list">
            {defaultScale.map((s) => {
              const loc = localizeStep(s, lang)
              return (
                <div key={s.key} className="scale-preview-row">
                  <div className="scale-preview-swatch" style={{ background: s.color }} />
                  <span className="scale-preview-label">{loc.label}</span>
                  <span className="scale-preview-short">{loc.short}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => onClose(false)} data-testid="add-custom-scale-cancel">
              {t('btn_cancel')}
            </Button>
            <Button variant="ghost" onClick={() => setCustomizing(true)}>
              {t('q_add_custom_scale_customize')}
            </Button>
            <Button onClick={() => onClose(null)} data-testid="add-custom-scale-default">
              {t('q_add_custom_scale_use_default')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="overflow-y-auto" style={{ maxHeight: '45vh' }}>
            <ScaleEditor scale={customScale} onChange={setCustomScale} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setCustomizing(false); setCustomScale(defaultScale.map((s) => ({ ...s }))) }}>
              {t('btn_back')}
            </Button>
            <Button onClick={() => onClose(customScale)} data-testid="add-custom-scale-confirm">
              {t('btn_ok')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
