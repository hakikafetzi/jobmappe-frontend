import type { CSSProperties, MouseEvent } from 'react'
import { cx } from '../lib/cx'
import styles from './SlideSwitch.module.css'

type Props<T extends string> = {
  options: readonly { value: T; label: string }[]
  value: T
  /** Mit dem Klick-Ereignis, z. B. für den Ursprung einer Animation */
  onSelect: (value: T, event: MouseEvent<HTMLButtonElement>) => void
  /** menu: kompakt über die volle Breite (Profilmenü); settings: Einstellungszeile */
  size: 'menu' | 'settings'
  className?: string
} & ({ label: string; labelledBy?: never } | { label?: never; labelledBy: string })

/** Umschalter mit gleich breiten Optionen; die Markierung gleitet zur Wahl (Erscheinungsbild, Animationen). */
export function SlideSwitch<T extends string>({
  options,
  value,
  onSelect,
  size,
  className,
  label,
  labelledBy,
}: Props<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  return (
    <div
      className={cx(styles.switch, styles[size], className)}
      role="radiogroup"
      aria-label={label}
      aria-labelledby={labelledBy}
      style={{ '--index': index, '--count': options.length } as CSSProperties}
    >
      <span className={styles.thumb} aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={styles.option}
          onClick={(e) => onSelect(o.value, e)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
