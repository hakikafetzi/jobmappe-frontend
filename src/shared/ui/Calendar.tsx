import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { parseLocalDate, toIsoDate, weekdayIndex } from '../lib/format'
import {
  addDays,
  addMonths,
  dayLabel,
  inRange,
  monthGrid,
  monthLabel,
  monthOf,
  MONTHS,
  WEEKDAYS,
} from '../lib/germanDate'
import { cx } from '../lib/cx'
import styles from './Calendar.module.css'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons'

type CalendarProps = {
  /** ISO-Datum oder leer */
  value: string
  min?: string
  max?: string
  onPick: (iso: string) => void
  onClear?: () => void
  onEscape: () => void
}

/** Tageskalender mit Sprung zu Monaten und Jahren; Tage per Pfeiltasten wie in einer Tabelle. */
export function Calendar({ value, min, max, onPick, onClear, onEscape }: CalendarProps) {
  const [today] = useState(() => toIsoDate(new Date()))
  /** Tag mit dem Fokus; bestimmt auch den angezeigten Monat */
  const [cursor, setCursor] = useState(value || today)
  const [view, setView] = useState<'days' | 'months' | 'years'>('days')
  const gridRef = useRef<HTMLDivElement>(null)
  /** Fokus soll dem Tag folgen (beim Öffnen und bei Pfeiltasten, nicht bei ‹ ›) */
  const focusDay = useRef(true)
  const titleId = useId()

  useLayoutEffect(() => {
    if (view !== 'days' || !focusDay.current) return
    focusDay.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${cursor}"]`)?.focus()
  }, [cursor, view])

  const year = Number(cursor.slice(0, 4))
  const month = Number(cursor.slice(5, 7)) - 1

  const moveTo = (iso: string) => {
    focusDay.current = true
    setCursor(iso)
  }

  const onGridKey = (e: KeyboardEvent) => {
    const weekday = weekdayIndex(parseLocalDate(cursor))
    const target = {
      ArrowLeft: addDays(cursor, -1),
      ArrowRight: addDays(cursor, 1),
      ArrowUp: addDays(cursor, -7),
      ArrowDown: addDays(cursor, 7),
      Home: addDays(cursor, -weekday),
      End: addDays(cursor, 6 - weekday),
      PageUp: addMonths(cursor, e.shiftKey ? -12 : -1),
      PageDown: addMonths(cursor, e.shiftKey ? 12 : 1),
    }[e.key]
    if (!target) return
    e.preventDefault()
    moveTo(target)
  }

  const footer = (
    <Foot onClear={onClear}>
      <FootButton accent disabled={!inRange(today, min, max)} onClick={() => onPick(today)}>
        Heute
      </FootButton>
    </Foot>
  )

  if (view !== 'days')
    return (
      <YearMonthViews
        view={view}
        onViewChange={(v) => setView(v)}
        year={year}
        onYearChange={(y) => setCursor(addMonths(cursor, (y - year) * 12))}
        selected={{ year, month }}
        onPickMonth={(m) => {
          moveTo(addMonths(cursor, m - month))
          setView('days')
        }}
        // Escape führt erst zurück zu den Tagen
        onEscape={() => setView('days')}
        footer={footer}
      />
    )

  return (
    <Frame onEscape={onEscape}>
      <Head
        titleId={titleId}
        title={monthLabel(cursor)}
        titleLabel={`${monthLabel(cursor)}, Monat wählen`}
        onTitle={() => setView('months')}
        prevLabel="Vorheriger Monat"
        nextLabel="Nächster Monat"
        onStep={(dir) => setCursor(addMonths(cursor, dir))}
      />
      <div
        ref={gridRef}
        role="grid"
        // Fokus liegt auf den Tagen (wandernder tabIndex), nicht auf dem Raster selbst
        tabIndex={-1}
        aria-labelledby={titleId}
        className={styles.grid}
        onKeyDown={onGridKey}
      >
        <div role="row" className={styles.weekdays}>
          {WEEKDAYS.map((d) => (
            <span key={d.short} role="columnheader" className={styles.weekday}>
              <abbr title={d.long}>{d.short}</abbr>
            </span>
          ))}
        </div>
        {monthGrid(cursor).map((week) => (
          <div key={week[0]} role="row" className={styles.week}>
            {week.map((day) => (
              <span key={day} role="gridcell" aria-selected={day === value}>
                <button
                  type="button"
                  data-day={day}
                  className={styles.day}
                  data-outside={monthOf(day) !== monthOf(cursor) || undefined}
                  data-today={day === today || undefined}
                  data-selected={day === value || undefined}
                  tabIndex={day === cursor ? 0 : -1}
                  aria-label={dayLabel(day)}
                  aria-current={day === today ? 'date' : undefined}
                  disabled={!inRange(day, min, max)}
                  onClick={() => onPick(day)}
                >
                  {Number(day.slice(8))}
                </button>
              </span>
            ))}
          </div>
        ))}
      </div>
      {footer}
    </Frame>
  )
}

