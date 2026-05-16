// Pure helpers for the imports pool. v1.0 analogs: app.js:isTemplateImport, importLabel.

import type { Import } from '@/lib/storage/types'

// Template imports are seed bundles distributed by the project — they should NOT
// appear in the Home imports list. v1.0 checks at public/legacy/js/app.js:1028-1033:
//   if (imp.exportMode === "template") return true;
//   if (imp.exportMode === "restricted" && !imp.answersUnlocked) return true;
//   return false;
export function isTemplateImport(imp: Import): boolean {
  if (imp.exportMode === 'template') return true
  if (imp.exportMode === 'restricted' && !imp.answersUnlocked) return true
  return false
}

// v1.0 analog: importLabel(imp) at public/legacy/js/app.js:65-68
// v1.0 uses: `${imp.name} → ${imp.subject}${v}` — adapted for optional fields.
export function importLabel(imp: Import): string {
  const who = imp.name?.trim() || 'Anonymous'
  const subj = imp.subject?.trim()
  return subj ? `${who} · ${subj}` : who
}
