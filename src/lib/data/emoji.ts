// EMOJI_BANK ported verbatim from public/legacy/js/app.js:97-105 for the bespoke picker (D-21).
// CONCERNS Pitfall 14: distinct from the 14-entry random-default bank in src/lib/storage/store.ts.

// EMOJI_BANK: 76 entries from public/legacy/js/app.js:97
export const EMOJI_BANK: readonly string[] = [
  '🌷', '🌹', '🌻', '🌼', '🌸', '🪻', '🪷', '🌺', '🌿', '🍀', '🍃', '🌱', '🌳', '🌲', '🌴',
  '🦋', '🐝', '🐞', '🐌', '🐢', '🦊', '🐱', '🐶', '🐰', '🐼', '🦁', '🐯', '🐨', '🦄', '🐲',
  '🌊', '🌙', '☀️', '⭐', '✨', '🌟', '💫', '☁️', '🌈', '🔥', '❄️', '⚡', '🌍', '🌌', '🪐',
  '💞', '💖', '💗', '💓', '💘', '💝', '💜', '💙', '💚', '🧡', '💛', '🤍', '🖤', '🤎',
  '🪩', '🎨', '🎭', '🎵', '🎶', '🎷', '🎸', '🎺', '🪕', '📚', '✏️', '📷', '🎬', '🕯️',
  '☕', '🍵', '🍷', '🍓', '🍑', '🍇', '🥑', '🍩', '🧁', '🍪', '🥐', '🌮', '🍣', '🍜',
  '⚓', '🚲', '🛵', '🏔️', '🏝️', '🛶', '🪁', '🎢', '🎡', '♾️', '🌀', '🪄', '🔮', '🧿',
] as const

// isLikelyEmoji helper from public/legacy/js/app.js:135-139
export function isLikelyEmoji(value: string): boolean {
  if (!value) return false
  if (value.length > 12) return false
  // v1.0 uses /\p{Extended_Pictographic}/u; add length guard per source
  try {
    return /\p{Extended_Pictographic}/u.test(value)
  } catch {
    // Fallback for environments without Unicode property escapes:
    // non-ASCII characters are likely emoji
    return value.charCodeAt(0) > 127
  }
}
