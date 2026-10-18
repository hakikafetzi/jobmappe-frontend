import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  applicationColumnQuery,
  applicationsPageQuery,
  useApplicationsPage,
  usePatchApplication,
} from '../../api/applications'
import { clampedPage } from '../../api/pagination'
import type { ApplicationListParams, ApplicationStatus } from '../../api/types'
import {
  applicationsViewParam,
  pageParam,
  parsePage,
  parsePageSize,
  parseSearch,
  sizeParam,
  tableSortParam,
  type ApplicationsView,
  type TableSort,
  type TableSortKey,
} from '../../app/paths'
import { APP_STATUS, BOARD_COLUMNS } from '../../domain/labels'
import { PREFETCH_WAIT_MS, settleWithin } from '../../shared/lib/async'
import { useDefaultApplicationsView } from '../../shared/settings/viewPreferences'
import { useToast } from '../../shared/ui/toastContext'
import {
  apiTableSort,
  DEFAULT_TABLE_SORT,
  parseApplicationsView,
  parsePriorityFilter,
  parseStatusFilter,
  parseTableSort,
  type PriorityFilter,
  type StatusFilter,
} from './selectApplications'
import { switchApplicationsView } from './viewTransition'

/**
 * Query-Parameter einer Tabellenseite (gleich für Anzeige und Vorabladen). Eine Suche ersetzt die
 * Filter: Das Backend kombiniert `q` weder mit `status` noch mit `priority`.
 */
const tableParams = (
  search: string,
  status: StatusFilter,
  priority: PriorityFilter,
  page: number,
  sort: TableSort,
  size: number,
): ApplicationListParams => {
  const paging = { page, size, sort: [apiTableSort(sort)] }
  if (search) return { ...paging, q: search }
  return {
    ...paging,
    status: status === 'all' ? undefined : status,
    priority: priority === 'all' ? undefined : priority,
  }
}

/**
 * Zustand der Bewerbungen-Seite. Ansicht, Suche, Filter, Seite, Sortierung und Seitengröße stehen in
 * der URL (?ansicht=tabelle|kanban&suche=…&status=…&prioritaet=…&seite=…&sortierung=…&anzahl=…); Suchen,
 * Filtern, Sortieren und Blättern übernimmt das Backend. Ohne `ansicht` gilt die in den Einstellungen
 * gewählte Standardansicht (viewPreferences). Das Board lädt seine Spalten selbst
 * (BoardView) und kann nicht suchen: Eine Suche zeigt die Treffer in der Tabelle. Suche und Filter
 * schließen sich aus — mit Suche gelten Status und Priorität als „Alle“.
 */
