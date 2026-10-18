import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, RefObject } from 'react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { vi } from 'vitest'
import { createQueryClient } from '../app/queryClient'
import { AppActionsContext } from '../app/uiContext'
import { NoteWorkspaceProvider } from '../features/notes/NoteWorkspaceProvider'
import type { ShowToast } from '../shared/ui/toastContext'
import { ToastProvider } from '../shared/ui/ToastProvider'
import { ToastBridge } from './ToastBridge'

/**
 * Rendert eine Komponente mit allen App-Providern (Query-Client der App ohne Retries, Toasts,
 * Router im Speicher). Die API läuft gegen das Fake-Backend (MSW, siehe setup.ts).
 * `path` ist das Routen-Muster der Komponente (z. B. `/bewerbungen/:applicationId`), damit `useParams` greift.
 */
export function renderWithApp(
  ui: ReactElement,
  { route = '/', path = '*' }: { route?: string; path?: string } = {},
) {
  const toast: RefObject<ShowToast> = { current: () => {} }
  const client = createQueryClient(toast, { retry: false })
  const setToast = (show: ShowToast) => {
    toast.current = show
  }
  const actions = {
    openNewPosting: vi.fn<() => void>(),
    openNewCompany: vi.fn<() => void>(),
    openCommandPalette: vi.fn<() => void>(),
  }
  // Notizfenster sind app-weit (AppShell); Seiten öffnen sie über den Workspace
  const router = createMemoryRouter(
    [{ path, element: <NoteWorkspaceProvider>{ui}</NoteWorkspaceProvider> }],
    {
      initialEntries: [route],
    },
  )
  const user = userEvent.setup()
  const result = render(
    <ToastProvider>
      <ToastBridge onToast={setToast} />
      <QueryClientProvider client={client}>
        {/* oxlint-disable-next-line react/jsx-no-constructed-context-values -- Testhelfer, rendert nicht neu */}
        <AppActionsContext.Provider value={actions}>
          <RouterProvider router={router} />
        </AppActionsContext.Provider>
      </QueryClientProvider>
    </ToastProvider>,
  )
  return { ...result, user, router, client, actions }
}
