// Notizen über Browserfenster hinweg aktuell halten (Notiz im eigenen Fenster ↔ App): Nach dem
// Speichern oder Löschen meldet ein Fenster die Änderung, die anderen laden Liste und Notiz neu.
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { queryKeys } from './queryKeys'

const CHANNEL = 'jobmappe.notes'

type NotesChanged = { noteId: string }

const channelAvailable = () => typeof BroadcastChannel !== 'undefined'

export function announceNoteChanged(message: NotesChanged) {
  if (!channelAvailable()) return
  const channel = new BroadcastChannel(CHANNEL)
  channel.postMessage(message)
  channel.close()
}

/** Änderungen aus anderen Fenstern übernehmen. */
export function useNotesSync() {
  const qc = useQueryClient()
  useEffect(() => {
    if (!channelAvailable()) return
    const channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (e: MessageEvent<NotesChanged>) => {
      void qc.invalidateQueries({ queryKey: queryKeys.notes.lists })
      void qc.invalidateQueries({ queryKey: queryKeys.notes.detail(e.data.noteId) })
    }
    return () => channel.close()
  }, [qc])
}
