// SHARE-05, D-25, D-35. Port of public/legacy/js/app.js:3453-3544.

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ImportForm } from '@/components/ImportForm'
import { UnlockAnswersBody } from '@/components/UnlockAnswersDialog'
import { mapResultToDataset, mapImportToDataset } from '@/lib/charts/datasets'
import { CATEGORIES } from '@/lib/data/data'
import type { Import, AnswersBlob } from '@/lib/storage/types'
import { useToast } from '@/lib/hooks/useToast'
import { dialog } from '@/lib/dialog/dialog'
import { t } from '@/lib/i18n/i18n'

export function Compare() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  // null = param absent (first visit → default to first 2); '' = explicit empty (user deselected all)
  const idsParam = params.get('ids')
  const rawIds = idsParam !== null ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : null
  const truncatedRaw = rawIds !== null ? rawIds.slice(0, 4) : null
  const { toast } = useToast()
  const { openShare } = useShareData()

  useEffect(() => {
    if (rawIds !== null && rawIds.length > 4) toast.message(t('compare_too_many_truncated', { n: rawIds.length }) as string)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds?.length])

  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const imports = useStore((s) => s.imports)
  const unlockImport = useStore((s) => s.unlockImport)

  // Separate own-result options and imported options for grouped display.
  const ownOptions = useMemo(
    () => results.map((r) => {
      const profile = profiles.find((p) => p.id === r.profileId)
      return {
        id: r.id,
        name: profile?.name ?? '?',
        subject: r.subject ?? '',
        emoji: r.subjectEmoji || profile?.emoji || '💞',
        color: r.subjectColor || profile?.color || '#7c3aed',
      }
    }),
    [results, profiles],
  )

  const importedOptions = useMemo(
    () => imports.map((i) => ({
      id: `imp:${i.id}`,
      impId: i.id,
      name: i.name ?? 'Anonymous',
      subject: i.subject ?? '',
      emoji: i.emoji || '📨',
      color: i.color || '#7c3aed',
      locked: i.exportMode === 'restricted' && !i.answersUnlocked,
    })),
    [imports],
  )

  const allOptions = useMemo(
    () => [...ownOptions.map((o) => ({ id: o.id })), ...importedOptions.map((o) => ({ id: o.id }))],
    [ownOptions, importedOptions],
  )

  // Default to the first 2 options when ?ids= param is absent; explicit empty string = nothing selected.
  const effectiveIds = truncatedRaw === null
    ? allOptions.slice(0, 2).map((o) => o.id)
    : truncatedRaw

  const [importOpen, setImportOpen] = useState(false)

  function handleImportSuccess(imp: Import) {
    setImportOpen(false)
    const id = `imp:${imp.id}`
    const cur = truncatedRaw ?? effectiveIds
    const next = cur.includes(id) ? cur : [...cur, id].slice(0, 4)
    setParams({ ids: next.join(',') })
  }

  function handleUnlockImport(impId: string) {
    const imp = imports.find((i) => i.id === impId)
    if (!imp) return
    void dialog<boolean>({
      title: t('unlock_answers_title'),
      body: (close) => (
        <UnlockAnswersBody
          imp={imp}
          onUnlock={(answers) => { unlockImport(impId, answers); close(true) }}
          onCancel={() => close(false)}
        />
      ),
      actions: [],
    })
  }

  function toggleId(id: string) {
    const cur = truncatedRaw ?? effectiveIds
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 4)
    setParams({ ids: next.join(',') })
  }

  const selectedCount = effectiveIds.length
  const atMax = selectedCount >= 4

  const datasets = useMemo(() => effectiveIds.map((id) => {
    if (id.startsWith('imp:')) {
      const imp = imports.find((i) => i.id === id.slice(4))
      return imp ? mapImportToDataset(imp) : null
    }
    const r = results.find((r) => r.id === id)
    if (!r) return null
    const profile = profiles.find((p) => p.id === r.profileId) ?? null
    return mapResultToDataset(r, profile)
  }).filter((d): d is NonNullable<typeof d> => d !== null),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [effectiveIds.join(','), results, imports, profiles])

  function hasItemValues(answers: AnswersBlob | undefined, catId: string): boolean {
    const slot = answers?.[catId]
    if (!slot) return false
    type Cell = { scale?: string; scaleFrac?: number; giving?: string; receiving?: string }
    for (const k of Object.keys(slot)) {
      if (k === '__custom' || k === '__hidden') continue
      const cell = slot[k] as Cell | undefined
      if (cell?.scale || cell?.giving || cell?.receiving) return true
    }
    for (const cell of Object.values(slot.__custom ?? {}) as Cell[]) {
      if (cell?.giving || cell?.receiving) return true
      if (cell?.scale && (cell.scale !== 'open' || cell.scaleFrac != null)) return true
    }
    return false
  }

  function hasCommonCategories(): boolean {
    if (datasets.length < 2) return false
    const allCatIds = Array.from(new Set([
      ...CATEGORIES.map((c) => c.id),
      ...datasets.flatMap((ds) => (ds.customCategories ?? []).map((c) => c.id)),
    ]))
    return allCatIds.some((catId) => datasets.every((ds) => hasItemValues(ds.answers, catId)))
  }

  async function handleGoToDetails() {
    if (!hasCommonCategories()) {
      const confirmed = await dialog<boolean>({
        title: t('compare_no_common_title') as string,
        body: <p>{t('compare_no_common_body')}</p>,
        actions: [
          { label: t('btn_cancel') as string, kind: 'ghost', value: false },
          { label: t('btn_compare_overview') as string, kind: 'primary', value: true },
        ],
      })
      if (!confirmed) return
    }
    navigate(`/compare/details?ids=${effectiveIds.join(',')}`)
  }

  return (
    <section className="page" data-testid="compare-page">
      <header className="page-head">
        <h1>{t('compare_title')}</h1>
        <p className="muted">{t('compare_sub')}</p>
      </header>

      {/* Grouped dataset selector */}
      <div className="compare-selector" data-testid="compare-chips">
        {/* Selection counter */}
        <div className="compare-selector-meta">
          <span className="muted small">
            {t('compare_selected_of', { n: selectedCount })}
          </span>
          {atMax && (
            <span className="muted small"> · {t('compare_max_hint')}</span>
          )}
        </div>

        {/* Own maps */}
        {ownOptions.length > 0 && (
          <div className="compare-group">
            <h2 className="compare-group-label">{t('compare_own_section')}</h2>
            <div className="compare-group-items">
              {ownOptions.map((o) => {
                const selected = effectiveIds.includes(o.id)
                const disabled = atMax && !selected
                return (
                  <div
                    key={o.id}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-pressed={selected}
                    className={`compare-row${selected ? ' compare-row--on' : ''}${disabled ? ' compare-row--disabled' : ''}`}
                    style={{ ['--c' as 'color']: o.color } as React.CSSProperties}
                    onClick={() => !disabled && toggleId(o.id)}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); toggleId(o.id) } }}
                    data-testid={`compare-chip-${o.id}`}
                  >
                    <span className="compare-row-select">
                      <span className="compare-row-check" aria-hidden="true">
                        {selected ? '✓' : ''}
                      </span>
                      <span className="compare-row-emoji" aria-hidden="true">{o.emoji}</span>
                      <span className="compare-row-text">
                        <span className="compare-row-name">{o.subject || o.name}</span>
                        {o.subject && <span className="compare-row-sub">{o.name}</span>}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="compare-row-export"
                      onClick={(e) => { e.stopPropagation(); openShare(o.id) }}
                      data-testid={`compare-export-${o.id}`}
                    >
                      {t('btn_export_result')}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Imported results */}
        <div className="compare-group">
          <div className="compare-group-header">
            <h2 className="compare-group-label">{t('compare_imported_section')}</h2>
            <button
              type="button"
              className="btn btn-outline compare-import-inline-btn"
              onClick={() => setImportOpen(true)}
              data-testid="compare-import-btn"
            >
              {t('compare_import_btn')}
            </button>
          </div>
          {importedOptions.length === 0 && (
            <p className="muted small px-1" data-testid="compare-no-imports">{t('compare_no_imports_yet')}</p>
          )}
          {importedOptions.length > 0 && (
            <div className="compare-group-items">
              {importedOptions.map((o) => {
                if (o.locked) {
                  return (
                    <div
                      key={o.id}
                      className="compare-row compare-row--locked-import"
                      style={{ ['--c' as 'color']: o.color } as React.CSSProperties}
                      data-testid={`compare-chip-${o.id}`}
                    >
                      <span className="compare-row-select compare-row-select--locked">
                        <span className="compare-row-emoji" aria-hidden="true">{o.emoji}</span>
                        <span className="compare-row-text">
                          <span className="compare-row-name">{o.subject || o.name}</span>
                          {o.subject && <span className="compare-row-sub">{o.name}</span>}
                          <span className="compare-row-locked-label">{t('locked_answers_badge')}</span>
                        </span>
                      </span>
                      <button
                        type="button"
                        className="compare-row-unlock"
                        onClick={() => handleUnlockImport(o.impId)}
                        data-testid={`compare-unlock-${o.id}`}
                      >
                        {t('unlock_answers_btn')}
                      </button>
                    </div>
                  )
                }
                const selected = effectiveIds.includes(o.id)
                const disabled = atMax && !selected
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`compare-row${selected ? ' compare-row--on' : ''}${disabled ? ' compare-row--disabled' : ''}`}
                    style={{ ['--c' as 'color']: o.color } as React.CSSProperties}
                    onClick={() => !disabled && toggleId(o.id)}
                    data-testid={`compare-chip-${o.id}`}
                    aria-pressed={selected}
                    disabled={disabled}
                  >
                    <span className="compare-row-check" aria-hidden="true">
                      {selected ? '✓' : ''}
                    </span>
                    <span className="compare-row-emoji" aria-hidden="true">{o.emoji}</span>
                    <span className="compare-row-text">
                      <span className="compare-row-name">{o.subject || o.name}</span>
                      {o.subject && <span className="compare-row-sub">{o.name}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="btn btn-primary"
          disabled={selectedCount < 2}
          onClick={() => { void handleGoToDetails() }}
          data-testid="compare-go-to-details"
        >
          {t('compare_go_to_details')}
        </button>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg" data-testid="compare-import-modal">
          <DialogTitle>{t('compare_import_title')}</DialogTitle>
          <ImportForm onSuccess={handleImportSuccess} testIdPrefix="compare-import" />
        </DialogContent>
      </Dialog>
    </section>
  )
}
