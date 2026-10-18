import type { ReactNode } from 'react'
import styles from './VisuallyHidden.module.css'

/** Nur für Screenreader sichtbar. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.hidden}>{children}</span>
}
