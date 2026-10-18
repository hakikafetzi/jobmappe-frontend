import { useCallback, useLayoutEffect, useRef } from 'react'
import type { PostingFilter, PostingSort } from '../../app/paths'
import { useLatest } from '../../shared/hooks/useLatest'
import { plural } from '../../shared/lib/format'
import styles from './PostingsFilterBar.module.css'
import { POSTING_FILTERS, POSTING_SORTS } from './selectPostings'

type Props = {
  filter: PostingFilter
  onFilterChange: (f: PostingFilter) => void
  /** Treffer des aktiven Filters über alle Seiten (totalElements); undefined = lädt noch */
  total: number | undefined
  sort: PostingSort
  onSortChange: (s: PostingSort) => void
}

/** Filter-Pillen und Sortierung; die Trefferzahl des aktiven Filters steht rechts neben der Sortierung. */
export function PostingsFilterBar({ filter, onFilterChange, total, sort, onSortChange }: Props) {
  const pillsRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const latestFilter = useLatest(filter)

  /** Markierung auf die Pille von `value` setzen; ohne `animate` springt sie. */
  const place = useCallback((value: PostingFilter, animate: boolean) => {
    const active = pillsRef.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
    const indicator = indicatorRef.current
    if (!active || !indicator) return
    if (!animate) indicator.dataset.instant = ''
    indicator.style.setProperty('--x', `${active.offsetLeft}px`)
    indicator.style.setProperty('--w', `${active.offsetWidth}px`)
    indicator.style.setProperty('--h', `${active.offsetHeight}px`)
    if (!animate) {
      void indicator.offsetWidth
      delete indicator.dataset.instant
    }
    return active
  }, [])

  // Filterwechsel: zur neuen Pille gleiten (beim ersten Platzieren springen)
  const placed = useRef(false)
  useLayoutEffect(() => {
    const active = place(filter, placed.current)
    placed.current = true
    // Waagerecht scrollende Leiste (mobil): neue aktive Pille sichtbar halten
    active?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [filter, place])

  // Andere Fensterbreite oder nachgeladene Schrift: ohne Gleiten nachziehen. Beobachtet wird die
  // ganze Leiste, nicht die Pillen — die werden beim Wechsel selbst breiter (fett) und würden sonst
  // das Gleiten abbrechen.
  useLayoutEffect(() => {
    const bar = pillsRef.current?.parentElement
    if (!bar) return
    let mounted = true
    const replace = () => place(latestFilter.current, false)
    void document.fonts?.ready.then(() => mounted && replace())
    const observer = new ResizeObserver(replace)
    observer.observe(bar)
    return () => {
      mounted = false
      observer.disconnect()
    }
  }, [place, latestFilter])

  return (
    <div className={styles.bar}>
      <div className={styles.pills} role="group" aria-label="Filter" ref={pillsRef}>
        <span ref={indicatorRef} className={styles.indicator} aria-hidden="true" />
        {POSTING_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={styles.pill}
            aria-pressed={f.value === filter}
            data-value={f.value}
            onClick={() => onFilterChange(f.value)}
          >
            <span className={styles.label}>{f.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.meta}>
        <span className={styles.total} aria-live="polite">
          {total !== undefined && plural(total, 'Stelle', 'Stellen')}
        </span>
        <label className={styles.sort}>
          Sortieren:
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => onSortChange(e.target.value as PostingSort)}
          >
            {POSTING_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
