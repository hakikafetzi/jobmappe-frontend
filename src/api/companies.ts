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
import { nextPageParam, PAGE_SIZE } from './pagination'
import { queryKeys } from './queryKeys'
import type {
  CompanyCompact,
  CompanyDetail,
  CompanyListParams,
  CompanyRequest,
  JobPostingCompact,
  Page,
  PageParams,
} from './types'

export const companiesApi = {
  list: (params: CompanyListParams) => http.get<Page<CompanyCompact>>(withParams('/companies', params)),
  get: (id: string) => http.get<CompanyDetail>(`/companies/${seg(id)}`),
  create: (body: CompanyRequest) => http.post<CompanyDetail>('/companies', body),
  update: (id: string, body: CompanyRequest) => http.put<CompanyDetail>(`/companies/${seg(id)}`, body),
  postings: (id: string, params: PageParams) =>
    http.get<Page<JobPostingCompact>>(withParams(`/companies/${seg(id)}/job-postings`, params)),
}

/** 409: Firmennamen sind unabhängig von Groß-/Kleinschreibung eindeutig. */
export const COMPANY_CONFLICT = 'Eine Firma mit diesem Namen gibt es bereits.'

/** Fehlerbehandlung von useSaveCompany; das Formular zeigt Feldfehler und 409 selbst an. */
export const saveCompanyMeta = {
  errorMessage: 'Die Firma konnte nicht gespeichert werden',
  inlineFields: ['name', 'website', 'street', 'postalCode', 'city'],
  conflictField: 'name',
  conflictMessage: COMPANY_CONFLICT,
} as const satisfies MutationErrorMeta

/** Eine Seite der Firmen (Backend sortiert nach Name, sucht per `q`); auch zum Vorabladen. */
export const companiesPageQuery = (params: CompanyListParams) =>
  queryOptions({ queryKey: queryKeys.companies.list(params), queryFn: () => companiesApi.list(params) })

export const companyQuery = (id: string) =>
  queryOptions({ queryKey: queryKeys.companies.detail(id), queryFn: () => companiesApi.get(id) })

export const companyPostingsQuery = (id: string, params: PageParams) =>
  queryOptions({
    queryKey: queryKeys.companies.postings(id, params),
    queryFn: () => companiesApi.postings(id, params),
  })

export const useCompaniesPage = (params: CompanyListParams) =>
  useQuery({ ...companiesPageQuery(params), placeholderData: keepPreviousData })

/**
 * Firmen zum Auswählen, deren Name `q` enthält: erst eine Seite, weitere über fetchNextPage
 * („Mehr laden“). Ohne Suchbegriff lädt nichts.
 */
export const useCompaniesInfinite = (q: string) =>
  useInfiniteQuery({
    queryKey: queryKeys.companies.infinite(q),
    queryFn: ({ pageParam }) =>
      companiesApi.list({ q, page: pageParam, size: PAGE_SIZE, sort: ['name,asc'] }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled: q !== '',
    placeholderData: keepPreviousData,
  })

// Beim Wechsel der Firma bleibt die bisherige stehen, bis die neue geladen ist (isPlaceholderData)
export const useCompany = (id: string) => useQuery({ ...companyQuery(id), placeholderData: keepPreviousData })

/** Eine Seite der Stellen einer Firma (Backend sortiert, neueste zuerst). */
export const useCompanyPostingsPage = (id: string, params: PageParams) =>
  useQuery({ ...companyPostingsQuery(id, params), placeholderData: keepPreviousData })

/**
 * Firma anlegen (`id: null`, POST) oder ändern (PUT ersetzt alle Angaben). Name und Anschrift
 * stecken auch in Stellen und Bewerbungen — deshalb auch die neu laden.
 */
export function useSaveCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: CompanyRequest }) =>
      id ? companiesApi.update(id, body) : companiesApi.create(body),
    meta: saveCompanyMeta,
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.companies.all }),
        qc.invalidateQueries({ queryKey: queryKeys.postings.all }),
        qc.invalidateQueries({ queryKey: queryKeys.applications.all }),
      ]),
  })
}
