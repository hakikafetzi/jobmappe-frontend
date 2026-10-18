import { useEffect, useReducer, useState } from 'react'
import { centeredPosition, clampPosition, viewportSize } from '../../shared/ui/dialogSize'
import {
  DEFAULT_NOTE_DIALOG_PREFS,
  loadNoteDialogPrefs,
  saveNoteDialogPrefs,
  type NoteDialogPrefs,
} from './noteDialogPrefs'
import { noteWorkspaceReducer, visibleWindows, type NoteApplication } from './noteWindows'
import { loadNoteWindows, saveNoteWindows } from './noteWindowsStorage'

/** Versatz jedes weiteren Fensters, damit man sieht, dass mehrere offen sind */
const CASCADE = 32

/** Vorbelegung beim Öffnen */
export type OpenNoteOptions = {
  /** Ordner neuer Notizen (Name, wie ihn die Notizliste liefert) */
  categoryName?: string | null
  /** Bewerbung neuer Notizen */
  application?: NoteApplication | null
  /** Bewerbung, in deren Kontext geöffnet wird: neue Notizen aus dem Vollbild werden ihr zugeordnet */
  scope?: NoteApplication | null
}

/**
 * Notizfenster der App samt der gemerkten Größe, Lage und Vollbild-Einstellung. Die Fenster (auch
 * minimierte, mit Entwurf) stehen im Browser und liegen nach dem Neuladen unten in der Leiste.
 */
export function useNoteWorkspace() {
  const [state, dispatch] = useReducer(noteWorkspaceReducer, undefined, loadNoteWindows)
  const [prefs, setPrefs] = useState(loadNoteDialogPrefs)

  useEffect(() => saveNoteWindows(state), [state])

  const updatePrefs = (patch: Partial<NoteDialogPrefs>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    saveNoteDialogPrefs(next)
  }

  const resetPrefs = () => {
    setPrefs(DEFAULT_NOTE_DIALOG_PREFS)
    saveNoteDialogPrefs(DEFAULT_NOTE_DIALOG_PREFS)
  }

  /** Notiz öffnen (eine minimierte kommt zurück); ein weiteres Fenster erscheint versetzt vor dem vordersten. */
  const open = (noteId: string | null, options: OpenNoteOptions = {}) => {
    const front = visibleWindows(state).reduce<(typeof state.windows)[number] | null>(
      (top, w) => (!top || w.z > top.z ? w : top),
      null,
    )
    const viewport = viewportSize()
    const base = front ? (front.position ?? centeredPosition(prefs, viewport)) : null
    const position = base
      ? clampPosition({ x: base.x + CASCADE, y: base.y + CASCADE }, prefs, viewport)
      : prefs.position
    dispatch({
      type: 'open',
      noteId,
      categoryName: options.categoryName ?? null,
      application: options.application ?? null,
      scope: options.scope ?? null,
      position,
    })
  }

  return { state, dispatch, prefs, updatePrefs, resetPrefs, open }
}

export type NoteWorkspaceApi = ReturnType<typeof useNoteWorkspace>
