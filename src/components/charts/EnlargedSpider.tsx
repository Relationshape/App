// RESULT-06, D-07. shadcn Dialog hosting <Spider size={900} />.

import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Spider } from './Spider'
import type { ChartDataset } from './types'
import { t } from '@/lib/i18n/i18n'

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  datasets: readonly ChartDataset[]
  activeAxis?: string | null
  onAxisEnter?: (axis: string) => void
  onAxisLeave?: () => void
  onAxisTap?: (axis: string) => void
}

export function EnlargedSpider(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-[min(90vw,1000px)]" data-testid="enlarged-spider">
        <DialogHeader>
          <DialogTitle>{t('result_enlarged_title')}</DialogTitle>
        </DialogHeader>
        <Spider
          datasets={props.datasets}
          size={900}
          activeAxis={props.activeAxis ?? null}
          {...(props.onAxisEnter && { onAxisEnter: props.onAxisEnter })}
          {...(props.onAxisLeave && { onAxisLeave: props.onAxisLeave })}
          {...(props.onAxisTap && { onAxisTap: props.onAxisTap })}
        />
      </DialogContent>
    </Dialog>
  )
}
