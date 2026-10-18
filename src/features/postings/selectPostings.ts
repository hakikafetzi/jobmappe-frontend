// Filter und Sortierung der Stellen übernimmt das Backend; hier nur die Zuordnung UI → API.
import type { JobPostingFilter, PostingListParams } from '../../api/types'
import type { PostingFilter, PostingSort } from '../../app/paths'

export const POSTING_FILTERS: { value: PostingFilter; label: string; api: JobPostingFilter }[] = [
  { value: 'open', label: 'Offen', api: 'OPEN' },
  { value: 'with', label: 'Beworben', api: 'APPLIED' },
  { value: 'inactive', label: 'Inaktiv', api: 'INACTIVE' },
  { value: 'archived', label: 'Archiviert', api: 'ARCHIVED' },
  { value: 'all', label: 'Alle', api: 'ALL' },
]

export const POSTING_SORTS: { value: PostingSort; label: string; api: string }[] = [
  { value: 'new', label: 'Neueste', api: 'createdAt,desc' },
  { value: 'old', label: 'Älteste', api: 'createdAt,asc' },
  { value: 'title', label: 'Titel A–Z', api: 'title,asc' },
  { value: 'company', label: 'Firma A–Z', api: 'company.name,asc' },
]

export function parsePostingFilter(value: string | null): PostingFilter {
  return POSTING_FILTERS.find((f) => f.value === value)?.value ?? 'open'
}

export function parsePostingSort(value: string | null): PostingSort {
  return POSTING_SORTS.find((s) => s.value === value)?.value ?? 'new'
}

export const apiPostingFilter = (filter: PostingFilter): JobPostingFilter =>
  POSTING_FILTERS.find((f) => f.value === filter)!.api

export const apiPostingSort = (sort: PostingSort): string => POSTING_SORTS.find((s) => s.value === sort)!.api

/**
 * Query-Parameter einer Seite der Stellen-Liste (gleich für Seite und Vorabladen, siehe pageSwitch.ts).
 * Eine Suche gilt immer über alle Stellen: Das Backend kombiniert `q` nur mit `filter=ALL`.
 */
export const postingsListParams = (q: {
  filter: PostingFilter
  search?: string
  sort: PostingSort
  page: number
  size: number
}): PostingListParams => {
  const paging = { page: q.page, size: q.size, sort: [apiPostingSort(q.sort)] }
  return q.search
    ? { ...paging, filter: 'ALL', q: q.search }
    : { ...paging, filter: apiPostingFilter(q.filter) }
}

/** Filter der Seite: Bei einer Suche ist es immer „Alle“ (Suche und Filter schließen sich aus). */
export const effectivePostingFilter = (filter: PostingFilter, search: string): PostingFilter =>
  search ? 'all' : filter
