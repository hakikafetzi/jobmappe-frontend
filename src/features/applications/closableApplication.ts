import type { ApplicationStatus } from '../../api/types'

/** Was die Status-Dialoge (Abschließen, Beworben, Zurücksetzen, Wieder öffnen) von einer Bewerbung brauchen. */
export type ClosableApplication = {
  id: string
  status: ApplicationStatus
  jobTitle: string
  companyName: string
}

/** Hinweis, wenn eine Bewerbung zurück auf „In Bearbeitung“ geht (das Backend leert diese Felder). */
export const RESET_NOTE =
  'Das Bewerbungsdatum, der Bewerbungsweg und der Link zum Portal werden zurückgesetzt.'
