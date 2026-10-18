import { cx } from '../lib/cx'
import styles from './Badge.module.css'

/** Zahl in einer Kopfzeile, z. B. „Offene Stellen (3)“. */
export function CountBadge({ value, className }: { value: number; className?: string }) {
  return <span className={cx(styles.count, className)}>{value}</span>
}
