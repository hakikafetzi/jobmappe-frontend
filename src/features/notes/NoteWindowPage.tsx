import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useCategories } from '../../api/noteCategories'
import { useNote } from '../../api/notes'
import { useNotesSync } from '../../api/notesSync'
import { paths } from '../../app/paths'
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'
import { DialogCloseButton } from '../../shared/ui/Dialog'
import { takeDraft } from './noteDraftHandoff'
import { LoadedNoteForm } from './NoteForm'
import styles from './NoteWindowPage.module.css'
import type { NoteDraft } from './noteWindows'

/**
 * Notiz in einem eigenen Browserfenster (aus dem Notizfenster herausgelöst, z. B. für einen zweiten
 * Bildschirm). Ohne Navigation; Änderungen meldet notesSync an die App im anderen Fenster.
 */
export function NoteWindowPage() {
  const params = useParams()
  const noteId = params.noteId === 'neu' || !params.noteId ? null : params.noteId
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const [handed] = useState(() => takeDraft(search.get('entwurf')))
  const [draft, setDraft] = useState<NoteDraft | null>(handed?.draft ?? null)
  const note = useNote(noteId)
  const categories = useCategories()
  useNotesSync()
  useDocumentTitle(draft?.title || note.data?.title || 'Neue Notiz')

  // Vom Skript geöffnete Fenster lassen sich schließen; sonst zur Bewerbung der Notiz bzw. zu den Notizen
  const close = () => {
    if (window.opener) return window.close()
    const applicationId = note.data?.applicationId ?? (noteId === null ? handed?.application?.id : null)
    void navigate(applicationId ? paths.application(applicationId) : paths.notes())
  }

  return (
    <main className={styles.window}>
      <LoadedNoteForm
        key={noteId ?? 'neu'}
        noteId={noteId}
        defaultCategoryName={handed?.categoryName ?? null}
        defaultApplication={handed?.application ?? null}
        linkToApplication={false}
        categories={categories.data ?? []}
        draft={draft}
        onDraftChange={setDraft}
        titleId="note-window-title"
        controls={<DialogCloseButton onClose={close} />}
        closeLabel="Schließen"
        onClose={close}
        onSaved={(saved) => {
          setDraft(null)
          if (noteId === null) void navigate(paths.noteWindow(saved.id), { replace: true })
        }}
        onDeleted={close}
      />
    </main>
  )
}
