// Fehlerauswertung: Entscheidend sind HTTP-Status und Feldnamen.
// Backend-Texte (`detail`, Meldungen in `errors`) sind englisch und werden nie angezeigt.

import { ApiError } from './client'

/** Fehlerbehandlung einer Mutation (als `meta` deklariert, siehe react-query.d.ts). */
export type MutationErrorMeta = {
  /** Wird bei einem Fehler zentral als Toast angezeigt, ergänzt um den Grund (app/queryClient.ts). */
  errorMessage?: string
  /** Backend-Felder, die das Formular selbst anzeigt: kein Toast, wenn alle Feldfehler darin liegen. */
  inlineFields?: readonly string[]
  /** Ein 409 betrifft dieses Feld (z. B. doppelter Name) und wird im Formular angezeigt. */
  conflictField?: string
  /** Deutscher Text für einen 409 (inline an `conflictField`, sonst als Toast). */
  conflictMessage?: string
}

/** Der ApiError hinter einem Fehler — direkt oder als `cause` eines umhüllenden Fehlers. */
export function apiErrorOf(error: unknown): ApiError | null {
  if (error instanceof ApiError) return error
  if (error instanceof Error && error.cause instanceof ApiError) return error.cause
  return null
}

/**
 * Fehler im Frontend, kein fehlender Eintrag: 404 „Not Found“ (den Pfad gibt es im Backend
 * nicht), 405 (falsche Methode) und 415 (falscher Content-Type). Wird wie ein Serverfehler behandelt.
 */
export function isClientBug(error: unknown): boolean {
  const apiError = apiErrorOf(error)
  if (!apiError) return false
  return (apiError.status === 404 && apiError.title === 'Not Found') || [405, 415].includes(apiError.status)
}

/** Status für die Auswertung; ein Fehler im Frontend zählt als 500. */
const statusOf = (error: unknown) => (isClientBug(error) ? 500 : apiErrorOf(error)?.status)

/** Deutscher Grund für einen fehlgeschlagenen Request. */
export function errorReason(error: unknown): string {
  switch (statusOf(error)) {
    case 0:
      return 'Das Backend ist nicht erreichbar.'
    case 400:
      return 'Bitte die Eingaben prüfen.'
    case 404:
      return 'Der Eintrag existiert nicht mehr.'
    case 409:
      return 'Das steht im Konflikt mit vorhandenen Daten.'
    default:
      return 'Bitte später erneut versuchen.'
  }
}

/** 400/404: Eintrag gibt es nicht (oder die ID ist ungültig) — ein erneuter Versuch hilft nicht. */
export function isNotFound(error: unknown): boolean {
  const status = statusOf(error)
  return status === 400 || status === 404
}

/** Client-Fehler (4xx, auch Fehler im Frontend wie ein fehlender Endpunkt) werden nicht wiederholt; Netzwerk- und Serverfehler schon. */
export function isRetryable(error: unknown): boolean {
  const status = apiErrorOf(error)?.status
  return status === undefined || status === 0 || status >= 500
}

const INVALID_VALUE = 'Dieser Wert ist ungültig.'

/**
 * Feldfehler zum Anzeigen im Formular (Backend-Feldname → deutscher Text):
 * jedes Feld einer fehlgeschlagenen Validierung bzw. `conflictField` bei einem 409.
 */
export function serverFieldErrors(
  error: unknown,
  { conflictField, conflictMessage }: Pick<MutationErrorMeta, 'conflictField' | 'conflictMessage'> = {},
): Record<string, string> {
  const apiError = apiErrorOf(error)
  if (apiError?.status === 409 && conflictField)
    return { [conflictField]: conflictMessage ?? errorReason(apiError) }
  if (apiError?.status === 400)
    return Object.fromEntries(Object.keys(apiError.fieldErrors).map((field) => [field, INVALID_VALUE]))
  return {}
}

/** Zeigt das Formular den Fehler selbst an (dann kein zentraler Toast)? */
export function isHandledInline(error: unknown, meta: MutationErrorMeta | undefined): boolean {
  const apiError = apiErrorOf(error)
  if (!apiError || !meta) return false
  if (apiError.status === 409) return !!meta.conflictField
  const fields = Object.keys(apiError.fieldErrors)
  return apiError.status === 400 && fields.length > 0 && fields.every((f) => meta.inlineFields?.includes(f))
}

/** Text für den zentralen Fehler-Toast einer Mutation (null = kein Toast). */
export function mutationToastMessage(error: unknown, meta: MutationErrorMeta | undefined): string | null {
  if (!meta?.errorMessage || isHandledInline(error, meta)) return null
  if (statusOf(error) === 409 && meta.conflictMessage) return meta.conflictMessage
  return `${meta.errorMessage}. ${errorReason(error)}`
}
