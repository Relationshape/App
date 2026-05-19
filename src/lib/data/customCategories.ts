import { CATEGORIES } from './data'
import type { CustomCategoryDef } from '@/lib/storage/types'

export const CUSTOM_CAT_COLORS = [
  '#7c3aed', '#ec4899', '#10b981', '#f59e0b',
  '#06b6d4', '#ef4444', '#a78bfa', '#22c55e',
]

export const QUICK_EMOJIS = [
  // symbols
  '✶', '⭐', '💫', '🌟', '✨', '💥', '🔮', '💡', '🎯', '🏆', '🎖️', '🔑',
  // hearts
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💝', '💖',
  // faces
  '😊', '😍', '🥰', '🤩', '😎', '🧐', '🤔', '😌', '🫶', '🙏',
  // people & social
  '👥', '🤝', '🫂', '💪', '🙌', '🗣️', '👁️', '🧠', '🫀',
  // nature
  '🦋', '🌈', '🌊', '🌿', '🌺', '🍃', '☀️', '🌙', '⚡', '❄️', '🔥', '🌱', '🪴',
  // animals
  '🦁', '🐬', '🦊', '🦅', '🐉', '🦄', '🐝',
  // objects & activities
  '🎨', '🎵', '💎', '🚀', '✈️', '🏠', '💼', '🎪', '🧩', '🎭', '🎁', '🔬', '⚙️', '📚', '🎓',
]

export function makeCustomCatId(): string {
  const r = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  return `ccat-${r.replace(/-/g, '').slice(0, 8)}`
}

export function nextCustomCatColor(existing: CustomCategoryDef[]): string {
  return CUSTOM_CAT_COLORS[existing.length % CUSTOM_CAT_COLORS.length]!
}

export interface ResolvedCat {
  id: string
  title: string
  de: string
  icon: string
  color: string
  blurb: string
  deBlurb: string
  items: readonly string[]
  deItems: readonly string[]
  gr?: true
  isCustom?: true
}

export function resolveCustomCat(
  id: string,
  resultCats?: CustomCategoryDef[],
  profileCats?: CustomCategoryDef[],
): ResolvedCat | null {
  const def = [...(resultCats ?? []), ...(profileCats ?? [])].find((c) => c.id === id)
  if (!def) return null
  return {
    id: def.id,
    title: def.title,
    de: def.title,
    icon: def.icon,
    color: def.color,
    blurb: '',
    deBlurb: '',
    items: [] as const,
    deItems: [] as const,
    isCustom: true,
  }
}

export function resolveAnyCat(
  catId: string,
  resultCats?: CustomCategoryDef[],
  profileCats?: CustomCategoryDef[],
): ResolvedCat | null {
  const builtin = CATEGORIES.find((c) => c.id === catId)
  if (builtin) return { ...builtin, blurb: builtin.blurb ?? '', deBlurb: builtin.deBlurb ?? '' }
  return resolveCustomCat(catId, resultCats, profileCats)
}
