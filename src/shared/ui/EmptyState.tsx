import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './EmptyState.module.css'

type Props = {
  /** Dekoratives Icon über dem Text (z. B. `<BriefcaseIcon />`) */
  icon?: ReactNode
  title?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  /** Nebensächliche Aktion unter den Knöpfen (z. B. ein Textlink) */
  footnote?: ReactNode
  /** Weniger Abstand, kleineres Icon (für Karten und schmale Listen) */
  compact?: boolean
  /** Größeres Icon und größerer Text, z. B. für Fehler, die eine ganze Seite ersetzen */
  large?: boolean
  /** Füllt den (Flex-)Container und steht darin mittig, z. B. in einer großen Karte */
  fill?: boolean
}

/** Leerer Zustand einer Liste, Tabelle oder Seite: Icon, Titel, Text und Aktionen, mittig. */
export function EmptyState({ icon, title, children, actions, footnote, compact, large, fill }: Props) {
  return (
    <div className={cx(styles.empty, compact && styles.compact, large && styles.large, fill && styles.fill)}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {title && <div className={styles.title}>{title}</div>}
      {children && <div className={styles.text}>{children}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
      {footnote && <div className={styles.footnote}>{footnote}</div>}
    </div>
  )
}
