// Numbered scale legend strip — one chip per scale step (1..N).
// Renders above the question list in ListMode and above the card in SingleMode.
// Reads from result.scale ?? storeScale at the caller; chips are styled by step color.

import type { MutableScaleStep } from '@/lib/data/types'

interface Props { scale: readonly MutableScaleStep[] }

export function RsScaleLegend({ scale }: Props) {
  return (
    <div className="scale-legend" data-testid="rs-scale-legend">
      {scale.map((s, i) => (
        <span
          key={s.key}
          className="chip"
          style={{ ['--c' as string]: s.color } as React.CSSProperties}
          title={s.description ?? ''}
        >
          <span className="chip-num">{i + 1}</span> {s.short || s.label}
        </span>
      ))}
    </div>
  )
}
