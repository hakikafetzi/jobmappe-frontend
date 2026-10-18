import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './InfoList.module.css'

type InfoItem = {
  label: string
  value: ReactNode
  wrap?: boolean
  /** Kleine Aktionen neben der Beschriftung (z. B. ToolButton variant="inline") */
  actions?: ReactNode
}

/** Beschriftete Werte im Raster (Firma, Ort, Datum …). */
export function InfoList({
  items,
  columns = 3,
  className,
}: {
  items: InfoItem[]
  columns?: 1 | 3
  className?: string
}) {
  return (
    <dl className={cx(styles.list, columns === 1 && styles.single, className)}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className={cx(styles.term, item.actions != null && styles.withActions)}>
            {item.label}
            {item.actions && <span className={styles.actions}>{item.actions}</span>}
          </dt>
          <dd className={cx(styles.value, item.wrap && styles.wrap)}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
