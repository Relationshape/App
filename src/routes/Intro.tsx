// PROFILE-07. Port of public/legacy/js/app.js:3895-3917. D-11 flat-i18n. D-12 RICH_TEXT_KEYS via TranslatedText.

import { TranslatedText } from '@/lib/i18n/richText'
import { t } from '@/lib/i18n/i18n'

export function Intro() {
  return (
    <section className="page narrow prose" data-testid="intro-page">
      <h1>{t('about_title')}</h1>
      <p>{t('about_p1')}</p>
      <p>{t('about_p2')}</p>
      <h2>{t('about_how_title')}</h2>
      <ol>
        <li>{t('about_how_1')}</li>
        <li>{t('about_how_2')}</li>
        <li>{t('about_how_3')} <em>Need → No</em> {t('about_how_3b')}</li>
        <li>{t('about_how_4')}</li>
        <li>{t('about_how_5')}</li>
      </ol>
      <h2>{t('about_privacy_title')}</h2>
      <p>{t('about_privacy')}</p>
      <h2>{t('about_credits_title')}</h2>
      <p>
        <TranslatedText k="about_credits" />{' '}
        <a href="https://github.com/Relationshape/Relationshape-Pre-release-1" target="_blank" rel="noopener">
          <TranslatedText k="about_credits_repo" />
        </a>
        .{' '}
        <TranslatedText k="about_credits_unofficial" />
      </p>
    </section>
  )
}
