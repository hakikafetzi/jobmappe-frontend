import { useState, type ReactNode } from 'react'
import { serverFieldErrors } from '../../api/errors'
import { useDeleteNote, useNote, useSaveNote } from '../../api/notes'
import type { NoteCategory, NoteDetail } from '../../api/types'
import { RichTextEditor } from '../../shared/editor/RichTextEditor'
import { fmtDate } from '../../shared/lib/format'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { DialogDragHandle } from '../../shared/ui/Dialog'
import { FolderIcon, TrashIcon } from '../../shared/ui/icons'
import { ErrorState, LoadingState } from '../../shared/ui/QueryState'
import { useToast } from '../../shared/ui/toastContext'
import { ToolButton } from '../../shared/ui/ToolButton'
import { ApplicationPicker } from './ApplicationPicker'
import styles from './NoteForm.module.css'
import { countText } from './noteText'
import type { NoteApplication, NoteDraft } from './noteWindows'

type Props = {
  /** null = neue Notiz */
  note: NoteDetail | null
  /** Vorauswahl bei neuen Notizen (Name, wie ihn die Notizliste liefert) */
  defaultCategoryName: string | null
  /** Vorauswahl der Bewerbung bei neuen Notizen */
  defaultApplication: NoteApplication | null
  /** Link „Zur Bewerbung“ in der Auswahl (nicht im eigenen Browserfenster) */
  linkToApplication?: boolean
  categories: NoteCategory[]
  /** Ungespeicherte Eingaben; null = Notiz unverändert anzeigen */
  draft: NoteDraft | null
  onDraftChange: (draft: NoteDraft) => void
  titleId: string
  /** Knöpfe links neben Ordner und Bewerbung (eigenes Fenster, Originalgröße) */
  tools?: ReactNode
  /** Knöpfe rechts in der Kopfleiste (Vollbild, ✕) */
  controls: ReactNode
  /** Knopf vorn in der Kopfleiste (z. B. Notizliste ausklappen) */
  leading?: ReactNode
  /** Beschriftung des Schließen-Knopfs in der Fußzeile */
  closeLabel?: string
  onClose: () => void
  /** Nach dem Speichern, mit der ID des gewählten Ordners (null = ohne) */
  onSaved: (note: NoteDetail, categoryId: string | null) => void
  onDeleted: (id: string) => void
}

/**
 * Notiz im Dokument-Stil. Gesteuert über den Entwurf, damit die Eingaben beim Wechsel des Fensters
 * (schwebend ↔ Vollbild ↔ eigenes Browserfenster) erhalten bleiben. Der Editor übernimmt den Inhalt
 * nur beim Mounten; zum Neustart mit einer anderen Notiz per `key` neu mounten.
 */
