// SHARE-03, SHARE-04. Port of public/legacy/js/app.js:3359-3437.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/storage/store'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ImportForm } from '@/components/ImportForm'
import { useShareData } from '@/components/providers/ShareDataProvider'
import { CATEGORIES } from '@/lib/data/data'
import { t, getLang } from '@/lib/i18n/i18n'
import type { Import, CustomCategoryDef, CustomItemDef } from '@/lib/storage/types'

const STANDARD_CAT_IDS = new Set<string>(CATEGORIES.map((c) => c.id))

interface AdoptState {
  imp: Import
  cats: CustomCategoryDef[]
  itemDefs: Record<string, Record<string, CustomItemDef>>
}

export function Import() {
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const updateProfile = useStore((s) => s.updateProfile)
  const { openShare } = useShareData()
  const lang = getLang()

  const [adoptState, setAdoptState] = useState<AdoptState | null>(null)
  const [adoptProfileId, setAdoptProfileId] = useState<string>('')

  const exportGroups = profiles
    .map((p) => ({ profile: p, results: results.filter((r) => r.profileId === p.id) }))
    .filter((g) => g.results.length > 0)

  function onImportSuccess(imp: Import) {
    const cats = imp.customCategories ?? []
    const itemDefs = Object.fromEntries(
      Object.entries(imp.customItemDefs ?? {}).filter(([catId]) => STANDARD_CAT_IDS.has(catId))
    )
    if ((cats.length > 0 || Object.keys(itemDefs).length > 0) && profiles.length > 0) {
      setAdoptProfileId(profiles[0]?.id ?? '')
      setAdoptState({ imp, cats, itemDefs })
    } else {
      navigate(`/compare?ids=imp:${imp.id}`)
    }
  }

  function goToCompare(imp: Import) {
    navigate(`/compare?ids=imp:${imp.id}`)
  }

  function navigateAfterAdopt(imp: Import) {
    const storeImp = useStore.getState().imports.find((i) => i.id === imp.id) ?? null
    if (storeImp?.exportMode === 'restricted' && !storeImp.answersUnlocked) {
      const profileId = adoptProfileId || profiles[0]?.id
      if (profileId) { navigate(`/profile/${profileId}`); return }
    }
    goToCompare(imp)
  }

  function confirmAdopt() {
    if (!adoptState) return
    const profile = profiles.find((p) => p.id === adoptProfileId)
    if (profile) {
      // Adopt custom categories
      const existingIds = new Set((profile.customCategories ?? []).map((c) => c.id))
      const toAdd = adoptState.cats.filter((c) => !existingIds.has(c.id))
      if (toAdd.length > 0) {
        updateProfile(profile.id, {
          customCategories: [...(profile.customCategories ?? []), ...toAdd],
        })
      }
      // Adopt custom items for standard categories
      const newItemsByCat: Record<string, Record<string, CustomItemDef>> = {}
      for (const [catId, items] of Object.entries(adoptState.itemDefs)) {
        const existing = profile.customItemDefs?.[catId] ?? {}
        const toAddItems = Object.fromEntries(Object.entries(items).filter(([n]) => !existing[n]))
        if (Object.keys(toAddItems).length > 0) newItemsByCat[catId] = toAddItems
      }
      if (Object.keys(newItemsByCat).length > 0) {
        const merged: Record<string, Record<string, CustomItemDef>> = { ...(profile.customItemDefs ?? {}) }
        for (const [catId, items] of Object.entries(newItemsByCat)) {
          merged[catId] = { ...(merged[catId] ?? {}), ...items }
        }
        updateProfile(profile.id, { customItemDefs: merged })
      }
    }
    const imp = adoptState.imp
    setAdoptState(null)
    navigateAfterAdopt(imp)
  }

  function skipAdopt() {
    if (!adoptState) return
    const imp = adoptState.imp
    setAdoptState(null)
    navigateAfterAdopt(imp)
  }

  const selectedProfile = profiles.find((p) => p.id === adoptProfileId)
  const existingCatIds = new Set((selectedProfile?.customCategories ?? []).map((c) => c.id))
  const newCats = (adoptState?.cats ?? []).filter((c) => !existingCatIds.has(c.id))
  const alreadyCats = (adoptState?.cats ?? []).filter((c) => existingCatIds.has(c.id))

  // Custom items grouped by category for display
  const newItemsByCatDisplay: { catId: string; catName: string; items: string[] }[] = []
  const alreadyItemsByCatDisplay: { catId: string; catName: string; items: string[] }[] = []
  for (const [catId, items] of Object.entries(adoptState?.itemDefs ?? {})) {
    const stdCat = CATEGORIES.find((c) => c.id === catId)
    const catName = (lang === 'de' && stdCat?.de ? stdCat.de : stdCat?.title) ?? catId
    const existing = selectedProfile?.customItemDefs?.[catId] ?? {}
    const newNames = Object.keys(items).filter((n) => !existing[n])
    const alreadyNames = Object.keys(items).filter((n) => !!existing[n])
    if (newNames.length > 0) newItemsByCatDisplay.push({ catId, catName, items: newNames })
    if (alreadyNames.length > 0) alreadyItemsByCatDisplay.push({ catId, catName, items: alreadyNames })
  }

  const hasAnythingNew = newCats.length > 0 || newItemsByCatDisplay.length > 0

  return (
    <>
    <section className="page narrow" data-testid="import-page">
      <header>
        <h1>{t('import_title')}</h1>
        <p className="muted">{t('import_sub')}</p>
      </header>
      <ImportForm onSuccess={onImportSuccess} />

      <hr className="section-divider" />
      <h2>{t('import_section2_title')}</h2>
      <p className="muted">{t('import_section2_text')}</p>
      {exportGroups.length > 0 ? (
        <div className="export-results-list" data-testid="export-results-list">
          {exportGroups.flatMap(({ profile, results: pResults }) => [
            <div key={`head-${profile.id}`} className="export-profile-head">
              <span className="export-profile-avatar">{profile.emoji}</span>
              <strong>{profile.name}</strong>
            </div>,
            ...pResults.map((r) => (
              <div key={r.id} className="export-result-row" data-testid={`export-row-${r.id}`}>
                <span>
                  {(r.subjectEmoji || '💞') + ' ' + (r.subject ?? '')}
                  {(r.version ?? 1) > 1 ? ` (v${r.version})` : ''}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => openShare(r.id)}
                  data-testid={`export-share-${r.id}`}
                >
                  {t('btn_share')}
                </Button>
              </div>
            )),
          ])}
        </div>
      ) : (
        <p className="muted small">{t('import_no_results')}</p>
      )}
    </section>

    <Dialog open={!!adoptState} onOpenChange={(o) => { if (!o) skipAdopt() }}>
      <DialogContent data-testid="import-adopt-cats-dialog">
        <DialogTitle>{t('import_adopt_cats_title')}</DialogTitle>
        <p className="muted small">{t('import_adopt_cats_body')}</p>

        {/* Custom categories */}
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

        {/* Custom items for standard categories */}
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
              data-testid="import-adopt-profile-select"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={skipAdopt} data-testid="import-adopt-skip">{t('btn_skip')}</Button>
          <Button
            onClick={confirmAdopt}
            disabled={!hasAnythingNew}
            data-testid="import-adopt-confirm"
          >
            {t('import_adopt_cats_btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
