import {
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { http, seg, withParams } from './client'
import type { MutationErrorMeta } from './errors'
import { COMPANY_CONFLICT, companiesApi } from './companies'
import { nextPageParam, PAGE_SIZE } from './pagination'
import { queryKeys } from './queryKeys'
import type {
  CompanyRequest,
  CompanyDetail,
  JobPostingArchiveRequest,
  JobPostingCompact,
  JobPostingDetail,
  JobPostingRequest,
  Page,
  PostingListParams,
} from './types'

const jobPostingsApi = {
  list: (params: PostingListParams) => http.get<Page<JobPostingCompact>>(withParams('/job-postings', params)),
  get: (id: string) => http.get<JobPostingDetail>(`/job-postings/${seg(id)}`),
  create: (companyId: string, body: JobPostingRequest) =>
    http.post<JobPostingDetail>(`/companies/${seg(companyId)}/job-postings`, body),
  update: (id: string, body: JobPostingRequest) =>
    http.put<JobPostingDetail>(`/job-postings/${seg(id)}`, body),
  archive: (id: string, body: JobPostingArchiveRequest) =>
    http.patch<JobPostingDetail>(`/job-postings/${seg(id)}/archive`, body),
}

/** Eine Seite der Stellen; Filter und Sortierung übernimmt das Backend. Auch zum Vorabladen. */
export const postingsPageQuery = (params: PostingListParams) =>
  queryOptions({ queryKey: queryKeys.postings.list(params), queryFn: () => jobPostingsApi.list(params) })

export const usePostingsPage = (params: PostingListParams) =>
  useQuery({ ...postingsPageQuery(params), placeholderData: keepPreviousData })

/**
 * Stellen, deren Titel oder Firma `q` enthält (über alle Stellen, `filter=ALL`), neueste zuerst;
 * weitere Seiten über fetchNextPage. Ohne Suchbegriff lädt nichts.
 */
export const usePostingsSearch = (q: string) =>
  useInfiniteQuery({
    queryKey: queryKeys.postings.search(q),
    queryFn: ({ pageParam }) =>
      jobPostingsApi.list({ filter: 'ALL', q, page: pageParam, size: PAGE_SIZE, sort: ['createdAt,desc'] }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled: q !== '',
    placeholderData: keepPreviousData,
  })

export const postingQuery = (id: string) =>
  queryOptions({ queryKey: queryKeys.postings.detail(id), queryFn: () => jobPostingsApi.get(id) })

// Beim Wechsel der Stelle bleibt die bisherige stehen, bis die neue geladen ist (isPlaceholderData)
export const usePosting = (id: string) => useQuery({ ...postingQuery(id), placeholderData: keepPreviousData })

/** Firma ist entweder vorhanden (`companyId`) oder wird vorher neu angelegt (`newCompany`). */
export type CreatePostingInput =
  | { companyId: string; newCompany?: never; posting: JobPostingRequest }
  | { companyId?: never; newCompany: CompanyRequest; posting: JobPostingRequest }

/**
 * Fehler beim Anlegen einer Stelle (der ApiError steckt in `cause`). Ist die neue Firma schon
 * angelegt und erst die Stelle gescheitert, steht sie in `createdCompany` — ein erneuter Versuch
 * muss sie verwenden, sonst gäbe es einen 409 (Firmennamen sind eindeutig).
 */
export class CreatePostingError extends Error {
  readonly createdCompany: CompanyDetail | null

  constructor(cause: unknown, createdCompany: CompanyDetail | null) {
    super('Die Stelle konnte nicht angelegt werden', { cause })
    this.name = 'CreatePostingError'
    this.createdCompany = createdCompany
  }
}

/** Fehlerbehandlung von useCreatePosting; das Formular zeigt Feldfehler und 409 selbst an. */
export const createPostingMeta = {
  errorMessage: 'Die Stelle konnte nicht gespeichert werden',
  // Feldnamen von JobPostingRequest und CompanyRequest (neue Firma) überschneiden sich nicht
  inlineFields: [
    'title',
    'url',
    'location',
    'publishedAt',
    'name',
    'website',
    'street',
    'postalCode',
    'city',
  ],
  conflictField: 'name',
  conflictMessage: COMPANY_CONFLICT,
} as const satisfies MutationErrorMeta

export function useCreatePosting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePostingInput) => {
      const created = input.newCompany ? await companiesApi.create(input.newCompany) : null
      try {
        return await jobPostingsApi.create(created?.id ?? input.companyId!, input.posting)
      } catch (error) {
        throw new CreatePostingError(error, created)
      }
    },
    meta: createPostingMeta,
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.postings.all }),
        qc.invalidateQueries({ queryKey: queryKeys.companies.all }),
      ]),
  })
}

/** PUT ersetzt alle Angaben der Stelle; Titel und Status stecken auch in Firmen- und Bewerbungsdaten. */
export function useUpdatePosting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: JobPostingRequest }) => jobPostingsApi.update(id, body),
    meta: {
      errorMessage: 'Die Stelle konnte nicht gespeichert werden',
      inlineFields: ['title', 'url', 'location', 'publishedAt'],
    } satisfies MutationErrorMeta,
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.postings.all }),
        qc.invalidateQueries({ queryKey: queryKeys.companies.all }),
        qc.invalidateQueries({ queryKey: queryKeys.applications.all }),
      ]),
  })
}

/**
 * Archivieren bzw. Wiederherstellen. Die Listeneinträge kennen den Archivstatus nicht, nur das
 * Detail; die Antwort ist das neue Detail. Der Filter „Archiviert“ wird neu geladen.
 * 409: schon (nicht) archiviert oder es gibt eine Bewerbung.
 */
export function useArchivePosting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      jobPostingsApi.archive(id, { archived }),
    meta: {
      errorMessage: 'Der Archivstatus konnte nicht geändert werden',
      conflictMessage: 'Der Archivstatus der Stelle hat sich inzwischen geändert.',
    } satisfies MutationErrorMeta,
    onSuccess: (detail) => qc.setQueryData(queryKeys.postings.detail(detail.id), detail),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.postings.all }),
  })
}
