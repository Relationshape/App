// Inline profile-creation dialog reused from Nav (no-profile state), WizardHost
// finish, and Welcome CTA. Keeps the form minimal: name, pronouns, emoji, colour.
// Notes are available later in ProfileEdit.

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from '@/components/EmojiPicker'
import { useStore } from '@/lib/storage/store'
import { t } from '@/lib/i18n/i18n'

const PALETTE = [
  '#7c3aed', '#8b5cf6', '#a78bfa', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
  '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#e11d48',
  '#ec4899', '#d946ef', '#c026d3', '#9333ea', '#64748b', '#475569', '#1e293b', '#0f172a',
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Called with the new profile id immediately after creation. */
  onCreated: (profileId: string) => void
}

export function CreateProfileModal({ open, onOpenChange, onCreated }: Props) {
  const createProfile = useStore((s) => s.createProfile)
  const [name, setName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [emoji, setEmoji] = useState('🌷')
  const [color, setColor] = useState(PALETTE[0]!)

  // Reset form each time the modal opens
  useEffect(() => {
    if (open) {
      setName('')
      setPronouns('')
      setEmoji('🌷')
      setColor(PALETTE[0]!)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const p = createProfile({ name: name.trim() || 'Unnamed', pronouns, emoji, color, notes: '' })
    onCreated(p.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="create-profile-modal">
        <DialogHeader>
          <DialogTitle>{t('profile_new_title')}</DialogTitle>
        </DialogHeader>
        <form id="create-profile-modal-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t('profile_name_label')}</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile_name_placeholder') as string}
              className="rounded border border-line px-2 py-1"
              data-testid="create-profile-name-input"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t('profile_pronouns_label')}</span>
            <input
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder={t('profile_pronouns_placeholder') as string}
              className="rounded border border-line px-2 py-1"
              data-testid="create-profile-pronouns-input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t('profile_emoji_label')}</span>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </label>
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium mb-1">{t('profile_color_label')}</legend>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label={p}
                  aria-pressed={p === color}
                  onClick={() => setColor(p)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: p, borderColor: p === color ? 'white' : 'transparent' }}
                />
              ))}
            </div>
          </fieldset>
        </form>
        <DialogFooter>
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            {t('btn_cancel')}
          </Button>
          <Button type="submit" form="create-profile-modal-form" data-testid="create-profile-save-btn">
            {t('btn_create_profile')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
