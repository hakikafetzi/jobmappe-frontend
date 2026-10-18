import type { JobPostingDetail, JobPostingRequest, JobPostingStatus } from '../../../api/types'
import { orNull } from '../../../shared/lib/format'
import { INVALID_URL, isWebUrl, normalizeUrl } from '../../../shared/lib/url'
import { isJobTitle, isLocation } from '../../../shared/lib/validation'

export type PostingFormValues = {
  url: string
  title: string
  location: string
  publishedAt: string
  status: JobPostingStatus
  description: string
}

/** Felder mit Fehleranzeige, in Formularreihenfolge (heißen wie die JobPostingRequest-Properties). */
export const POSTING_FIELDS = ['title', 'url', 'location', 'publishedAt'] as const
export type PostingField = (typeof POSTING_FIELDS)[number]
export type PostingFieldErrors = Partial<Record<PostingField, string>>

/** Feldfehler vom Backend auf die Formularfelder übernehmen. */
export function pickPostingErrors(server: Record<string, string>): PostingFieldErrors {
  return Object.fromEntries(POSTING_FIELDS.filter((f) => server[f]).map((f) => [f, server[f]]))
}

export function toFormValues(p: JobPostingDetail): PostingFormValues {
  return {
    url: p.url,
    title: p.title,
    location: p.location ?? '',
    // LocalDate oder LocalDateTime; das Datumsfeld braucht JJJJ-MM-TT
    publishedAt: p.publishedAt?.slice(0, 10) ?? '',
    status: p.status,
    description: p.description ?? '',
  }
}

/**
 * Feldfehler der Stellenangaben (für Bearbeiten und Erfassen): Pflichtfelder wie im Backend, dazu
 * Formatregeln und ein öffnbarer Link — er wird später direkt als `href` verwendet.
 */
export function postingErrors(
  v: Pick<PostingFormValues, 'url' | 'title' | 'location' | 'publishedAt'>,
  today: string,
): PostingFieldErrors {
  const errors: PostingFieldErrors = {}
  if (!v.title.trim()) errors.title = 'Bitte einen Titel eingeben.'
  else if (!isJobTitle(v.title)) errors.title = 'Bitte einen aussagekräftigen Titel eingeben.'
  if (!v.url.trim()) errors.url = 'Bitte den Link zur Anzeige eintragen.'
  else if (!isWebUrl(normalizeUrl(v.url))) errors.url = INVALID_URL
  if (v.location.trim() && !isLocation(v.location))
    errors.location = 'Bitte einen Ort eingeben (z. B. Frankfurt am Main oder Remote).'
  if (v.publishedAt && v.publishedAt > today)
    errors.publishedAt = 'Das Datum darf nicht in der Zukunft liegen.'
  return errors
}

/**
 * Prüft das Formular und baut den PUT-Body; bei Fehlern kommen alle Feldfehler zurück.
 * PUT ersetzt alle Angaben: leere optionale Felder werden als null gesendet und damit entfernt.
 */
export function toPostingRequest(
  v: PostingFormValues,
  today: string,
): { errors: PostingFieldErrors } | { body: JobPostingRequest } {
  const errors = postingErrors(v, today)
  return Object.keys(errors).length ? { errors } : { body: toPostingBody(v) }
}

/** Body aus geprüften Formularwerten; leere optionale Felder werden null. */
export function toPostingBody(v: PostingFormValues): JobPostingRequest {
  return {
    title: v.title.trim(),
    url: normalizeUrl(v.url),
    location: orNull(v.location),
    publishedAt: v.publishedAt || null,
    description: orNull(v.description),
    status: v.status,
  }
}
