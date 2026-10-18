import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { InfoIcon } from './icons'
import styles from './InfoNote.module.css'

type Props = {
  children: ReactNode
  /**
   * Mittig unter den Feldern eines Dialogs, mit Abstand nach oben (z. B. „Beides ist freiwillig …“).
   * Ohne: Schrift und Abstände bestimmt der Aufrufer über `className`.
   */
  centered?: boolean
  className?: string
}

/** Hinweistext mit Info-Icon davor; das Icon sitzt auf Höhe der ersten Zeile. */
export function InfoNote({ children, centered = false, className }: Props) {
  return (
    <p className={cx(styles.note, centered && styles.centered, className)}>
      <InfoIcon className={styles.icon} />
      <span>{children}</span>
    </p>
  )
}
