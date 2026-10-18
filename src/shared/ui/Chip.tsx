import type { CSSProperties, ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './Chip.module.css'

type Props = {
  /** Farbe des Punkts (CSS-Wert, z. B. `var(--green)`). Ohne Farbe: schlichter Chip. */
  color?: string
  children: ReactNode
  className?: string
}

export function Chip({ color, children, className }: Props) {
  return (
    <span
      className={cx(styles.chip, !color && styles.plain, className)}
      style={color ? ({ '--chip-color': color } as CSSProperties) : undefined}
    >
      {children}
    </span>
  )
}