export function NoteForm({
  note,
  defaultCategoryName,
  defaultApplication,
  linkToApplication,
  categories,
  draft,
  onDraftChange,
  titleId,
  tools,
  controls,
  leading,
  closeLabel = 'Abbrechen',
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const toast = useToast()
  const save = useSaveNote()
  const remove = useDeleteNote()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialCategoryName = note ? note.noteCategory : defaultCategoryName
  // Ohne gewählten Ordner aus dem Namen ableiten (Kategorien treffen evtl. erst später ein)
  const initialCategoryId = categories.find((c) => c.name === initialCategoryName)?.id ?? ''
  const title = draft?.title ?? note?.title ?? ''
  const content = draft?.content ?? note?.content ?? ''
  const pickedCategoryId = draft?.categoryId ?? null
  const categoryId = pickedCategoryId ?? initialCategoryId
  const initialApplication = note
    ? note.applicationId
      ? { id: note.applicationId, jobTitle: note.jobTitle, companyName: note.companyName }
      : null
    : defaultApplication
  const pickedApplication = draft?.application ?? null
  const resolveApplication = (picked: NoteDraft['application']) =>
    picked === null ? initialApplication : picked === 'none' ? null : picked
  const application = resolveApplication(pickedApplication)
  const counts = countText(content)

  const change = (patch: Partial<Omit<NoteDraft, 'dirty'>>) => {
    const next = { title, content, categoryId: pickedCategoryId, application: pickedApplication, ...patch }
    const dirty =
      next.title !== (note?.title ?? '') ||
      next.content !== (note?.content ?? '') ||
      (next.categoryId ?? initialCategoryId) !== initialCategoryId ||
      (resolveApplication(next.application)?.id ?? null) !== (initialApplication?.id ?? null)
    onDraftChange({ ...next, dirty })
  }

  const submit = () => {
    if (!title.trim()) {
      setError('Bitte einen Titel eingeben.')
      document.getElementById(titleId)?.focus()
      return
    }
    setError(null)
    save.mutate(
      {
        noteId: note?.id ?? null,
        body: {
          title: title.trim(),
          content: content.trim() ? content : null,
          // PUT ist ein Vollupdate: Ordner und Bewerbung immer mitsenden, sonst gehen sie verloren
          noteCategoryId: categoryId || null,
          applicationId: application?.id ?? null,
        },
      },
      {
        onSuccess: (saved) => {
          onSaved(saved, categoryId || null)
          toast('Notiz gespeichert')
        },
        onError: (err) => {
          const titleError = serverFieldErrors(err).title
          if (!titleError) return
          setError(titleError)
          document.getElementById(titleId)?.focus()
        },
      },
    )
  }

  const deleteNote = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => {
        onDeleted(id)
        toast('Notiz gelöscht')
      },
      onSettled: () => setConfirmDelete(false),
    })

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <>
      <DialogDragHandle className={styles.bar}>
        {leading}
        <label className={styles.folder} title="Ordner">
          <FolderIcon />
          <select
            className={styles.folderSelect}
            aria-label="Ordner"
            value={categoryId}
            onChange={(e) => change({ categoryId: e.target.value })}
          >
            <option value="">Ohne Ordner</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <ApplicationPicker
          value={application}
          linkToApplication={linkToApplication}
          onChange={(picked) => change({ application: picked ?? 'none' })}
        />
        {tools && <div className={styles.tools}>{tools}</div>}
        <div className={styles.windowControls}>{controls}</div>
      </DialogDragHandle>
      <div className={styles.scroll}>
        <div className={styles.page}>
          <input
            id={titleId}
            className={styles.title}
            placeholder="Titel (Pflicht)"
            aria-label="Titel der Notiz"
            aria-required="true"
            maxLength={255}
            autoFocus={!note}
            data-autofocus={!note || undefined}
            value={title}
            onChange={(e) => change({ title: e.target.value })}
            onKeyDown={onKeyDown}
          />
          <RichTextEditor
            variant="document"
            initialValue={content}
            onChange={(markdown) => change({ content: markdown })}
            onKeyDown={onKeyDown}
            label="Inhalt der Notiz"
            placeholder="Schreib los …"
            autoFocus={!!note}
          />
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.footerStart}>
          {note && (
            <ToolButton
              label="Löschen"
              tone="danger"
              size="lg"
              tooltipAbove
              onClick={() => setConfirmDelete(true)}
            >
              <TrashIcon />
            </ToolButton>
          )}
          <span className={styles.info}>
            <span className={styles.words}>
              {counts.words} {counts.words === 1 ? 'Wort' : 'Wörter'} · {counts.chars} Zeichen
            </span>
            {note && (
              <span className={styles.dates}>
                Angelegt am {fmtDate(note.createdAt)} · Zuletzt bearbeitet {fmtDate(note.updatedAt)}
              </span>
            )}
          </span>
          {error && (
            <span className={styles.error} role="alert">
              {error}
            </span>
          )}
        </div>
        <Button className={styles.footerButton} onClick={onClose}>
          {closeLabel}
        </Button>
        <Button className={styles.footerButton} variant="primary" onClick={submit} disabled={save.isPending}>
          Speichern
        </Button>
      </div>
      {note && confirmDelete && (
        <ConfirmDialog
          title="Notiz löschen?"
          confirmLabel="Löschen"
          danger
          busy={remove.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => deleteNote(note.id)}
        >
          Die Notiz „{note.title}“ wird endgültig gelöscht.
        </ConfirmDialog>
      )}
    </>
  )
}

/** Lädt die Notiz (bei bestehenden) und zeigt dann das Formular. */
export function LoadedNoteForm({ noteId, ...props }: Omit<Props, 'note'> & { noteId: string | null }) {
  const note = useNote(noteId)
  if (noteId !== null && note.isPending) return <LoadingState />
  if (note.error) return <ErrorState error={note.error} onRetry={() => void note.refetch()} />
  return <NoteForm {...props} note={noteId === null ? null : (note.data ?? null)} />
}
