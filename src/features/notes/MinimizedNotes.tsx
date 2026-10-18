import { useState } from 'react'
import { useNote } from '../../api/notes'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { CloseIcon, NoteIcon } from '../../shared/ui/icons'
import styles from './MinimizedNotes.module.css'
import type { NoteWindow } from './noteWindows'
import type { NoteWorkspaceApi } from './useNoteWorkspace'

/**
 * Leiste unten mit den minimierten Notizen (auf jeder Seite). Ein Klick holt die Notiz zurück, ✕
 * schließt sie (mit Rückfrage, wenn es ungespeicherte Änderungen gibt).
 */
export function MinimizedNotes({ ws }: { ws: NoteWorkspaceApi }) {
  const { state, dispatch } = ws
  const [confirming, setConfirming] = useState<number | null>(null)
  const minimized = state.windows.filter((w) => w.minimized)
  if (!minimized.length) return null

  const close = (w: NoteWindow) => {
    if (w.draft?.dirty) setConfirming(w.wid)
    else dispatch({ type: 'close', wid: w.wid })
  }

  return (
    <section className={styles.tray} aria-label="Minimierte Notizen">
      <ul className={styles.list}>
        {minimized.map((w) => (
          <MinimizedChip
            key={w.wid}
            window={w}
            onRestore={() => dispatch({ type: 'focus', wid: w.wid })}
            onClose={() => close(w)}
          />
        ))}
      </ul>
      {confirming !== null && (
        <ConfirmDialog
          title="Änderungen verwerfen?"
          confirmLabel="Verwerfen"
          danger
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            dispatch({ type: 'close', wid: confirming })
            setConfirming(null)
          }}
        >
          Die Notiz hat ungespeicherte Änderungen. Beim Schließen gehen sie verloren.
        </ConfirmDialog>
      )}
    </section>
  )
}

function MinimizedChip({
  window: w,
  onRestore,
  onClose,
}: {
  window: NoteWindow
  onRestore: () => void
  onClose: () => void
}) {
  // Titel: Entwurf, sonst die gespeicherte Notiz (meist schon im Cache)
  const note = useNote(w.draft?.title.trim() ? null : w.noteId)
  const title = w.draft?.title.trim() || note.data?.title || (w.noteId ? 'Notiz' : 'Neue Notiz')
  const dirty = !!w.draft?.dirty
  return (
    <li className={styles.chip}>
      <button
        type="button"
        className={styles.restore}
        aria-label={`Notiz „${title}“ wiederherstellen${dirty ? ' (ungespeichert)' : ''}`}
        title={title}
        onClick={onRestore}
      >
        <NoteIcon className={styles.icon} />
        <span className={styles.title}>{title}</span>
        {dirty && <span className={styles.dot} aria-hidden="true" />}
      </button>
      <button
        type="button"
        className={styles.close}
        aria-label={`Notiz „${title}“ schließen`}
        onClick={onClose}
      >
        <CloseIcon />
      </button>
    </li>
  )
}
