// Paginierte Listen: Seitengröße und Helfer für Infinite Queries.
import type { Page } from './types'

/**
 * Einträge pro Seite ohne Größenauswahl: Board-Spalten, Firmenauswahl, Stellen einer Firma.
 * Listen und Tabelle mit Größenauswahl nutzen LIST_PAGE_SIZE (app/paths.ts).
 */
export const PAGE_SIZE = 20

/** Nächste Seite einer Infinite Query (`page` ist 0-basiert); undefined = keine weitere. */
export const nextPageParam = (last: Page<unknown>) =>
  last.page + 1 < last.totalPages ? last.page + 1 : undefined

/**
 * Seite, die nach einer Mutation leer geworden ist (z. B. weil der Filter nicht mehr passt):
 * die letzte vorhandene Seite, sonst null.
 */
export function clampedPage(data: Page<unknown> | undefined, page: number): number | null {
  if (!data || page === 0 || data.content.length) return null
  return Math.max(0, data.totalPages - 1)
}
