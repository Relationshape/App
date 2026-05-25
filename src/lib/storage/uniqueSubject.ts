/**
 * Returns `candidate` if it is not already in `existing`,
 * otherwise appends " v2", " v3", … until a free name is found.
 * Only the subject string is modified — no content is touched.
 */
export function uniqueSubject(candidate: string, existing: string[]): string {
  if (!existing.includes(candidate)) return candidate
  let v = 2
  while (existing.includes(`${candidate} v${v}`)) v++
  return `${candidate} v${v}`
}
