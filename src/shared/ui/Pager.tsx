import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from '../lib/cx'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons'
import styles from './Pager.module.css'
import { pagerItems, pagerRange } from './pagerPages'

type Props = {
  /** Aktuelle Seite, 0-basiert wie im Backend */
  page: number
  totalPages: number
  /** Für „6–10 von 23“ links: Seitengröße und Gesamtzahl (totalElements) */
  range?: { size: number; total: number }
  /** Auswahl „15 pro Seite“: aktuelle Größe, wählbare Größen, Wechsel */
  sizes?: { value: number; options: readonly number[]; onChange: (size: number) => void }
  /** Auch bei nur einer (oder keiner) Seite zeigen, z. B. wegen der Größenauswahl */
  alwaysVisible?: boolean
  /**
   * `numbers`: Bereich links, Pfeile und Seitenzahlen rechts.
   * `card`: einzeilige Fußleiste ohne Kartenrahmen — dieselben Pfeile und Seitenzahlen links,
   *   Größenauswahl rechts.
   */
  variant?: 'numbers' | 'card'
  className?: string
} & (
  | { /** Link je Seite (Seite steht in der URL) */ hrefFor: (page: number) => string; onChange?: never }
  | { /** Seite liegt im lokalen State */ onChange: (page: number) => void; hrefFor?: never }
)

/** Blättern in einer paginierten Liste: Bereich links, Pfeile und Seitenzahlen rechts. */
export function Pager({
  page,
  totalPages,
  range,
  sizes,
  alwaysVisible = false,
  variant = 'numbers',
  className,
  hrefFor,
  onChange,
}: Props) {
  if (totalPages <= 1 && !alwaysVisible) return null
  // Ohne Treffer gibt es keine Seite — die Leiste zeigt dann „1“ (deaktivierte Pfeile)
  const pageCount = Math.max(1, totalPages)

  // Ein Schritt ist Link (Seite in der URL) oder Knopf (lokaler State); außerhalb deaktiviert
  const step = (target: number, label: string, content: ReactNode, current = false) => {
    const itemClass = cx(styles.item, current && styles.current)
    if (target < 0 || target >= pageCount)
      return (
        <button type="button" className={itemClass} aria-label={label} disabled>
          {content}
        </button>
      )
    if (hrefFor)
      return (
        <Link
          to={hrefFor(target)}
          replace
          className={itemClass}
          aria-label={label}
          aria-current={current ? 'page' : undefined}
        >
          {content}
        </Link>
      )
    return (
      <button
        type="button"
        className={itemClass}
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        onClick={() => onChange?.(target)}
      >
        {content}
      </button>
    )
  }

  const items = (
    <div className={styles.items}>
      {step(page - 1, 'Vorherige Seite', <ChevronLeftIcon />)}
      {pagerItems(page, pageCount).map((item) =>
        item.kind === 'gap' ? (
          <span key={item.key} className={styles.gap} aria-hidden="true">
            …
          </span>
        ) : (
          <Fragment key={item.page}>
            {step(item.page, `Seite ${item.page + 1}`, item.page + 1, item.page === page)}
          </Fragment>
        ),
      )}
      {step(page + 1, 'Nächste Seite', <ChevronRightIcon />)}
    </div>
  )

  const sizeSelect = sizes && (
    <label className={styles.size}>
      <select
        className={styles.sizeSelect}
        value={sizes.value}
        aria-label="Einträge pro Seite"
        onChange={(e) => sizes.onChange(Number(e.target.value))}
      >
        {sizes.options.map((n) => (
          <option key={n} value={n}>
            {n} / Seite
          </option>
        ))}
      </select>
      <ChevronDownIcon className={styles.chevron} />
    </label>
  )

  if (variant === 'card')
    return (
      <nav className={cx(styles.card, className)} aria-label="Seiten">
        {items}
        {sizeSelect}
      </nav>
    )

  return (
    <nav className={cx(styles.pager, className)} aria-label="Seiten">
      <div className={styles.meta}>
        <span className={styles.status}>
          {range ? pagerRange(page, range.size, range.total) : `Seite ${page + 1} von ${pageCount}`}
        </span>
        {sizeSelect}
      </div>
      {items}
    </nav>
  )
}
