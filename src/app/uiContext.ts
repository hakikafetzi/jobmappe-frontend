import { createContext, useContext } from 'react'

/** App-weite Aktionen, die von überall ausgelöst werden können. */
type AppActions = {
  openNewPosting: () => void
  openNewCompany: () => void
  /** Command Palette (⌘K) */
  openCommandPalette: () => void
}

export const AppActionsContext = createContext<AppActions | null>(null)

export function useAppActions(): AppActions {
  const ctx = useContext(AppActionsContext)
  if (!ctx) throw new Error('useAppActions braucht die AppShell')
  return ctx
}
