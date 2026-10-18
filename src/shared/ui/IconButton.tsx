import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/cx'
import styles from './IconButton.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Pflicht, weil der Knopf keinen sichtbaren Text hat. */
  'aria-label': string
  /** Blasser, bis Hover/Fokus (für Bearbeiten-Stifte in Listen). */
  subtle?: boolean
  /** md: 30 px, für Aktionen in großzügigen Listenzeilen */
  size?: 'sm' | 'md'
}

export function IconButton({ subtle, size = 'sm', className, type = 'button', title, ...rest }: Props) {
  return (
    <button
      type={type}
      title={title ?? rest['aria-label']}
      className={cx(styles.iconButton, subtle && styles.subtle, size === 'md' && styles.md, className)}
      {...rest}
    />
  )
}