export function useApplicationsView() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const patch = usePatchApplication()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [defaultView] = useDefaultApplicationsView()
  // Ansicht nur in der URL, wenn sie vom Standard abweicht
  const viewParam = (v: ApplicationsView) => (v === defaultView ? null : applicationsViewParam(v))

  const search = parseSearch(params.get('suche'))
  const view: ApplicationsView = search ? 'table' : parseApplicationsView(params.get('ansicht'), defaultView)
  const status = search ? 'all' : parseStatusFilter(params.get('status'))
  const priority = search ? 'all' : parsePriorityFilter(params.get('prioritaet'))
  const sort = parseTableSort(params.get('sortierung'))
  const page = parsePage(params.get('seite'))
  const size = parsePageSize(params.get('anzahl'))

  const table = useApplicationsPage(tableParams(search, status, priority, page, sort, size), view === 'table')

  const withChanges = (prev: URLSearchParams, changes: Record<string, string | null>) => {
    const next = new URLSearchParams(prev)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    return next
  }
  const updateParams = (changes: Record<string, string | null>) =>
    setParams((prev) => withChanges(prev, changes), { replace: true })
  // Ansichtswechsel animiert: navigate() statt setParams, weil die View Transition auf das
  // Promise wartet und flushSync das DOM bis dahin umgestellt hat
  const switchView = (next: ApplicationsView, changes: Record<string, string | null>) =>
    switchApplicationsView(next, () =>
      navigate({ search: `?${withChanges(params, changes)}` }, { replace: true, flushSync: true }),
    )

  // Daten der Zielansicht vorab laden: Sonst erfasst der animierte Wechsel beim ersten Mal (nach
  // dem Neuladen) nur einen Ladezustand statt Tabelle bzw. Spalten, und die Animation bricht ab.
  // Die Tabelle beginnt nach dem Wechsel ohne Status-Filter auf Seite 1 mit Standardsortierung
  // (die gewählte Seitengröße bleibt).
  const prefetchView = (v: ApplicationsView) =>
    v === 'table'
      ? queryClient.prefetchQuery(
          applicationsPageQuery(tableParams('', 'all', priority, 0, DEFAULT_TABLE_SORT, size)),
        )
      : Promise.all(
          BOARD_COLUMNS.map((c) =>
            queryClient.prefetchInfiniteQuery(
              applicationColumnQuery(c.status, priority === 'all' ? undefined : priority),
            ),
          ),
        )
  const switchWhenReady = (v: ApplicationsView, changes: Record<string, string | null>) =>
    void settleWithin(prefetchView(v), PREFETCH_WAIT_MS).then(() => switchView(v, changes))

  // Seite nach einem Statuswechsel leer (passt nicht mehr zum Filter): zurückblättern
  const clamped =
    view === 'table' ? clampedPage(table.isPlaceholderData ? undefined : table.data, page) : null
  useEffect(() => {
    if (clamped === null) return
    setParams((prev) => withPage(prev, clamped), { replace: true })
  }, [clamped, setParams])

  const isFiltered = !!search || priority !== 'all' || (view === 'table' && status !== 'all')

  return {
    table,
    view,
    // Suche, Seite und Sortierung gelten nur für die Tabelle (die Seitengröße bleibt als Vorliebe)
    setView: (v: ApplicationsView) =>
      switchWhenReady(v, {
        ansicht: viewParam(v),
        suche: null,
        status: null,
        seite: null,
        sortierung: null,
      }),
    /** Daten der anderen Ansicht laden (beim Überfahren des Umschalters) */
    prefetchOtherView: () => void prefetchView(view === 'board' ? 'table' : 'board'),
    search,
    // Suche oder Filter ändern: zurück auf die erste Seite. Eine Suche hebt die Filter auf und
    // wechselt (ohne Animation, man tippt ja noch) zur Tabelle; ein Filter beendet die Suche.
    setSearch: (q: string) =>
      updateParams(
        q
          ? { suche: q, ansicht: viewParam('table'), status: null, prioritaet: null, seite: null }
          : { suche: null, seite: null },
      ),
    status,
    setStatus: (s: StatusFilter) =>
      updateParams({ status: s === 'all' ? null : s, ...(s !== 'all' && { suche: null }), seite: null }),
    priority,
    setPriority: (p: PriorityFilter) =>
      updateParams({ prioritaet: p === 'all' ? null : p, ...(p !== 'all' && { suche: null }), seite: null }),
    sort,
    sortBy: (key: TableSortKey) => {
      const next =
        sort.key === key ? ({ key, dir: sort.dir === 1 ? -1 : 1 } as const) : ({ key, dir: 1 } as const)
      const isDefault = next.key === DEFAULT_TABLE_SORT.key && next.dir === DEFAULT_TABLE_SORT.dir
      updateParams({ sortierung: isDefault ? null : tableSortParam(next), seite: null })
    },
    page,
    size,
    // Neue Seitengröße: zurück auf die erste Seite
    setSize: (n: number) => updateParams({ anzahl: sizeParam(n) ?? null, seite: null }),
    pageHref: (p: number) => `?${withPage(params, p)}`,
    isFiltered,
    resetFilters: () => updateParams({ suche: null, status: null, prioritaet: null, seite: null }),
    showTable: () => switchWhenReady('table', { ansicht: viewParam('table'), status: null, seite: null }),
    moveTo: (id: string, next: ApplicationStatus) =>
      patch.mutate(
        { id, patch: { status: next } },
        { onSuccess: () => toast(`Status: ${APP_STATUS[next].label}`) },
      ),
  }
}

/** URL-Parameter mit Seite `page` (0-basiert). */
function withPage(params: URLSearchParams, page: number): URLSearchParams {
  const next = new URLSearchParams(params)
  const seite = pageParam(page)
  if (seite) next.set('seite', seite)
  else next.delete('seite')
  return next
}
