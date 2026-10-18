import { LIST_PAGE_SIZES, paths } from '../../app/paths'
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'
import { MOBILE_QUERY, useMediaQuery } from '../../shared/hooks/useMediaQuery'
import { cx } from '../../shared/lib/cx'
import { BuildingIcon } from '../../shared/ui/icons'
import { Pager } from '../../shared/ui/Pager'
import { ErrorState, LoadingState } from '../../shared/ui/QueryState'
import { SearchBox } from '../../shared/ui/SearchBox'
import { AddPostingButton } from './AddPostingButton'
import { EmptyDetail } from './EmptyDetail'
import { PageSwitchLink, PageToolbar } from './PageToolbar'
import { prefetchCompaniesPage } from './pageSwitch'
import { PostingDetail } from './PostingDetail'
import { PostingList } from './PostingList'
import { PostingsEmpty } from './PostingsEmpty'
import { PostingsFilterBar } from './PostingsFilterBar'
import styles from './PostingsPage.module.css'
import { usePostingsView } from './usePostingsView'

export function PostingsPage() {
  const view = usePostingsView()
  // Mobil ist die Detailkarte ohne Auswahl ausgeblendet → Aktionen dann in der Liste
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const selectedTitle = view.hasExplicitSelection
    ? view.list.find((p) => p.id === view.selectedId)?.title
    : undefined
  useDocumentTitle(selectedTitle ?? 'Stellen')
  const emptyProps = {
    filter: view.filter,
    onFilterChange: view.setFilter,
    search: view.search,
    onClearSearch: () => view.setSearch(''),
    showFindActions: isMobile,
  }
  // Noch gar keine Stellen: statt Liste und leerem Detail eine Fläche mit den Wegen zur ersten Stelle
  const noPostingsYet =
    view.postings.isSuccess && view.filter === 'all' && !view.search && view.total === 0 && !view.selectedId

  return (
    <section className={cx(styles.page, view.hasExplicitSelection && styles.showDetail)} aria-label="Stellen">
      <div className={styles.top}>
        <PageToolbar>
          <SearchBox
            value={view.search}
            onSearch={view.setSearch}
            placeholder="Titel oder Firma suchen"
            label="Stellen durchsuchen"
          />
          <AddPostingButton />
          <PageSwitchLink to={paths.companies()} prefetch={prefetchCompaniesPage}>
            <BuildingIcon />
            Firmen
          </PageSwitchLink>
        </PageToolbar>
        <div className={styles.filters}>
          <PostingsFilterBar
            filter={view.filter}
            onFilterChange={view.setFilter}
            total={view.postings.data?.totalElements}
            sort={view.sort}
            onSortChange={view.setSort}
          />
        </div>
      </div>

      <button type="button" className={styles.back} onClick={view.closeDetail}>
        ← Zurück zur Liste
      </button>

      {view.postings.isPending ? (
        <LoadingState page />
      ) : view.postings.error ? (
        <ErrorState page error={view.postings.error} onRetry={() => void view.postings.refetch()} />
      ) : noPostingsYet ? (
        <div className={styles.emptyPage}>
          <PostingsEmpty {...emptyProps} />
        </div>
      ) : (
        <div className={styles.split}>
          <div className={styles.master}>
            <PostingList
              postings={view.list}
              selectedId={view.selectedId}
              hrefFor={view.hrefFor}
              // Nur „Alle“ und „Inaktiv“ mischen Stellen mit und ohne Bewerbung; sonst sagt es der Filter
              showApplicationState={view.filter === 'all' || view.filter === 'inactive'}
              empty={<PostingsEmpty {...emptyProps} />}
            />
            <div className={styles.pagerSlot}>
              <Pager
                page={view.page}
                totalPages={view.totalPages}
                sizes={{ value: view.size, options: LIST_PAGE_SIZES, onChange: view.setSize }}
                alwaysVisible
                variant="card"
                className={styles.pager}
                hrefFor={view.pageHref}
              />
            </div>
          </div>
          <div className={styles.detail}>
            {view.selectedId ? (
              <PostingDetail postingId={view.selectedId} />
            ) : (
              <EmptyDetail listEmpty={!view.list.length} />
            )}
          </div>
        </div>
      )}
    </section>
  )
}
