import { useState } from 'react'
import { LIST_PAGE_SIZES, paths } from '../../app/paths'
import { useAppActions } from '../../app/uiContext'
import { APP_STATUS, PRIORITY_FILTER_OPTIONS, STATUS_ORDER } from '../../domain/labels'
import { moveDialog } from '../../domain/transitions'
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'
import { Button, ButtonLink } from '../../shared/ui/Button'
import { cx } from '../../shared/lib/cx'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FilterGroup, FilterSelect } from '../../shared/ui/FilterSelect'
import { BoardIcon, TableIcon } from '../../shared/ui/icons'
import { Pager } from '../../shared/ui/Pager'
import { ErrorState, LoadingState } from '../../shared/ui/QueryState'
import { SearchBox } from '../../shared/ui/SearchBox'
import { TextButton } from '../../shared/ui/TextButton'
import { PageSwitchButton, PageToolbar } from '../postings/PageToolbar'
import styles from './ApplicationsPage.module.css'
import { BoardView } from './board/BoardView'
import type { ClosableApplication } from './closableApplication'
import { CloseApplicationDialog } from './CloseApplicationDialog'
import { MarkAppliedDialog } from './MarkAppliedDialog'
import { ResetToDraftDialog } from './ResetToDraftDialog'
import type { PriorityFilter, StatusFilter } from './selectApplications'
import { ApplicationsTable } from './table/ApplicationsTable'
import { useApplicationsView } from './useApplicationsView'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [{ value: 'all', label: 'Alle Bewerbungen' }]

export function ApplicationsPage() {
  const v = useApplicationsView()
  const [closing, setClosing] = useState<ClosableApplication | null>(null)
  // Wechsel, die erst eine Rückfrage brauchen (Bewerbungsweg bzw. Zurücksetzen)
  const [pending, setPending] = useState<{ kind: 'apply' | 'reset'; app: ClosableApplication } | null>(null)
  const { openNewPosting } = useAppActions()
  useDocumentTitle('Bewerbungen')
  const total = v.table.data?.totalElements
  const tableBusy = v.view === 'table' && (v.table.isPending || !!v.table.error)
  // Ohne Bewerbungen steht statt der Tabelle ein Hinweis
  const noApplications = !!v.table.data && !v.table.data.totalElements && !v.isFiltered

  return (
    <section className={styles.page} aria-label="Bewerbungen">
      <div className={styles.top}>
        <PageToolbar>
          <SearchBox
            value={v.search}
            onSearch={v.setSearch}
            placeholder="Stelle oder Firma suchen"
            label="Bewerbungen durchsuchen"
          />
          {v.view === 'board' ? (
            <PageSwitchButton onClick={() => v.setView('table')} onPrefetch={v.prefetchOtherView}>
              <TableIcon />
              Tabelle
            </PageSwitchButton>
          ) : (
            <PageSwitchButton onClick={() => v.setView('board')} onPrefetch={v.prefetchOtherView}>
              <BoardIcon />
              Board
            </PageSwitchButton>
          )}
        </PageToolbar>
        <div className={styles.filterRow}>
          <FilterGroup aria-label="Filter">
            {v.view === 'table' && (
              <FilterSelect
                label="Status"
                value={v.status}
                onChange={v.setStatus}
                options={STATUS_OPTIONS}
                groups={[
                  {
                    label: 'Einzelner Status',
                    options: STATUS_ORDER.map((s) => ({ value: s, label: APP_STATUS[s].label })),
                  },
                ]}
              />
            )}
            <FilterSelect<PriorityFilter>
              label="Priorität"
              value={v.priority}
              onChange={v.setPriority}
              options={PRIORITY_FILTER_OPTIONS}
            />
          </FilterGroup>
          <div className={styles.meta}>
            {/* Die Anzahl kennt nur die Tabelle (totalElements); im Board steht sie je Spalte */}
            {v.view === 'table' && total !== undefined && (
              <span aria-live="polite">
                <b>{total}</b> {total === 1 ? 'Bewerbung' : 'Bewerbungen'}
              </span>
            )}
            {v.isFiltered && (
              <TextButton onClick={v.resetFilters}>
                {v.search ? 'Suche zurücksetzen' : 'Filter zurücksetzen'}
              </TextButton>
            )}
          </div>
        </div>
      </div>

      <div className={cx(styles.body, tableBusy && styles.centered)} data-vt-stage>
        {v.view === 'board' ? (
          <BoardView
            priority={v.priority === 'all' ? undefined : v.priority}
            onMove={(app, to) => {
              const kind = moveDialog(app.status, to)
              if (kind) setPending({ kind, app })
              else v.moveTo(app.id, to)
            }}
            onDropClosed={setClosing}
            onShowClosed={v.showTable}
          />
        ) : v.table.isPending ? (
          <LoadingState page />
        ) : v.table.error ? (
          <ErrorState page error={v.table.error} onRetry={() => void v.table.refetch()} />
        ) : noApplications ? (
          // Ohne Bewerbungen: Tabelle wird zur Hinweisfläche, das Board zeigt leere Spalten
          <div className={styles.emptyPage} data-vt-part="sheet">
            <EmptyState
              icon={<TableIcon />}
              title="Noch keine Bewerbungen"
              actions={
                <>
                  <ButtonLink size="sm" variant="primary" to={paths.postings('open')}>
                    Zu den offenen Stellen
                  </ButtonLink>
                  <Button size="sm" onClick={openNewPosting}>
                    Stelle erfassen
                  </Button>
                </>
              }
            >
              Starte eine Bewerbung aus einer erfassten Stelle – sie erscheint dann hier.
            </EmptyState>
          </div>
        ) : (
          <ApplicationsTable
            rows={v.table.data.content}
            sort={v.sort}
            onSort={v.sortBy}
            search={v.search}
            onResetFilters={v.resetFilters}
            pager={
              // Wie auf der Startseite, dazu die Größenauswahl; auch bei nur einer Seite sichtbar
              <Pager
                alwaysVisible
                page={v.page}
                totalPages={v.table.data.totalPages}
                range={{ size: v.size, total: v.table.data.totalElements }}
                sizes={{ value: v.size, options: LIST_PAGE_SIZES, onChange: v.setSize }}
                hrefFor={v.pageHref}
              />
            }
          />
        )}
      </div>

      {closing && <CloseApplicationDialog app={closing} onClose={() => setClosing(null)} />}
      {pending?.kind === 'apply' && <MarkAppliedDialog app={pending.app} onClose={() => setPending(null)} />}
      {pending?.kind === 'reset' && <ResetToDraftDialog app={pending.app} onClose={() => setPending(null)} />}
    </section>
  )
}
