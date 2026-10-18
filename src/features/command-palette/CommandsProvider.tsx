import { useMemo, useState, type ReactNode } from 'react'
import type { Command } from './commands'
import { CommandsRegistryContext, PageCommandsContext } from './commandsContext'

/** Sammelt die Befehle, die Seiten über useRegisterCommands einhängen. */
export function CommandsProvider({ children }: { children: ReactNode }) {
  const [byOwner, setByOwner] = useState<ReadonlyMap<string, readonly Command[]>>(new Map())
  const registry = useMemo(
    () => ({
      register: (owner: string, commands: readonly Command[]) => {
        setByOwner((prev) => new Map(prev).set(owner, commands))
        return () =>
          setByOwner((prev) => {
            const next = new Map(prev)
            next.delete(owner)
            return next
          })
      },
    }),
    [],
  )
  const commands = useMemo(() => [...byOwner.values()].flat(), [byOwner])
  return (
    <CommandsRegistryContext value={registry}>
      <PageCommandsContext value={commands}>{children}</PageCommandsContext>
    </CommandsRegistryContext>
  )
}