/** Monats- und Jahresansicht des Kalenders */
function YearMonthViews({
  view,
  onViewChange,
  year,
  onYearChange,
  selected,
  onPickMonth,
  onEscape,
  focusSelected,
  footer,
}: {
  view: 'months' | 'years'
  onViewChange: (view: 'months' | 'years') => void
  year: number
  onYearChange: (year: number) => void
  selected: { year: number; month: number } | null
  onPickMonth: (month: number) => void
  onEscape: () => void
  /** Beim Öffnen den gewählten (sonst ersten) Monat fokussieren */
  focusSelected?: boolean
  footer: ReactNode
}) {
  const titleId = useId()
  /** Jahrzehnt der Jahresansicht; sie zeigt dazu das Jahr davor und danach (12 Felder) */
  const decade = year - (year % 10)

  // Läuft beim Einhängen jeder Ansicht (key={view})
  const focusPick = useCallback(
    (picks: HTMLDivElement | null) => {
      if (!focusSelected || !picks) return
      ;(picks.querySelector<HTMLButtonElement>('[data-selected]') ?? picks.querySelector('button'))?.focus()
    },
    [focusSelected],
  )

  const months = view === 'months'
  return (
    <Frame onEscape={onEscape}>
      <Head
        titleId={titleId}
        title={months ? String(year) : `${decade} – ${decade + 9}`}
        titleLabel={months ? `${year}, Jahr wählen` : `${decade} – ${decade + 9}`}
        onTitle={months ? () => onViewChange('years') : undefined}
        prevLabel={months ? 'Vorheriges Jahr' : 'Frühere Jahre'}
        nextLabel={months ? 'Nächstes Jahr' : 'Spätere Jahre'}
        onStep={(dir) => onYearChange(year + dir * (months ? 1 : 10))}
      />
      <div key={view} ref={focusPick} className={styles.picks} role="group" aria-labelledby={titleId}>
        {months
          ? MONTHS.map((name, m) => (
              <button
                key={name}
                type="button"
                className={styles.pick}
                data-selected={(selected?.year === year && selected.month === m) || undefined}
                onClick={() => onPickMonth(m)}
              >
                {name}
              </button>
            ))
          : Array.from({ length: 12 }, (_, i) => decade - 1 + i).map((y) => (
              <button
                key={y}
                type="button"
                className={styles.pick}
                data-outside={y < decade || y > decade + 9 || undefined}
                data-selected={y === year || undefined}
                onClick={() => {
                  onYearChange(y)
                  onViewChange('months')
                }}
              >
                {y}
              </button>
            ))}
      </div>
      {footer}
    </Frame>
  )
}

/** Rahmen mit Escape: ohne natives Popover schließt sonst nichts, mit führt es zurück */
function Frame({ onEscape, children }: { onEscape: () => void; children: ReactNode }) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- fängt nur Escape aus den Knöpfen darin ab
    <div
      className={styles.calendar}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.preventDefault()
        e.stopPropagation()
        onEscape()
      }}
    >
      {children}
    </div>
  )
}

function Head({
  titleId,
  title,
  titleLabel,
  onTitle,
  prevLabel,
  nextLabel,
  onStep,
}: {
  titleId: string
  title: string
  titleLabel: string
  /** Zur gröberen Ansicht (Monate → Jahre); ohne ist der Titel nur Text */
  onTitle?: () => void
  prevLabel: string
  nextLabel: string
  onStep: (dir: 1 | -1) => void
}) {
  return (
    <div className={styles.head}>
      <button type="button" className={styles.nav} aria-label={prevLabel} onClick={() => onStep(-1)}>
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        id={titleId}
        className={styles.title}
        aria-live="polite"
        aria-label={titleLabel}
        disabled={!onTitle}
        onClick={onTitle}
      >
        {title}
        {onTitle && <ChevronDownIcon className={styles.titleChevron} />}
      </button>
      <button type="button" className={styles.nav} aria-label={nextLabel} onClick={() => onStep(1)}>
        <ChevronRightIcon />
      </button>
    </div>
  )
}

/** Fuß: links „Löschen“ (wenn erlaubt), rechts die Schnellwahl */
function Foot({ onClear, children }: { onClear?: () => void; children: ReactNode }) {
  return (
    <div className={styles.foot}>
      {onClear ? <FootButton onClick={onClear}>Löschen</FootButton> : <span />}
      <span className={styles.footActions}>{children}</span>
    </div>
  )
}

function FootButton({
  accent,
  disabled,
  onClick,
  children,
}: {
  accent?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={cx(styles.link, accent && styles.accent)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
