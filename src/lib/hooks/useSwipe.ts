// QUEST-03, PROFILE-05, D-08, D-09. Axis-locked drag wrapper over @use-gesture/react.
import { useDrag } from '@use-gesture/react'
import { useReducedMotion } from './useReducedMotion'

interface UseSwipeOpts {
  onLeft?: () => void
  onRight?: () => void
  threshold?: number  // default 40 to match v1.0
}

export function useSwipe(opts: UseSwipeOpts) {
  const reduced = useReducedMotion()
  return useDrag(
    ({ movement: [mx], last }) => {
      if (last) {
        const t = opts.threshold ?? 40
        if (mx < -t) opts.onLeft?.()
        else if (mx > t) opts.onRight?.()
      }
    },
    {
      axis: 'x',
      pointer: { touch: true },
      filterTaps: true,
      // Under reduced-motion, disable rubberband/spring visuals — handler still fires
      rubberband: reduced ? 0 : 0.15,
    },
  )
}
