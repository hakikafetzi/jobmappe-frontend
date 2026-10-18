import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { useCompaniesPage } from '../../api/companies'
import { clampedPage } from '../../api/pagination'
import {
  LIST_PAGE_SIZES,
  parsePage,
  parsePageSize,
  parseSearch,
  paths,
  readState,
  type CompanyOrigin,
} from '../../app/paths'
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'
import { cx } from '../../shared/lib/cx'
import { CountBadge } from '../../shared/ui/Badge'
import { EmptyState } from '../../shared/ui/EmptyState'
import { BriefcaseIcon, BuildingIcon, PlusIcon, SearchIcon } from '../../shared/ui/icons'
import { Pager } from '../../shared/ui/Pager'
import { ErrorState, LoadingState } from '../../shared/ui/QueryState'
import { SearchBox } from '../../shared/ui/SearchBox'
import { TextButton } from '../../shared/ui/TextButton'
import { CompanyDialog } from './company-edit/CompanyDialog'
import { CompanyDetail } from './CompanyDetail'
import { CompanyList } from './CompanyList'
import styles from './CompanyPage.module.css'
import { PageSwitchLink, PageToolbar, ToolbarAction } from './PageToolbar'
import { companiesListParams, prefetchPostingsPage } from './pageSwitch'

/**
 * Firmen-Seite: oben Suche nach Namen (?suche=), „+ Firma“ und der Wechsel zu den Stellen; links
 * eine Seite der Firmen (?seite=), rechts die gewählte mit ihren Stellen. Ohne Firma in der URL
 * (/firmen) zeigt der Desktop die erste der Seite, mobil die Liste selbst.
 */
export function CompanyPage() {
  const { companyId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const backToPostingId = readState<CompanyOrigin>(location.state, 'fromPosting')?.fromPosting
  const [params] = useSearchParams()
  const search = parseSearch(params.get('suche'))
  const page = parsePage(params.get('seite'))
  const size = parsePageSize(params.get('anzahl'))
  const companies = useCompaniesPage(companiesListParams(page, size, search))
  const [creating, setCreating] = useState(false)
  const list = companies.data?.content ?? []
  const selectedId = companyId ?? list[0]?.id

  // Neue Suche oder Seitengröße: zurück auf die erste Seite
  const setSize = (n: number) => void navigate(paths.companies({ search, size: n }), { replace: true })
  const setSearch = (q: string) => void navigate(paths.companies({ search: q, size }), { replace: true })

  // Seite über das Ende hinaus (z. B. alter Link): auf die letzte vorhandene
  const clamped = clampedPage(companies.isPlaceholderData ? undefined : companies.data, page)
  useEffect(() => {
    if (clamped !== null) void navigate(paths.companies({ search, page: clamped, size }), { replace: true })
  }, [clamped, search, size, navigate])
  // Die Detailkarte setzt den Titel selbst, sobald eine Firma gewählt ist
  useDocumentTitle(selectedId ? null : 'Firmen')

  return (
    <section className={cx(styles.page, companyId && styles.showDetail)} aria-label="Firmen">
      <div className={styles.top}>
        <PageToolbar>
          <SearchBox
            value={search}
            onSearch={setSearch}
            placeholder="Firma suchen"
            label="Firmen durchsuchen"
          />
          <ToolbarAction onClick={() => setCreating(true)}>
            <PlusIcon />
            Firma
          </ToolbarAction>
          <PageSwitchLink to={paths.postings()} prefetch={prefetchPostingsPage}>
            <BriefcaseIcon />
            Stellen
          </PageSwitchLink>
        </PageToolbar>
      </div>

      {/* Mobil zurück zur Liste — außer man kam von einer Stelle (dann „Zurück zur Stelle“ in der Karte) */}
      {!backToPostingId && (
        <Link to={paths.companies({ search, page, size })} className={styles.back}>
          ← Zurück zur Liste
        </Link>
      )}

      {companies.isPending ? (
        <LoadingState page />
      ) : companies.error ? (
        <ErrorState page error={companies.error} onRetry={() => void companies.refetch()} />
      ) : (
        <div className={styles.split}>
          <div className={styles.master}>
            <div className={styles.head}>
              <h2 className={styles.title}>Firmen</h2>
              <CountBadge value={companies.data.totalElements} />
            </div>
            {list.length ? (
              <CompanyList companies={list} selectedId={selectedId} query={{ search, page, size }} />
            ) : search ? (
              <EmptyState
                icon={<SearchIcon />}
                title="Keine Treffer"
                actions={<TextButton onClick={() => setSearch('')}>Suche zurücksetzen</TextButton>}
              >
                Keine Firma passt zu „{search}“.
              </EmptyState>
            ) : (
              <EmptyState icon={<BuildingIcon />} title="Noch keine Firmen">
                Lege eine Firma an oder erfasse eine Stelle.
              </EmptyState>
            )}
            {/* Wie auf der Stellen-Seite: immer sichtbar, Seitengröße wählbar */}
            <div className={styles.pagerSlot}>
              <Pager
                page={page}
                totalPages={companies.data.totalPages}
                sizes={{ value: size, options: LIST_PAGE_SIZES, onChange: setSize }}
                alwaysVisible
                variant="card"
                className={styles.pager}
                hrefFor={(p) => paths.companies({ search, page: p, size })}
              />
            </div>
          </div>
          <div className={styles.detail}>
            {selectedId && <CompanyDetail companyId={selectedId} backToPostingId={backToPostingId} />}
          </div>
        </div>
      )}

      {creating && (
        <CompanyDialog
          company={null}
          onClose={() => setCreating(false)}
          onSaved={(company) => void navigate(paths.company(company.id))}
        />
      )}
    </section>
  )
}
