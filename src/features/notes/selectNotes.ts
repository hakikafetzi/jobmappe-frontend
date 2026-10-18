// Filter und Sortierung der Notizen übernimmt das Backend; hier nur die Zuordnung UI → API.
import type { NoteListParams } from '../../api/types'
import type { NoteSort, NotesView } from '../../app/paths'

export const NOTE_SORTS: { value: NoteSort; label: string; api: string }[] = [
  { value: 'new', label: 'Neueste', api: 'createdAt,desc' },
  { value: 'edited', label: 'Zuletzt bearbeitet', api: 'updatedAt,desc' },
  { value: 'old', label: 'Älteste', api: 'createdAt,asc' },
  { value: 'title', label: 'Titel A–Z', api: 'title,asc' },
]

/** `?ansicht=tabelle|galerie`; fehlt oder ungültig → `fallback` (gespeicherte Standardansicht) */
export function parseNotesView(value: string | null, fallback: NotesView): NotesView {
  if (value === 'tabelle') return 'table'
  if (value === 'galerie') return 'gallery'
  return fallback
}

export function parseNoteSort(value: string | null): NoteSort {
  return NOTE_SORTS.find((s) => s.value === value)?.value ?? 'new'
}

export const apiNoteSort = (sort: NoteSort): string => NOTE_SORTS.find((s) => s.value === sort)!.api

/** Datum, das ein Eintrag zeigt: passend zur Sortierung */
export const noteDateField = (sort: NoteSort) => (sort === 'edited' ? 'updatedAt' : 'createdAt')

/** Ordner der Seite: Bei einer Suche gilt keiner (Suche und Filter schließen sich aus). */
export const effectiveNoteCategory = (category: string | null, search: string) =>
  search ? undefined : category || undefined

/** Query-Parameter einer Seite der Notizen-Liste. */
export const notesListParams = (q: {
  search: string
  categoryId: string | undefined
  sort: NoteSort
  page: number
  size: number
}): NoteListParams => {
  const paging = { page: q.page, size: q.size, sort: [apiNoteSort(q.sort)] }
  if (q.search) return { ...paging, q: q.search }
  return q.categoryId ? { ...paging, noteCategoryId: q.categoryId } : paging
}

/** Sortierbare Spalten der Tabelle */
export type NoteColumn = 'title' | 'created' | 'edited'

/** Sortiert die Spalte gerade, und wie? Das Backend kennt nur die Sortierungen aus NOTE_SORTS. */
export function headerSort(sort: NoteSort, column: NoteColumn): 'asc' | 'desc' | null {
  if (column === 'title') return sort === 'title' ? 'asc' : null
  if (column === 'created') return sort === 'new' ? 'desc' : sort === 'old' ? 'asc' : null
  return sort === 'edited' ? 'desc' : null
}

/** Klick auf einen Spaltenkopf: „Erstellt“ wechselt zwischen neueste und älteste zuerst. */
export function sortOnHeaderClick(sort: NoteSort, column: NoteColumn): NoteSort {
  if (column === 'title') return 'title'
  if (column === 'created') return sort === 'new' ? 'old' : 'new'
  return 'edited'
}
