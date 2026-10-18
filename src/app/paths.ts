// Pfad-Builder und typisierter Navigations-State — keine Routen-Strings in den Features.

import type { ApplicationPriority, ApplicationStatus } from '../api/types'

export type PostingFilter = 'open' | 'with' | 'inactive' | 'archived' | 'all'
export type PostingSort = 'new' | 'old' | 'title' | 'company'
export type ApplicationsView = 'board' | 'table'
export type TableSortKey = 'title' | 'status' | 'priority' | 'applied' | 'days'
export type TableSort = { key: TableSortKey; dir: 1 | -1 }
export type NoteSort = 'new' | 'edited' | 'old' | 'title'
export type NotesView = 'gallery' | 'table'

/**
 * Suche, Seite, Sortierung und Seitengröße einer paginierten Liste in der URL. `page` ist 0-basiert,
 * `?seite=` 1-basiert; `size` steht als `?anzahl=`, `search` als `?suche=`.
 */
type ListQuery<S> = { search?: string; page?: number; sort?: S; size?: number }

/** `?suche=`: getrimmt, leer = keine Suche. */
export const parseSearch = (value: string | null) => value?.trim() ?? ''

/** `?seite=` (1-basiert); die erste Seite steht nicht in der URL. */
export const pageParam = (page: number | undefined) => (page ? String(page + 1) : undefined)

/** Such-, Seiten- und Sortier-Parameter der URL; Defaults (keine Suche, erste Seite, Standardsortierung) entfallen. */
const listParams = (
  search: string | undefined,
  page: number | undefined,
  sort: string | undefined,
  size?: number,
) => ({
  suche: search?.trim() || undefined,
  seite: pageParam(page),
  sortierung: sort,
  anzahl: sizeParam(size),
})

/**
 * Seitengröße der Listen mit Größenauswahl (Stellen, Firmen, Bewerbungstabelle): Standard wie der Backend-Default,
 * dazu die wählbaren Größen (Backend kappt bei 100).
 */
export const LIST_PAGE_SIZE = 15
export const LIST_PAGE_SIZES = [10, 15, 25, 50, 100] as const

/** `?anzahl=`: nur die wählbaren Größen, sonst der Standard. */
export function parsePageSize(value: string | null): number {
  const n = Number(value)
  return (LIST_PAGE_SIZES as readonly number[]).includes(n) ? n : LIST_PAGE_SIZE
}

/** `?anzahl=`; die Standardgröße steht nicht in der URL. */
export const sizeParam = (size: number | undefined) =>
  size && size !== LIST_PAGE_SIZE ? String(size) : undefined

const postingParams = (
  filter: PostingFilter | undefined,
  { search, page, sort, size }: ListQuery<PostingSort>,
) => ({
  filter,
  ...listParams(search, page, sort === 'new' ? undefined : sort, size),
})

/** `?seite=` (1-basiert) → 0-basierte Seite; Ungültiges zählt als erste Seite. */
export function parsePage(value: string | null): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 1 ? n - 1 : 0
}

/** Ansicht in der URL (`?ansicht=`); ohne Parameter gilt die gespeicherte Standardansicht */
export const applicationsViewParam = (view: ApplicationsView) => (view === 'table' ? 'tabelle' : 'kanban')
export const notesViewParam = (view: NotesView) => (view === 'table' ? 'tabelle' : 'galerie')

export const tableSortParam = (sort: TableSort) => `${sort.key}-${sort.dir === 1 ? 'auf' : 'ab'}`
/**
 * Notizen in der URL; `category` ist die Kategorie-ID (`?ordner=`), `view` die Ansicht
 * (`?ansicht=tabelle|galerie`, ohne Parameter die gespeicherte Standardansicht). `size` (`?anzahl=`) gibt es nur in der Tabelle; in der Galerie
 * richtet sich die Seitengröße nach der Fläche (features/notes/noteGrid.ts).
 */
export type NoteListQuery = ListQuery<NoteSort> & { category?: string; view?: NotesView }

/** Firmen-Liste in der URL (ohne Sortierung). */
export type CompanyListQuery = Omit<ListQuery<never>, 'sort'>

const withQuery = (path: string, params: Record<string, string | undefined>) => {
  const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]))
  const s = q.toString()
  return s ? `${path}?${s}` : path
}

export const paths = {
  home: () => '/',
  postings: (filter?: PostingFilter, query: ListQuery<PostingSort> = {}) =>
    withQuery('/stellen', postingParams(filter, query)),
  posting: (id: string, filter?: PostingFilter, query: ListQuery<PostingSort> = {}) =>
    withQuery(`/stellen/${id}`, postingParams(filter, query)),
  companies: ({ search, page, size }: CompanyListQuery = {}) =>
    withQuery('/firmen', listParams(search, page, undefined, size)),
  company: (id: string, { search, page, size }: CompanyListQuery = {}) =>
    withQuery(`/firmen/${id}`, listParams(search, page, undefined, size)),
  applications: (
    opts: {
      view?: ApplicationsView
      status?: ApplicationStatus
      priority?: ApplicationPriority
    } & ListQuery<TableSort> = {},
  ) =>
    withQuery('/bewerbungen', {
      ansicht: opts.view && applicationsViewParam(opts.view),
      status: opts.status,
      prioritaet: opts.priority,
      ...listParams(opts.search, opts.page, opts.sort && tableSortParam(opts.sort), opts.size),
    }),
  application: (id: string) => `/bewerbungen/${id}`,
  settings: () => '/einstellungen',
  notes: ({ search, category, page, sort, view, size }: NoteListQuery = {}) =>
    withQuery('/notizen', {
      ansicht: view && notesViewParam(view),
      ordner: category,
      ...listParams(search, page, sort === 'new' ? undefined : sort, size),
    }),
  /** Notiz in eigenem Browserfenster (ohne Navigation); `draft` = Token eines übergebenen Entwurfs */
  noteWindow: (noteId: string | null, draft?: string) =>
    withQuery(`/notiz/${noteId ?? 'neu'}`, { entwurf: draft }),
}

/** Woher kam man in die Bewerbung? Bestimmt den Zurück-Link. */
export type ApplicationOrigin = { from: 'postings'; postingId: string } | { from: 'home' } | { from: 'board' }

/** Aus der Firmenansicht zurück zur Stelle, von der man kam. */
export type CompanyOrigin = { fromPosting: string }

export function readState<T extends object>(state: unknown, key: keyof T): T | null {
  return state && typeof state === 'object' && key in state ? (state as T) : null
}
