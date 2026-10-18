import type { JobPostingDetail, JobPostingRequest, JobPostingStatus } from '../../../api/types'
import { orNull } from '../../../shared/lib/format'

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
 * Prüft das Formular nach den Regeln des Backends und baut den PUT-Body.
 * PUT ersetzt alle Angaben: leere optionale Felder werden als null gesendet und damit entfernt.
 */
export function toPostingRequest(
  v: PostingFormValues,
  today: string,
): { error: { field: PostingField; message: string } } | { body: JobPostingRequest } {
  if (!v.url.trim()) return { error: { field: 'url', message: 'Bitte den Link zur Anzeige eintragen.' } }
  if (!v.title.trim()) return { error: { field: 'title', message: 'Bitte einen Titel eingeben.' } }
  if (v.publishedAt && v.publishedAt > today)
    return { error: { field: 'publishedAt', message: 'Das Datum darf nicht in der Zukunft liegen.' } }

  return { body: toPostingBody(v) }
}

/** Body aus geprüften Formularwerten; leere optionale Felder werden null. */
export function toPostingBody(v: PostingFormValues): JobPostingRequest {
  return {
    title: v.title.trim(),
    url: v.url.trim(),
    location: orNull(v.location),
    publishedAt: v.publishedAt || null,
    description: orNull(v.description),
    status: v.status,
  }
}
