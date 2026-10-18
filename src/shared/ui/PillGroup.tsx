import { useCallback, useLayoutEffect, useRef } from 'react'
import { useLatest } from '../hooks/useLatest'
import { cx } from '../lib/cx'
import styles from './PillGroup.module.css'

type Props<T extends string> = {
  /** id des sichtbaren Labels der Gruppe */
  labelledBy: string
  value: T | null
  onChange: (value: T) => void
  /** Einzelne Pillen lassen sich mit `disabled` sperren */
  options: readonly { value: T; label: string; disabled?: boolean }[]
  /** Ganze Gruppe gesperrt (ausgegraut, die Markierung bleibt sichtbar) */
  disabled?: boolean
}

/**
 * Einfachauswahl als umbrechende Pillen (z. B. Status, Priorität). Die Markierung gleitet beim
 * Wechsel zur neuen Pille, auch über Zeilenumbrüche. Erneutes Wählen ändert nichts.
 */
export function PillGroup<T extends string>({
  labelledBy,
  value,
  onChange,
  options,
  disabled = false,
}: Props<T>) {
  const groupRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const latestValue = useLatest(value)

  /** Markierung auf die gewählte Pille setzen; ohne `animate` springt sie (erstes Platzieren, Umbruch). */
  const place = useCallback(
    (animate: boolean) => {
      const group = groupRef.current
      const indicator = indicatorRef.current
      if (!group || !indicator) return
      const current = latestValue.current
      const active =
        current === null ? null : group.querySelector<HTMLElement>(`[data-value="${CSS.escape(current)}"]`)
      indicator.dataset.visible = String(!!active)
      if (!active) return
      if (!animate) indicator.dataset.instant = ''
      indicator.style.setProperty('--x', `${active.offsetLeft}px`)
      indicator.style.setProperty('--y', `${active.offsetTop}px`)
      indicator.style.setProperty('--w', `${active.offsetWidth}px`)
      indicator.style.setProperty('--h', `${active.offsetHeight}px`)
      if (!animate) {
        void indicator.offsetWidth
        delete indicator.dataset.instant
      }
    },
    [latestValue],
  )

  // Wechsel: gleiten, sofern schon eine Pille markiert war
  const hadValue = useRef(false)
  useLayoutEffect(() => {
    place(hadValue.current)
    hadValue.current = value !== null
  }, [value, place])

  // Andere Breite → Pillen brechen anders um: ohne Gleiten nachziehen
  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    const observer = new ResizeObserver(() => place(false))
    observer.observe(group)
    return () => observer.disconnect()
  }, [place])

  return (
    <div
      ref={groupRef}
      className={cx(styles.pills, disabled && styles.disabled)}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-disabled={disabled || undefined}
    >
      <span ref={indicatorRef} className={styles.indicator} aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          data-value={o.value}
          className={styles.pill}
          disabled={disabled || o.disabled}
          onClick={() => o.value !== value && onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
