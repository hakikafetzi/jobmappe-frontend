import { useApplicationsSearch } from '../../api/applications'
import { useCompaniesInfinite } from '../../api/companies'
import { usePostingsSearch } from '../../api/jobPostings'
import { useNotesSearch } from '../../api/notes'
import type { ApplicationCompact, CompanyCompact, JobPostingCompact, NoteCompact } from '../../api/types'
import { paths } from '../../app/paths'
import type { SearchScope } from './searchScopes'

/**
 * Ein Treffer im Such-Modus: Seiten-Treffer haben ein Ziel (`to`), Notizen öffnen im Fenster auf der
 * aktuellen Seite.
 */
export type ScopeResult =
  | ({ id: string; to: string } & (
      | { kind: 'application'; item: ApplicationCompact }
      | { kind: 'posting'; item: JobPostingCompact }
      | { kind: 'company'; item: CompanyCompact }
    ))
  | { id: string; kind: 'note'; item: NoteCompact }

/**
 * Treffer des Such-Modus `scope` für `q` über das Backend (seitenweise). Die anderen Bereiche
 * fragen nichts ab. `total` ist `totalElements` der Suche.
 */
export function useScopeSearch(scope: SearchScope | null, q: string) {
  const applications = useApplicationsSearch(scope === 'applications' ? q : '')
  const postings = usePostingsSearch(scope === 'postings' ? q : '')
  const companies = useCompaniesInfinite(scope === 'companies' ? q : '')
  const notes = useNotesSearch(scope === 'notes' ? q : '')

  const items = <T>(data: { pages: { content: T[] }[] } | undefined) =>
    (data?.pages ?? []).flatMap((p) => p.content)

  const byScope = {
    applications: {
      query: applications,
      results: items(applications.data).map((item): ScopeResult => ({
        kind: 'application',
        id: item.id,
        to: paths.application(item.id),
        item,
      })),
    },
    postings: {
      query: postings,
      results: items(postings.data).map((item): ScopeResult => ({
        kind: 'posting',
        id: item.id,
        to: paths.posting(item.id, 'all'),
        item,
      })),
    },
    companies: {
      query: companies,
      results: items(companies.data).map((item): ScopeResult => ({
        kind: 'company',
        id: item.id,
        to: paths.company(item.id),
        item,
      })),
    },
    // Notizen haben keine eigene Adresse: Sie öffnen im Fenster auf der aktuellen Seite
    notes: {
      query: notes,
      results: items(notes.data).map((item): ScopeResult => ({ kind: 'note', id: item.id, item })),
    },
  }
  const { query, results } = byScope[scope ?? 'companies']
  const pages = (scope && q && query.data?.pages) || []

  return {
    results: pages.length ? results : [],
    total: pages[0]?.totalElements,
    hasMore: !!pages.length && query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    loading: !!scope && !!q && query.isFetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    error: scope && q ? query.error : null,
  }
}
