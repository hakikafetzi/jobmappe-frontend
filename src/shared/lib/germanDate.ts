// Datumseingabe im deutschen Format (TT.MM.JJJJ). Gespeichert und an die API gegeben wird weiter
// das ISO-Datum (JJJJ-MM-TT); nur Anzeige und Eingabe sind deutsch.
import { fmtDate, parseLocalDate, toIsoDate, weekdayIndex } from './format'

export const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const

export const WEEKDAYS = [
  { short: 'Mo', long: 'Montag' },
  { short: 'Di', long: 'Dienstag' },
  { short: 'Mi', long: 'Mittwoch' },
  { short: 'Do', long: 'Donnerstag' },
  { short: 'Fr', long: 'Freitag' },
  { short: 'Sa', long: 'Samstag' },
  { short: 'So', long: 'Sonntag' },
] as const

/** "2026-09-01" → "01.09.2026"; leer bleibt leer */
export function formatGermanDate(iso: string): string {
  return iso ? fmtDate(iso) : ''
}

/**
 * Eingabe → ISO-Datum, oder null, wenn sie kein gültiges Datum ist. Erlaubt „1.9.2026“,
 * „01.09.26“ (→ 2026) und Ziffern ohne Punkte („01092026“).
 */
export function parseGermanDate(text: string): string | null {
  const t = text.trim()
  const parts = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(t) ?? /^(\d{2})(\d{2})(\d{4}|\d{2})$/.exec(t)
  if (!parts) return null
  const day = Number(parts[1])
  const month = Number(parts[2])
  const year = parts[3]!.length === 2 ? 2000 + Number(parts[3]) : Number(parts[3])
  const date = new Date(year, month - 1, day)
  date.setFullYear(year) // Jahre unter 100 nicht als 19xx deuten
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return valid && year >= 1000 ? toIsoDate(date) : null
}

/**
 * Hilfe beim Tippen: nur Ziffern und Punkte (andere Trenner wie „/“ werden zu Punkten), höchstens
 * 10 Zeichen, und nach Tag und Monat setzt sie den Punkt selbst (nur beim Weitertippen, damit Löschen
 * nicht hängen bleibt).
 */
export function maskDateInput(previous: string, next: string): string {
  const cleaned = next
    .replace(/[/\-\s,]/g, '.')
    .replace(/[^\d.]/g, '')
    .replace(/\.{2,}/g, '.')
    .slice(0, 10)
  const growing = cleaned.length > previous.length
  return growing && /^(\d{2}|\d{1,2}\.\d{2})$/.test(cleaned) ? `${cleaned}.` : cleaned
}

/** Erster Tag des Monats als ISO-Datum */
export function monthOf(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

export function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

/** Monate weiter; der Tag bleibt, soweit es ihn im Zielmonat gibt (31.01. + 1 → 28./29.02.) */
export function addMonths(iso: string, months: number): string {
  const d = parseLocalDate(iso)
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return toIsoDate(target)
}

/** Sechs Wochen (Montag zuerst), die den Monat von `iso` enthalten: gleich hoch in jedem Monat */
export function monthGrid(iso: string): string[][] {
  const first = parseLocalDate(monthOf(iso))
  const offset = weekdayIndex(first)
  const start = addDays(toIsoDate(first), -offset)
  return Array.from({ length: 6 }, (_week, w) =>
    Array.from({ length: 7 }, (_day, d) => addDays(start, w * 7 + d)),
  )
}

/** Liegt `iso` in [min, max]? (ISO-Daten lassen sich als Text vergleichen) */
export function inRange(iso: string, min?: string, max?: string): boolean {
  return (!min || iso >= min.slice(0, 10)) && (!max || iso <= max.slice(0, 10))
}

/** "September 2026" */
export function monthLabel(iso: string): string {
  return `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
}

/** Vorlesbarer Tag: "Dienstag, 1. September 2026" */
export function dayLabel(iso: string): string {
  const d = parseLocalDate(iso)
  return `${WEEKDAYS[weekdayIndex(d)]!.long}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
