import type { ReactNode } from 'react'
import { CountBadge } from '../../shared/ui/Badge'
import styles from './SettingsSection.module.css'

type Props = {
  title: ReactNode
  count?: number
  actions?: ReactNode
  children: ReactNode
}

/** Abschnitt der Einstellungen: Überschrift, optionale Aktionen, Karte. */
export function SettingsSection({ title, count, actions, children }: Props) {
  return (
    <section>
      <div className={styles.head}>
        <h2 className={styles.title}>
          {title}
          {count !== undefined && <CountBadge value={count} />}
        </h2>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.panel}>{children}</div>
    </section>
  )
}
