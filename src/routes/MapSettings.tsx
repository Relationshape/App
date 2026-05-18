// SETTINGS-03, D-41. Port of public/legacy/js/app.js:3758-3850.
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import { ScaleEditor } from '@/components/ScaleEditor'
import { EmojiPicker } from '@/components/EmojiPicker'
import { RsTile } from '@/components/RsTile'
import { RsCategoryPicker } from '@/components/RsCategoryPicker'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import { t } from '@/lib/i18n/i18n'
import { dialog } from '@/lib/dialog/dialog'
import { useTemplateWarning } from '@/lib/hooks/useTemplateWarning'
import type { MutableScaleStep } from '@/lib/data/types'
import type { CustomCategoryDef } from '@/lib/storage/types'

const PALETTE = ['#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#22c55e', '#e11d48']

export function MapSettings() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const result = useStore((s) => (id ? s.results.find((r) => r.id === id) ?? null : null))
  const profiles = useStore((s) => s.profiles)
  const profile = result ? (profiles.find((p) => p.id === result.profileId) ?? null) : null
  const globalScale = useStore((s) => s.scale)
  const saveResult = useStore((s) => s.saveResult)
  const updateProfile = useStore((s) => s.updateProfile)

  const [subject, setSubject] = useState(result?.subject ?? '')
  const [subjectEmoji, setSubjectEmoji] = useState(result?.subjectEmoji ?? '💞')
  const [subjectColor, setSubjectColor] = useState(result?.subjectColor ?? PALETTE[0]!)
  const [scale, setScale] = useState<MutableScaleStep[] | undefined>(result?.scale ? result.scale.map((s) => ({ ...s })) : undefined)

  // Toggling off keeps the row visible this session so users can re-enable before saving.
  const [knownCatIds, setKnownCatIds] = useState(() => result?.enabledCategories ?? CATEGORIES.map((c) => c.id))
  const [enabledCategories, setEnabledCategories] = useState(() => result?.enabledCategories ?? CATEGORIES.map((c) => c.id))

  const [deletedCatIds, setDeletedCatIds] = useState<Set<string>>(() => new Set())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [resultCustomCats, setResultCustomCats] = useState<CustomCategoryDef[]>(() => result?.customCategories ?? [])

  const { confirmIfTemplate } = useTemplateWarning(result)

  useEffect(() => {
    if (!result) void navigate('/')
  }, [result, navigate])
  if (!result) return null

  function toggleCat(catId: string) {
    setEnabledCategories((prev) => prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId])
  }

  async function deleteCat(catId: string) {
    const ok = await dialog<boolean>({
      title: t('confirm_delete_cat_title'),
      body: t('confirm_delete_cat_body'),
      actions: [
        { label: t('btn_cancel'), kind: 'ghost', value: false },
        { label: t('map_cat_delete'), kind: 'danger', value: true },
      ],
    })
    if (!ok) return
    setDeletedCatIds((prev) => new Set([...prev, catId]))
    setKnownCatIds((prev) => prev.filter((id) => id !== catId))
    setEnabledCategories((prev) => prev.filter((id) => id !== catId))
    setResultCustomCats((prev) => prev.filter((c) => c.id !== catId))
  }

  function handlePickerSubmit(mergedIds: string[], newResultCats: CustomCategoryDef[], newProfileCats: CustomCategoryDef[]) {
    const newIds = mergedIds.filter((id) => !knownCatIds.includes(id))
    if (newIds.length > 0) {
      setKnownCatIds((prev) => [...prev, ...newIds])
      setEnabledCategories((prev) => [...prev, ...newIds])
    }
    setResultCustomCats(newResultCats)
    if (profile && newProfileCats.length > (profile.customCategories?.length ?? 0)) {
      updateProfile(profile.id, { customCategories: newProfileCats })
    }
  }

  async function onSave() {
    const r = result
    if (!r) return
    const structuralChange =
      JSON.stringify(enabledCategories.slice().sort()) !== JSON.stringify((r.enabledCategories ?? CATEGORIES.map((c) => c.id)).slice().sort()) ||
      (scale !== undefined && JSON.stringify(scale) !== JSON.stringify(r.scale ?? globalScale))
    if (structuralChange && !await confirmIfTemplate()) return
    const trimmedSubject = subject.trim()
    const cleanedAnswers = deletedCatIds.size > 0
      ? Object.fromEntries(Object.entries(r.answers).filter(([cid]) => !deletedCatIds.has(cid))) as typeof r.answers
      : r.answers
    saveResult({
      ...r,
      ...(trimmedSubject ? { subject: trimmedSubject } : {}),
      subjectEmoji,
      subjectColor,
      enabledCategories,
      answers: cleanedAnswers,
      ...(scale !== undefined ? { scale } : {}),
      ...(resultCustomCats.length > 0 ? { customCategories: resultCustomCats } : {}),
    })
    void navigate(`/result/${r.id}`)
  }
  function clearScaleOverride() {
    setScale(undefined)
  }
  function adoptGlobalScale() {
    setScale(globalScale.map((s) => ({ ...s })))
  }

  const knownSet = useMemo(() => new Set(knownCatIds), [knownCatIds])
  const visibleCats = useMemo(() => {
    const builtins = CATEGORIES.filter((cat) => knownSet.has(cat.id))
    const customCats = resultCustomCats
      .filter((c) => knownSet.has(c.id))
      .map((c) => resolveAnyCat(c.id, resultCustomCats, profile?.customCategories ?? []))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
    return [...builtins, ...customCats]
  }, [knownSet, resultCustomCats, profile?.customCategories])

  return (
    <section className="page narrow" data-testid="map-settings-page">
      <Button asChild variant="ghost"><Link to={`/result/${result.id}`}>{t('btn_back')}</Link></Button>
      <header className="page-head">
        <h1>{t('map_settings_title')}</h1>
      </header>
      <section className="page-section" data-testid="map-settings-subject">
        <h2>{t('map_settings_subject_title')}</h2>
        <label>{t('map_settings_subject_label')}
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded border border-line px-2 py-1"
            data-testid="map-subject-input"
          />
        </label>
        <label>{t('profile_emoji_label')}
          <EmojiPicker value={subjectEmoji} onChange={setSubjectEmoji} />
        </label>
        <fieldset>
          <legend>{t('profile_color_label')}</legend>
          <div className="palette-row flex flex-wrap gap-2">
            {PALETTE.map((p) => (
              <button
                key={p}
                type="button"
                aria-label={p}
                aria-pressed={p === subjectColor}
                onClick={() => setSubjectColor(p)}
                className="h-8 w-8 rounded-full border-2"
                style={{ background: p, borderColor: p === subjectColor ? 'white' : 'transparent' }}
                data-testid={`map-color-${p}`}
              />
            ))}
          </div>
        </fieldset>
      </section>
      <section className="page-section" data-testid="map-settings-scale">
        <h2>{t('map_scale_title')}</h2>
        <div className="flex gap-2 mb-2">
          <Button type="button" variant="outline" onClick={adoptGlobalScale} data-testid="map-scale-adopt-global">{t('map_scale_use_global')}</Button>
          {scale && <Button type="button" variant="ghost" onClick={clearScaleOverride} data-testid="map-scale-clear-override">{t('map_scale_clear_override')}</Button>}
        </div>
        {scale ? (
          <ScaleEditor scale={scale} onChange={setScale} />
        ) : (
          <p className="muted">{t('map_scale_using_global', { n: globalScale.length })}</p>
        )}
      </section>
      <section className="page-section" data-testid="map-settings-categories">
        <h2>{t('map_settings_cat_title')}</h2>
        <p className="muted">{t('map_settings_cat_sub')}</p>
        <div className="callout" data-testid="map-cat-hidden-info">
          ℹ️ {t('map_settings_cat_hidden_info')}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2" data-testid="map-cat-grid">
          {visibleCats.map((cat) => {
            const on = enabledCategories.includes(cat.id)
            return (
              <div key={cat.id} className="relative">
                <RsTile
                  color={cat.color}
                  active={on}
                  onClick={() => toggleCat(cat.id)}
                  testId={`map-cat-toggle-${cat.id}`}
                  icon={cat.icon}
                  title={cat.title}
                  trailing={<span>{on ? '✓' : '–'}</span>}
                />
                <button
                  type="button"
                  className="absolute bottom-1 right-1 text-xs opacity-40 hover:opacity-100 hover:text-red-400 transition-opacity px-1"
                  title={t('map_cat_delete')}
                  onClick={(e) => { e.stopPropagation(); void deleteCat(cat.id) }}
                  data-testid={`map-cat-delete-${cat.id}`}
                >
                  🗑
                </button>
              </div>
            )
          })}
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="list-add"
            onClick={() => setPickerOpen(true)}
            data-testid="map-cat-add-btn"
          >
            {t('map_settings_add_cat')}
          </button>
        </div>
      </section>
      <Button type="button" onClick={() => { void onSave() }} data-testid="map-save-btn">{t('btn_save')}</Button>

      <RsCategoryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingIds={knownCatIds}
        result={result}
        profile={profile}
        onSubmit={handlePickerSubmit}
      />
    </section>
  )
}
