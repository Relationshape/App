// src/router.tsx
// SHELL-01, SHELL-02, D-13, D-24. Full route table; placeholders ship in this plan, real views land in plans 3-7.
import { createHashRouter } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { DesignSystem } from './routes/DesignSystem'
import {
  Home, Welcome, ProfileEdit, ProfileDetail,
  CategoryOverview, Questionnaire, Result,
  Share, Import, Compare, Settings, MapSettings, Intro,
} from './routes/_placeholders'

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
