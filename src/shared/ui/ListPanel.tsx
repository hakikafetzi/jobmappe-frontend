import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { CountBadge } from './Badge'
import styles from './ListPanel.module.css'

type Props = {
  title: ReactNode
  count?: number
  actions?: ReactNode
  children: ReactNode
  /** Füllt die verfügbare Höhe; die Karte wird zur Spalte, ihr Inhalt regelt das Scrollen selbst */
  fill?: boolean
}

/** Abschnitt mit großer Überschrift über einer Karte (Notizen, Dokumente). */
export function ListPanel({ title, count, actions, children, fill }: Props) {
  return (
    <section className={cx(fill && styles.fill)}>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {count !== undefined && <CountBadge value={count} />}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.box}>{children}</div>
    </section>
  )
}
