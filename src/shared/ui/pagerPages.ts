/** Eintrag der Seitenleiste: Seite (0-basiert) oder Lücke („…“). */
type PagerItem = { kind: 'page'; page: number } | { kind: 'gap'; key: string }

/**
 * Seitenzahlen für den Pager: bis 7 Seiten alle, sonst erste, letzte und die Nachbarn der
 * aktuellen Seite, dazwischen Lücken. Die Leiste bleibt dabei immer 7 Einträge breit.
 */
export function pagerItems(page: number, totalPages: number): PagerItem[] {
  const pages = (from: number, to: number): PagerItem[] =>
    Array.from({ length: to - from + 1 }, (_, i) => ({ kind: 'page', page: from + i }))
  const last = totalPages - 1
  if (totalPages <= 7) return pages(0, last)
  if (page <= 3) return [...pages(0, 4), { kind: 'gap', key: 'end' }, ...pages(last, last)]
  if (page >= last - 3) return [...pages(0, 0), { kind: 'gap', key: 'start' }, ...pages(last - 4, last)]
  return [
    ...pages(0, 0),
    { kind: 'gap', key: 'start' },
    ...pages(page - 1, page + 1),
    { kind: 'gap', key: 'end' },
    ...pages(last, last),
  ]
}

/** „6–10 von 23“: angezeigter Bereich bei Seitengröße `size` und `total` Einträgen. */
export function pagerRange(page: number, size: number, total: number): string {
  if (!total) return 'Keine Einträge'
  const from = page * size + 1
  const to = Math.min(total, (page + 1) * size)
  return `${from}–${to} von ${total}`
}
