// RESULT-02, D-06. Active-axis state for the spider chart. Replaces v1.0 bindSpiderInteractivity at public/legacy/js/charts.js:238-297.

import { useCallback, useState } from 'react'
import type { ChartDataset } from '@/components/charts/types'

interface UseSpiderInteractionReturn {
  activeAxis: string | null
  setActiveAxis: (axis: string | null) => void
  onAxisEnter: (axis: string) => void
  onAxisLeave: () => void
  onAxisTap: (axis: string) => void
}

export function useSpiderInteraction(_datasets: readonly ChartDataset[]): UseSpiderInteractionReturn {
  const [activeAxis, setActiveAxis] = useState<string | null>(null)
  const onAxisEnter = useCallback((axis: string) => { setActiveAxis(axis) }, [])
  const onAxisLeave = useCallback(() => { setActiveAxis(null) }, [])
  const onAxisTap = useCallback((axis: string) => {
    setActiveAxis((prev) => (prev === axis ? null : axis))
  }, [])
  return { activeAxis, setActiveAxis, onAxisEnter, onAxisLeave, onAxisTap }
}
