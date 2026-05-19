// Phase-04 D-03. "Compare with someone" section used on the Result page.
// React port of public/legacy/js/app.js:3212-3279 (`compareTargetPicker`).
//
// Two sub-sections:
//   1. Overlay your own maps  — one RsCompareTile per OTHER own-result.
//                               Omitted entirely when there are no others.
//   2. Compare with imported  — one tile per import + Import… tile at the end.
//                               ALWAYS rendered so the Import… tile is reachable.
//
// Empty state: when both lists are empty → a single muted <p>{t('no_compare')}</p>.
//
// CSS already present in src/styles/legacy-components.css:
//   .compare-pickers-split / .compare-section / .compare-section-title /
//   .compare-grid / .compare-tile.compare-tile-import     (no new CSS).

import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { RsCompareTile } from '@/components/RsCompareTile'
import { Button } from '@/components/ui/button'
import { fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'

export interface CompareWithSomeoneProps {
  /** The current result viewed on /result/:id — excluded from "Overlay your own maps". */
  currentResultId: string
}

export function CompareWithSomeone({ currentResultId }: CompareWithSomeoneProps) {
  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const imports = useStore((s) => s.imports)
  const navigate = useNavigate()

  const others = results.filter((r) => r.id !== currentResultId)

  // Empty state — neither own-maps NOR imports to show.
  if (others.length === 0 && imports.length === 0) {
    return (
      <div className="flex flex-col gap-3 items-start" data-testid="compare-with-empty">
        <p className="muted">{t('no_compare')}</p>
        <Button onClick={() => navigate('/import')} data-testid="compare-empty-import-btn">
          {t('btn_import_map')}
        </Button>
      </div>
    )
  }

  return (
    <div className="compare-pickers-split" data-testid="compare-with">
      {others.length > 0 && (
        <div className="compare-section">
          <h3 className="compare-section-title">{t('compare_own_maps')}</h3>
          <div className="compare-grid">
            {others.map((o) => {
              const ownerProfile = profiles.find((p) => p.id === o.profileId) ?? null
              const color = o.subjectColor || ownerProfile?.color || '#7c3aed'
              const emoji = o.subjectEmoji || ownerProfile?.emoji || '💞'
              const title = `${ownerProfile?.name ?? '?'} → ${o.subject ?? ''}`
              const sub = `${t('updated')} ${fmtDate(o.updatedAt)}`
              return (
                <RsCompareTile
                  key={o.id}
                  color={color}
                  emoji={emoji}
                  title={title}
                  sub={sub}
                  onClick={() => navigate(`/compare?ids=${currentResultId},${o.id}`)}
                  testId={`compare-with-own-${o.id}`}
                  ariaLabel={title}
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="compare-section">
        <h3 className="compare-section-title">{t('compare_imports_title')}</h3>
        <div className="compare-grid">
          {imports.map((i) => {
            const color = i.color || '#7c3aed'
            const emoji = i.emoji || '📨'
            const title = `${i.name ?? '?'} → ${i.subject ?? ''}`
            const sub = `${t('imported_on')} ${fmtDate(i.importedAt)}`
            return (
              <RsCompareTile
                key={`imp:${i.id}`}
                color={color}
                emoji={emoji}
                title={title}
                sub={sub}
                onClick={() => navigate(`/compare?ids=${currentResultId},imp:${i.id}`)}
                testId={`compare-with-imp-${i.id}`}
                ariaLabel={title}
              />
            )
          })}
          {/* Import… tile is ALWAYS rendered last so users can reach /import from any state. */}
          <RsCompareTile
            color="#7c3aed"
            emoji="📥"
            title={t('btn_import_map')}
            onClick={() => navigate('/import')}
            className="compare-tile-import"
            testId="compare-with-import-cta"
            ariaLabel={t('btn_import_map')}
          />
        </div>
      </div>
    </div>
  )
}
