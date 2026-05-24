// Full-page read-only view for an imported result.
// Shows the same spider + category grid experience as Result.tsx but with no edit actions.

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { mapImportToDataset } from '@/lib/charts/datasets'
import { CategoryModal } from '@/components/charts/CategoryModal'
import { RsCategoryCard } from '@/components/RsCategoryCard'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { CATEGORIES } from '@/lib/data/data'
import { resolveAnyCat } from '@/lib/data/customCategories'
import { fmtDate } from '@/lib/format/date'
import { t, getLang } from '@/lib/i18n/i18n'
import { useToast } from '@/lib/hooks/useToast'
import type { ResolvedCat } from '@/lib/data/customCategories'
import type { Import, Profile, CustomItemDef } from '@/lib/storage/types'

type CategoryDef = (typeof CATEGORIES)[number]

const STANDARD_CAT_IDS = new Set<string>(CATEGORIES.map((c) => c.id))

function hasNewContentForAnyProfile(imp: Import, profiles: Profile[]): boolean {
  const impCats = imp.customCategories ?? []
  if (impCats.length > 0) {
    const allIds = new Set(profiles.flatMap((p) => (p.customCategories ?? []).map((c) => c.id)))
    if (impCats.some((c) => !allIds.has(c.id))) return true
  }
  for (const [catId, items] of Object.entries(imp.customItemDefs ?? {})) {
    if (!STANDARD_CAT_IDS.has(catId)) continue
    for (const itemName of Object.keys(items)) {
      if (!profiles.some((p) => p.customItemDefs?.[catId]?.[itemName])) return true
    }
  }
  return false
}

