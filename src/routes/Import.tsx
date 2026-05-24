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
import { t } from '@/lib/i18n/i18n'
import type { Import, CustomCategoryDef } from '@/lib/storage/types'

interface AdoptState {
  imp: Import
  cats: CustomCategoryDef[]
}

export function Import() {
  const navigate = useNavigate()
  const profiles = useStore((s) => s.profiles)
  const results = useStore((s) => s.results)
  const updateProfile = useStore((s) => s.updateProfile)
  const { openShare } = useShareData()

  const [adoptState, setAdoptState] = useState<AdoptState | null>(null)
  const [adoptProfileId, setAdoptProfileId] = useState<string>('')

  const exportGroups = profiles
    .map((p) => ({ profile: p, results: results.filter((r) => r.profileId === p.id) }))
    .filter((g) => g.results.length > 0)

  function onImportSuccess(imp: Import) {
    const cats = imp.customCategories
    if (cats && cats.length > 0 && profiles.length > 0) {
      setAdoptProfileId(profiles[0]?.id ?? '')
      setAdoptState({ imp, cats })
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
      // Locked restricted import: go to profile page so the user can create new maps
      // with the adopted categories; the locked card is visible in the profile's locked section
      const profileId = adoptProfileId || profiles[0]?.id
      if (profileId) { navigate(`/profile/${profileId}`); return }
    }
    goToCompare(imp)
  }

  function confirmAdopt() {
    if (!adoptState) return
    const profile = profiles.find((p) => p.id === adoptProfileId)
    if (profile) {
      const existingIds = new Set((profile.customCategories ?? []).map((c) => c.id))
      const toAdd = adoptState.cats.filter((c) => !existingIds.has(c.id))
      if (toAdd.length > 0) {
        updateProfile(profile.id, {
          customCategories: [...(profile.customCategories ?? []), ...toAdd],
        })
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

  // Categories from the import that are not yet in the currently selected profile
  const selectedProfile = profiles.find((p) => p.id === adoptProfileId)
  const existingIds = new Set((selectedProfile?.customCategories ?? []).map((c) => c.id))
  const newCats = (adoptState?.cats ?? []).filter((c) => !existingIds.has(c.id))
  const alreadyCats = (adoptState?.cats ?? []).filter((c) => existingIds.has(c.id))

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
            disabled={newCats.length === 0}
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
