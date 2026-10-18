import type { CompanyCompact } from '../../../api/types'

/** Auswahl im Formular: vorhandene Firma oder neu anzulegende. */
export type CompanyChoice = { kind: 'existing'; company: CompanyCompact } | { kind: 'new'; name: string }

type ComboOption = (CompanyChoice | { kind: 'more' }) & { key: string }

/**
 * Optionen der Firmen-Auswahl: „als neue Firma anlegen“ für die Eingabe (außer der Name steht
 * schon unter den Treffern), dann die Treffer der Backend-Suche und ggf. „Weitere Firmen laden“.
 * Die Liste wird hier nicht gefiltert — das übernimmt das Backend.
 */
export function companyOptions(companies: CompanyCompact[], input: string, hasMore: boolean): ComboOption[] {
  const name = input.trim()
  const exists = companies.some((c) => c.name.toLowerCase() === name.toLowerCase())
  return [
    ...(name && !exists ? [{ kind: 'new' as const, name, key: 'new' }] : []),
    ...companies.map((company) => ({ kind: 'existing' as const, company, key: company.id })),
    ...(hasMore ? [{ kind: 'more' as const, key: 'more' }] : []),
  ]
}
