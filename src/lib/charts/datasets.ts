// Dataset adapters: Result → ChartDataset, Import → ChartDataset. v1.0 analogs: resultLabel/importLabel at public/legacy/js/app.js.

import type { Result, Import, Profile } from '@/lib/storage/types'
import type { ChartDataset } from '@/components/charts/types'
import { useStore } from '@/lib/storage/store'

export function resultLabel(result: Result, profile: Profile | null): string {
  const who = profile?.name ?? 'Unknown'
  const subject = result.subject?.trim()
  return subject ? `${who} · ${subject}` : who
}

export function importLabel(imp: Import): string {
  const who = imp.name?.trim() || 'Anonymous'
  const subj = imp.subject?.trim()
  return subj ? `${who} · ${subj}` : who
}

function resolveScale(maybe: Result['scale'] | Import['scale']) {
  if (maybe && maybe.length > 0) return maybe
  return useStore.getState().scale
}

export function mapResultToDataset(result: Result, profile: Profile | null): ChartDataset {
  return {
    id: result.id,
    name: resultLabel(result, profile),
    color: result.subjectColor || profile?.color || '#7c3aed',
    emoji: result.subjectEmoji || profile?.emoji || '💞',
    answers: result.answers,
    scale: resolveScale(result.scale),
  }
}

export function mapImportToDataset(imp: Import): ChartDataset {
  return {
    id: `imp:${imp.id}`,
    name: importLabel(imp),
    color: imp.subjectColor || imp.color || '#7c3aed',
    emoji: imp.subjectEmoji || imp.emoji || '📨',
    answers: imp.answers,
    scale: resolveScale(imp.scale),
  }
}
