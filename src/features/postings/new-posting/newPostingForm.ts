import type { CreatePostingInput } from '../../../api/jobPostings'
import { orNull } from '../../../shared/lib/format'
import { normalizeUrl } from '../../../shared/lib/url'
import { companyFieldErrors } from '../company-edit/companyForm'
import { postingErrors, toPostingBody } from '../posting-edit/postingForm'
import type { CompanyChoice } from './companyOptions'

/** Weitere Angaben, falls die Firma neu angelegt wird (CompanyRequest ohne Namen). */
export type NewCompanyValues = {
  website: string
  street: string
  postalCode: string
  city: string
}

export type NewPostingValues = {
  url: string
  title: string
  company: CompanyChoice | null
  newCompany: NewCompanyValues
  location: string
  publishedAt: string
  description: string
}

export type NewCompanyField = keyof NewCompanyValues
export type NewPostingField = 'url' | 'title' | 'company' | 'location' | 'publishedAt' | NewCompanyField
export type NewPostingFieldErrors = Partial<Record<NewPostingField, string>>

/** Felder mit Fehleranzeige, in Formularreihenfolge. */
const FIELD_ORDER: readonly NewPostingField[] = [
  'url',
  'title',
  'company',
  'location',
  'publishedAt',
  'website',
  'street',
  'postalCode',
  'city',
]

export const firstErrorField = (errors: NewPostingFieldErrors) => FIELD_ORDER.find((f) => errors[f])

/**
 * Feldfehler vom Backend auf die Formularfelder übernehmen. Die Properties von JobPostingRequest
 * und CompanyRequest heißen wie die Formularfelder — bis auf den Firmennamen (`name`).
 */
export function pickNewPostingErrors({ name, ...server }: Record<string, string>): NewPostingFieldErrors {
  const byField: Record<string, string | undefined> = { ...server, company: name }
  return Object.fromEntries(FIELD_ORDER.filter((f) => byField[f]).map((f) => [f, byField[f]]))
}

export const EMPTY_VALUES: NewPostingValues = {
  url: '',
  title: '',
  company: null,
  newCompany: { website: '', street: '', postalCode: '', city: '' },
  location: '',
  publishedAt: '',
  description: '',
}

/**
 * Prüft das Formular und baut die Anfrage.
 * Ergebnis: entweder alle Feldfehler (das erste Feld wird fokussiert) oder die fertige Eingabe.
 */
export function toCreatePostingInput(
  v: NewPostingValues,
  today: string,
): { errors: NewPostingFieldErrors } | { input: CreatePostingInput } {
  const errors: NewPostingFieldErrors = postingErrors(v, today)
  if (!v.company) errors.company = 'Bitte eine Firma auswählen oder anlegen.'
  if (v.company?.kind === 'new') {
    // Gleiche Regeln wie im Firmenformular; der Name steht im Feld „Firma“
    const { name, ...rest } = companyFieldErrors({ ...v.newCompany, name: v.company.name })
    Object.assign(errors, rest)
    if (name) errors.company = name
  }
  if (!v.company || Object.keys(errors).length) return { errors }

  const posting = toPostingBody({ ...v, status: 'ACTIVE' })
  return {
    input:
      v.company.kind === 'existing'
        ? { companyId: v.company.company.id, posting }
        : {
            newCompany: {
              name: v.company.name,
              website: orNull(normalizeUrl(v.newCompany.website)),
              street: orNull(v.newCompany.street),
              postalCode: orNull(v.newCompany.postalCode),
              city: orNull(v.newCompany.city),
            },
            posting,
          },
  }
}
