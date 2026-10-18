// Befehle der Command Palette: eine feste Liste, die lokal gefiltert wird (commandMatch.ts).
import type { ComponentType, SVGProps } from 'react'
import { paths, type PostingFilter } from '../../app/paths'
import type { ThemePreference } from '../../shared/theme/theme'
import type { MotionPreference } from '../../shared/theme/motionPreference'
import {
  ArchiveIcon,
  BoardIcon,
  BriefcaseIcon,
  BuildingIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  ClockIcon,
  GearIcon,
  HomeIcon,
  NoteIcon,
  PlusIcon,
  SearchIcon,
  TableIcon,
} from '../../shared/ui/icons'
import type { SearchScope } from './searchScopes'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

/** Was ein Befehl auslöst: Seite öffnen, Aktion ausführen oder in einen Such-Modus wechseln. */
export type CommandTarget =
  | { kind: 'go'; to: string }
  | { kind: 'run'; run: (ctx: CommandContext) => void }
  | { kind: 'scope'; scope: SearchScope }

/** App-Aktionen, die Befehle auslösen können */
export type CommandContext = {
  openNewPosting: () => void
  openNewCompany: () => void
  /** Notiz im Fenster auf der aktuellen Seite öffnen (null = neue) */
  openNote: (noteId: string | null) => void
  setTheme: (theme: ThemePreference) => void
  setMotion: (motion: MotionPreference) => void
  toast: (message: string) => void
}

export type Command = {
  id: string
  group: string
  label: string
  /** Kleiner Zusatz rechts (z. B. „aktiv“) */
  hint?: string
  /** Weitere Wörter, unter denen der Befehl gefunden wird */
  keywords?: readonly string[]
  icon: Icon
  target: CommandTarget
}

const go = (to: string): CommandTarget => ({ kind: 'go', to })

const POSTING_FILTER_COMMANDS: [PostingFilter, string, readonly string[], Icon][] = [
  ['open', 'Offene Stellen', ['ohne bewerbung', 'aktiv'], BriefcaseIcon],
  ['with', 'Beworbene Stellen', ['mit bewerbung'], CheckCircleIcon],
  ['inactive', 'Inaktive Stellen', ['abgelaufen', 'nicht mehr ausgeschrieben'], BriefcaseIcon],
  ['archived', 'Archivierte Stellen', ['archiv'], ArchiveIcon],
]

const THEMES: [ThemePreference, string, readonly string[], string][] = [
  [
    'light',
    'Helles Design',
    ['light mode', 'hell', 'tag', 'theme', 'erscheinungsbild'],
    'Helles Design aktiv',
  ],
  [
    'dark',
    'Dunkles Design',
    ['dark mode', 'dunkel', 'nacht', 'theme', 'erscheinungsbild'],
    'Dunkles Design aktiv',
  ],
  [
    'system',
    'Design wie System',
    ['auto', 'automatisch', 'theme', 'erscheinungsbild'],
    'Design folgt dem System',
  ],
]

/**
 * Alle globalen Befehle. `state` bestimmt, was gerade aktiv ist (Erscheinungsbild) bzw. welcher
 * Schalter angeboten wird (Animationen).
 */
