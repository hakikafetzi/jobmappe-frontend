import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { postingQuery, usePostingsPage } from '../../api/jobPostings'
import { clampedPage } from '../../api/pagination'
import {
  paths,
  parsePage,
  parsePageSize,
  parseSearch,
  type ApplicationOrigin,
  type PostingFilter,
  type PostingSort,
} from '../../app/paths'
import { plainKey, useHotkey } from '../../shared/hooks/useHotkey'
import {
  effectivePostingFilter,
  parsePostingFilter,
  parsePostingSort,
  postingsListParams,
} from './selectPostings'

/**
 * Zustand der Stellen-Seite. Filter, Suche, Seite, Sortierung, Seitengröße und gewählte Stelle stehen
 * in der URL (/stellen/:postingId?filter=…&suche=…&seite=…&sortierung=…&anzahl=…); die Seite liefert
 * das Backend. Suche und Filter schließen sich aus: Mit Suche gilt immer „Alle“.
 */
export function usePostingsView() {
  const { postingId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const search = parseSearch(params.get('suche'))
  const filter = effectivePostingFilter(parsePostingFilter(params.get('filter')), search)
  const sort = parsePostingSort(params.get('sortierung'))
  const page = parsePage(params.get('seite'))
  const size = parsePageSize(params.get('anzahl'))
  const postings = usePostingsPage(postingsListParams({ filter, search, sort, page, size }))

  const list = postings.data?.content ?? []
  const total = postings.data?.totalElements ?? 0

  // Seite nach einer Änderung leer (z. B. Stelle passt nicht mehr zum Filter): zurückblättern
  const clamped = clampedPage(postings.isPlaceholderData ? undefined : postings.data, page)
  useEffect(() => {
    if (clamped !== null)
      void navigate(paths.postings(filter, { search, page: clamped, sort, size }), { replace: true })
  }, [clamped, filter, search, sort, size, navigate])

  // Ohne Auswahl in der URL zeigt der Desktop die erste Stelle der Seite
  const selectedId = postingId ?? list[0]?.id
  const hasExplicitSelection = !!postingId

  const hrefFor = (id: string) => paths.posting(id, filter, { search, page, sort, size })
  const pageHref = (p: number) => paths.postings(filter, { search, page: p, sort, size })

  // Filter, Suche, Sortierung oder Seitengröße ändern: zurück auf die erste Seite. Ein Filter außer
  // „Alle“ beendet die Suche, eine Suche setzt den Filter auf „Alle“.
  const setFilter = (f: PostingFilter) =>
    void navigate(paths.postings(f, { search: f === 'all' ? search : undefined, sort, size }))
  const setSearch = (q: string) =>
    void navigate(paths.postings(q ? 'all' : filter, { search: q, sort, size }), { replace: true })
  const setSort = (s: PostingSort) =>
    void navigate(paths.postings(filter, { search, sort: s, size }), { replace: true })
  const setSize = (n: number) =>
    void navigate(paths.postings(filter, { search, sort, size: n }), { replace: true })

  // Die Liste kennt nur hasApplication; die ID steht im Detail (meist schon im Cache der Detailkarte)
  const openApplicationOf = async (id: string) => {
    if (!list.find((p) => p.id === id)?.hasApplication) return
    const { applicationId } = await queryClient.ensureQueryData(postingQuery(id))
    if (!applicationId) return
    const state: ApplicationOrigin = { from: 'postings', postingId: id }
    void navigate(paths.application(applicationId), { state })
  }

  // Tastatur: ↑/↓ bzw. j/k wählen (innerhalb der Seite), Enter öffnet die Bewerbung
  const move = (dir: 1 | -1) => {
    if (!list.length) return
    const index = list.findIndex((p) => p.id === selectedId)
    const next = list[Math.min(list.length - 1, Math.max(0, index < 0 ? 0 : index + dir))]
    if (next) void navigate(hrefFor(next.id), { replace: true })
  }
  useHotkey(plainKey('ArrowDown', 'j'), (e) => {
    e.preventDefault()
    move(1)
  })
  useHotkey(plainKey('ArrowUp', 'k'), (e) => {
    e.preventDefault()
    move(-1)
  })
  useHotkey(plainKey('Enter'), (e) => {
    // Auf Links/Knöpfen gilt deren eigene Enter-Aktion
    if (e.target instanceof Element && e.target.closest('a, button')) return
    // Fehler zeigt die Detailkarte selbst an
    if (selectedId) openApplicationOf(selectedId).catch(() => {})
  })

  return {
    postings,
    list,
    total,
    page,
    size,
    setSize,
    totalPages: postings.data?.totalPages ?? 0,
    pageHref,
    filter,
    setFilter,
    search,
    setSearch,
    sort,
    setSort,
    selectedId,
    hasExplicitSelection,
    hrefFor,
    closeDetail: () => void navigate(paths.postings(filter, { search, page, sort, size })),
  }
}
