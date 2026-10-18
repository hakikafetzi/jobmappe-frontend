import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query'
import { http, seg, withParams } from './client'
import { nextPageParam, PAGE_SIZE } from './pagination'
import { queryKeys } from './queryKeys'
import type {
  ApplicationCompact,
  ApplicationDetail,
  ApplicationListParams,
  ApplicationPatch,
  ApplicationPriority,
  ApplicationResponse,
  ApplicationStatus,
  Page,
} from './types'

export const applicationsApi = {
  list: (params: ApplicationListParams) =>
    http.get<Page<ApplicationCompact>>(withParams('/applications', params)),
  get: (id: string) => http.get<ApplicationDetail>(`/applications/${seg(id)}`),
  /** Kein Request-Body: Backend setzt status=IN_PROGRESS, priority=NONE. */
  start: (jobPostingId: string) =>
    http.post<ApplicationResponse>(`/job-postings/${seg(jobPostingId)}/applications`),
  patch: (id: string, body: ApplicationPatch) =>
    http.patch<ApplicationResponse>(`/applications/${seg(id)}`, body),
}

/** Eine Seite der Bewerbungen; Filter und Sortierung übernimmt das Backend. */
export const applicationsPageQuery = (params: ApplicationListParams) =>
  queryOptions({
    queryKey: queryKeys.applications.list(params),
    queryFn: () => applicationsApi.list(params),
  })

export const useApplicationsPage = (params: ApplicationListParams, enabled = true) =>
  useQuery({ ...applicationsPageQuery(params), placeholderData: keepPreviousData, enabled })

/** Eine Board-Spalte: Bewerbungen eines Status, weitere Seiten über fetchNextPage. Auch zum Vorabladen. */
export const applicationColumnQuery = (status: ApplicationStatus, priority?: ApplicationPriority) =>
  infiniteQueryOptions({
    queryKey: queryKeys.applications.column(status, priority),
    queryFn: ({ pageParam }) => applicationsApi.list({ status, priority, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
  })

export const useApplicationColumn = (status: ApplicationStatus, priority?: ApplicationPriority) =>
  useInfiniteQuery(applicationColumnQuery(status, priority))

/**
 * Bewerbungen, deren Stellentitel oder Firma `q` enthält (ohne Filter), neueste zuerst; weitere
 * Seiten über fetchNextPage. Ohne Suchbegriff lädt nichts.
 */
export const useApplicationsSearch = (q: string) =>
  useInfiniteQuery({
    queryKey: queryKeys.applications.search(q),
    queryFn: ({ pageParam }) =>
      applicationsApi.list({ q, page: pageParam, size: PAGE_SIZE, sort: ['createdAt,desc'] }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled: q !== '',
    placeholderData: keepPreviousData,
  })

/**
 * Bewerbungen zum Auswählen (Notiz zuordnen): ohne Suchbegriff die neuesten, sonst die Treffer von
 * `q`; weitere Seiten über fetchNextPage.
 */
export const useApplicationChoices = (q: string, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: queryKeys.applications.search(q),
    queryFn: ({ pageParam }) =>
      applicationsApi.list({ q, page: pageParam, size: PAGE_SIZE, sort: ['createdAt,desc'] }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled,
    placeholderData: keepPreviousData,
  })

export const useApplication = (id: string) =>
  useQuery({ queryKey: queryKeys.applications.detail(id), queryFn: () => applicationsApi.get(id) })

export function useStartApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: applicationsApi.start,
    meta: {
      errorMessage: 'Die Bewerbung konnte nicht angelegt werden',
      // 409: Es gibt schon eine Bewerbung oder die Stelle ist archiviert. Das Neuladen der
      // Stelle (onSettled) zeigt dann „Zur Bewerbung“ bzw. „Wiederherstellen“.
      conflictMessage: 'Für diese Stelle lässt sich keine Bewerbung starten.',
    },
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.applications.lists }),
        qc.invalidateQueries({ queryKey: queryKeys.postings.all }),
        qc.invalidateQueries({ queryKey: queryKeys.companies.all }),
      ]),
  })
}

/**
 * Nur gesetzte Felder übernehmen (PATCH-Semantik: fehlend = unverändert). Zurück nach
 * „In Bearbeitung“ leert das Backend Bewerbungsdatum, Weg und Link, auch wenn sie im selben
 * Request stehen — das wird vorweggenommen.
 */
