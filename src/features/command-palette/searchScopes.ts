// Such-Modi der Command Palette: „Stellen suchen“ usw. sucht über das Backend (`q`).
import { paths } from '../../app/paths'

export type SearchScope = 'postings' | 'applications' | 'companies' | 'notes'

export const SEARCH_SCOPES: Record<
  SearchScope,
  { chip: string; placeholder: string; searchesIn: string; listHref: (q: string) => string }
> = {
  postings: {
    chip: 'Stellen',
    placeholder: 'Titel oder Firma suchen …',
    searchesIn: 'Gesucht wird in Titel und Firmenname aller Stellen.',
    listHref: (q) => paths.postings('all', { search: q }),
  },
  applications: {
    chip: 'Bewerbungen',
    placeholder: 'Stelle oder Firma suchen …',
    searchesIn: 'Gesucht wird in Stellentitel und Firmenname.',
    listHref: (q) => paths.applications({ view: 'table', search: q }),
  },
  companies: {
    chip: 'Firmen',
    placeholder: 'Firmenname suchen …',
    searchesIn: 'Gesucht wird im Firmennamen.',
    listHref: (q) => paths.companies({ search: q }),
  },
  notes: {
    chip: 'Notizen',
    placeholder: 'Titel oder Inhalt suchen …',
    searchesIn: 'Gesucht wird in Titel und Inhalt aller Notizen.',
    listHref: (q) => paths.notes({ search: q }),
  },
}
