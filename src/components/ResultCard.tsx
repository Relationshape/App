// PROFILE-04. Card for a single result. v1.0 analog public/legacy/js/app.js:1591-1608
// (resultCard) — full `.list-item` row with avatar + body + four-button `.li-actions`.
// Plain <button class="btn …"> matches legacy markup so legacy-components.css rules
// (.list-item, .li-avatar, .li-body, .li-actions, .btn-danger-ghost) apply directly.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Result, Profile } from '@/lib/storage/types'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { fmtDate, countAnswers } from '@/lib/format/date'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { t } from '@/lib/i18n/i18n'

export function ResultCard({ result, profile, onCopy }: { result: Result; profile: Profile; onCopy?: (r: Result) => void }) {
  const color = result.subjectColor || profile.color
  const title =
    (result.subject || 'Untitled') + ((result.version ?? 1) > 1 ? ` (v${result.version})` : '')
  const deleteResult = useStore((s) => s.deleteResult)
  const saveResult = useStore((s) => s.saveResult)
  const { openShare } = useShareData()
  const [renaming, setRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')

  function startRename() { setRenameDraft(result.subject ?? ''); setRenaming(true) }
  function commitRename() {
    const next = renameDraft.trim()
    if (next) saveResult({ ...result, subject: next, updatedAt: Date.now() })
    setRenaming(false)
  }

  async function onDelete() {
    const ok = await dialog<boolean>({
      title: t('confirm_delete_map'),
      body: <p>{t('confirm_delete_map')}</p>,
      actions: [
        { label: t('btn_cancel'), kind: 'ghost', value: false },
        { label: t('btn_delete'), kind: 'danger', value: true },
      ],
    })
    if (ok) deleteResult(result.id)
  }

  return (
    <div
      className="list-item"
      style={{ ['--c' as 'color']: color } as React.CSSProperties}
      data-testid={`result-card-${result.id}`}
    >
      <div className="li-avatar">{result.subjectEmoji || '💞'}</div>
      <div className="li-body">
        {renaming ? (
          <input
            autoFocus
            className="result-card-rename-input"
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
            onBlur={commitRename}
            placeholder={t('result_rename_placeholder') as string}
            data-testid={`result-rename-input-${result.id}`}
          />
        ) : (
          <h3 className="result-card-title">
            {title}
            <button
              type="button"
              className="result-card-rename-btn"
              onClick={startRename}
              aria-label={t('result_rename_label') as string}
              data-testid={`result-rename-btn-${result.id}`}
            >✎</button>
          </h3>
        )}
        <p className="muted small">
          {`${t('updated')} ${fmtDate(result.updatedAt)} · ${countAnswers(result)} ${t('answers')}`}
        </p>
      </div>
      <div className="li-actions">
        <Link
          to={`/q-categories/${profile.id}/${result.id}`}
          className="btn btn-primary"
          data-testid={`result-view-${result.id}`}
        >
          {t('btn_view')}
        </Link>
        {onCopy && (
          <button
            type="button"
            className="btn"
            onClick={() => onCopy(result)}
            data-testid={`result-copy-${result.id}`}
          >
            {t('btn_copy_map')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => openShare(result.id)}
          data-testid={`result-share-${result.id}`}
        >
          {t('btn_export_result')}
        </button>
        <button
          type="button"
          className="btn btn-danger-ghost"
          onClick={onDelete}
          aria-label={t('btn_delete')}
          data-testid={`result-delete-${result.id}`}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
