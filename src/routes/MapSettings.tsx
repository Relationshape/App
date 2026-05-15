// SETTINGS-03, D-41. Port of public/legacy/js/app.js:3758-3850.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import { ScaleEditor } from '@/components/ScaleEditor'
import { EmojiPicker } from '@/components/EmojiPicker'
import { CATEGORIES } from '@/lib/data/data'
import { t } from '@/lib/i18n/i18n'
import type { MutableScaleStep } from '@/lib/data/types'

const PALETTE = ['#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#22c55e', '#e11d48']

export function MapSettings() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const result = useStore((s) => (id ? s.results.find((r) => r.id === id) ?? null : null))
  const globalScale = useStore((s) => s.scale)
  const saveResult = useStore((s) => s.saveResult)

  const [subject, setSubject] = useState(result?.subject ?? '')
  const [subjectEmoji, setSubjectEmoji] = useState(result?.subjectEmoji ?? '💞')
  const [subjectColor, setSubjectColor] = useState(result?.subjectColor ?? PALETTE[0]!)
  const [scale, setScale] = useState<MutableScaleStep[] | undefined>(result?.scale ? result.scale.map((s) => ({ ...s })) : undefined)
  const [enabledCategories, setEnabledCategories] = useState(result?.enabledCategories ?? CATEGORIES.map((c) => c.id))

  useEffect(() => {
    if (!result) void navigate('/')
  }, [result, navigate])
  if (!result) return null

  function toggleCat(catId: string) {
    setEnabledCategories((prev) => prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId])
  }
  function onSave() {
    const r = result
    if (!r) return
    const trimmedSubject = subject.trim()
    saveResult({
      ...r,
      ...(trimmedSubject ? { subject: trimmedSubject } : {}),
      subjectEmoji,
      subjectColor,
      enabledCategories,
      ...(scale !== undefined ? { scale } : {}),
    })
    void navigate(`/result/${r.id}`)
  }
  function clearScaleOverride() {
    setScale(undefined)
  }
  function adoptGlobalScale() {
    setScale(globalScale.map((s) => ({ ...s })))
  }

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
        <h2>{t('settings_scale_title')}</h2>
        <div className="flex gap-2 mb-2">
          <Button type="button" variant="outline" onClick={adoptGlobalScale} data-testid="map-scale-adopt-global">Use global scale</Button>
          {scale && <Button type="button" variant="ghost" onClick={clearScaleOverride} data-testid="map-scale-clear-override">Clear override</Button>}
        </div>
        {scale ? (
          <ScaleEditor scale={scale} onChange={setScale} />
        ) : (
          <p className="muted">Using global scale ({globalScale.length} steps).</p>
        )}
      </section>
      <section className="page-section" data-testid="map-settings-categories">
        <h2>{t('map_settings_cat_title')}</h2>
        <p className="muted">{t('map_settings_cat_sub')}</p>
        <div className="cat-toggle-grid grid grid-cols-2 md:grid-cols-3 gap-2" data-testid="map-cat-grid">
          {CATEGORIES.map((cat) => {
            const on = enabledCategories.includes(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                data-state={on ? 'active' : 'inactive'}
                onClick={() => toggleCat(cat.id)}
                className="cat-toggle border border-line rounded p-2 data-[state=active]:border-accent"
                style={{ ['--c' as 'color']: cat.color } as React.CSSProperties}
                data-testid={`map-cat-toggle-${cat.id}`}
              >
                <span aria-hidden>{cat.icon}</span>{' '}{cat.title}{' '}
                <span className="muted text-sm">{on ? '✓' : '–'}</span>
              </button>
            )
          })}
        </div>
      </section>
      <Button type="button" onClick={onSave} data-testid="map-save-btn">{t('btn_save')}</Button>
    </section>
  )
}
