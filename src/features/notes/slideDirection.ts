// Wann und in welche Richtung der Seitenwechsel der Notizen-Galerie animiert wird (PageSlide.tsx).

export type SlideDirection = 'next' | 'prev'

/** Angezeigte Seite und alles, was sonst die Liste bestimmt (Suche, Ordner, Sortierung, Größe) */
export type SlideKey = { page: number; scope: string }

/**
 * Richtung beim Blättern: vor → die alten Karten gehen nach links, die neuen kommen von rechts;
 * zurück umgekehrt. null = kein Blättern (andere Suche, anderer Ordner, andere Seitengröße), dann
 * wechselt der Inhalt ohne Animation.
 */
export function slideDirection(prev: SlideKey | null, next: SlideKey): SlideDirection | null {
  if (!prev || prev.scope !== next.scope || prev.page === next.page) return null
  return next.page > prev.page ? 'next' : 'prev'
}
