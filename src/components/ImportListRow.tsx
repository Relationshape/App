// Shared import row for Home and ProfileDetail.

import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'
import type { Import } from '@/lib/storage/types'

export type ImportCategory = 'answers' | 'locked' | 'template'

export function ImportListRow({
  imp,
  category,
  testIdBase,
  onUseTemplate,
  onUnlock,
  onViewTemplate,
}: {
  imp: Import
  category: ImportCategory
  testIdBase?: string
  onUseTemplate: (imp: Import) => void
  onUnlock: (imp: Import) => void
  onViewTemplate?: (imp: Import) => void
}) {
  const navigate = useNavigate()
  const deleteImport = useStore((s) => s.deleteImport)
  const v = (imp.version ?? 1) > 1 ? ` (v${imp.version})` : ''
  const color = imp.color || '#7c3aed'
  const subject = imp.subject?.trim() || '—'
  const title = (imp.name?.trim() || 'Imported result') + v
  const base = testIdBase ?? (category === 'template' ? `home-template-${imp.id}` : `home-import-${imp.id}`)

  async function onDelete() {
    const ok = await dialog<boolean>({
      title: t('confirm_delete_map'),
      body: <p>{t('confirm_delete_map')}</p>,
      actions: [
        { label: t('btn_cancel'), kind: 'ghost', value: false },
        { label: t('btn_delete'), kind: 'danger', value: true },
      ],
    })
    if (ok) deleteImport(imp.id)
  }

  return (
    <div
      className="list-item"
      style={{ ['--c' as 'color']: color } as React.CSSProperties}
      data-testid={base}
    >
      <div className="li-avatar">{imp.emoji || '📨'}</div>
      <div className="li-body">
        <h3>
          {title}
          {category === 'template' && (
            <span className="badge" style={{ marginLeft: 6, fontSize: 11 }}>
              {t('template_badge')}
            </span>
          )}
          {category === 'locked' && (
            <span className="badge" style={{ marginLeft: 6, fontSize: 11 }}>
              {t('locked_answers_badge')}
            </span>
          )}
        </h3>
        <p className="muted small">
          {`${subject}${v} · ${t('imported_on')} ${fmtDate(imp.importedAt)}`}
        </p>
      </div>
      <div className="li-actions">
        {category === 'answers' && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => navigate(`/import-view/${imp.id}`)}
              data-testid={`${base}-view`}
            >
              {t('btn_view_import')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => navigate(`/compare?ids=imp:${imp.id}`)}
              data-testid={`${base}-compare`}
            >
              {t('btn_compare')}
            </button>
          </>
        )}
        {category === 'locked' && imp.lockedAnswers && (
          <button
            type="button"
            className="btn"
            onClick={() => onUnlock(imp)}
            data-testid={`${base}-unlock`}
          >
            {t('unlock_answers_btn')}
          </button>
        )}
        {onViewTemplate && (
          <button
            type="button"
            className="btn"
            onClick={() => onViewTemplate(imp)}
            data-testid={`${base}-view-template`}
          >
            {t('btn_view_template')}
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => onUseTemplate(imp)}
          data-testid={`${base}-use-template`}
        >
          {t('btn_use_as_template')}
        </button>
        <button
          type="button"
          className="btn btn-danger-outline"
          onClick={onDelete}
          data-testid={`${base}-delete`}
        >
          {t('btn_delete')}
        </button>
      </div>
    </div>
  )
}
