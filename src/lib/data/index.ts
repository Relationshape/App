// src/lib/data/index.ts
// Barrel re-export for the data module (CORE-05).

export {
  CATEGORIES,
  DEFAULT_SCALE,
  SPIDER_AXES,
  CATEGORY_GROUPS,
  FILE_FORMAT,
} from './data'
export type { CategoryId, ScaleStep, SpiderAxisId, Lang, MutableScaleStep } from './types'
