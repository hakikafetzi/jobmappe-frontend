// Zusätzliche Befehle von Seiten (z. B. „Status ändern“ auf einer Bewerbung). Noch registriert keine
// Seite welche; die Palette zeigt sie nach den globalen Befehlen.
import { createContext, useContext, useEffect, useId } from 'react'
import type { Command } from './commands'

type Registry = { register: (owner: string, commands: readonly Command[]) => () => void }

export const CommandsRegistryContext = createContext<Registry | null>(null)
export const PageCommandsContext = createContext<readonly Command[]>([])

/** Befehle registrieren, solange die Komponente gemountet ist. `commands` sollte stabil sein (useMemo). */
export function useRegisterCommands(commands: readonly Command[]) {
  const registry = useContext(CommandsRegistryContext)
  const owner = useId()
  useEffect(() => registry?.register(owner, commands), [registry, owner, commands])
}

/** Befehle, die Seiten gerade registriert haben. */
export const usePageCommands = () => useContext(PageCommandsContext)
