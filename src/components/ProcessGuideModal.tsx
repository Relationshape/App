import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n/i18n'

const STEPS = [
  { titleKey: 'guide_step1_title', bodyKey: 'guide_step1_body' },
  { titleKey: 'guide_step2_title', bodyKey: 'guide_step2_body' },
  { titleKey: 'guide_step3_title', bodyKey: 'guide_step3_body' },
  { titleKey: 'guide_step4_title', bodyKey: 'guide_step4_body' },
  { titleKey: 'guide_step5_title', bodyKey: 'guide_step5_body' },
  { titleKey: 'guide_step6_title', bodyKey: 'guide_step6_body' },
  { titleKey: 'guide_step7_title', bodyKey: 'guide_step7_body' },
  { titleKey: 'guide_step8_title', bodyKey: 'guide_step8_body' },
  { titleKey: 'guide_step9_title', bodyKey: 'guide_step9_body' },
] as const

export function ProcessGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg" data-testid="process-guide-modal">
        <DialogHeader>
          <DialogTitle>{t('guide_title')}</DialogTitle>
          <DialogDescription>{t('guide_sub')}</DialogDescription>
        </DialogHeader>

        <div className="guide-body">
          <div className="guide-prep">
            <strong className="guide-prep-title">{t('guide_prep_title')}</strong>
            <p className="guide-prep-body">{t('guide_prep_body')}</p>
          </div>

          <ol className="guide-steps">
            {STEPS.map(({ titleKey, bodyKey }, i) => (
              <li key={i} className="guide-step">
                <span className="guide-step-num" aria-hidden>{i + 1}</span>
                <div className="guide-step-content">
                  <strong className="guide-step-title">{t(titleKey)}</strong>
                  <p className="guide-step-body">{t(bodyKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <DialogFooter>
          <Button onClick={onClose} data-testid="process-guide-close">{t('guide_close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
