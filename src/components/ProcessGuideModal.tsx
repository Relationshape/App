import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { t } from '@/lib/i18n/i18n'
import type { TranslationKey } from '@/lib/i18n/en'

type TKey = TranslationKey

interface Section {
  icon: string
  titleKey: TKey
  bodyKey: TKey
}

type PageDef =
  | { type: 'intro'; icon: string; titleKey: TKey; bodyKey: TKey; noteKey: TKey }
  | { type: 'single'; icon: string; titleKey: TKey; bodyKey: TKey }
  | { type: 'multi'; icon: string; headingKey?: TKey; sections: Section[] }

const PAGES: PageDef[] = [
  {
    type: 'intro',
    icon: '🗺️',
    titleKey: 'guide_p1_title',
    bodyKey: 'guide_p1_body',
    noteKey: 'guide_p1_note',
  },
  {
    type: 'single',
    icon: '🔐',
    titleKey: 'guide_p2_title',
    bodyKey: 'guide_p2_body',
  },
  {
    type: 'single',
    icon: '💛',
    titleKey: 'guide_p3_title',
    bodyKey: 'guide_p3_body',
  },
  {
    type: 'multi',
    icon: '👥',
    sections: [
      { icon: '📖', titleKey: 'guide_p4_s1_title', bodyKey: 'guide_p4_s1_body' },
      { icon: '☑️', titleKey: 'guide_p4_s2_title', bodyKey: 'guide_p4_s2_body' },
    ],
  },
  {
    type: 'multi',
    icon: '✍️',
    headingKey: 'guide_p5_heading',
    sections: [
      { icon: '📤', titleKey: 'guide_p5_s1_title', bodyKey: 'guide_p5_s1_body' },
      { icon: '🎚️', titleKey: 'guide_p5_s2_title', bodyKey: 'guide_p5_s2_body' },
      { icon: '🤫', titleKey: 'guide_p5_s3_title', bodyKey: 'guide_p5_s3_body' },
    ],
  },
  {
    type: 'multi',
    icon: '🔍',
    headingKey: 'guide_p6_heading',
    sections: [
      { icon: '↕️', titleKey: 'guide_p6_s1_title', bodyKey: 'guide_p6_s1_body' },
      { icon: '📊', titleKey: 'guide_p6_s2_title', bodyKey: 'guide_p6_s2_body' },
    ],
  },
  {
    type: 'multi',
    icon: '💬',
    headingKey: 'guide_p7_heading',
    sections: [
      { icon: '🗣️', titleKey: 'guide_p7_s1_title', bodyKey: 'guide_p7_s1_body' },
      { icon: '🌱', titleKey: 'guide_p7_s2_title', bodyKey: 'guide_p7_s2_body' },
    ],
  },
  {
    type: 'multi',
    icon: '🌟',
    headingKey: 'guide_p8_heading',
    sections: [
      { icon: '🔄', titleKey: 'guide_p8_s1_title', bodyKey: 'guide_p8_s1_body' },
      { icon: '✨', titleKey: 'guide_p8_s2_title', bodyKey: 'guide_p8_s2_body' },
    ],
  },
]

const TOTAL = PAGES.length

export function ProcessGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (open) setPage(0)
  }, [open])

  const current = PAGES[page]
  if (!current) return null

  const isFirst = page === 0
  const isLast = page === TOTAL - 1

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="guide-wiz-dialog" data-testid="process-guide-modal">
        <DialogTitle className="sr-only">{t('guide_howto_btn')}</DialogTitle>

        {/* Progress dots */}
        <div className="guide-wiz-dots" aria-label="progress" role="tablist">
          {PAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === page}
              className={`guide-wiz-dot${i === page ? ' guide-wiz-dot--active' : ''}${i < page ? ' guide-wiz-dot--done' : ''}`}
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>

        {/* Page content */}
        <div className="guide-wiz-page" key={page}>
          <div className="guide-wiz-page-icon" aria-hidden="true">{current.icon}</div>

          {current.type === 'intro' && (
            <>
              <h2 className="guide-wiz-page-title">{t(current.titleKey)}</h2>
              <p className="guide-wiz-body">{t(current.bodyKey)}</p>
              <div className="guide-wiz-note">
                <span className="guide-wiz-note-icon" aria-hidden="true">💡</span>
                <span>{t(current.noteKey)}</span>
              </div>
            </>
          )}

          {current.type === 'single' && (
            <>
              <h2 className="guide-wiz-page-title">{t(current.titleKey)}</h2>
              <p className="guide-wiz-body">{t(current.bodyKey)}</p>
            </>
          )}

          {current.type === 'multi' && (
            <>
              {current.headingKey && (
                <h2 className="guide-wiz-page-title">{t(current.headingKey)}</h2>
              )}
              <div className="guide-wiz-sections">
                {current.sections.map((s) => (
                  <div key={s.titleKey} className="guide-wiz-section">
                    <div className="guide-wiz-section-icon" aria-hidden="true">{s.icon}</div>
                    <div className="guide-wiz-section-content">
                      <strong className="guide-wiz-section-title">{t(s.titleKey)}</strong>
                      <p className="guide-wiz-section-body">{t(s.bodyKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer nav */}
        <div className="guide-wiz-footer">
          <button
            type="button"
            className="btn btn-ghost guide-wiz-back"
            onClick={() => setPage((p) => p - 1)}
            style={{ visibility: isFirst ? 'hidden' : 'visible' }}
            data-testid="guide-wiz-back"
          >
            {t('guide_back')}
          </button>
          <button
            type="button"
            className={`btn ${isLast ? 'btn-primary' : 'btn-outline'} guide-wiz-next`}
            onClick={() => { if (isLast) { onClose() } else { setPage((p) => p + 1) } }}
            data-testid="guide-wiz-next"
          >
            {isLast ? t('guide_done') : t('guide_next')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
