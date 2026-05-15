// src/router.tsx
// D-01: React Router v7 routing library.
// D-02: createHashRouter — v1.0 hash deep links (#/profile/abc, #/q/:profileId/:resultId, ...)
//       resolve verbatim with no server-side fallback.
// D-03: Phase 1 wires only / and /design-system; full route table is a Phase 2 concern.

import { createHashRouter } from 'react-router-dom'
import { Placeholder } from './routes/Placeholder'
import { DesignSystem } from './routes/DesignSystem'

export const router = createHashRouter([
  { path: '/', element: <Placeholder /> },
  { path: '/design-system', element: <DesignSystem /> },
])
