import type { ReactNode } from 'react'
import styles from './SettingRow.module.css'

type Props = {
  label: ReactNode
  description?: ReactNode
  children: ReactNode
}

/** Zeile einer Einstellungs-Karte: Bezeichnung und Beschreibung links, Steuerelement rechts. */
export function SettingRow({ label, description, children }: Props) {
  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <div className={styles.label}>{label}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      <div className={styles.control}>{children}</div>
    </div>
  )
}
