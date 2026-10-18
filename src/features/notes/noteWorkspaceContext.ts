import { createContext, useContext } from 'react'
import type { OpenNoteOptions } from './useNoteWorkspace'

/** Was Seiten und die Command Palette vom app-weiten Notiz-Workspace brauchen */
export type NoteWindowsApi = {
  /** Notiz im Fenster öffnen (null = neue); eine minimierte kommt zurück */
  open: (noteId: string | null, options?: OpenNoteOptions) => void
}

export const NoteWindowsContext = createContext<NoteWindowsApi | null>(null)

export function useNoteWindows(): NoteWindowsApi {
  const ctx = useContext(NoteWindowsContext)
  if (!ctx) throw new Error('useNoteWindows braucht den NoteWorkspaceProvider (AppShell)')
  return ctx
}
