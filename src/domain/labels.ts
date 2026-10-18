// Einzige Stelle für Enum → deutsches Label und Farbe.
import type {
  ApplicationChannel,
  ApplicationPriority,
  ApplicationStatus,
  JobPostingStatus,
} from '../api/types'

export const APP_STATUS: Record<ApplicationStatus, { label: string; short: string }> = {
  IN_PROGRESS: { label: 'In Bearbeitung', short: 'In Bearbeitung' },
  APPLIED: { label: 'Beworben', short: 'Beworben' },
  INTERVIEW: { label: 'Gespräch', short: 'Gespräch' },
  WAITING: { label: 'Warten', short: 'Warten' },
  OFFER: { label: 'Zusage erhalten', short: 'Zusage' },
  OFFER_ACCEPTED: { label: 'Zusage angenommen', short: 'Angebot angenommen' },
  OFFER_REJECTED: { label: 'Zusage abgelehnt', short: 'Angebot abgelehnt' },
  REJECTED: { label: 'Absage', short: 'Absage' },
  WITHDRAWN: { label: 'Zurückgezogen', short: 'Zurückgezogen' },
  NO_RESPONSE: { label: 'Keine Rückmeldung', short: 'Keine Rückmeldung' },
}

/** Bewerbungsweg (`appliedVia`), in Anzeigereihenfolge. */
export const APP_CHANNEL: Record<ApplicationChannel, string> = {
  ONLINE: 'Online',
  EMAIL: 'E-Mail',
  PHONE: 'Telefon',
  IN_PERSON: 'Persönlich',
  POSTAL_MAIL: 'Post',
  OTHER: 'Sonstiges',
}

export const STATUS_ORDER: readonly ApplicationStatus[] = [
  'IN_PROGRESS',
  'APPLIED',
  'INTERVIEW',
  'WAITING',
  'OFFER',
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'REJECTED',
  'WITHDRAWN',
  'NO_RESPONSE',
]

/** Spalten des Boards (laufende Bewerbungen). */
/** Name einer Spalte: `APP_STATUS[status].short`. */
export const BOARD_COLUMNS: readonly { status: ApplicationStatus; color: string }[] = [
  { status: 'IN_PROGRESS', color: 'var(--ink-3)' },
  { status: 'APPLIED', color: 'var(--accent)' },
  { status: 'INTERVIEW', color: 'var(--green)' },
  { status: 'WAITING', color: 'var(--amber)' },
  { status: 'OFFER', color: 'var(--violet)' },
]

const CLOSED: ReadonlySet<ApplicationStatus> = new Set([
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'REJECTED',
  'WITHDRAWN',
  'NO_RESPONSE',
])

export const isClosedStatus = (s: ApplicationStatus): boolean => CLOSED.has(s)

/** Alle Ausgänge beim Abschließen; welche je Status wählbar sind, regelt `outcomesFor` (transitions.ts). */
export const OUTCOMES: readonly { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'OFFER_ACCEPTED', label: 'Zusage angenommen', color: 'var(--green)' },
  { status: 'OFFER_REJECTED', label: 'Zusage abgelehnt', color: 'var(--violet)' },
  { status: 'REJECTED', label: 'Absage bekommen', color: 'var(--red)' },
  { status: 'WITHDRAWN', label: 'Zurückgezogen', color: 'var(--ink-3)' },
  { status: 'NO_RESPONSE', label: 'Keine Rückmeldung', color: 'var(--amber)' },
]

/** Label und Farbe für Status-Chips. */
export function statusLook(status: ApplicationStatus): { label: string; color: string } {
  const look = BOARD_COLUMNS.find((c) => c.status === status) ?? OUTCOMES.find((o) => o.status === status)
  return { label: APP_STATUS[status].short, color: look?.color ?? 'var(--ink-3)' }
}

export const PRIORITY_LABEL: Record<ApplicationPriority, string> = {
  HIGH: 'Hoch',
  MEDIUM: 'Mittel',
  LOW: 'Niedrig',
  NONE: 'Keine',
}

export const PRIORITY_OPTIONS: readonly ApplicationPriority[] = ['HIGH', 'MEDIUM', 'LOW', 'NONE']

export const PRIORITY_COLOR: Record<ApplicationPriority, string> = {
  HIGH: 'var(--red)',
  MEDIUM: 'var(--amber)',
  LOW: 'var(--ink-3)',
  NONE: 'var(--hair)',
}

/** Filter-Optionen für Priorität (Board, Tabelle). */
export const PRIORITY_FILTER_OPTIONS: { value: ApplicationPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle Prioritäten' },
  { value: 'HIGH', label: 'Priorität hoch' },
  { value: 'MEDIUM', label: 'Priorität mittel' },
  { value: 'LOW', label: 'Priorität niedrig' },
  { value: 'NONE', label: 'Ohne Priorität' },
]

export const POSTING_STATUS_LABEL: Record<JobPostingStatus, string> = {
  ACTIVE: 'Online',
  INACTIVE: 'Offline',
}
