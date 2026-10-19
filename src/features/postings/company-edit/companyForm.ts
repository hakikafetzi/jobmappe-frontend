import type { CompanyRequest, CompanySummary } from '../../../api/types'
import { orNull } from '../../../shared/lib/format'
import { INVALID_POSTAL_CODE, isPostalCode } from '../../../shared/lib/postalCode'
import { INVALID_URL, isWebUrl, normalizeUrl } from '../../../shared/lib/url'
import { isCity, isCompanyName, isStreet } from '../../../shared/lib/validation'

export type CompanyFormValues = {
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

export function toFormValues(c: CompanySummary): CompanyFormValues {
  return {
    name: c.name,
    website: c.website ?? '',
    street: c.street ?? '',
    postalCode: c.postalCode ?? '',
    city: c.city ?? '',
  }
}

/**
 * Feldfehler der Firmenangaben (auch für die neue Firma in „Stelle erfassen“). Optionale Felder
 * werden nur geprüft, wenn etwas drinsteht. Die Webseite wird gespeichert wie eingegeben
 * (z. B. „firma.de“), muss sich aber öffnen lassen.
 */
export function companyFieldErrors(v: CompanyFormValues): CompanyFieldErrors {
  const errors: CompanyFieldErrors = {}
  const filled = (value: string) => value.trim() !== ''
  if (!filled(v.name)) errors.name = 'Bitte einen Namen eingeben.'
  else if (!isCompanyName(v.name)) errors.name = 'Bitte einen gültigen Firmennamen eingeben.'
  if (filled(v.website) && !isWebUrl(normalizeUrl(v.website))) errors.website = INVALID_URL
  if (filled(v.street) && !isStreet(v.street))
    errors.street = 'Bitte Straße und Hausnummer angeben (z. B. Musterstraße 12).'
  if (filled(v.postalCode) && !isPostalCode(v.postalCode)) errors.postalCode = INVALID_POSTAL_CODE
  if (filled(v.city) && !isCity(v.city)) errors.city = 'Bitte einen gültigen Ortsnamen eingeben.'
  return errors
}

/**
 * Prüft das Formular und baut den Body für POST/PUT. PUT ersetzt alle Angaben: leere Felder werden
 * als null gesendet und damit entfernt (der Vertrag verbietet Strings nur aus Leerzeichen).
 */
export function toCompanyRequest(
  v: CompanyFormValues,
): { errors: CompanyFieldErrors } | { body: CompanyRequest } {
  const errors = companyFieldErrors(v)
  if (Object.keys(errors).length) return { errors }
  return {
    body: {
      name: v.name.trim(),
      website: orNull(normalizeUrl(v.website)),
      street: orNull(v.street),
      postalCode: orNull(v.postalCode),
      city: orNull(v.city),
    },
  }
}
