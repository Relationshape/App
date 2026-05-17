// PROFILE-03, D-21. shadcn Popover + EMOJI_BANK grid + free-input fallback.
// v1.0 analog public/legacy/js/app.js:107-133.

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { EMOJI_BANK, isLikelyEmoji } from '@/lib/data/emoji'
import { t } from '@/lib/i18n/i18n'

interface Props {
  value: string
  onChange: (next: string) => void
}

export function EmojiPicker({ value, onChange }: Props) {
  const [free, setFree] = useState('')
  const [open, setOpen] = useState(false)
  function pick(e: string) { onChange(e); setOpen(false) }
  function commitFree() {
    const v = free.trim()
    if (!v) return
    if (!isLikelyEmoji(v)) return
    onChange(v)
    setFree('')
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t('emoji_picker_label')}
        data-testid="emoji-picker"
        className="relative inline-flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-line text-3xl transition-colors hover:border-accent hover:bg-surface-2"
      >
        {value || '✨'}
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent text-[11px] font-bold shadow" aria-hidden>✎</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-w-[20rem]">
        <div className="grid grid-cols-8 gap-1" data-testid="emoji-grid">
          {EMOJI_BANK.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => pick(e)}
              data-state={e === value ? 'active' : 'inactive'}
              className="aspect-square text-xl data-[state=active]:bg-accent"
              data-testid={`emoji-cell-${e}`}
            >{e}</button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={free}
            onChange={(ev) => setFree(ev.target.value)}
            placeholder={t('emoji_picker_free_placeholder')}
            className="flex-1 rounded border border-line px-2 py-1"
            maxLength={8}
            data-testid="emoji-free-input"
          />
          <Button type="button" size="sm" onClick={commitFree} data-testid="emoji-free-commit">{t('btn_ok')}</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