export function globalCommands(state: { theme: ThemePreference; motion: MotionPreference }): Command[] {
  return [
    {
      id: 'search-postings',
      group: 'Suchen',
      label: 'Stellen suchen',
      keywords: ['finden', 'suche', 'jobs', 'anzeigen'],
      icon: SearchIcon,
      target: { kind: 'scope', scope: 'postings' },
    },
    {
      id: 'search-applications',
      group: 'Suchen',
      label: 'Bewerbungen suchen',
      keywords: ['finden', 'suche'],
      icon: SearchIcon,
      target: { kind: 'scope', scope: 'applications' },
    },
    {
      id: 'search-companies',
      group: 'Suchen',
      label: 'Firmen suchen',
      keywords: ['finden', 'suche', 'unternehmen', 'arbeitgeber'],
      icon: SearchIcon,
      target: { kind: 'scope', scope: 'companies' },
    },
    {
      id: 'search-notes',
      group: 'Suchen',
      label: 'Notizen suchen',
      keywords: ['finden', 'suche', 'notiz'],
      icon: SearchIcon,
      target: { kind: 'scope', scope: 'notes' },
    },
    {
      id: 'new-posting',
      group: 'Neu',
      label: 'Neue Stelle erfassen',
      keywords: ['anlegen', 'hinzufügen', 'erstellen', 'job'],
      icon: PlusIcon,
      target: { kind: 'run', run: (ctx) => ctx.openNewPosting() },
    },
    {
      id: 'new-company',
      group: 'Neu',
      label: 'Neue Firma anlegen',
      keywords: ['erfassen', 'hinzufügen', 'erstellen', 'unternehmen', 'arbeitgeber'],
      icon: PlusIcon,
      target: { kind: 'run', run: (ctx) => ctx.openNewCompany() },
    },
    {
      id: 'new-note',
      group: 'Neu',
      label: 'Neue Notiz',
      keywords: ['anlegen', 'hinzufügen', 'erstellen', 'notieren', 'schreiben'],
      icon: PlusIcon,
      target: { kind: 'run', run: (ctx) => ctx.openNote(null) },
    },
    {
      id: 'go-home',
      group: 'Gehe zu',
      label: 'Startseite',
      keywords: ['home', 'übersicht', 'dashboard', 'start'],
      icon: HomeIcon,
      target: go(paths.home()),
    },
    {
      id: 'go-postings',
      group: 'Gehe zu',
      label: 'Stellen',
      keywords: ['jobs', 'anzeigen', 'öffnen'],
      icon: BriefcaseIcon,
      target: go(paths.postings()),
    },
    {
      id: 'go-board',
      group: 'Gehe zu',
      label: 'Bewerbungen',
      hint: 'Board',
      keywords: ['board', 'kanban', 'spalten', 'öffnen'],
      icon: BoardIcon,
      target: go(paths.applications({ view: 'board' })),
    },
    {
      id: 'go-table',
      group: 'Gehe zu',
      label: 'Bewerbungen als Tabelle',
      keywords: ['tabelle', 'liste', 'öffnen'],
      icon: TableIcon,
      target: go(paths.applications({ view: 'table' })),
    },
    {
      id: 'go-companies',
      group: 'Gehe zu',
      label: 'Firmen',
      keywords: ['unternehmen', 'arbeitgeber', 'öffnen'],
      icon: BuildingIcon,
      target: go(paths.companies()),
    },
    {
      id: 'go-notes',
      group: 'Gehe zu',
      label: 'Notizen',
      keywords: ['notiz', 'ordner', 'öffnen'],
      icon: NoteIcon,
      target: go(paths.notes()),
    },
    {
      id: 'go-settings',
      group: 'Gehe zu',
      label: 'Einstellungen',
      keywords: ['optionen', 'konfiguration', 'settings', 'profil', 'name', 'ordner'],
      icon: GearIcon,
      target: go(paths.settings()),
    },
    ...POSTING_FILTER_COMMANDS.map(([filter, label, keywords, icon]): Command => ({
      id: `postings-${filter}`,
      group: 'Stellen',
      label,
      keywords: ['stellen', 'filter', ...keywords],
      icon,
      target: go(paths.postings(filter)),
    })),
    ...THEMES.map(([theme, label, keywords, message]): Command => ({
      id: `theme-${theme}`,
      group: 'Erscheinungsbild',
      label,
      hint: state.theme === theme ? 'aktiv' : undefined,
      keywords,
      icon: theme === 'dark' ? EyeOffIcon : EyeIcon,
      target: {
        kind: 'run',
        run: (ctx) => {
          ctx.setTheme(theme)
          ctx.toast(message)
        },
      },
    })),
    state.motion === 'off'
      ? {
          id: 'motion-on',
          group: 'Erscheinungsbild',
          label: 'Animationen einschalten',
          keywords: ['bewegung', 'motion', 'effekte', 'an'],
          icon: ClockIcon,
          target: {
            kind: 'run',
            run: (ctx) => {
              ctx.setMotion('on')
              ctx.toast('Animationen eingeschaltet')
            },
          },
        }
      : {
          id: 'motion-off',
          group: 'Erscheinungsbild',
          label: 'Animationen ausschalten',
          keywords: ['bewegung', 'motion', 'effekte', 'reduzieren', 'aus'],
          icon: ClockIcon,
          target: {
            kind: 'run',
            run: (ctx) => {
              ctx.setMotion('off')
              ctx.toast('Animationen ausgeschaltet')
            },
          },
        },
  ]
}
