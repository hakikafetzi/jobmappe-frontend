// Was die Palette als Liste zeigt: Befehle (gruppiert bzw. nach Rang) oder Treffer eines Such-Modus.
import { matchCommands } from './commandMatch'
import type { Command } from './commands'
import type { ScopeResult } from './useScopeSearch'

export type PaletteEntry =
  | { key: string; kind: 'command'; command: Command }
  | { key: string; kind: 'result'; result: ScopeResult }
  | { key: 'more'; kind: 'more' }
  | { key: 'all'; kind: 'all'; to: string; total: number }

export type PaletteSection = { label: string | null; entries: PaletteEntry[] }

const commandEntry = (command: Command): PaletteEntry => ({ key: command.id, kind: 'command', command })

/** Ohne Eingabe alle Befehle nach Gruppen, mit Eingabe die passenden nach Rang (ohne Gruppen). */
export function commandSections(commands: readonly Command[], query: string): PaletteSection[] {
  if (query.trim()) {
    const matches = matchCommands(commands, query)
    return matches.length ? [{ label: null, entries: matches.map(commandEntry) }] : []
  }
  const groups = new Map<string, PaletteEntry[]>()
  for (const command of commands) {
    const entries = groups.get(command.group) ?? []
    entries.push(commandEntry(command))
    groups.set(command.group, entries)
  }
  return [...groups].map(([label, entries]) => ({ label, entries }))
}

/** Treffer des Such-Modus, dazu „Weitere laden“ und der Weg zur ganzen Liste. */
export function resultSections(
  results: readonly ScopeResult[],
  { hasMore, total, listHref }: { hasMore: boolean; total: number | undefined; listHref: string },
): PaletteSection[] {
  if (!results.length) return []
  const entries: PaletteEntry[] = results.map((result) => ({ key: result.id, kind: 'result', result }))
  if (hasMore) entries.push({ key: 'more', kind: 'more' })
  if (total) entries.push({ key: 'all', kind: 'all', to: listHref, total })
  return [{ label: null, entries }]
}
