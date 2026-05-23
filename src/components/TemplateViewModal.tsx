// Read-only preview of a template import: categories + items, collapsible.

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/data/data'
import { getLang } from '@/lib/i18n/i18n'
import { t } from '@/lib/i18n/i18n'
import type { Import, CustomCategoryDef } from '@/lib/storage/types'

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  imp: Import
  onUseAsTemplate?: () => void
}

function CategoryRow({ title, icon, color, items }: {
  title: string
  icon: string
  color: string
  items: string[]
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <span className="flex-1 font-medium text-sm" style={{ color }}>{title}</span>
        <span className="text-xs muted" aria-hidden="true">{items.length}</span>
        <span className="text-xs muted ml-1" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <ul className="border-t border-line px-3 py-2 flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground py-0.5">{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TemplateViewModal({ open, onOpenChange, imp, onUseAsTemplate }: Props) {
  const lang = getLang()
  const enabledIds = imp.enabledCategories ?? CATEGORIES.map((c) => c.id)

  const standardCats = CATEGORIES.filter((c) => enabledIds.includes(c.id))
  const customCats: CustomCategoryDef[] = imp.customCategories ?? []

  function getStandardItems(catId: string, baseItems: readonly string[]): string[] {
    const extras = imp.customItemDefs?.[catId]
    if (!extras) return [...baseItems]
    const extraNames = Object.keys(extras)
    return [...baseItems, ...extraNames]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col" data-testid="template-view-modal">
        <DialogTitle>
          {imp.subject?.trim()
            ? `${imp.emoji || '📋'} ${imp.subject.trim()}`
            : (imp.name?.trim() || t('template_view_title'))}
        </DialogTitle>

        <p className="text-sm font-medium mb-1">{t('template_view_categories')}</p>

        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
          {standardCats.map((cat) => {
            const baseItems = lang === 'de' ? cat.deItems : cat.items
            const items = getStandardItems(cat.id, baseItems)
            return (
              <CategoryRow
                key={cat.id}
                title={lang === 'de' ? cat.de : cat.title}
                icon={cat.icon}
                color={cat.color}
                items={items}
              />
            )
          })}
          {customCats.map((cat) => {
            // Prefer items from cat.items definition; fall back to customItemDefs keys
            const defItems = (cat.items ?? []).map((item) => item.name)
            const defsFromCustomItemDefs = Object.keys(imp.customItemDefs?.[cat.id] ?? {})
            const items = defItems.length > 0 ? defItems : defsFromCustomItemDefs
            return (
              <CategoryRow
                key={cat.id}
                title={cat.title}
                icon={cat.icon}
                color={cat.color}
                items={items}
              />
            )
          })}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('btn_cancel')}
          </Button>
          {onUseAsTemplate && (
            <Button onClick={() => { onOpenChange(false); onUseAsTemplate() }}>
              {t('btn_use_as_template')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
