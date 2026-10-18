import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { ApplicationCompact } from '../../../api/types'
import { paths, type ApplicationOrigin, type TableSort, type TableSortKey } from '../../../app/paths'
import { isClosedStatus } from '../../../domain/labels'
import { cx } from '../../../shared/lib/cx'
import { fmtDate } from '../../../shared/lib/format'
import { useSettings } from '../../../shared/settings/useSettings'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { TableIcon } from '../../../shared/ui/icons'
import { TextButton } from '../../../shared/ui/TextButton'
import { isOverdue } from '../age'
import { PriorityLabel } from '../components/PriorityLabel'
import { StatusChip } from '../components/StatusChip'
import styles from './ApplicationsTable.module.css'

const COLUMNS: { key: TableSortKey; label: string }[] = [
  { key: 'title', label: 'Stelle' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priorität' },
  { key: 'applied', label: 'Beworben' },
  { key: 'days', label: 'Wartet' },
]

type Props = {
  rows: ApplicationCompact[]
  sort: TableSort
  onSort: (key: TableSortKey) => void
  /** Aktive Suche ('' = keine); bestimmt den Text, wenn nichts gefunden wurde */
  search: string
  onResetFilters: () => void
  /** Blättern als Fußzeile der Tabellenkarte */
  pager: ReactNode
}

/** Eine Seite der Bewerbungen; Sortieren per Spaltenkopf übernimmt das Backend. */
export function ApplicationsTable({ rows, sort, onSort, search, onResetFilters, pager }: Props) {
  const { followUpDays } = useSettings()
  const state: ApplicationOrigin = { from: 'board' }

  return (
    <div className={styles.wrap} data-vt-part="sheet">
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                className={styles.th}
                aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
              >
                <button type="button" className={styles.sortButton} onClick={() => onSort(c.key)}>
                  {c.label}
                  {sort.key === c.key && (
                    <span className={styles.arrow} aria-hidden="true">
                      {sort.dir === 1 ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const closed = isClosedStatus(a.status)
            const days = a.daysSinceApplication
            return (
              <tr key={a.id} className={styles.row}>
                <td className={styles.td}>
                  <Link to={paths.application(a.id)} state={state} className={styles.link}>
                    <div className={styles.title}>{a.jobTitle}</div>
                    <div className={styles.company}>{a.companyName}</div>
                  </Link>
                </td>
                <td className={styles.td}>
                  <StatusChip status={a.status} />
                </td>
                <td className={styles.td} data-label="Priorität">
                  <PriorityLabel priority={a.priority} />
                </td>
                <td className={styles.td} data-label="Beworben">
                  <span className={styles.num}>{fmtDate(a.appliedAt)}</span>
                </td>
                <td className={styles.td} data-label="Wartet">
                  {closed ? (
                    <span className={styles.muted}>abgeschlossen</span>
                  ) : days !== null ? (
                    <span className={cx(styles.num, isOverdue(days, followUpDays) && styles.warn)}>
                      {days} Tage
                    </span>
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!rows.length && (
        <EmptyState
          icon={<TableIcon />}
          title="Keine Treffer"
          actions={
            <TextButton onClick={onResetFilters}>
              {search ? 'Suche zurücksetzen' : 'Filter zurücksetzen'}
            </TextButton>
          }
        >
          {search
            ? `Keine Bewerbung passt zu „${search}“. Gesucht wird in Stellentitel und Firmenname.`
            : 'Keine Bewerbung passt zu dieser Auswahl.'}
        </EmptyState>
      )}
      <div className={styles.footer}>{pager}</div>
    </div>
  )
}
