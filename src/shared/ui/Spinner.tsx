import { cx } from '../lib/cx'
import styles from './Spinner.module.css'

/** Drehender Ladekreis. Dekorativ — den Ladezustand meldet der umgebende `role="status"`. */
export function Spinner({ large }: { large?: boolean }) {
  return <span className={cx(styles.spinner, large && styles.large)} aria-hidden="true" />
}
