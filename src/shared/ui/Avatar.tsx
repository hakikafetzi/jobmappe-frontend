import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { initials } from '../lib/format'
import styles from './Avatar.module.css'

type Props = { size?: 'sm' | 'md' | 'lg' | 'xl' } & (
  { name: string; children?: never } | { name?: never; children: ReactNode }
)

/** Initialen einer Firma (z. B. „FI“) oder ein eigenes Zeichen. */
export function Avatar({ name, children, size = 'lg' }: Props) {
  return (
    <span className={cx(styles.avatar, size !== 'lg' && styles[size])} aria-hidden="true">
      {name !== undefined ? initials(name) : children}
    </span>
  )
}
