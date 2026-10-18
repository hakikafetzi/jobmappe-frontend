import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '../lib/cx'
import styles from './TextButton.module.css'

/** Knopf im Link-Look (blau, unterstrichen bei Hover). */
export function TextButton({ className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx(styles.textButton, className)} {...rest} />
}

export function TextLink({ className, ...rest }: LinkProps) {
  return <Link className={cx(styles.textButton, className)} {...rest} />
}

export function TextAnchor({ className, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a target="_blank" rel="noopener noreferrer" className={cx(styles.textButton, className)} {...rest}>
      {children}
    </a>
  )
}
