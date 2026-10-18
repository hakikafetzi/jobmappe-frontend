// Maße des Notizkarten-Rasters (Notizen-Seite). Die Seitengröße richtet sich danach, wie viele
// Karten vollständig in die Fläche passen; CSS und Berechnung nutzen dieselben Werte.

/** Maße eines Rasters: Mindestbreite einer Spalte (auto-fill), feste Höhe eines Eintrags, Abstand */
export type NoteLayout = { minWidth: number; height: number; gap: number }

/** Kartenansicht */
export const NOTE_GRID: NoteLayout = { minWidth: 300, height: 116, gap: 12 }

/** Höchste Seitengröße, die das Backend annimmt */
const MAX_PAGE_SIZE = 100

/**
 * Wie viele Karten passen in eine Fläche von `width` × `height` (ohne Innenabstand)? Spalten wie bei
 * `repeat(auto-fill, minmax(minWidth, 1fr))`, Zeilen nur ganze. null = Fläche noch nicht messbar.
 */
export function fitPageSize(width: number, height: number, grid: NoteLayout = NOTE_GRID): number | null {
  if (width <= 0 || height <= 0) return null
  const cols = Math.max(1, Math.floor((width + grid.gap) / (grid.minWidth + grid.gap)))
  const rows = Math.max(1, Math.floor((height + grid.gap) / (grid.height + grid.gap)))
  return Math.min(MAX_PAGE_SIZE, cols * rows)
}

/** Seite, auf der die erste Notiz der bisherigen Seite bei der neuen Seitengröße steht. */
export const pageForSize = (page: number, oldSize: number, newSize: number) =>
  Math.floor((page * oldSize) / newSize)
