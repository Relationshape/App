// QUEST-02, QUEST-05, QUEST-07. Port of public/legacy/js/app.js:2151-2240.
// List questionnaire view — renders all enabled categories as rows of ItemRows.

import { useStore } from '@/lib/storage/store'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import { ItemRow } from './ItemRow'
import { QuestionnaireHeader } from './QuestionnaireHeader'
import { QuestionnaireNav } from './QuestionnaireNav'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/data/data'
import { enabledItemsForCat } from '@/lib/charts/items'
import { dialog } from '@/lib/dialog/dialog'
import { useToast } from '@/lib/hooks/useToast'
import type { Result, Profile } from '@/lib/storage/types'
import { t, getLang } from '@/lib/i18n/i18n'

interface Props { result: Result; profile: Profile }

export function ListMode({ result, profile }: Props) {
  const saveResult = useStore((s) => s.saveResult)
  const { confirmIfTemplate } = useTemplateWarning(result)
  const { toast } = useToast()
  const lang = getLang()

  const enabledCats = (result.enabledCategories ?? CATEGORIES.map((c) => c.id))
    .map((cid) => CATEGORIES.find((c) => c.id === cid))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  async function addCustom(catId: string) {
    if (!await confirmIfTemplate()) return
    const name = await dialog<string | null>({
      title: t('q_add_custom_title'),
      body: (close) => {
        let value = ''
        return (
          <input
            autoFocus
            data-testid="add-custom-input"
            placeholder={t('q_add_custom_placeholder')}
            onChange={(e) => { value = e.target.value }}
            onKeyDown={(e) => { if (e.key === 'Enter') close(value.trim() || null) }}
            className="w-full rounded border border-line px-2 py-1"
          />
        )
      },
      actions: [
        { label: t('btn_cancel'), kind: 'ghost', value: null },
        { label: t('btn_ok'), kind: 'primary', value: '__placeholder__' },
      ],
    })
    if (!name || name === '__placeholder__') return
    const slot = result.answers[catId] ?? {}
    const cat = CATEGORIES.find((c) => c.id === catId)!
    // Duplicate-id guard (CONCERNS Pitfall 4 — port of public/legacy/js/app.js:2207)
    if ((cat.items as readonly string[]).includes(name) || (slot.__custom ?? {})[name]) {
      toast.message(t('q_item_already_exists'))
      return
    }
    const next = structuredClone(result)
    const ns = next.answers[catId] ?? {}
    ns.__custom = { ...(ns.__custom ?? {}), [name]: { scale: 'open' } }
    next.answers[catId] = ns
    saveResult(next)
  }

  return (
    <div data-testid="list-mode" className="flex flex-col">
      <QuestionnaireHeader result={result} profileId={profile.id} />
      <main className="px-4 py-3">
        {enabledCats.map((cat) => {
          const { base, custom } = enabledItemsForCat(result.answers, cat.id)
          const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
          return (
            <section key={cat.id} className="q-cat-section mb-6" data-testid={`q-cat-${cat.id}`}>
              <header className="flex items-center gap-2 mb-2">
                <span aria-hidden>{cat.icon}</span>
                <h2>{catTitle}</h2>
              </header>
              <div className="q-items">
                {base.map((item) => {
                  const slot = result.answers[cat.id] ?? {}
                  return (
                    <ItemRow
                      key={item}
                      result={result}
                      catId={cat.id}
                      item={item}
                      isCustom={false}
                      cell={slot[item]}
                      onBeforeMutate={confirmIfTemplate}
                    />
                  )
                })}
                {custom.map((item) => {
                  const slot = result.answers[cat.id] ?? {}
                  return (
                    <ItemRow
                      key={`custom-${item}`}
                      result={result}
                      catId={cat.id}
                      item={item}
                      isCustom={true}
                      cell={slot.__custom?.[item]}
                      onBeforeMutate={confirmIfTemplate}
                    />
                  )
                })}
                <Button variant="ghost" onClick={() => addCustom(cat.id)} data-testid={`add-custom-${cat.id}`}>
                  {t('q_add_custom')}
                </Button>
              </div>
            </section>
          )
        })}
      </main>
      <QuestionnaireNav result={result} profileId={profile.id} />
    </div>
  )
}
