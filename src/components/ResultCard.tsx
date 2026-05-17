// PROFILE-04. Card for a single result. v1.0 analog public/legacy/js/app.js:1591-1608
// (resultCard) — full `.list-item` row with avatar + body + four-button `.li-actions`.
// Plain <button class="btn …"> matches legacy markup so legacy-components.css rules
// (.list-item, .li-avatar, .li-body, .li-actions, .btn-danger-ghost) apply directly.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Result, Profile } from '@/lib/storage/types'
import { useStore } from '@/lib/storage/store'
import { dialog } from '@/lib/dialog/dialog'
import { fmtDate, countAnswers } from '@/lib/format/date'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { ResultModal } from '@/components/ResultModal'
import { t } from '@/lib/i18n/i18n'

export function ResultCard({ result, profile }: { result: Result; profile: Profile }) {
  const color = result.subjectColor || profile.color
  const title =
    (result.subject || 'Untitled') + ((result.version ?? 1) > 1 ? ` (v${result.version})` : '')
  const deleteResult = useStore((s) => s.deleteResult)
  const navigate = useNavigate()
  const { openShare } = useShareData()
  const [modalOpen, setModalOpen] = useState(false)

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
    <>
      <div
        className="list-item"
        style={{ ['--c' as 'color']: color } as React.CSSProperties}
        data-testid={`result-card-${result.id}`}
      >
        <div className="li-avatar">{result.subjectEmoji || '💞'}</div>
        <div className="li-body">
          <h3>{title}</h3>
          <p className="muted small">
            {`${t('updated')} ${fmtDate(result.updatedAt)} · ${countAnswers(result)} ${t('answers')}`}
          </p>
        </div>
        <div className="li-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/q-categories/${profile.id}/${result.id}`)}
            data-testid={`result-continue-${result.id}`}
          >
            {t('btn_continue_editing')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setModalOpen(true)}
            data-testid={`result-view-${result.id}`}
          >
            {t('btn_view')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => openShare(result.id)}
            data-testid={`result-share-${result.id}`}
          >
            {t('btn_share')}
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

      <ResultModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        result={result}
        profile={profile}
      />
    </>
  )
}
