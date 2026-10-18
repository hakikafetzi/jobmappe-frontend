import { createBrowserRouter, type RouteObject } from 'react-router'
import { LoadingState } from '../shared/ui/QueryState'
import { AppShell } from './AppShell'
import { NotFoundPage, RouteError } from './RouteError'

// Jede Seite wird erst beim Aufruf geladen (Code-Splitting).
const page = (load: () => Promise<{ Component: React.ComponentType }>): Pick<RouteObject, 'lazy'> => ({
  lazy: load,
})

export const routes: RouteObject[] = [
  // Notiz in eigenem Browserfenster (aus dem Notizfenster herausgelöst): ohne Kopfleiste
  {
    path: 'notiz/:noteId',
    errorElement: <RouteError />,
    hydrateFallbackElement: <LoadingState page />,
    ...page(() => import('../features/notes/NoteWindowPage').then((m) => ({ Component: m.NoteWindowPage }))),
  },
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    // Anzeige, während die erste (lazy) Seite geladen wird
    hydrateFallbackElement: <LoadingState page />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            ...page(() => import('../features/home/HomePage').then((m) => ({ Component: m.HomePage }))),
          },
          {
            path: 'stellen/:postingId?',
            ...page(() =>
              import('../features/postings/PostingsPage').then((m) => ({ Component: m.PostingsPage })),
            ),
          },
          {
            path: 'firmen/:companyId?',
            ...page(() =>
              import('../features/postings/CompanyPage').then((m) => ({ Component: m.CompanyPage })),
            ),
          },
          {
            path: 'bewerbungen',
            ...page(() =>
              import('../features/applications/ApplicationsPage').then((m) => ({
                Component: m.ApplicationsPage,
              })),
            ),
          },
          {
            path: 'bewerbungen/:applicationId',
            ...page(() =>
              import('../features/applications/detail/ApplicationPage').then((m) => ({
                Component: m.ApplicationPage,
              })),
            ),
          },
          {
            path: 'einstellungen',
            ...page(() =>
              import('../features/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
            ),
          },
          {
            path: 'notizen',
            ...page(() => import('../features/notes/NotesPage').then((m) => ({ Component: m.NotesPage }))),
          },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(routes)
