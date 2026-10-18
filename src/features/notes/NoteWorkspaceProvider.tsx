import { useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { useNotesSync } from '../../api/notesSync'
import { useLatest } from '../../shared/hooks/useLatest'
import { MinimizedNotes } from './MinimizedNotes'
import { NoteWindowsContext, type NoteWindowsApi } from './noteWorkspaceContext'
import { NoteWorkspace } from './NoteWorkspace'
import { useNoteWorkspace } from './useNoteWorkspace'

/**
 * Notizfenster der ganzen App (AppShell): Sie bleiben über Seitenwechsel erhalten, beim Wechsel
 * wandern offene Fenster unten in die Leiste. Seiten öffnen Notizen über `useNoteWindows()`.
 */
export function NoteWorkspaceProvider({ children }: { children: ReactNode }) {
  // Schon innerhalb eines Workspaces (z. B. Tests, die die AppShell rendern): nichts doppelt
  if (useContext(NoteWindowsContext)) return children
  return <Workspace>{children}</Workspace>
}

function Workspace({ children }: { children: ReactNode }) {
  const ws = useNoteWorkspace()
  const { pathname } = useLocation()
  const { dispatch } = ws
  useNotesSync()

  // Andere Seite (nicht nur andere Query, z. B. Blättern): offene Fenster minimieren
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    dispatch({ type: 'minimizeAll' })
  }, [pathname, dispatch])

  // Stabil, damit Seiten nicht bei jedem Tastendruck im Editor neu rendern
  const open = useLatest(ws.open)
  const api = useMemo<NoteWindowsApi>(() => ({ open: (...args) => open.current(...args) }), [open])

  return (
    <NoteWindowsContext.Provider value={api}>
      {children}
      <NoteWorkspace ws={ws} />
      <MinimizedNotes ws={ws} />
    </NoteWindowsContext.Provider>
  )
}
