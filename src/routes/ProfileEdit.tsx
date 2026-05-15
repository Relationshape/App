// PROFILE-03. Port of public/legacy/js/app.js:1517-1563

import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from '@/components/EmojiPicker'
import { t } from '@/lib/i18n/i18n'

const PALETTE = ['#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#22c55e', '#e11d48']

export function ProfileEdit() {
  const { id } = useParams<{ id?: string }>()
  const existing = useStore((s) => (id ? s.profiles.find((p) => p.id === id) ?? null : null))
  const createProfile = useStore((s) => s.createProfile)
  const updateProfile = useStore((s) => s.updateProfile)
  const navigate = useNavigate()

  const [name, setName] = useState(existing?.name ?? '')
  const [pronouns, setPronouns] = useState(existing?.pronouns ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🌷')
  const [color, setColor] = useState(existing?.color ?? PALETTE[0]!)
  const [notes, setNotes] = useState(existing?.notes ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim() || 'Unnamed'
    if (id && existing) {
      updateProfile(id, { name: trimmedName, pronouns, emoji, color, notes })
      navigate(`/profile/${id}`)
    } else {
      const p = createProfile({ name: trimmedName, pronouns, emoji, color, notes })
      navigate(`/profile/${p.id}`)
    }
  }

  return (
    <form onSubmit={onSubmit} className="page narrow form" data-testid="profile-edit-form">
      <h1>{existing ? t('btn_edit') : t('new_profile_btn')}</h1>
      <label>
        {t('profile_name_label')}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="profile-name-input"
        />
      </label>
      <label>
        {t('profile_pronouns_label')}
        <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} data-testid="profile-pronouns-input" />
      </label>
      <label>
        {t('profile_emoji_label')}
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </label>
      <fieldset>
        <legend>{t('profile_color_label')}</legend>
        <div className="palette-row flex flex-wrap gap-2" data-testid="palette-row">
          {PALETTE.map((p) => (
            <button
              key={p}
              type="button"
              aria-label={p}
              aria-pressed={p === color}
              onClick={() => setColor(p)}
              className="h-8 w-8 rounded-full border-2"
              style={{ background: p, borderColor: p === color ? 'white' : 'transparent' }}
              data-testid={`palette-${p}`}
            />
          ))}
        </div>
      </fieldset>
      <label>
        {t('profile_notes_label')}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="profile-notes-input" />
      </label>
      <Button type="submit" data-testid="profile-save-btn">{t('btn_save')}</Button>
    </form>
  )
}
