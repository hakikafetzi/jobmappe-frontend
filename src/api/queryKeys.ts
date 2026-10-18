import type {
  ApplicationListParams,
  ApplicationPriority,
  ApplicationStatus,
  CompanyListParams,
  NoteListParams,
  PageParams,
  PostingListParams,
} from './types'

// Zentrale Query-Keys. Hierarchisch, damit sich verwandte Daten gemeinsam invalidieren lassen.
// Paginierte Listen tragen ihre Parameter im Key; `lists` trifft alle Seiten einer Ressource.
export const queryKeys = {
  companies: {
    all: ['companies'] as const,
    list: (params: CompanyListParams) => ['companies', 'list', 'page', params] as const,
    infinite: (q: string) => ['companies', 'list', 'infinite', q] as const,
    detail: (id: string) => ['companies', id] as const,
    postings: (id: string, params: PageParams) => ['companies', id, 'job-postings', params] as const,
  },
  postings: {
    all: ['job-postings'] as const,
    list: (params: PostingListParams) => ['job-postings', 'list', params] as const,
    search: (q: string) => ['job-postings', 'list', 'search', q] as const,
    detail: (id: string) => ['job-postings', id] as const,
  },
  applications: {
    all: ['applications'] as const,
    lists: ['applications', 'list'] as const,
    pages: ['applications', 'list', 'page'] as const,
    list: (params: ApplicationListParams) => ['applications', 'list', 'page', params] as const,
    search: (q: string) => ['applications', 'list', 'search', q] as const,
    columns: ['applications', 'list', 'column'] as const,
    column: (status: ApplicationStatus, priority?: ApplicationPriority) =>
      ['applications', 'list', 'column', { status, priority }] as const,
    detail: (id: string) => ['applications', 'detail', id] as const,
  },
  notes: {
    all: ['notes'] as const,
    lists: ['notes', 'list'] as const,
    list: (params: NoteListParams) => ['notes', 'list', 'page', params] as const,
    infinite: (params: NoteListParams) => ['notes', 'list', 'infinite', params] as const,
    detail: (id: string) => ['notes', 'detail', id] as const,
  },
  categories: {
    all: ['note-categories'] as const,
  },
}
