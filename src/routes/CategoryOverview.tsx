// QUEST-01. Port of public/legacy/js/app.js:1622-1690.
// Category overview tile grid for the active enabledCategories list. Tile click
// jumps into the questionnaire at that category (legacy behaviour); category
// selection is managed through the modal RsCategoryPicker (quick task 260516-qva).

import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { CATEGORIES } from '@/lib/data/data'
import { catProgress } from '@/lib/charts/math'
import { Button } from '@/components/ui/button'
import { RsTile } from '@/components/RsTile'
import { RsCategoryPicker } from '@/components/RsCategoryPicker'
import { t, getLang } from '@/lib/i18n/i18n'

export function CategoryOverview() {
  const { profileId, resultId } = useParams<{ profileId: string; resultId: string }>()
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const allResults = useStore((s) => s.results)
  const saveResult = useStore((s) => s.saveResult)
  const lang = getLang()
  const [pickerOpen, setPickerOpen] = useState(false)

  const profile = profileId ? profiles.find((p) => p.id === profileId) ?? null : null
  const result = allResults.find((r) => r.id === resultId) ?? null

  // All hooks MUST be declared before any early returns (Rules of Hooks).
  // Otherwise the new-result path renders 2 hooks on the first pass and 3 on the next,
  // crashing with "Rendered more hooks than during the previous render".
  useEffect(() => {
    if (resultId !== 'new' || !profile) return
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `r-${Date.now()}`
    saveResult({
      id,
      profileId: profile.id,
      subject: profile.name,
      subjectColor: profile.color,
      subjectEmoji: profile.emoji,
      answers: {},
      enabledCategories: CATEGORIES.map((c) => c.id),
      progress: { mode: 'list' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    navigate(`/q-categories/${profile.id}/${id}`, { replace: true })
  }, [resultId, profile, saveResult, navigate])

  useEffect(() => {
    if (!profile) navigate('/')
  }, [profile, navigate])

  useEffect(() => {
    if (profile && !result && resultId !== 'new') navigate(`/profile/${profile.id}`)
  }, [result, resultId, profile, navigate])

  const enabledIds = useMemo(
    () => result?.enabledCategories ?? CATEGORIES.map((c) => c.id),
    [result?.enabledCategories],
  )
  const enabledCats = useMemo(
    () =>
      enabledIds
        .map((id) => CATEGORIES.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [enabledIds],
  )

  if (!profile) return null
  if (resultId === 'new') return null
  if (!result) return null

  function openCategory(catId: string) {
    const idx = enabledCats.findIndex((c) => c.id === catId)
    saveResult({
      ...result!,
      progress: { ...(result!.progress ?? { mode: 'list' }), catIndex: idx >= 0 ? idx : 0 },
    })
    navigate(`/q/${profile!.id}/${result!.id}`)
  }

  function onPickerSubmit(mergedIds: string[]) {
    saveResult({ ...result!, enabledCategories: mergedIds })
  }

  return (
    <section className="page" data-testid="category-overview-page">
      <header className="page-head">
        <h1>{t('q_overview_title')}</h1>
        <p className="muted">{t('q_overview_sub')}</p>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="cat-grid">
        {enabledCats.map((cat) => {
          const { answered, total } = catProgress(result.answers, cat.id)
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0
          const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
          return (
            <RsTile
              key={cat.id}
              color={cat.color}
              active
              onClick={() => openCategory(cat.id)}
              testId={`cat-tile-${cat.id}`}
              icon={<span className="text-2xl">{cat.icon}</span>}
              title={catTitle}
              trailing={<span className="text-xs">{`${answered}/${total}`}</span>}
            >
              <div className="h-1 bg-line rounded mt-1">
                <div className="h-1 rounded" style={{ width: `${pct}%`, background: cat.color }} />
              </div>
            </RsTile>
          )
        })}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setPickerOpen(true)}
          data-testid="open-cat-picker"
        >
          {t('btn_add_categories')}
        </Button>
        <Button asChild data-testid="confirm-start-questionnaire">
          <a href={`#/q/${profile.id}/${result.id}`}>{t('q_overview_start')}</a>
        </Button>
      </div>
      <RsCategoryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingIds={enabledIds}
        onSubmit={onPickerSubmit}
      />
    </section>
  )
}
