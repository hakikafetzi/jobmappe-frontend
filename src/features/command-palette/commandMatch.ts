// Lokales Filtern der festen Befehlsliste (keine API-Daten).
import type { Command } from './commands'

/** Kleinschreibung, Umlaute und ß gefaltet, Satzzeichen als Trenner. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ß', 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const words = (text: string) => normalize(text).split(' ').filter(Boolean)

/** Wörter mit Umlaut zusätzlich in der Schreibweise mit e („hinzufuegen“ findet „hinzufügen“). */
const withAeSpelling = (text: string) => [
  ...words(text),
  ...words(text.toLowerCase().replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue')),
]

/**
 * Rang eines Befehls für die Eingabe; null = passt nicht. Jedes eingegebene Wort muss Anfang
 * eines Worts aus Label oder Keywords sein. Kleiner ist besser: 0 = Label beginnt mit der Eingabe,
 * 1 = alle Wörter im Label, 2 = mit Keywords.
 */
export function commandRank(command: Command, query: string): number | null {
  const terms = words(query)
  if (!terms.length) return 0
  const label = withAeSpelling(command.label)
  const all = [...label, ...(command.keywords ?? []).flatMap(withAeSpelling)]
  if (!terms.every((t) => all.some((w) => w.startsWith(t)))) return null
  if (normalize(command.label).startsWith(normalize(query))) return 0
  return terms.every((t) => label.some((w) => w.startsWith(t))) ? 1 : 2
}

/** Passende Befehle, bester Rang zuerst; bei Gleichstand bleibt die Reihenfolge der Liste. */
export function matchCommands(commands: readonly Command[], query: string): Command[] {
  return commands
    .map((command, index) => ({ command, index, rank: commandRank(command, query) }))
    .filter((m): m is typeof m & { rank: number } => m.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((m) => m.command)
}
