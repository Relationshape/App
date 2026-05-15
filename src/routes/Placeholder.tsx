// src/routes/Placeholder.tsx
// FOUND-02 sanity: Tailwind utilities derived from v2.0 @theme tokens resolve here.
// FOUND-07: renders at / while the legacy app remains reachable at /legacy/.

import { Link } from 'react-router-dom'
import { t } from '@/lib/i18n/i18n'

export function Placeholder() {
  return (
    <main className="min-h-screen bg-bg text-text font-sans p-8 max-w-3xl mx-auto">
      <h1 className="font-heading text-4xl text-primary">{t('welcome_title')}</h1>
      <p className="mt-4 text-muted">
        Relationshape v2.0 skeleton is alive. Open{' '}
        <Link to="/design-system" className="underline text-accent">
          /design-system
        </Link>{' '}
        for the theme + animation reference.
      </p>
      <p className="mt-2 text-muted text-sm">
        The legacy v1.0 app is still available at{' '}
        <a href="/legacy/" className="underline">
          /legacy/
        </a>{' '}
        for parity checks during the migration.
      </p>
    </main>
  )
}
