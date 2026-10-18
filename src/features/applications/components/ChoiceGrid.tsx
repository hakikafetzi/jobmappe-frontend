import { useId } from 'react'
import styles from './ChoiceGrid.module.css'

type Props<T extends string> = {
  label: string
  value: T | null
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
}

/** Einfachauswahl als große Kacheln in zwei Spalten (Ausgang beim Abschließen, Status beim Wiederöffnen). */
export function ChoiceGrid<T extends string>({ label, value, onChange, options }: Props<T>) {
  const labelId = useId()
  return (
    <>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div className={styles.choices} role="radiogroup" aria-labelledby={labelId}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={styles.choice}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>
  )
}