export function ImportView() {
  const { importId } = useParams<{ importId: string }>()
  const navigate = useNavigate()
  const imp = useStore((s) => (importId ? s.imports.find((i) => i.id === importId) ?? null : null))
  const profiles = useStore((s) => s.profiles)
  const updateProfile = useStore((s) => s.updateProfile)

  const [modalCat, setModalCat] = useState<ResolvedCat | CategoryDef | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [showAdopt, setShowAdopt] = useState(false)
  const [adoptProfileId, setAdoptProfileId] = useState('')
  const hasShownAdoptRef = useRef(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!imp || hasShownAdoptRef.current || profiles.length === 0) return
    if (hasNewContentForAnyProfile(imp, profiles)) {
      hasShownAdoptRef.current = true
      setAdoptProfileId(profiles[0]?.id ?? '')
      setShowAdopt(true)
    }
    // Only run when the viewed import changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imp?.id])

  if (!imp) {
    navigate('/')
    return null
  }

  const lang = getLang()
  const dataset = mapImportToDataset(imp)
  const datasets = [dataset]
  const allProfileCats = profiles.flatMap((p) => p.customCategories ?? [])

  // Include custom category IDs from the import even if not explicitly in enabledCategories
  const enabledIds = [...new Set([
    ...(imp.enabledCategories ?? CATEGORIES.map((c) => c.id)),
    ...(imp.customCategories ?? []).map((c) => c.id),
  ])]
  const enabledCats = enabledIds
    .map((id) => resolveAnyCat(id, imp.customCategories, allProfileCats))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const v = (imp.version ?? 1) > 1 ? ` (v${imp.version})` : ''
  const title = (imp.subject?.trim() || imp.name?.trim() || 'Imported result') + v

  async function handlePdfReport() {
    if (!imp || generatingPdf) return
    setGeneratingPdf(true)
    toast.message(t('pdf_generating'))
    try {
      const { generatePdfReport } = await import('@/lib/pdf/generateReport')
      const allCatIds = Array.from(new Set([
        ...enabledIds,
        ...(imp.customCategories ?? []).map((c) => c.id),
      ]))
      const mapName = (imp.subject?.trim() || imp.name?.trim() || 'import')
      const safeFilename = `relationshapes-${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      const ok = await generatePdfReport({
        datasets,
        categoryIds: allCatIds,
        lang,
        filename: safeFilename,
      })
      if (!ok) toast.message(t('pdf_no_answers'))
    } finally {
      setGeneratingPdf(false)
    }
  }

  // ── Adopt dialog ────────────────────────────────────────────────────────────
  const selectedProfile = profiles.find((p) => p.id === adoptProfileId)
  const existingCatIds = new Set((selectedProfile?.customCategories ?? []).map((c) => c.id))
  const impCats = imp.customCategories ?? []
  const newCats = impCats.filter((c) => !existingCatIds.has(c.id))
  const alreadyCats = impCats.filter((c) => existingCatIds.has(c.id))

  const impItemDefs = Object.fromEntries(
    Object.entries(imp.customItemDefs ?? {}).filter(([catId]) => STANDARD_CAT_IDS.has(catId))
  )
  const newItemsByCatDisplay: { catId: string; catName: string; items: string[] }[] = []
  const alreadyItemsByCatDisplay: { catId: string; catName: string; items: string[] }[] = []
  for (const [catId, items] of Object.entries(impItemDefs)) {
    const stdCat = CATEGORIES.find((c) => c.id === catId)
    const catName = (lang === 'de' && stdCat?.de ? stdCat.de : stdCat?.title) ?? catId
    const existing = selectedProfile?.customItemDefs?.[catId] ?? {}
    const newNames = Object.keys(items).filter((n) => !existing[n])
    const alreadyNames = Object.keys(items).filter((n) => !!existing[n])
    if (newNames.length > 0) newItemsByCatDisplay.push({ catId, catName, items: newNames })
    if (alreadyNames.length > 0) alreadyItemsByCatDisplay.push({ catId, catName, items: alreadyNames })
  }
  const hasAnythingNew = newCats.length > 0 || newItemsByCatDisplay.length > 0

  function confirmAdopt() {
    const profile = profiles.find((p) => p.id === adoptProfileId)
    if (profile) {
      const toAddCats = impCats.filter((c) => !existingCatIds.has(c.id))
      if (toAddCats.length > 0) {
        updateProfile(profile.id, {
          customCategories: [...(profile.customCategories ?? []), ...toAddCats],
        })
      }
      const newItemsByCat: Record<string, Record<string, CustomItemDef>> = {}
      for (const [catId, items] of Object.entries(impItemDefs)) {
        const existing = profile.customItemDefs?.[catId] ?? {}
        const toAdd = Object.fromEntries(Object.entries(items).filter(([n]) => !existing[n]))
        if (Object.keys(toAdd).length > 0) newItemsByCat[catId] = toAdd
      }
      if (Object.keys(newItemsByCat).length > 0) {
        const merged: Record<string, Record<string, CustomItemDef>> = { ...(profile.customItemDefs ?? {}) }
        for (const [catId, items] of Object.entries(newItemsByCat)) {
          merged[catId] = { ...(merged[catId] ?? {}), ...items }
        }
        updateProfile(profile.id, { customItemDefs: merged })
      }
    }
    setShowAdopt(false)
  }

  return (
    <section className="page" data-testid="import-view-page">
      <header
        className="result-head"
        style={{ ['--c' as 'color']: dataset.color } as React.CSSProperties}
      >
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          data-testid="import-view-back"
          className="result-back-btn"
        >
          {t('btn_back')}
        </Button>
        <div className="li-avatar text-3xl">{imp.emoji || '📨'}</div>
        <div className="result-head-info">
          <h1 data-testid="import-view-title">{title}</h1>
          <p className="muted small" data-testid="import-view-subtitle">
            {`${imp.name?.trim() || ''} · ${t('imported_on')} ${fmtDate(imp.importedAt)}`}
          </p>
        </div>
        <div className="result-head-actions">
          <Button
            variant="outline"
            onClick={() => { void handlePdfReport() }}
            disabled={generatingPdf}
            data-testid="import-view-pdf"
          >
            {t('btn_pdf_report')}
          </Button>
        </div>
      </header>

      <section className="page-section" data-testid="import-view-cat-grid-section">
        <header className="section-head">
          <h2>{t('by_category')}</h2>
        </header>
        <div className="cat-grid">
          {enabledCats.map((cat) => (
            <RsCategoryCard
              key={cat.id}
              cat={cat}
              datasets={datasets}
              editableResult={null}
              fabiMode={false}
              onClick={() => setModalCat(cat)}
              testId={`import-view-cat-${cat.id}`}
            />
          ))}
        </div>
      </section>

      <CategoryModal
        open={modalCat !== null}
        onOpenChange={(open) => { if (!open) setModalCat(null) }}
        datasets={datasets}
        cat={modalCat}
        result={null}
      />

      <Dialog open={showAdopt} onOpenChange={(o) => { if (!o) setShowAdopt(false) }}>
        <DialogContent data-testid="import-view-adopt-dialog">
          <DialogTitle>{t('import_adopt_cats_title')}</DialogTitle>
          <p className="muted small">{t('import_adopt_cats_body')}</p>

          {(newCats.length > 0 || alreadyCats.length > 0) && (
            <ul className="flex flex-col gap-1 my-1">
              {newCats.map((cat) => (
                <li key={cat.id} className="flex items-center gap-2 text-sm">
                  <span aria-hidden>{cat.icon}</span>
                  <span className="font-medium" style={{ color: cat.color }}>{cat.title}</span>
                </li>
              ))}
              {alreadyCats.map((cat) => (
                <li key={cat.id} className="flex items-center gap-2 text-sm opacity-40">
                  <span aria-hidden>{cat.icon}</span>
                  <span>{cat.title}</span>
                  <span className="text-xs">✓</span>
                </li>
              ))}
            </ul>
          )}

          {(newItemsByCatDisplay.length > 0 || alreadyItemsByCatDisplay.length > 0) && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted mb-1">{t('import_adopt_items_header')}</p>
              <ul className="flex flex-col gap-1">
                {newItemsByCatDisplay.map(({ catId, catName, items }) => (
                  <li key={catId} className="text-sm">
                    <span className="font-medium">{catName}:</span>{' '}
                    <span className="muted">{items.join(' · ')}</span>
                  </li>
                ))}
                {alreadyItemsByCatDisplay.map(({ catId, catName, items }) => (
                  <li key={catId} className="text-sm opacity-40">
                    <span>{catName}:</span>{' '}
                    <span>{items.join(' · ')}</span>{' '}
                    <span className="text-xs">✓</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profiles.length > 1 && (
            <div className="flex flex-col gap-1 mt-1">
              <label className="text-sm font-medium">{t('import_adopt_cats_select_profile')}</label>
              <select
                value={adoptProfileId}
                onChange={(e) => setAdoptProfileId(e.target.value)}
                className="rounded border border-line bg-surface px-2 py-1 text-sm"
                data-testid="import-view-adopt-profile-select"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdopt(false)} data-testid="import-view-adopt-skip">
              {t('btn_skip')}
            </Button>
            <Button
              onClick={confirmAdopt}
              disabled={!hasAnythingNew}
              data-testid="import-view-adopt-confirm"
            >
              {t('import_adopt_cats_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
