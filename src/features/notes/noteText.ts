import type { ApplicationDetail, NoteCategory, NoteCompact } from '../../api/types'
import type { NoteApplication } from './noteWindows'

export function countText(text: string): { words: number; chars: number } {
  const trimmed = text.trim()
  return { words: trimmed ? trimmed.split(/\s+/).length : 0, chars: trimmed.length }
}

/** Tab „Alle“ der Ordner-Tabs */
export const ALL_NOTES = 'all'

/**
 * Ordner-Tabs aus den Kategorien (nach Name sortiert; die Liste ist ein ungeordnetes Array). Der Wert
 * eines Tabs ist die Kategorie-ID, gefiltert wird im Backend (`noteCategoryId`). Ein verschwundener
 * Ordner fällt auf „Alle“; solange die Kategorien laden, bleibt der Tab stehen.
 */
export function categoryTabs(categories: NoteCategory[] | undefined, tab: string) {
  const sorted = (categories ?? []).toSorted((a, b) => a.name.localeCompare(b.name, 'de'))
  const known = tab === ALL_NOTES || !categories || sorted.some((c) => c.id === tab)
  const activeTab = known ? tab : ALL_NOTES
  return {
    tabs: [{ value: ALL_NOTES, label: 'Alle' }, ...sorted.map((c) => ({ value: c.id, label: c.name }))],
    activeTab,
    /** Für den Request; undefined = alle Ordner */
    categoryId: activeTab === ALL_NOTES ? undefined : activeTab,
    /** Name des aktiven Ordners (Vorauswahl neuer Notizen) */
    categoryName: sorted.find((c) => c.id === activeTab)?.name ?? null,
  }
}

/** Notiz, die nach dem Löschen von `id` geöffnet wird: die nächste in der Liste, sonst die vorige. */
export function neighbourNote(shown: NoteCompact[], id: string): string | null {
  const i = shown.findIndex((n) => n.id === id)
  if (i < 0) return shown[0]?.id ?? null
  return shown[i + 1]?.id ?? shown[i - 1]?.id ?? null
}

/** Anzeige einer zugeordneten Bewerbung: „Stelle · Firma“ */
export const applicationLabel = (a: { jobTitle: string | null; companyName: string | null }) =>
  [a.jobTitle, a.companyName].filter(Boolean).join(' · ') || 'Bewerbung'

/** Bewerbung als Vorauswahl neuer Notizen (Bewerbungsdetail, Editor) */
export const noteApplicationOf = (app: ApplicationDetail): NoteApplication => ({
  id: app.id,
  jobTitle: app.jobPosting.title,
  companyName: app.company.name,
})

/**
 * Angedeutete Textzeilen im Mini-Blatt der Notizkarten (Breiten in %). Nur Dekoration: Die Liste
 * liefert keinen Inhalt. Aus der ID abgeleitet, damit jede Karte etwas anders und immer gleich aussieht.
 */
export function previewLines(id: string, count = 5): { key: string; width: number }[] {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return Array.from({ length: count }, (_, i) => {
    hash = (hash * 1103515245 + 12345) >>> 0
    // Absatzende kürzer, sonst fast volle Zeilen
    const short = i % 3 === 2
    return { key: `line-${i}`, width: short ? 40 + (hash % 25) : 75 + (hash % 25) }
  })
}
