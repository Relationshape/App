// Shared dataset shape for all chart components. D-04.

import type { AnswersBlob, CustomItemDef, CustomCategoryDef } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'

export interface ChartDataset {
  /** Display label (profile name + subject). Rendered via React text node — XSS-safe. */
  name: string
  /** Accent colour (hex). Used as polygon fill / axis tint. */
  color: string
  /** Optional avatar emoji */
  emoji?: string
  /** The user's answers for this map */
  answers: AnswersBlob
  /** The active scale for this map (may differ per result via scale override) */
  scale: readonly MutableScaleStep[]
  /** Optional ID for keying tooltips and tab-targets */
  id?: string
  /** Custom item format definitions: catId → itemName → def */
  customItemDefs?: Record<string, Record<string, CustomItemDef>>
  /** Custom category definitions for this dataset */
  customCategories?: CustomCategoryDef[]
}
