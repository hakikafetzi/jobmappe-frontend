// Wechsel Stellen ↔ Firmen: Die Zielseite wird vorab geladen, damit der animierte Übergang
// (View Transition, pageTransition.ts) ihre Karten und den Pager erfasst — nicht einen Spinner.
import type { QueryClient } from '@tanstack/react-query'
import { companiesPageQuery, companyPostingsQuery, companyQuery } from '../../api/companies'
import { postingQuery, postingsPageQuery } from '../../api/jobPostings'
import { PAGE_SIZE } from '../../api/pagination'
import type { CompanyListParams, PageParams } from '../../api/types'
import { LIST_PAGE_SIZE } from '../../app/paths'
import { postingsListParams } from './selectPostings'

/** Query-Parameter einer Seite der Firmen-Liste; `search` sucht im Namen. */
export const companiesListParams = (page: number, size: number, search = ''): CompanyListParams => ({
  q: search || undefined,
  page,
  size,
  sort: ['name,asc'],
})

/** Seite `page` der Stellen einer Firma, neueste zuerst (Firmendetail). */
export const companyJobsParams = (page: number): PageParams => ({
  page,
  size: PAGE_SIZE,
  sort: ['createdAt,desc'],
})

/** Firmen-Seite ohne Parameter (/firmen): erste Seite und die erste Firma samt ihren Stellen. */
export async function prefetchCompaniesPage(qc: QueryClient) {
  const list = await qc.fetchQuery(companiesPageQuery(companiesListParams(0, LIST_PAGE_SIZE)))
  const first = list.content[0]
  if (first)
    await Promise.all([
      qc.prefetchQuery(companyQuery(first.id)),
      qc.prefetchQuery(companyPostingsQuery(first.id, companyJobsParams(0))),
    ])
}

/** Stellen-Seite ohne Parameter (/stellen): erste Seite „Offen“ und die erste Stelle. */
export async function prefetchPostingsPage(qc: QueryClient) {
  const params = postingsListParams({ filter: 'open', sort: 'new', page: 0, size: LIST_PAGE_SIZE })
  const list = await qc.fetchQuery(postingsPageQuery(params))
  const first = list.content[0]
  if (first) await qc.prefetchQuery(postingQuery(first.id))
}
