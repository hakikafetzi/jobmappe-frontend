import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCategories } from '../../api/noteCategories'
import { useNotesPage } from '../../api/notes'
import { clampedPage } from '../../api/pagination'
import {
  LIST_PAGE_SIZE,
  parsePage,
  parsePageSize,
  parseSearch,
  paths,
  type NoteListQuery,
  type NoteSort,
  type NotesView,
} from '../../app/paths'
import { useDefaultNotesView } from '../../shared/settings/viewPreferences'
import { pageForSize } from './noteGrid'
import { ALL_NOTES, categoryTabs } from './noteText'
import { effectiveNoteCategory, notesListParams, parseNoteSort, parseNotesView } from './selectNotes'

/**
 * Zustand der Notizen-Seite. Ansicht, Suche, Ordner, Seite, Sortierung und (nur in der Tabelle) die
 * Seitengröße stehen in der URL (/notizen?ansicht=tabelle|galerie&suche=…&ordner=…&seite=…&sortierung=…&anzahl=…);
 * die Seite liefert das Backend. Suche und Ordner schließen sich aus: Mit Suche gilt immer „Alle“.
 * In der Galerie passt sich die Seitengröße der Fläche an (`fitSize` aus `useFitPageSize`; null =
 * noch nicht gemessen, dann lädt nichts), in der Tabelle wählt man sie unten im Pager.
 */
export function useNotesView(fitSize: number | null) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const categories = useCategories()

  const [defaultView] = useDefaultNotesView()

  const view = parseNotesView(params.get('ansicht'), defaultView)
  // Ansicht nur in der URL, wenn sie vom Standard abweicht
  const urlView = view === defaultView ? undefined : view
  const search = parseSearch(params.get('suche'))
  const rawCategory = effectiveNoteCategory(params.get('ordner'), search)
  const tabs = categoryTabs(categories.data, rawCategory ?? ALL_NOTES)
  const sort = parseNoteSort(params.get('sortierung'))
  const page = parsePage(params.get('seite'))
  const tableSize = parsePageSize(params.get('anzahl'))
  const size = view === 'table' ? tableSize : fitSize
  // Ordner aus der URL erst nach dem Abgleich mit den Kategorien senden (unbekannte fallen auf „Alle“)
  const ready = size !== null && (!tabs.categoryId || !categories.isPending)
  const notes = useNotesPage(
    notesListParams({ search, categoryId: tabs.categoryId, sort, page, size: size ?? LIST_PAGE_SIZE }),
    ready,
  )
  const category = tabs.categoryId

  // Die Seitengröße steht nur in der Tabelle in der URL
  const urlSize = view === 'table' ? tableSize : undefined
  /** Adresse mit dem aktuellen Zustand und `patch` */
  const href = (patch: NoteListQuery = {}) =>
    paths.notes({ view: urlView, search, category, sort, size: urlSize, ...patch })

  // Andere Seitengröße (Fenster, Ansicht oder Auswahl im Pager): auf die Seite mit der bisher ersten
  // Notiz wechseln
  const lastSize = useRef(size)
  useEffect(() => {
    const before = lastSize.current
    lastSize.current = size
    if (before === null || size === null || before === size || page === 0) return
    const target = pageForSize(page, before, size)
    void navigate(paths.notes({ view: urlView, search, category, sort, size: urlSize, page: target }), {
      replace: true,
    })
  }, [size, page, search, category, sort, urlView, urlSize, navigate])

  // Seite nach einer Änderung leer (z. B. letzte Notiz der Seite gelöscht): zurückblättern
  const clamped = clampedPage(notes.isPlaceholderData ? undefined : notes.data, page)
  useEffect(() => {
    if (clamped !== null)
      void navigate(paths.notes({ view: urlView, search, category, sort, size: urlSize, page: clamped }), {
        replace: true,
      })
  }, [clamped, search, category, sort, urlView, urlSize, navigate])

  // Neue Suche, Ordner oder Sortierung: zurück auf die erste Seite. Eine Suche setzt den Ordner auf
  // „Alle“, ein Ordner beendet die Suche.
  const setSearch = (q: string) => void navigate(href({ search: q, category: undefined }), { replace: true })
  const setCategory = (tab: string) =>
    void navigate(href({ category: tab === ALL_NOTES ? undefined : tab, search: undefined }))
  // Ansicht wechseln: Suche, Ordner und Sortierung bleiben; die Seite rechnet der Effekt oben um
  const setView = (v: NotesView) =>
    void navigate(paths.notes({ view: v === defaultView ? undefined : v, search, category, page, sort }))
  const setSort = (s: NoteSort) => void navigate(href({ sort: s }), { replace: true })
  // Seitengröße der Tabelle: die Seite rechnet der Effekt oben um
  const setSize = (n: number) => void navigate(href({ size: n, page }), { replace: true })
  const pageHref = (p: number) => href({ page: p })

  return {
    notes,
    tabs,
    view,
    search,
    sort,
    page,
    tableSize,
    setView,
    setSearch,
    setCategory,
    setSort,
    setSize,
    pageHref,
  }
}
