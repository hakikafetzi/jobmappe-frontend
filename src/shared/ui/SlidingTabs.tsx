import { useLayoutEffect, useRef, type ReactNode } from 'react'
import styles from './SlidingTabs.module.css'

type Tab<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  tabs: Tab<T>[]
  value: T
  onChange: (value: T) => void
  /** Direkt hinter dem letzten Tab, außerhalb der Tab-Liste (z. B. ein Knopf „Neuer Ordner“) */
  trailing?: ReactNode
}

/** Tabs mit einem Strich, der zum aktiven Tab gleitet. */
export function SlidingTabs<T extends string>({ label, tabs, value, onChange, trailing }: Props<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)

  // Auch bei geänderten Tabs neu setzen: Ein neuer Ordner vor dem aktiven verschiebt ihn
  useLayoutEffect(() => {
    if (!tabs.some((t) => t.value === value)) return
    const active = listRef.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
    const ind = indicatorRef.current
    if (!active || !ind) return
    // Beim ersten Platzieren ohne Animation
    if (!placed.current) ind.style.transition = 'none'
    ind.style.transform = `translateX(${active.offsetLeft}px)`
    ind.style.width = `${active.offsetWidth}px`
    if (!placed.current) {
      void ind.offsetWidth
      ind.style.transition = ''
      placed.current = true
    }
  }, [value, tabs])

  return (
    <div className={styles.tabs} ref={listRef}>
      <div className={styles.list} role="tablist" aria-label={label}>
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={t.value === value}
            data-value={t.value}
            className={styles.tab}
            onClick={() => onChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {trailing && <div className={styles.trailing}>{trailing}</div>}
      <span className={styles.indicator} ref={indicatorRef} aria-hidden="true" />
    </div>
  )
}
