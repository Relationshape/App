// src/router.tsx
// SHELL-01, SHELL-02, D-13, D-24. Full route table; plans 3-7 replace placeholders with real views.
import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { DesignSystem } from './routes/DesignSystem'
import { Home } from './routes/Home'
import { Welcome } from './routes/Welcome'
import { ProfileEdit } from './routes/ProfileEdit'
import { ProfileDetail } from './routes/ProfileDetail'
import { Intro } from './routes/Intro'
import { CategoryOverview } from './routes/CategoryOverview'
import { Questionnaire } from './routes/Questionnaire'
import { Result } from './routes/Result'
import { Share } from './routes/Share'
import { Import } from './routes/Import'
import { Compare } from './routes/Compare'
import { CompareDetails } from './routes/CompareDetails'
import { Settings } from './routes/Settings'
import { MapSettings } from './routes/MapSettings'
import { ImportView } from './routes/ImportView'
import { RouteErrorFallback } from './routes/RouteErrorFallback'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <Home /> },
      { path: 'welcome', element: <Welcome /> },
      { path: 'profile/new', element: <ProfileEdit /> },
      { path: 'profile/:id', element: <ProfileDetail /> },
      { path: 'profile/:id/edit', element: <ProfileEdit /> },
      { path: 'q-categories/:profileId/:resultId', element: <CategoryOverview /> },
      { path: 'q/:profileId/:resultId', element: <Questionnaire /> },
      { path: 'result/:id', element: <Result /> },
      { path: 'result/:id/:catId', element: <Result /> },
      { path: 'share/:id', element: <Share /> },
      { path: 'import', element: <Import /> },
      { path: 'compare', element: <Compare /> },
      { path: 'compare/details', element: <CompareDetails /> },
      { path: 'settings', element: <Settings /> },
      { path: 'map/:id/settings', element: <MapSettings /> },
      { path: 'import-view/:importId', element: <ImportView /> },
      { path: 'intro', element: <Intro /> },
      { path: 'about', element: <Intro /> },
      { path: 'design-system', element: <DesignSystem /> },
    ],
  },
])
