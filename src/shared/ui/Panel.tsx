import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { CountBadge } from './Badge'
import styles from './Panel.module.css'

type Props = {
  title: ReactNode
  /** Zahl neben dem Titel */
  count?: number
  /** Grauer Hinweis rechts (z. B. Zeitraum) */
  hint?: ReactNode
  /** Aktionen rechts (Links, Knöpfe) */
  actions?: ReactNode
  children: ReactNode
  className?: string
  headingLevel?: 'h2' | 'h3'
  'aria-label'?: string
}

/** Karte mit Kopfzeile. */
export function Panel({
  title,
  count,
  hint,
  actions,
  children,
  className,
  headingLevel: H = 'h2',
  ...rest
}: Props) {
  return (
    <section className={cx(styles.panel, className)} aria-label={rest['aria-label']}>
      <div className={styles.head}>
        <H className={styles.title}>{title}</H>
        {count !== undefined && <CountBadge value={count} />}
        {hint && <span className={styles.hint}>{hint}</span>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </section>
  )
}