function applyPatch<T extends object>(target: T, patch: ApplicationPatch): T {
  const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v != null))
  if (patch.status !== 'IN_PROGRESS') return { ...target, ...defined }
  const cleared = Object.fromEntries(
    ['appliedAt', 'daysSinceApplication', 'appliedVia', 'portalUrl']
      .filter((key) => key in target)
      .map((key) => [key, null]),
  )
  return { ...target, ...defined, ...cleared }
}

type Column = InfiniteData<Page<ApplicationCompact>>
type ColumnFilter = { status: ApplicationStatus; priority?: ApplicationPriority }

const withTotal = (column: Column, delta: number): Column => ({
  ...column,
  pages: column.pages.map((p) => ({ ...p, totalElements: p.totalElements + delta })),
})

/**
 * Bewerbung in einer Board-Spalte nachziehen: Passt sie nicht mehr zum Filter der Spalte, fällt
 * sie heraus; kommt sie neu hinzu, steht sie oben auf der ersten Seite.
 */
function moveInColumn(column: Column, filter: ColumnFilter, updated: ApplicationCompact): Column {
  const contains = column.pages.some((p) => p.content.some((a) => a.id === updated.id))
  const belongs =
    updated.status === filter.status && (!filter.priority || updated.priority === filter.priority)
  if (contains && belongs)
    return {
      ...column,
      pages: column.pages.map((p) => ({
        ...p,
        content: p.content.map((a) => (a.id === updated.id ? updated : a)),
      })),
    }
  if (contains)
    return withTotal(
      {
        ...column,
        pages: column.pages.map((p) => ({ ...p, content: p.content.filter((a) => a.id !== updated.id) })),
      },
      -1,
    )
  if (!belongs) return column
  const [first, ...rest] = column.pages
  if (!first) return column
  return withTotal({ ...column, pages: [{ ...first, content: [updated, ...first.content] }, ...rest] }, 1)
}

/**
 * PATCH mit optimistischer Aktualisierung aller geladenen Listen (Tabellenseiten und
 * Board-Spalten) und des Details. appliedAt/closedAt setzt das Backend selbst, gefilterte Seiten
 * können sich verschieben — deshalb wird danach neu geladen.
 */
export function usePatchApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ApplicationPatch }) => applicationsApi.patch(id, patch),
    meta: {
      errorMessage: 'Speichern fehlgeschlagen',
      // 409: Statuswechsel nicht erlaubt (Backend prüft dieselben Regeln wie domain/transitions.ts)
      conflictMessage: 'Dieser Statuswechsel ist nicht möglich.',
    },
    onMutate: async ({ id, patch }) => {
      const listsKey = queryKeys.applications.lists
      const detailKey = queryKeys.applications.detail(id)
      await Promise.all([
        qc.cancelQueries({ queryKey: listsKey }),
        qc.cancelQueries({ queryKey: detailKey, exact: true }),
      ])
      const prevLists = qc.getQueriesData({ queryKey: listsKey })
      const prevDetail = qc.getQueryData<ApplicationDetail>(detailKey)
      const { status, priority } = patch
      const listPatch = { status, priority }

      qc.setQueriesData<Page<ApplicationCompact>>(
        { queryKey: queryKeys.applications.pages },
        (page) =>
          page && {
            ...page,
            content: page.content.map((a) => (a.id === id ? applyPatch(a, listPatch) : a)),
          },
      )
      const columns = qc.getQueriesData<Column>({ queryKey: queryKeys.applications.columns })
      const current = columns
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.content) ?? [])
        .find((a) => a.id === id)
      if (current) {
        const updated = applyPatch(current, listPatch)
        for (const [key, data] of columns)
          if (data) qc.setQueryData<Column>(key, moveInColumn(data, columnFilter(key), updated))
      }
      qc.setQueryData<ApplicationDetail>(detailKey, (d) => d && applyPatch(d, patch))
      return { prevLists, prevDetail }
    },
    onError: (_err, { id }, ctx) => {
      for (const [key, data] of ctx?.prevLists ?? []) qc.setQueryData(key, data)
      qc.setQueryData(queryKeys.applications.detail(id), ctx?.prevDetail)
    },
    onSettled: (_data, _err, { id }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.applications.lists }),
        qc.invalidateQueries({ queryKey: queryKeys.applications.detail(id), exact: true }),
      ]),
  })
}

/** Filter einer Board-Spalte aus ihrem Query-Key (queryKeys.applications.column). */
const columnFilter = (key: QueryKey) => key[3] as ColumnFilter
