import type { CSSProperties } from 'react'
import { cx } from '../../shared/lib/cx'
import styles from './NoteSheet.module.css'
import { previewLines } from './noteText'

/** Angedeutete Zeilen je Größe */
const LINES = { lg: 5, md: 4, sm: 3 } as const

/**
 * Kleines Notizblatt mit Eselsohr und angedeuteten Zeilen (Galerie, Tabelle, Notizliste im Vollbild).
 * Nur Dekoration. `lg`: Karte der Galerie, `md`: Notizliste im Vollbild, `sm`: Zeilen der Tabelle.
 * Beim Darüberfahren färbt die umgebende Zeile es über `--sheet-bg` / `--sheet-fold` ein.
 */

export function NoteSheet({ noteId, size }: { noteId: string; size: 'lg' | 'md' | 'sm' }) {
  return (
    <span className={cx(styles.sheet, styles[size])} aria-hidden="true">
      {previewLines(noteId, LINES[size]).map((line) => (
        <span key={line.key} className={styles.line} style={{ '--w': `${line.width}%` } as CSSProperties} />
      ))}
    </span>
  )
}
