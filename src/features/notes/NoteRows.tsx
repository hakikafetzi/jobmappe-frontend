import type { NoteCompact } from '../../api/types'
import type { NoteSort } from '../../app/paths'
import { cx } from '../../shared/lib/cx'
import { fmtDate } from '../../shared/lib/format'
import { FolderIcon } from '../../shared/ui/icons'
import styles from './NoteRows.module.css'
import { NoteSheet } from './NoteSheet'
import { applicationLabel } from './noteText'
import { headerSort, sortOnHeaderClick, type NoteColumn } from './selectNotes'

const SORTABLE: { key: NoteColumn; label: string; className: string | undefined }[] = [
  { key: 'title', label: 'Titel', className: styles.colTitle },
  { key: 'created', label: 'Erstellt', className: styles.colDate },
  { key: 'edited', label: 'Bearbeitet', className: styles.colDate },
]

type Props = {
  notes: NoteCompact[]
  onOpen: (id: string) => void
  sort: NoteSort
  onSort: (sort: NoteSort) => void
}

/**
 * Notizen als Tabelle (Notizen-Seite, Ansicht „Tabelle“): Titel mit kleinem Notizblatt, Bewerbung,
 * Ordner, Erstellt und Bearbeitet. Titel und Daten sortieren per Spaltenkopf (Backend). Eine Zeile
 * öffnet die Notiz im Fenster (der Titel-Knopf deckt die ganze Zeile ab).
 */
export function NoteRows({ notes, onOpen, sort, onSort }: Props) {
  const header = (key: NoteColumn) => {
    const column = SORTABLE.find((c) => c.key === key)!
    const active = headerSort(sort, key)
    return (
      <th
        className={cx(styles.th, column.className)}
        aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : undefined}
      >
        <button
          type="button"
          className={styles.sortButton}
          onClick={() => onSort(sortOnHeaderClick(sort, key))}
        >
          {column.label}
          {active && (
            <span className={styles.arrow} aria-hidden="true">
              {active === 'asc' ? '▲' : '▼'}
            </span>
          )}
        </button>
      </th>
    )
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {header('title')}
          <th className={cx(styles.th, styles.colApp)}>
            <span className={styles.thLabel}>Bewerbung</span>
          </th>
          <th className={cx(styles.th, styles.colFolder)}>
            <span className={styles.thLabel}>Ordner</span>
          </th>
          {header('created')}
          {header('edited')}
        </tr>
      </thead>
      <tbody>
        {notes.map((n) => (
          <tr key={n.id} className={styles.row}>
            <td className={cx(styles.td, styles.colTitle)}>
              <span className={styles.titleCell}>
                <NoteSheet noteId={n.id} size="sm" />
                <span className={styles.titleText}>
                  <button type="button" className={styles.open} onClick={() => onOpen(n.id)}>
                    {n.title}
                  </button>
                  {/* Mobil ohne eigene Spalte: die Bewerbung unter dem Titel */}
                  <span className={styles.subjectInline}>
                    {n.applicationId ? applicationLabel(n) : 'Ohne Bewerbung'}
                  </span>
                </span>
              </span>
            </td>
            <td className={cx(styles.td, styles.colApp)}>
              {n.applicationId ? (
                <>
                  <span className={styles.job}>{n.jobTitle}</span>
                  <span className={styles.company}>{n.companyName}</span>
                </>
              ) : (
                <span className={styles.muted}>Ohne Bewerbung</span>
              )}
            </td>
            <td className={cx(styles.td, styles.colFolder)}>
              {n.noteCategory ? (
                <span className={styles.category}>
                  <FolderIcon />
                  <span className={styles.categoryName}>{n.noteCategory}</span>
                </span>
              ) : (
                <span className={styles.muted}>–</span>
              )}
            </td>
            <td className={cx(styles.td, styles.colDate, styles.date)}>{fmtDate(n.createdAt)}</td>
            <td className={cx(styles.td, styles.colDate, styles.date)}>{fmtDate(n.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
