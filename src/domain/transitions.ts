// Einzige Stelle für erlaubte Statuswechsel (Board, Detail, Abschließen). Das Backend prüft
// dieselben Regeln und lehnt andere Wechsel mit 409 ab.
import type { ApplicationStatus } from '../api/types'
import { isClosedStatus } from './labels'

/** Gemeinsam frei untereinander wechselbar: alles nach dem Absenden der Bewerbung. */
const SENT: ReadonlySet<ApplicationStatus> = new Set(['APPLIED', 'INTERVIEW', 'WAITING', 'OFFER'])

/**
 * Laufende Wechsel: aus „In Bearbeitung“ nur nach „Beworben“; danach frei untereinander und
 * zurück nach „In Bearbeitung“ (setzt Datum, Weg und Link zurück). Abgeschlossene nur per Wiederöffnen.
 */
export function canMoveTo(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to || isClosedStatus(from) || isClosedStatus(to)) return false
  if (from === 'IN_PROGRESS') return to === 'APPLIED'
  return true
}

/** Mögliche Ausgänge beim Abschließen, je nach aktuellem Status. */
export function outcomesFor(from: ApplicationStatus): readonly ApplicationStatus[] {
  if (from === 'IN_PROGRESS') return ['WITHDRAWN']
  if (from === 'OFFER') return ['OFFER_ACCEPTED', 'OFFER_REJECTED']
  if (SENT.has(from)) return ['REJECTED', 'NO_RESPONSE', 'WITHDRAWN']
  return []
}

/** Rückfrage vor einem laufenden Wechsel: Bewerbungsweg erfassen bzw. Zurücksetzen bestätigen. */
export function moveDialog(from: ApplicationStatus, to: ApplicationStatus): 'apply' | 'reset' | null {
  if (from === 'IN_PROGRESS' && to === 'APPLIED') return 'apply'
  if (to === 'IN_PROGRESS' && from !== 'IN_PROGRESS') return 'reset'
  return null
}
