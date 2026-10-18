import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '../lib/cx'
import styles from './ToolButton.module.css'

type Common = {
  /** Name für Screenreader und Text des Tooltips */
  label: string
  /** Das Icon (einziger sichtbarer Inhalt) */
  children: ReactNode
  /** `inline`: randlos und kleiner, z. B. direkt hinter einem Wert */
  variant?: 'default' | 'inline'
}

const toolClass = (variant: Common['variant'], className?: string) =>
  cx(styles.tool, variant === 'inline' && styles.inline, className)

function Tooltip({ label, align, above }: { label: string; align?: 'center' | 'end'; above?: boolean }) {
  return (
    <span
      className={cx(styles.tooltip, align === 'end' && styles.tooltipEnd, above && styles.tooltipAbove)}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}

/** Kleiner Icon-Knopf mit Tooltip (bei Hover und Fokus), z. B. neben den Chips eines Kopfbereichs. */
export function ToolButton({
  label,
  tooltipAlign,
  tooltipAbove,
  tone,
  size,
  children,
  variant,
  className,
  ...rest
}: Common & {
  /** `end`: Tooltip rechtsbündig unter dem Knopf, für Knöpfe am rechten Rand (sonst abgeschnitten) */
  tooltipAlign?: 'center' | 'end'
  /** Tooltip über dem Knopf, für Knöpfe am unteren Rand (z. B. in einer Fußleiste) */
  tooltipAbove?: boolean
  /** `danger`: rot, für zerstörende Aktionen wie Löschen */
  tone?: 'danger'
  /** `lg`: so hoch wie die normalen Buttons (40 px), z. B. neben ihnen in einer Fußleiste */
  size?: 'lg'
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx(
        toolClass(variant, className),
        tone === 'danger' && styles.danger,
        size === 'lg' && styles.lg,
      )}
      {...rest}
    >
      {children}
      <Tooltip label={label} align={tooltipAlign} above={tooltipAbove} />
    </button>
  )
}

/** Wie ToolButton, aber als Link auf eine externe Seite (neuer Tab). */
export function ToolAnchor({
  label,
  children,
  variant,
  className,
  ...rest
}: Common & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'>) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={toolClass(variant, className)}
      {...rest}
    >
      {children}
      <Tooltip label={label} />
    </a>
  )
}

/** Wie ToolButton, aber als Link auf eine andere Seite der App. */
export function ToolLink({
  label,
  children,
  variant,
  className,
  ...rest
}: Common & Omit<LinkProps, 'children'>) {
  return (
    <Link aria-label={label} className={toolClass(variant, className)} {...rest}>
      {children}
      <Tooltip label={label} />
    </Link>
  )
}
