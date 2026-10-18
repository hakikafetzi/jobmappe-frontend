import type { ReactNode } from 'react'
import styles from './FilterSelect.module.css'
import { ChevronDownIcon } from './icons'
import { VisuallyHidden } from './VisuallyHidden'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  /** Zusätzliche <optgroup>s unter den Optionen */
  groups?: { label: string; options: Option<T>[] }[]
}

/** Filter als Pille mit Pfeil (Board, Tabelle). */
export function FilterSelect<T extends string>({ label, value, onChange, options, groups }: Props<T>) {
  return (
    <label className={styles.pill}>
      <VisuallyHidden>{label}</VisuallyHidden>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups?.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDownIcon className={styles.chevron} />
    </label>
  )
}

export function FilterGroup({
  children,
  'aria-label': label,
}: {
  children: ReactNode
  'aria-label': string
}) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {children}
    </div>
  )
}
