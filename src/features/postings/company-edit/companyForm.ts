import type { CompanyRequest, CompanyResponse } from '../../../api/types'
import { orNull } from '../../../shared/lib/format'
import { INVALID_URL, isWebUrl, normalizeUrl } from '../../../shared/lib/url'

type CompanyFormValues = {
  name: string
  website: string
  street: string
  postalCode: string
  city: string
}

export type CompanyField = keyof CompanyFormValues
export type CompanyFieldErrors = Partial<Record<CompanyField, string>>

/** In Formularreihenfolge (zum Fokussieren des ersten fehlerhaften Felds). */
export const COMPANY_FIELDS: readonly CompanyField[] = ['name', 'website', 'street', 'postalCode', 'city']

/** Feldfehler vom Backend (CompanyRequest-Properties) auf die Formularfelder übernehmen. */
export function pickCompanyErrors(server: Record<string, string>): CompanyFieldErrors {
  return Object.fromEntries(COMPANY_FIELDS.filter((f) => server[f]).map((f) => [f, server[f]]))
}

export const EMPTY_COMPANY: CompanyFormValues = {
  name: '',
  website: '',
  street: '',
  postalCode: '',
  city: '',
}

export function toFormValues(c: CompanyResponse): CompanyFormValues {
  return {
    name: c.name,
    website: c.website ?? '',
    street: c.street ?? '',
    postalCode: c.postalCode ?? '',
    city: c.city ?? '',
  }
}

/**
 * Prüft das Formular und baut den Body für POST/PUT. PUT ersetzt alle Angaben: leere Felder werden
 * als null gesendet und damit entfernt (der Vertrag verbietet Strings nur aus Leerzeichen).
 * Die Webseite wird gespeichert wie eingegeben (z. B. „firma.de“), muss sich aber öffnen lassen.
 */
export function toCompanyRequest(
  v: CompanyFormValues,
): { errors: CompanyFieldErrors } | { body: CompanyRequest } {
  const errors: CompanyFieldErrors = {}
  const name = v.name.trim()
  if (!name) errors.name = 'Bitte einen Namen eingeben.'
  const website = v.website.trim()
  if (website && !isWebUrl(normalizeUrl(website))) errors.website = INVALID_URL
  if (Object.keys(errors).length) return { errors }
  return {
    body: {
      name,
      website: orNull(v.website),
      street: orNull(v.street),
      postalCode: orNull(v.postalCode),
      city: orNull(v.city),
    },
  }
}
