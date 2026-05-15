// src/router.tsx
// SHELL-01, SHELL-02, D-13, D-24. Full route table; plans 3-7 replace placeholders with real views.
import { createHashRouter } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { DesignSystem } from './routes/DesignSystem'
import { Home } from './routes/Home'
import { Welcome } from './routes/Welcome'
import { ProfileEdit } from './routes/ProfileEdit'
import { ProfileDetail } from './routes/ProfileDetail'
import { Intro } from './routes/Intro'
import { CategoryOverview } from './routes/CategoryOverview'
import { Questionnaire } from './routes/Questionnaire'
import { Result, Share, Import, Compare, Settings, MapSettings } from './routes/_placeholders'

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
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
      { path: 'settings', element: <Settings /> },
      { path: 'map/:id/settings', element: <MapSettings /> },
      { path: 'intro', element: <Intro /> },
      { path: 'about', element: <Intro /> },
      { path: 'design-system', element: <DesignSystem /> },
    ],
  },
])
