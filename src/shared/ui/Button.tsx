import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '../lib/cx'
import styles from './Button.module.css'

type Variant = 'default' | 'primary' | 'ghost' | 'danger' | 'muted'
type Size = 'sm' | 'md'

type ButtonStyleProps = {
  variant?: Variant
  size?: Size
  block?: boolean
  /** Quadratischer Knopf nur mit Icon (braucht aria-label). */
  iconOnly?: boolean
}

function buttonClass({ variant = 'default', size = 'md', block, iconOnly }: ButtonStyleProps = {}) {
  return cx(
    styles.button,
    variant !== 'default' && styles[variant],
    size === 'sm' && styles.sm,
    block && styles.block,
    iconOnly && styles.icon,
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps

export function Button({ variant, size, block, iconOnly, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonClass({ variant, size, block, iconOnly }), className)}
      {...rest}
    />
  )
}

/** Interner Link im Button-Look. */
export function ButtonLink({
  variant,
  size,
  block,
  iconOnly,
  className,
  ...rest
}: LinkProps & ButtonStyleProps) {
  return <Link className={cx(buttonClass({ variant, size, block, iconOnly }), className)} {...rest} />
}

/** Externer Link (neuer Tab) im Button-Look. */
export function ButtonAnchor({
  variant,
  size,
  block,
  iconOnly,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & ButtonStyleProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cx(buttonClass({ variant, size, block, iconOnly }), className)}
      {...rest}
    >
      {children}
    </a>
  )
}
