// Quick task 260516-qva. Modal port of public/legacy/js/app.js:1999-2065
// (`runCategoryPicker`) for the "Add more categories" entry point from
// CategoryOverview. Locks already-enabled rows; user can only ADD from here.
//
// CSS comes from src/styles/legacy-components.css (`.cat-picker-*`, `.onboarding-body`).
// Removal of categories lives in MapSettings — out of scope for this modal.

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CATEGORIES, CATEGORY_GROUPS } from '@/lib/data/data'
import { t, getLang } from '@/lib/i18n/i18n'

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  existingIds: string[]
  onSubmit: (mergedIds: string[]) => void
}

export function RsCategoryPicker({ open, onOpenChange, existingIds, onSubmit }: Props) {
  const lang = getLang()
  const lockedIds = useMemo(() => new Set(existingIds), [existingIds])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set(existingIds))

  // Reset selection whenever the modal (re)opens or the locked set changes.
  useEffect(() => {
    if (open) setCheckedIds(new Set(existingIds))
  }, [open, existingIds])

  const newSelectedCount = Array.from(checkedIds).filter((id) => !lockedIds.has(id)).length
  const canSubmit = newSelectedCount > 0

  function toggle(id: string) {
    if (lockedIds.has(id)) return
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(Array.from(checkedIds))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(560px,96vw)] max-h-[min(90vh,720px)] p-6 flex flex-col gap-3"
        showCloseButton={false}
        data-testid="cat-picker"
      >
        <DialogTitle asChild>
          <h2 className="rs-modal-title">{t('onboarding_title')}</h2>
        </DialogTitle>
        <div className="onboarding-body flex-1 overflow-y-auto min-h-0">
          <p className="muted small">{t('onboarding_sub')}</p>
          <div className="cat-picker-groups">
            {CATEGORY_GROUPS.map((group) => {
              const groupTitle = lang === 'de' ? group.de : group.en
              const items = group.categories
                .map(({ id }) => CATEGORIES.find((c) => c.id === id))
                .filter((c): c is NonNullable<typeof c> => Boolean(c))
              if (items.length === 0) return null
              return (
                <div key={group.id} className="cat-picker-group">
                  <h3 className="cat-picker-group-title">{groupTitle}</h3>
                  <div className="cat-picker-items">
                    {items.map((cat) => {
                      const locked = lockedIds.has(cat.id)
                      const isChecked = checkedIds.has(cat.id)
                      const catTitle = lang === 'de' && cat.de ? cat.de : cat.title
                      return (
                        <label
                          key={cat.id}
                          htmlFor={`cp-${cat.id}`}
                          className={
                            'cat-picker-item' +
                            (locked ? ' is-locked' : '') +
                            (isChecked ? ' is-checked' : '')
                          }
                          data-testid={`cat-picker-item-${cat.id}`}
                        >
                          <input
                            type="checkbox"
                            id={`cp-${cat.id}`}
                            checked={isChecked}
                            disabled={locked}
                            onChange={() => toggle(cat.id)}
                          />
                          <span className="cat-picker-icon" aria-hidden>{cat.icon}</span>
                          <span className="cat-picker-label">{catTitle}</span>
                          {locked ? (
                            <span className="cat-picker-lock" aria-label="already added">✓</span>
                          ) : (
                            <span className="cat-picker-check" aria-hidden>{isChecked ? '✓' : ''}</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="rs-modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onOpenChange(false)}
            data-testid="cat-picker-cancel"
          >
            {t('btn_cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="cat-picker-submit"
          >
            {t('btn_add_categories')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
