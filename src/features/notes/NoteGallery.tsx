import type { CSSProperties } from 'react'
import type { NoteCompact } from '../../api/types'
import { cx } from '../../shared/lib/cx'
import { fmtDate } from '../../shared/lib/format'
import { FolderIcon } from '../../shared/ui/icons'
import styles from './NoteGallery.module.css'
import { NOTE_GRID } from './noteGrid'
import { NoteSheet } from './NoteSheet'

// Maße aus noteGrid.ts, damit Raster und berechnete Seitengröße übereinstimmen
const GRID_VARS = {
  '--card-min': `${NOTE_GRID.minWidth}px`,
  '--card-h': `${NOTE_GRID.height}px`,
  '--card-gap': `${NOTE_GRID.gap}px`,
} as CSSProperties

type Props = {
  notes: NoteCompact[]
  onOpen: (id: string) => void
  /** Welches Datum die Karte zeigt (passend zur Sortierung) */
  dateField: 'createdAt' | 'updatedAt'
}

/**
 * Notizen als Karten (Notizen-Seite): links ein kleines Notizblatt mit angedeuteten Zeilen, rechts
 * Ordner, Datum, Titel und die zugeordnete Bewerbung. Eine Karte öffnet die Notiz im Fenster.
 */
export function NoteGallery({ notes, onOpen, dateField }: Props) {
  return (
    <ul className={styles.grid} style={GRID_VARS}>
      {notes.map((n) => (
        <li key={n.id} className={styles.cell}>
          <button type="button" className={styles.card} onClick={() => onOpen(n.id)}>
            <NoteSheet noteId={n.id} size="lg" />
            <span className={styles.body}>
              {/* Ohne Ordner steht das Datum allein in der Ecke, Titel und Untertext rücken in die Mitte */}
              <span className={cx(styles.top, !n.noteCategory && styles.dateOnly)}>
                {n.noteCategory && (
                  <span className={styles.category}>
                    <FolderIcon />
                    <span className={styles.categoryName}>{n.noteCategory}</span>
                  </span>
                )}
                <span className={styles.date}>
                  {dateField === 'updatedAt' ? 'Bearbeitet ' : ''}
                  {fmtDate(n[dateField])}
                </span>
              </span>
              <span className={styles.title}>{n.title}</span>
              {n.applicationId ? (
                <span className={styles.subject}>
                  <span className={styles.job}>{n.jobTitle}</span>
                  <span className={styles.company}>{n.companyName}</span>
                </span>
              ) : (
                <span className={styles.lone}>Ohne Bewerbung</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
