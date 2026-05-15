// QUEST-02/03/05, D-30. Port of public/legacy/js/app.js:1049-1076.
// Returns a { confirmIfTemplate } function that gates answer mutations behind
// a dialog when the result was seeded from an import/template.

import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import type { Result } from '@/lib/storage/types'
import { t } from '@/lib/i18n/i18n'

export function useTemplateWarning(result: Result | null | undefined) {
  const saveResult = useStore((s) => s.saveResult)
  return {
    confirmIfTemplate: async (): Promise<boolean> => {
      if (!result) return true
      if (!result.seededFromImportId && !result.seededFromResultId) return true
      if (result.templateWarningDisabled) return true
      let disableForever = false
      const choice = await dialog<'ok' | 'cancel'>({
        title: t('template_warning_title'),
        body: () => (
          <div>
            <p>{t('template_warning')}</p>
            <label className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                data-testid="template-warning-disable"
                onChange={(e) => { disableForever = e.target.checked }}
              />
              {t('template_warning_disable')}
            </label>
          </div>
        ),
        actions: [
          { label: t('btn_cancel'), kind: 'ghost', value: 'cancel' },
          { label: t('btn_continue_anyway'), kind: 'primary', value: 'ok' },
        ],
      })
      if (choice !== 'ok') return false
      if (disableForever) saveResult({ ...result, templateWarningDisabled: true })
      return true
    },
  }
}
