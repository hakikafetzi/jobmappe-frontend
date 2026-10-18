import { useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAppActions } from '../../app/uiContext'
import { useDebouncedCallback } from '../../shared/hooks/useDebouncedCallback'
import { modKey } from '../../shared/hooks/useHotkey'
import { useMotionPreference } from '../../shared/theme/motionPreference'
import { useThemePreference } from '../../shared/theme/theme'
import { useToast } from '../../shared/ui/toastContext'
import { globalCommands, type CommandContext } from './commands'
import { usePageCommands } from './commandsContext'
import { commandSections, resultSections, type PaletteEntry } from './paletteEntries'
import { SEARCH_SCOPES, type SearchScope } from './searchScopes'
import { useScopeSearch } from './useScopeSearch'
import { useNoteWindows } from '../notes/noteWorkspaceContext'

/** Wartezeit nach dem letzten Tastendruck, bevor im Such-Modus gesucht wird */
const SEARCH_DELAY_MS = 250

/**
 * Zustand der Command Palette: Eingabe, Such-Modus, gewählter Eintrag und was ein Eintrag auslöst.
 * Ohne Such-Modus filtert die Eingabe die Befehle; im Such-Modus sucht sie über das Backend.
 */
export function useCommandPalette(onClose: () => void) {
  const navigate = useNavigate()
  const { openNewPosting, openNewCompany } = useAppActions()
  const toast = useToast()
  const [theme, setTheme] = useThemePreference()
  const [motion, setMotion] = useMotionPreference()
  const pageCommands = usePageCommands()

  const [input, setInput] = useState('')
  const [scope, setScope] = useState<SearchScope | null>(null)
  // Suchbegriff fürs Backend: die Eingabe im Such-Modus, entprellt
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const debouncedQuery = useDebouncedCallback(setQuery, SEARCH_DELAY_MS)
  const search = useScopeSearch(scope, query)

  const commands = useMemo(
    () => [...globalCommands({ theme, motion }), ...pageCommands],
    [theme, motion, pageCommands],
  )
  const sections = scope
    ? resultSections(search.results, {
        hasMore: search.hasMore,
        total: search.total,
        listHref: SEARCH_SCOPES[scope].listHref(query),
      })
    : commandSections(commands, input)
  const entries = sections.flatMap((s) => s.entries)
  // Liste kann kürzer werden (neue Treffer): Auswahl bleibt in den Grenzen
  const activeIndex = Math.min(active, Math.max(0, entries.length - 1))

  const changeInput = (value: string) => {
    setInput(value)
    setActive(0)
    if (scope) debouncedQuery.run(value.trim())
  }
  const enterScope = (next: SearchScope) => {
    setScope(next)
    setInput('')
    setQuery('')
    setActive(0)
  }
  const exitScope = () => {
    debouncedQuery.cancel()
    setScope(null)
    setInput('')
    setQuery('')
    setActive(0)
  }

  const noteWindows = useNoteWindows()
  const ctx: CommandContext = {
    openNewPosting,
    openNewCompany,
    openNote: (noteId) => noteWindows.open(noteId),
    setTheme,
    setMotion,
    toast,
  }
  const execute = (entry: PaletteEntry) => {
    if (entry.kind === 'more') return search.loadMore()
    if (entry.kind === 'command' && entry.command.target.kind === 'scope')
      return enterScope(entry.command.target.scope)
    onClose()
    if (entry.kind === 'result') {
      if (entry.result.kind === 'note') ctx.openNote(entry.result.id)
      else void navigate(entry.result.to)
    } else if (entry.kind === 'all') void navigate(entry.to)
    else if (entry.command.target.kind === 'go') void navigate(entry.command.target.to)
    else if (entry.command.target.kind === 'run') entry.command.target.run(ctx)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const native = e.nativeEvent
    if (modKey('k')(native)) {
      // ⌘K in der offenen Palette schließt sie wieder
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!entries.length) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((activeIndex + step + entries.length) % entries.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = entries[activeIndex]
      if (entry) execute(entry)
    } else if (e.key === 'Escape' && scope) {
      // Erst den Such-Modus verlassen, erst das nächste Escape schließt (verhindert das cancel des Dialogs)
      e.preventDefault()
      e.stopPropagation()
      exitScope()
    } else if (e.key === 'Backspace' && scope && !input) {
      e.preventDefault()
      exitScope()
    }
  }

  return {
    input,
    changeInput,
    scope,
    exitScope,
    query,
    search,
    sections,
    entries,
    activeIndex,
    setActive,
    execute,
    onKeyDown,
  }
}
